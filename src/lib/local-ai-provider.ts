import { randomUUID } from 'node:crypto';
import { readBoundedAiJson } from '@/lib/ai-provider-security';

type Options = { env?: NodeJS.ProcessEnv; fetchImpl?: typeof fetch };
type Payload = { instructions: string; prompt: string; maxOutputTokens: number; timeoutMs: number };
export const LOCAL_AI_TIMEOUT_MS = 110_000;
export const LOCAL_AI_MODEL = 'nowis/qwen3.6-35b-a3b';

/** Explicit server credentials for the existing local-worker queue, never a browser URL. */
function configuration(env: NodeJS.ProcessEnv) {
  const key = env.NOWIS_LOCAL_QUEUE_SERVICE_KEY?.trim();
  try {
    const url = new URL(env.NOWIS_LOCAL_QUEUE_URL || '');
    if (!key || url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) return null;
    return { url: url.origin, key };
  } catch { return null; }
}

export function isLocalAiConfigured(env: NodeJS.ProcessEnv = process.env) {
  return configuration(env) !== null;
}

/** Only queues work for NOWIS. No OpenAI, Gateway, runtime-token or direct Internet access to LM Studio. */
export async function requestLocalAiResponse(payload: Payload, options: Options = {}): Promise<Response> {
  const config = configuration(options.env || process.env);
  if (!config) return Response.json({ error: 'LOCAL_AI_UNCONFIGURED' }, { status: 503 });
  const transport = options.fetchImpl || fetch;
  const timeoutMs = Math.min(LOCAL_AI_TIMEOUT_MS, Math.max(1000, payload.timeoutMs));
  const startedAt = Date.now();
  const signal = AbortSignal.timeout(timeoutMs);
  const rest = (path: string, init: RequestInit = {}) => transport(`${config.url}/rest/v1/${path}`, {
    ...init, signal: init.signal || signal, redirect: 'error', cache: 'no-store',
    headers: { apikey: config.key, Authorization: `Bearer ${config.key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
  });
  const id = randomUUID();
  let submitted = false;
  try {
    const status = await rest('nowis_worker_status?select=last_seen');
    if (!status.ok) return Response.json({ error: 'LOCAL_AI_OFFLINE' }, { status: 503 });
    const rows = await readBoundedAiJson(status, signal);
    const seen = Date.parse(Array.isArray(rows) ? String(rows[0]?.last_seen || '') : '');
    if (!Number.isFinite(seen) || Date.now() - seen > 20_000 || seen - Date.now() > 5000) return Response.json({ error: 'LOCAL_AI_OFFLINE' }, { status: 503 });
    submitted = true; // Also clean up when the server accepted an insert but its response was lost.
    const created = await rest('nowis_jobs', { method: 'POST', body: JSON.stringify({
      id, instructions: payload.instructions, input: payload.prompt, images: [], schema_name: 'texte_libre', schema: {},
      options: { format: 'text', max_tokens: payload.maxOutputTokens }, deadline: new Date(startedAt + timeoutMs).toISOString(),
    }) });
    if (!created.ok) return Response.json({ error: 'LOCAL_AI_QUEUE' }, { status: 503 });
    while (!signal.aborted) {
      await new Promise<void>((resolve, reject) => {
        const stop = () => { clearTimeout(timer); reject(signal.reason); };
        const timer = setTimeout(() => { signal.removeEventListener('abort', stop); resolve(); }, 1000);
        signal.addEventListener('abort', stop, { once: true });
        if (signal.aborted) stop();
      });
      const response = await rest(`nowis_jobs?id=eq.${id}&select=status,result,input_tokens,output_tokens`);
      if (!response.ok) return Response.json({ error: 'LOCAL_AI_QUEUE' }, { status: 503 });
      const jobs = await readBoundedAiJson(response, signal);
      const row = Array.isArray(jobs) ? jobs[0] : null;
      if (row?.status === 'failed') return Response.json({ error: 'LOCAL_AI_FAILED' }, { status: 503 });
      if (row?.status !== 'done') continue;
      if (typeof row.result?.text !== 'string' || !row.result.text.trim()) return Response.json({ error: 'LOCAL_AI_OUTPUT' }, { status: 502 });
      return Response.json({ status: 'completed', model: LOCAL_AI_MODEL,
        output: [{ type: 'message', role: 'assistant', content: [{ type: 'output_text', text: row.result.text }] }],
      });
    }
    throw signal.reason;
  } finally {
    if (submitted) await rest(`nowis_jobs?id=eq.${id}`, { method: 'DELETE', signal: AbortSignal.timeout(5000) }).catch(() => undefined);
  }
}

import { AI_AGENT_BOUNDARIES, containsAiCredential, isTextOnlyAiResponse, readBoundedAiJson, safeAiText } from '@/lib/ai-provider-security';

export function createSiteAssistantProvider(instructions: string, options: { env?: NodeJS.ProcessEnv; fetchImpl?: typeof fetch } = {}) {
  return async ({ transcript, pathname }: { transcript: string; pathname: string }): Promise<string | null> => {
    const env = options.env || process.env;
    const gateway = env.AI_GATEWAY_API_KEY?.trim() || env.VERCEL_OIDC_TOKEN?.trim();
    const token = gateway || env.OPENAI_API_KEY?.trim();
    if (!token || containsAiCredential(transcript)) return null;
    const signal = AbortSignal.timeout(12_000);
    const response = await (options.fetchImpl || fetch)(gateway ? 'https://ai-gateway.vercel.sh/v1/responses' : 'https://api.openai.com/v1/responses', {
      method: 'POST', redirect: 'error', cache: 'no-store', signal,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(gateway ? { 'ai-reporting-tags': 'feature:site-assistant' } : {}) },
      body: JSON.stringify({
        model: gateway ? env.SITE_ASSISTANT_MODEL?.trim() || 'openai/gpt-5.6-luna' : env.OPENAI_MODEL?.trim() || 'gpt-5.6-luna',
        instructions: instructions + AI_AGENT_BOUNDARIES,
        input: [{ type: 'message', role: 'user', content: JSON.stringify({ page: pathname, untrustedClientHistory: transcript }) }],
        max_output_tokens: 450, store: false, tools: [], tool_choice: 'none',
      }),
    });
    if (!response.ok) { void response.body?.cancel().catch(() => undefined); return null; }
    const data = await readBoundedAiJson(response, signal);
    if (!isTextOnlyAiResponse(data)) return null;
    const output = (data as { output: Array<{ content?: Array<{ text?: unknown }> }> }).output;
    const parts = output.flatMap(item => (item.content || []).map(part => typeof part.text === 'string' ? part.text : ''));
    return safeAiText(parts.join('\n\n'), { maxWords: 150, maxCharacters: 1600, siteGuide: true });
  };
}

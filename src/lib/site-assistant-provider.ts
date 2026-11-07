import { requestLocalAiResponse, LOCAL_AI_TIMEOUT_MS } from '@/lib/local-ai-provider';
import { AI_AGENT_BOUNDARIES, containsAiCredential, isTextOnlyAiResponse, readBoundedAiJson, safeAiText } from '@/lib/ai-provider-security';

export function createSiteAssistantProvider(instructions: string, options: { env?: NodeJS.ProcessEnv; fetchImpl?: typeof fetch; responseImpl?: typeof requestLocalAiResponse } = {}) {
  return async ({ transcript, pathname }: { transcript: string; pathname: string }): Promise<string | null> => {
    if (containsAiCredential(transcript)) return null;
    const signal = AbortSignal.timeout(LOCAL_AI_TIMEOUT_MS);
    const response = await (options.responseImpl || requestLocalAiResponse)({
      instructions: instructions + AI_AGENT_BOUNDARIES,
      prompt: JSON.stringify({ page: pathname, untrustedClientHistory: transcript }),
      maxOutputTokens: 450, timeoutMs: LOCAL_AI_TIMEOUT_MS,
    }, options);
    if (!response.ok) { void response.body?.cancel().catch(() => undefined); return null; }
    const data = await readBoundedAiJson(response, signal);
    if (!isTextOnlyAiResponse(data)) return null;
    const output = (data as { output: Array<{ content?: Array<{ text?: unknown }> }> }).output;
    const parts = output.flatMap(item => (item.content || []).map(part => typeof part.text === 'string' ? part.text : ''));
    return safeAiText(parts.join('\n\n'), { maxWords: 150, maxCharacters: 1600, siteGuide: true });
  };
}

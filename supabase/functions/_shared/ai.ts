// Free-tier chat providers: Groq first, Cloudflare Workers AI as fallback (owner decision 26/11/2026, PRD §8.2).
// Plain TypeScript so Node 24 tests can import it; keys come from env and are never logged.
import { LIMITS, type Message } from './converse.ts';

export type Env = { GROQ_API_KEY?: string; CLOUDFLARE_ACCOUNT_ID?: string; CLOUDFLARE_AI_TOKEN?: string };
export type Fetch = (url: string, init: RequestInit) => Promise<Response>;
export type Answer = { provider: string; text: string };

type Provider = { name: string; model: string; stream: boolean; url: (e: Env) => string | null; key: (e: Env) => string | undefined };

export const PROVIDERS: Provider[] = [
  // https://console.groq.com/docs/models (production model)
  { name: 'groq', model: 'llama-3.1-8b-instant', stream: true,
    url: () => 'https://api.groq.com/openai/v1/chat/completions', key: e => e.GROQ_API_KEY },
  // Free-plan model per https://developers.cloudflare.com/changelog/post/2026-07-28-models-require-workers-paid/
  // OpenAI-compatible endpoint: https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/
  // shortcut: non-streaming, since streaming on this endpoint is not documented; stream it once the docs confirm it.
  { name: 'cloudflare', model: '@cf/google/gemma-4-26b-a4b-it', stream: false,
    url: e => e.CLOUDFLARE_ACCOUNT_ID && /^[a-f0-9]{32}$/.test(e.CLOUDFLARE_ACCOUNT_ID)
      ? `https://api.cloudflare.com/client/v4/accounts/${e.CLOUDFLARE_ACCOUNT_ID}/ai/v1/chat/completions` : null,
    key: e => e.CLOUDFLARE_AI_TOKEN },
];

// Yields the content deltas of an OpenAI-style SSE stream until [DONE].
export async function* parseSSE(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader(), decoder = new TextDecoder();
  let buf = '';
  try {
    for (;;) {
      const { value, done } = await reader.read();
      buf += decoder.decode(value, { stream: !done });
      const lines = buf.split('\n');
      buf = done ? '' : lines.pop() || '';
      if (buf.length > 16_384) throw new Error('Oversized provider event');
      for (const line of lines) {
        if (line.length > 16_384) throw new Error('Oversized provider event');
        const data = line.trim();
        if (!data.startsWith('data:')) continue;
        const payload = data.slice(5).trim();
        if (payload === '[DONE]') return;
        let json;
        try { json = JSON.parse(payload); } catch { continue; } // skip a malformed event, keep the stream
        const choice = json?.choices?.[0];
        if (choice?.finish_reason && choice.finish_reason !== 'stop') throw new Error('Incomplete provider answer');
        const t = choice?.delta?.content;
        if (typeof t === 'string' && t) yield t;
      }
      if (done) throw new Error('Incomplete provider stream');
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

async function readStream(body: ReadableStream<Uint8Array>): Promise<string> {
  let text = '';
  for await (const delta of parseSSE(body)) {
    text += delta;
    if (text.length > LIMITS.turnChars) throw new Error('Oversized provider answer');
  }
  return text;
}

async function readAnswer(res: Response, stream: boolean): Promise<unknown> {
  if (stream) return res.body ? readStream(res.body) : null;
  const json = await res.json();
  const choice = json?.choices?.[0];
  if (choice?.finish_reason && choice.finish_reason !== 'stop') return null;
  return choice?.message?.content ?? json?.result?.response;
}

// Tries providers in order. Only complete, validated answers reach the caller.
export async function openChat(messages: Message[], env: Env, fetchFn: Fetch, maxTokens: number,
  validate: (text: string) => boolean): Promise<Answer | null> {
  for (const p of PROVIDERS) {
    const url = p.url(env), key = p.key(env);
    if (!url || !key) continue;
    try {
      const res = await fetchFn(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: p.model, messages, stream: p.stream, max_tokens: maxTokens, temperature: 0.7 }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) { await res.body?.cancel(); continue; }
      const content = await readAnswer(res, p.stream);
      if (typeof content !== 'string' || content.length > LIMITS.turnChars) continue;
      const text = content.trim();
      if (text && validate(text)) return { provider: p.name, text };
    } catch { /* network error or timeout: try the next provider */ }
  }
  return null;
}

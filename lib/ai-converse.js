'use strict';
// Client for the converse Edge Function (PRD §8.2): real AI turns for Roleplay and Tutor.
// The account flag is a UI hint. The Edge Function independently checks the current user.

const AI_CHARS = 400; // same text cap as supabase/functions/_shared/converse.ts
const aiReady = () => !!(navigator.onLine !== false && cloudUserId() && cloudVerifiedAdult);
const aiModeLabel = ai => ai ? V('AI thật', 'Live AI') : V('Theo kịch bản', 'Scripted');
const aiReason = code => {
  if (code === 'privacy') return V('Trò chuyện AI chỉ mở cho tài khoản đã xác minh đủ 18 tuổi.', 'Live AI is available to accounts verified as 18 or older.');
  if (code === 'quota') return V('AI đã hết lượt hôm nay.', 'AI is out of turns for today.');
  return V('AI chưa trả lời được lần này.', 'AI could not reply this time.');
};
const aiBusyMsg = code => `${aiReason(code)} ${V('Chuyển sang hội thoại theo kịch bản.', 'Switching to the scripted conversation.')}`;

// Streams the reply; onText gets the text so far. Rejects with Error(code): auth, quota, busy, request.
async function aiConverse(body, onText) {
  if (!aiReady()) throw new Error('privacy');
  const c = await cloudClient();
  const session = c && (await c.auth.getSession()).data?.session;
  if (!session?.access_token || session.user?.id !== cloudUserId()) throw new Error('auth');
  if (session.user.app_metadata?.echolac_verified_adult !== true) throw new Error('privacy');
  const res = await fetch(CLOUD.url + '/functions/v1/converse', {
    method: 'POST', signal: cloudSignal(),
    headers: { Authorization: 'Bearer ' + session.access_token, apikey: CLOUD.key, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) throw new Error((await res.json().catch(() => ({}))).error || 'busy');
  const reader = res.body.getReader(), dec = new TextDecoder();
  let buf = '', text = '', provider = '';
  for (;;) {
    const { value, done } = await reader.read();
    buf += dec.decode(value, { stream: !done });
    const events = buf.split('\n\n');
    buf = done ? '' : events.pop();
    for (const ev of events) {
      if (!ev.startsWith('data: ')) continue;
      const msg = JSON.parse(ev.slice(6));
      if (msg.error) throw new Error(msg.error);
      if (msg.t) { text += msg.t; onText?.(text); }
      if (msg.done) provider = msg.provider;
    }
    if (done) break;
  }
  if (!text.trim()) throw new Error('busy');
  return { text: text.trim(), provider };
}

// Tutor: one streamed explanation of a saved mistake, shown under the scripted tip.
async function aiTutor(id) {
  const e = S.errors.find(x => x.id === id), box = $('#ai-tutor'), btn = $('#ai-tutor-btn');
  if (!e || !box || !aiReady()) return;
  btn.disabled = true; box.hidden = false; box.textContent = '…';
  try {
    const focus = { word: e.word.slice(0, 120), ...(e.wrong ? { wrong: e.wrong.slice(0, AI_CHARS) } : {}) };
    const { text } = await aiConverse({ mode: 'tutor', scenario: e.scen, locale: S.lang, turns: [], focus }, t => (box.textContent = t));
    box.textContent = text;
  } catch (err) {
    box.textContent = aiReason(err.message);
  }
  btn.disabled = false;
}

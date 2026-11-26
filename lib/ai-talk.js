'use strict';
// Live AI Roleplay (PRD §8.2): the learner speaks (on-device Whisper, lib/asr-*.js) or types a reply; the character's reply streams in as a subtitle.
// On busy, quota or any error it restarts the scripted roleplay for the same scenario.

function setTalkMode(ai) {
  $('#talk-mode').textContent = aiModeLabel(ai);
  $('#ai-form').hidden = !ai;
  $('#mic').hidden = !ai;
  $('#script-next').hidden = ai;
}
function startAiTalk() { T.ai = true; setTalkMode(true); aiReply(); }
function aiInput(on) {
  setMic(on ? 'ready' : 'wait');
  if (!asrSupported()) $('#mic').disabled = true; // no worker/WebAssembly/mic: the typing box is the only input
  $('#ai-send').disabled = !on;
  if (on) $('#mic-hint').textContent = asrSupported() ? V('Nhấn micro để nói, hoặc gõ bằng tiếng Anh', 'Tap the mic to speak, or type in English') : V('Gõ câu trả lời bằng tiếng Anh', 'Type your reply in English');
}
async function aiReply(input) {
  const t = T;
  const turns = input ? [{ role: 'user', text: input }] : [];
  aiInput(false);
  const el = addMsg('ai', '<span class="dots"><i></i><i></i><i></i></span>'), b = el.querySelector('.bubble');
  try {
    const { text } = await aiConverse({ mode: 'roleplay', scenario: t.s.id, locale: S.lang, turns },
      so => { if (T === t && S.settings.subs) b.innerHTML = esc(so) + '<span class="caret"></span>'; });
    if (T !== t) return;
    b.innerHTML = S.settings.subs ? `${esc(text)}<span class="time">${hhmm()}</span>`
      : `<span class="muted">🔊 ${V('Đang nói… (phụ đề tắt)', 'Speaking… (subtitles off)')}</span> <button class="link small" onclick="this.parentNode.innerHTML=${esc(JSON.stringify(esc(text)))}">${V('Xem lời', 'Show text')}</button><span class="time">${hhmm()}</span>`;
    speak(text);
    if (t.meDone >= t.meTotal) return later(finishTalk, 1200);
    aiInput(true);
  } catch (err) {
    if (T !== t) return;
    toast(aiBusyMsg(err.message));
    const id = t.s.id;
    $('#msgs').innerHTML = '';
    startTalk(id, true);
  }
}
function aiSend(ev) {
  ev.preventDefault();
  const inp = $('#ai-text'), text = inp.value.trim().slice(0, AI_CHARS);
  if (!T?.ai || !text || T.state !== 'ready') return false;
  inp.value = '';
  addMsg('me', `${esc(text)}<span class="time">${hhmm()}</span>`);
  T.meDone++; updateTurns();
  aiReply(text);
  return false;
}

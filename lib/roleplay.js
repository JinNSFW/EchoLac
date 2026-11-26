'use strict';
// Roleplay engine: scripted self-practice or live AI turns via lib/ai-talk.js.

let T = null;
function clearTalk() { if (T) T.timers.forEach(clearTimeout); T = null; stopAudio(); speechCancel(); }
const later = (fn, ms) => { const t = T; t.timers.push(setTimeout(() => T === t && fn(), ms)); };
function startTalk(id, scripted) {
  clearTalk();
  const s = scen(id), steps = TALK[s.id] || s.talk || genericTalk(s); // curriculum lessons carry their own model turns (R-13)
  T = { s, steps, i: 0, state: 'wait', timers: [], meTotal: steps.filter(x => x.me).length, meDone: 0 };
  updateTurns();
  if (!scripted && aiReady()) return startAiTalk();
  setTalkMode(false); later(nextStep, 500);
}
function updateTurns() { $('#turn-lbl').textContent = `${V('Lượt', 'Turn')} ${T.meDone}/${T.meTotal}`; $('#turn-bar').style.width = (T.meDone / T.meTotal) * 100 + '%'; }
function setMic(state) {
  T.state = state; const m = $('#mic'), h = $('#mic-hint');
  m.disabled = !['ready', 'listening'].includes(state);
  m.classList.toggle('rec', state === 'listening'); m.classList.toggle('pulse', state === 'listening');
  m.innerHTML = icon(state === 'listening' ? 'x' : 'mic');
  h.textContent = { wait: V('Đợi nhân vật nói xong…', 'Wait for your partner…'), ready: V('Nhấn micro để trả lời', 'Tap the mic to answer'), listening: V('Đang nghe… nhấn lần nữa để dừng', 'Listening… tap again to stop'), processing: V('Đang chấm điểm…', 'Scoring…') }[state] || '';
}
function addMsg(who, html) {
  const el = document.createElement('div'); el.className = 'msg ' + who;
  const av = who === 'ai' ? T.s.persona.name[0] : esc(S.user.name.trim()[0] || 'B');
  el.innerHTML = `<div class="av">${av}</div><div class="col" style="display:flex;flex-direction:column;align-items:${who === 'me' ? 'flex-end' : 'flex-start'};max-width:82%;min-width:0"><div class="bubble" style="max-width:100%">${html}</div></div>`;
  $('#msgs').append(el);
  requestAnimationFrame(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' }));
  return el;
}
function nextStep() {
  const st = T.steps[T.i];
  if (!st) return finishTalk();
  if (st.me) {
    T.state = 'ready';
    $('#script-next').disabled = false;
    $('#mic-hint').textContent = V('Trả lời thành tiếng rồi bấm Xong lượt. Bài này không thu âm.', 'Answer aloud, then tap Done. This exercise does not record you.');
    return;
  }
  T.i++; setMic('wait');
  const el = addMsg('ai', '<span class="dots"><i></i><i></i><i></i></span>'), b = el.querySelector('.bubble');
  later(() => {
    speak(st.ai);
    if (!S.settings.subs) {
      b.innerHTML = `<span class="muted">🔊 ${V('Đang nói… (phụ đề tắt)', 'Speaking… (subtitles off)')}</span> <button class="link small" onclick="this.parentNode.innerHTML=${esc(JSON.stringify(esc(st.ai)))}">${V('Xem lời', 'Show text')}</button><span class="time">${hhmm()}</span>`;
      return later(nextStep, 1800 + st.ai.length * 30);
    }
    const words = st.ai.split(' '); let n = 0;
    const tick = () => {
      n++; b.innerHTML = esc(words.slice(0, n).join(' ')) + (n < words.length ? '<span class="caret"></span>' : `<span class="time">${hhmm()}</span>`);
      if (n < words.length) later(tick, 230 / RATES[S.settings.rate]); else later(nextStep, 700);
    };
    tick();
  }, 900);
}
function completeScriptedTurn() {
  if (!T || T.ai || T.state !== 'ready') return;
  const turn = T.steps[T.i];
  if (!turn?.me) return;
  const example = turn.gram?.fix || turn.me;
  addMsg('ai', `<small>${V('Câu trả lời mẫu', 'Model answer')}</small><br>${esc(example)}
    <button class="link small" onclick='speak(${esc(JSON.stringify(example))})'>${V('Nghe mẫu', 'Listen')}</button>`);
  $('#script-next').disabled = true;
  T.i++; T.meDone++; updateTurns(); setMic('wait'); later(nextStep, 700);
}
function helpMe() {
  if (!T) return;
  const st = T.steps.slice(T.i).find(x => x.me), q = [...T.steps.slice(0, T.i)].reverse().find(x => x.ai);
  if (!st) return toast(V('Cuộc trò chuyện sắp kết thúc rồi!', 'The conversation is almost done!'));
  const model = st.gram?.fix || st.me, starter = model.split(' ').slice(0, 3).join(' ');
  openSheet(`
    <h2>💡 ${V('Gợi ý trả lời', 'Need a hand?')}</h2>
    ${q ? `<p class="muted mt-8">${T.s.persona.name}: “${esc(q.ai)}”</p>` : ''}
    <div class="card mt-16 flat"><div class="tiny muted">${V('Câu mở đầu', 'Starter')}</div><b>${esc(starter)}…</b></div>
    <div class="card flat"><div class="tiny muted">${V('Câu trả lời mẫu', 'Model answer')}</div><b>${esc(model)}</b>
      <div><button class="btn soft sm mt-16" onclick='speak(${esc(JSON.stringify(model))})'>${icon('volume', 'sm')} ${V('Nghe mẫu', 'Listen')}</button></div></div>
    <button class="btn mt-24" onclick="closeSheet()">${V('Mình thử nói nhé', 'I’ll try it')}</button>`);
}
function toggleSubs() { S.settings.subs = !S.settings.subs; save(); const b = $('#cc-btn'); b.style.background = S.settings.subs ? 'var(--navy)' : ''; b.style.color = S.settings.subs ? '#fff' : ''; toast(S.settings.subs ? V('Đã bật phụ đề', 'Subtitles on') : V('Đã tắt phụ đề', 'Subtitles off')); }
function talkSettings() {
  openSheet(`
    <h2>${V('Giọng nói AI', 'AI voice')}</h2><p class="small muted mt-8">${V('Thay đổi áp dụng từ câu trả lời tiếp theo.', 'Changes apply from the next reply.')}</p>
    <div class="mt-24 small bold">${V('Tốc độ', 'Speed')}</div>
    <div class="seg three mt-8">${[['slow', 'Chậm', 'Slow'], ['medium', 'Vừa', 'Medium'], ['fast', 'Nhanh', 'Fast']].map(([k, vi, en]) => `<button class="${S.settings.rate === k ? 'on' : ''}" onclick="setSetting('rate','${k}')">${V(vi, en)}</button>`).join('')}</div>
    <div class="mt-24 small bold">${V('Giọng', 'Accent')}</div>
    <div class="seg four mt-8">${ACCENTS.map(([k, vi, en]) => `<button class="${S.settings.accent === k ? 'on' : ''}" onclick="setSetting('accent','${k}')">${V(vi, en)}</button>`).join('')}</div>
    <div class="set-row mt-16"><span class="grow">${V('Phụ đề', 'Subtitles')}</span><button class="toggle ${S.settings.subs ? 'on' : ''}" onclick="toggleSubs();talkSettings()" aria-pressed="${S.settings.subs}" aria-label="${V('Phụ đề', 'Subtitles')}"></button></div>
    <button class="btn mt-24" onclick="closeSheet()">${V('Xong', 'Done')}</button>`);
}
function finishTalk() {
  if (!T || T.state === 'done') return;
  const s = T.s;
  S.sessions++; S.minutes += s.min; S.xp += s.xp; S.today.min += s.min;
  if (!S.done.includes(s.id)) S.done.push(s.id);
  save(); setMic('done'); $('#mic-hint').textContent = V('Hoàn thành!', 'Finished!');
  confetti();
  openSheet(`
    <div class="center">${img('party', '', '').replace('class=""', 'style="width:72px;height:72px;margin:0 auto"')}<h2 class="mt-8" style="font-size:24px">${V('Hoàn thành!', 'Well done!')}</h2>
      <p class="muted">${V(`${T.meDone} lượt luyện nói với ${s.persona.name}`, `${T.meDone} practice turns with ${s.persona.name}`)} · <b style="color:var(--lantern-b)">+${s.xp} XP</b></p></div>
    <a class="btn mt-24" href="#tutor" onclick="closeSheet()">${icon('micAi')} ${V('Luyện phát âm', 'Practise pronunciation')}</a>`);
}

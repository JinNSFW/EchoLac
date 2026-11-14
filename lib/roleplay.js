'use strict';
// Scripted roleplay engine; speech scores are simulated demo values.

/* ================= Talk engine (scripted demo) ================= */
let T = null;
function clearTalk() { if (T) T.timers.forEach(clearTimeout); T = null; stopAudio(); }
const later = (fn, ms) => { const t = T; t.timers.push(setTimeout(() => T === t && fn(), ms)); };
function startTalk(id) {
  clearTalk();
  const s = scen(id), steps = TALK[s.id] || s.talk || genericTalk(s); // curriculum lessons carry their own model turns (R-13)
  T = { s, steps, i: 0, state: 'wait', timers: [], caught: [], gram: 0, pron: 0, meTotal: steps.filter(x => x.me).length, meDone: 0 };
  updateTurns(); later(nextStep, 500);
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
  if (st.me) return setMic('ready');
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
function micTap() {
  if (!T) return;
  if (T.state === 'ready') {
    stopAudio(); setMic('listening');
    T.live = addMsg('me', '<span class="wave"><i></i><i></i><i></i><i></i><i></i></span>');
    later(() => T.state === 'listening' && micTap(), 4500);
  } else if (T.state === 'listening') {
    setMic('processing');
    T.live.querySelector('.bubble').innerHTML = '<span class="dots"><i></i><i></i><i></i></span>';
    later(finishTurn, 900);
  }
}
function finishTurn() {
  const st = T.steps[T.i], col = T.live.querySelector('.col'), b = col.querySelector('.bubble');
  let txt = esc(st.me);
  (st.pron || []).forEach(([w, sc]) => { txt = txt.replace(new RegExp(`\\b${w}\\b`, 'i'), m => `<button class="pw" onclick="pronSheet('${w}',${sc})">${m}</button>`); captureWord(w, sc); });
  b.innerHTML = `${txt}<span class="time">${hhmm()}</span>`;
  const fb = [];
  if (st.gram) { T.gram++; const gid = captureGram(st); fb.push(`<button class="fb amber" onclick="gramSheet('${gid}')">${V('1 lỗi ngữ pháp', '1 grammar tip')}</button>`); }
  if (st.pron?.length) { T.pron += st.pron.length; fb.push(`<button class="fb amber" onclick="pronSheet('${st.pron[0][0]}',${st.pron[0][1]})">${V('Phát âm', 'Pronunciation')}: ${st.pron[0][0]}</button>`); }
  if (!fb.length) fb.push(`<span class="fb green">✓ ${V('Tốt lắm!', 'Nice!')}</span>`);
  col.insertAdjacentHTML('beforeend', `<div class="feedback-row">${fb.join('')}</div>`);
  T.i++; T.meDone++; updateTurns(); setMic('wait'); later(nextStep, 700);
}
function captureWord(w, score) {
  const lib = WORDS[w]; if (!lib) return;
  let e = S.errors.find(x => x.word === w);
  if (!e) { e = { id: 'w-' + w, word: w, ...lib, scen: T.s.id, best: score, attempts: [score], days: [], status: 'open', at: Date.now() }; S.errors.push(e); }
  else { e.at = Date.now(); if (e.status === 'mastered') { e.status = 'open'; e.days = []; } }
  if (!T.caught.includes(e.id)) T.caught.push(e.id);
  save();
}
function captureGram(st) {
  const id = 'g-' + st.gram.fix.toLowerCase().replace(/[^a-z]+/g, '-').slice(0, 40);
  if (!S.errors.some(e => e.id === id)) S.errors.push({ id, word: st.gram.fix, wrong: st.me, cat: 'grammar', tip: st.gram.why, ipa: '', hl: '', mean: '', scen: T.s.id, best: 0, attempts: [], days: [], status: 'open', at: Date.now() });
  if (!T.caught.includes(id)) T.caught.push(id);
  save(); return id;
}
function pronSheet(w, sc) {
  const e = S.errors.find(x => x.word === w) || { word: w, ...WORDS[w] };
  openSheet(`
    <div class="center"><span class="tag amber">${L(ERR_CAT[e.cat])}</span><div style="font-size:38px;font-weight:800;margin-top:10px">${esc(w)}</div><div class="muted" style="font-size:18px">${ipaHl(e)}</div></div>
    <div class="mini-ring mt-16" style="width:72px;height:72px;margin:16px auto 0">${ringSvg(sc, 29, 7, scoreColor(sc), 'var(--line)')}<b style="font-size:17px">${sc}</b></div>
    ${tutorSay(esc(L(e.tip)), 0, 'in mt-24')}
    <p class="small center mt-16"><span class="tag green">✓ ${V('Đã lưu vào Gia sư', 'Saved to Tutor')}</span></p>
    <div class="row mt-24" style="gap:12px"><button class="btn white" onclick="speak('${w}')">${icon('volume')} ${V('Nghe', 'Listen')}</button><button class="btn" onclick="closeSheet()">${V('Tiếp tục nói', 'Keep talking')}</button></div>`);
}
function gramSheet(id) {
  const e = S.errors.find(x => x.id === id);
  openSheet(`
    <h2>${V('Gợi ý ngữ pháp', 'Grammar tip')}</h2>
    <div class="compare bad mt-16"><small>${V('Bạn nói', 'You said')}</small>${esc(e.wrong)}</div>
    <div class="compare good mt-8"><small>${V('Nên nói', 'Better')}</small>${esc(e.word)}</div>
    ${tutorSay(esc(L(e.tip)), 0, 'in mt-24')}
    <div class="row mt-24" style="gap:12px"><button class="btn white" onclick='speak(${esc(JSON.stringify(e.word))})'>${icon('volume')} ${V('Nghe', 'Listen')}</button><button class="btn" onclick="closeSheet()">${V('Đã hiểu', 'Got it')}</button></div>`);
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
  const s = T.s;
  const sess = { fluency: 64 + T.meTotal * 2, vocab: 74, grammar: clamp(82 - T.gram * 10, 30, 95), pron: clamp(72 - T.pron * 6, 30, 95) };
  CRIT.forEach(c => (S.scores[c.k] = Math.round((S.scores[c.k] * 4 + sess[c.k]) / 5))); // rolling avg of last 5, PRD §7.2
  S.sessions++; S.minutes += s.min; S.xp += s.xp; S.today.min += s.min;
  if (!S.done.includes(s.id)) S.done.push(s.id);
  save(); setMic('done'); $('#mic-hint').textContent = V('Hoàn thành!', 'Finished!');
  const caught = T.caught.map(id => S.errors.find(e => e.id === id)).filter(Boolean);
  const pw = caught.find(e => e.cat !== 'grammar'), gw = caught.find(e => e.cat === 'grammar');
  confetti();
  openSheet(`
    <div class="center">${img('party', '', '').replace('class=""', 'style="width:72px;height:72px;margin:0 auto"')}<h2 class="mt-8" style="font-size:24px">${V('Hoàn thành!', 'Well done!')}</h2>
      <p class="muted">${V(`Bạn đã trò chuyện ${T.meTotal} lượt với ${s.persona.name}`, `You had ${T.meTotal} turns with ${s.persona.name}`)} · <b style="color:var(--lantern-b)">+${s.xp} XP</b></p></div>
    ${tutorSay(V(`Bạn giới thiệu ${L(s.name)} rất tự nhiên! ${pw ? `Chú ý từ “${esc(pw.word)}”` : ''}${pw && gw ? ' và ' : ''}${gw ? 'cấu trúc câu đã được gợi ý' : ''}${pw || gw ? ' — mình đã lưu vào Gia sư.' : ''}`, `You introduced ${L(s.name)} naturally! ${pw ? `Watch the word “${esc(pw.word)}”` : ''}${pw && gw ? ' and ' : ''}${gw ? 'the grammar tip' : ''}${pw || gw ? ' — I saved them to Tutor.' : ''}`), 0, 'in mt-16')}
    <div class="card mt-16 flat">${CRIT.map(c => `<div class="row" style="margin-top:10px"><span class="small grow">${L(c.name)}</span><div class="track light" style="width:45%"><i data-w="${sess[c.k]}%" style="width:0;background:${scoreColor(sess[c.k])}"></i></div><b class="small" style="width:34px;text-align:right">${sess[c.k]}</b></div>`).join('')}</div>
    ${caught.length ? `<div class="card soft flat"><b>${caught.length} ${V('mục đã lưu vào Gia sư', 'items saved to Tutor')}</b><div class="row mt-8" style="flex-wrap:wrap;gap:8px">${caught.map(e => `<span class="tag amber">${esc(e.word.length > 22 ? e.word.slice(0, 22) + '…' : e.word)}</span>`).join('')}</div></div>` : ''}
    <a class="btn mt-24" href="#tutor" onclick="closeSheet()">${icon('micAi')} ${V('Sửa lỗi ngay', 'Fix them now')}</a>
    <a class="btn white mt-16" href="#radar" onclick="closeSheet()">${V('Xem bản đồ lỗi', 'See my radar')}</a>`);
}

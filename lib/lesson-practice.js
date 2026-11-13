'use strict';
// Location-lesson conversation lifecycle.

let PR = null;
function clearPractice() { if (PR) PR.timers.forEach(clearTimeout); PR = null; }
const pLater = (fn, ms) => { const p = PR; p.timers.push(setTimeout(() => PR === p && fn(), ms)); };
function pMsg(who, html) {
  const box = $('#pmsgs'); if (!box) return;
  const el = document.createElement('div'); el.className = 'msg ' + who;
  el.innerHTML = `<div class="av">${who === 'ai' ? LOGO('AI Tutor') : esc(S.user.name.trim()[0] || 'B')}</div><div class="bubble">${html}</div>`;
  box.append(el); el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function setSay(on) { if (!PR) return; PR.busy = !on; $('#ans').disabled = $('#send').disabled = !on; }
function startPractice(l) {
  clearPractice();
  const band = cefr(avgScore())[1];
  PR = { l, i: 0, easy: band.startsWith('A'), timers: [], busy: true };
  $('#pmsgs').innerHTML = '';
  pLater(() => pMsg('ai', V(`Chào bạn! Cùng nói về <b>${esc(l.name.en)}</b> bằng tiếng Anh nhé. Mình hỏi ${l.topics.length} câu ở trình độ khoảng <b>${band}</b> (ước tính). Bạn cũng có thể hỏi mình về nơi này.`, `Hi! Let’s talk about <b>${esc(l.name.en)}</b> in English. I’ll ask ${l.topics.length} questions at about <b>${band}</b> level (estimate). You can ask me about this place too.`)), 250);
  askNext(1100);
}
function askNext(ms = 700) {
  const t = PR.l.topics[PR.i];
  pLater(() => { pMsg('ai', `${esc(t.q)}${PR.easy ? `<p class="hintline">${V('Gợi ý', 'Starter')}: “${esc(t.start)}”</p>` : ''}`); speak(t.q); setSay(true); }, ms);
}
function helpStart() { if (!PR || PR.busy) return; const a = $('#ans'); a.value = PR.l.topics[PR.i].start.replace(/…$/, ' '); a.focus(); }
function sendAnswer() {
  const a = $('#ans'), text = a?.value.trim();
  if (!PR || PR.busy || !text) return;
  a.value = ''; setSay(false); stopAudio(); pMsg('me', esc(text));
  if (isQuestion(text)) {
    const f = factFor(text, PR.l);
    pLater(() => {
      pMsg('ai', f ? `${esc(f.en)}${srcTag(true)}` : V('Mình chưa có thông tin đã kiểm chứng về điều đó nên sẽ không đoán. Bạn có thể hỏi giáo viên nhé.', 'I don’t have verified information about that, so I won’t guess. You could ask your teacher.'));
      pLater(() => { pMsg('ai', `${V('Quay lại câu hỏi của mình nhé', 'Back to my question')}: ${esc(PR.l.topics[PR.i].q)}`); setSay(true); }, 900);
    }, 700);
    return;
  }
  const r = checkAnswer(text, PR.l, PR.easy);
  pLater(() => {
    pMsg('ai', feedbackHtml(r));
    PR.i++;
    if (PR.i < PR.l.topics.length) askNext(1000); else pLater(finishPractice, 900);
  }, 800);
}
function finishPractice() {
  const l = PR.l; progW(l.id).p = 1; save(); refreshProg(l);
  pMsg('ai', V(`Tuyệt vời! Bạn vừa giới thiệu <b>${esc(l.name.en)}</b> bằng tiếng Anh. Lần tới hãy thử kể cho một du khách thật nhé!`, `Great work! You just explained <b>${esc(l.name.en)}</b> in English. Next time, try telling a real visitor!`));
  $('#pmsgs').insertAdjacentHTML('beforeend', `<button class="btn soft sm" style="align-self:center" onclick="startPractice(loc('${l.id}'))">${icon('refresh', 'sm')} ${V('Luyện lại', 'Practise again')}</button>`);
  $('#ans').placeholder = V('Đã xong phần luyện nói', 'Practice finished');
  checkComplete(l);
}

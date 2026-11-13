'use strict';
// Saving and reading location-lesson progress.

// Lesson progress: d = Discover read, w = vocab indexes heard, p = practice finished
const prog = id => S.cam[id] || { d: 0, w: [], p: 0 };
const progW = id => (S.cam[id] ||= { d: 0, w: [], p: 0 });
const parts = l => { const p = prog(l.id); return [!!p.d, p.w.length >= l.vocab.length, !!p.p]; };
const progHtml = l => { const n = parts(l); return `${n.map(x => `<span class="${x ? 'on' : ''}"></span>`).join('')}<b>${n.filter(Boolean).length}/3 ${V('phần', 'parts')}</b>`; };
const progLabel = l => { const n = parts(l).filter(Boolean).length; return n ? `<span class="tag ${n === 3 ? 'green' : ''}">${n}/3</span>` : ''; };
const refreshProg = l => { const el = $('#lprog'); if (el) el.innerHTML = progHtml(l); };
function checkComplete(l) {
  const p = progW(l.id);
  if (p.done || !parts(l).every(Boolean)) return;
  p.done = 1; S.xp += 30; save(); confetti();
  toast(V(`Hoàn thành bài học ${l.name.vi} · +30 XP`, `${l.name.en} lesson complete · +30 XP`));
}

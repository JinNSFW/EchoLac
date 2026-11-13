'use strict';
// Landmark journey markup (T-07).

function journeyHtml() {
  const XS = [50, 26, 72, 30, 68, 50, 24, 70, 32, 62], GAP = 150, TOP = 30;
  const pts = JOURNEY.map((_, i) => [XS[i], TOP + i * GAP + 35]);
  const H = TOP + JOURNEY.length * GAP;
  const seg = (a, b) => `C ${a[0]} ${a[1] + GAP / 2} ${b[0]} ${b[1] - GAP / 2} ${b[0]} ${b[1]}`;
  const full = 'M ' + pts[0].join(' ') + ' ' + pts.slice(1).map((p, i) => seg(pts[i], p)).join(' ');
  const doneN = Math.min(S.done.length, JOURNEY.length - 1);
  const donePath = 'M ' + pts[0].join(' ') + ' ' + pts.slice(1, doneN + 1).map((p, i) => seg(pts[i], p)).join(' ');
  const remaining = JOURNEY.length - S.done.length;
  return `
    <div class="journey reveal" style="height:${H}px">
      <svg class="path" viewBox="0 0 100 ${H}" preserveAspectRatio="none" aria-hidden="true"><path d="${full}" vector-effect="non-scaling-stroke"/><path class="done" d="${donePath}" vector-effect="non-scaling-stroke"/></svg>
      ${JOURNEY.map((id, i) => {
        const s = scen(id), st = stopState(i);
        return `<a class="stop ${st} reveal zoom" style="left:${XS[i]}%;top:${TOP + i * GAP}px;margin-left:-66px;--d:${i * 40}ms" href="#scenario/${id}" onclick="return guardLocked('${id}')" aria-label="${L(s.name)}${st === 'locked' ? ' (' + V('đã khoá', 'locked') + ')' : ''}">
          <div class="node">${img(s.icon)}<span class="num">${st === 'done' ? '✓' : i + 1}</span></div>
          <div class="label">${L(s.name)}${st === 'locked' ? img('lock', 'lock') : `<small>${st === 'done' ? V('Đã xong', 'Done') + ' ✓' : s.xp + ' XP'}</small>`}</div>
        </a>`;
      }).join('')}
    </div>
    <section class="card reveal center mt-16">
      <b style="font-size:17px">${V('Tiến độ của bạn', 'Your Progress')}</b>
      <p class="small muted">${V('Hành trình Đà Nẵng – Hội An', 'Da Nang – Hoi An journey')}</p>
      <div class="row mt-16" style="justify-content:center;gap:0">
        <div class="grow"><b style="font-size:28px">${S.done.length}</b><div class="small muted">${V('Hoàn thành', 'Complete')}</div></div>
        <div style="width:1px;height:44px;background:var(--line)"></div>
        <div class="grow"><b style="font-size:28px;color:var(--faint)">${remaining}</b><div class="small muted">${V('Còn lại', 'Remaining')}</div></div>
      </div>
      <div class="track light mt-16"><i data-w="${Math.round((S.done.length / JOURNEY.length) * 100)}%" style="background:var(--primary)"></i></div>
    </section>`;
}

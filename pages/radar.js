'use strict';
// radar screen. Shared pieces live in components/.
VIEWS.radar = {
    render() {
      const avg = avgScore(), [, band, desc] = cefr(avg), w = weakest();
      const best = CRIT.reduce((b, c) => (S.scores[c.k] - PREV[c.k] > S.scores[b.k] - PREV[b.k] ? c : b));
      return `
      <div class="topbar reveal">
        <div class="grow"><h1>${V('Bản đồ lỗi', 'Error Radar')}</h1><p class="small muted">${V('Trung bình 5 phiên gần nhất', 'Average of your last 5 sessions')}</p></div>
        <span class="pill navy">${band} · ${V('ước tính', 'estimate')}</span>
      </div>
      <section class="card reveal">
        <div class="radar-wrap">${radarSvg()}${CRIT.map((c, i) => {
          const pos = [[50, 7], [91, 50], [50, 93], [9, 50]][i];
          return `<button class="axis-lbl ${c.k === w.k ? 'weak' : ''}" style="left:${pos[0]}%;top:${pos[1]}%" onclick="critSheet('${c.k}')">${L(c.name)}<b>${S.scores[c.k]}%</b></button>`;
        }).join('')}</div>
        <div class="legend"><span><i></i>${V('Hiện tại', 'Now')}</span><span><i class="dash"></i>${V('Tháng trước', 'Last month')}</span></div>
        <p class="tiny muted center mt-8">${V('Chạm vào từng tiêu chí để xem chi tiết', 'Tap a criterion to see details')}</p>
      </section>
      ${tutorSay(V(`${L(best.name)} tiến bộ nhanh nhất (+${S.scores[best.k] - PREV[best.k]}). <b>${L(w.name)}</b> vẫn là điểm yếu lớn nhất — đặc biệt là ${w.k === 'pron' ? 'âm cuối' : L(w.subs.reduce((a, b) => (b[1] < a[1] ? b : a))[0]).toLowerCase()}. Luyện 5 phút mỗi ngày nhé!`, `${L(best.name)} improved the most (+${S.scores[best.k] - PREV[best.k]}). <b>${L(w.name)}</b> is still your biggest challenge — especially ${w.k === 'pron' ? 'final sounds' : L(w.subs.reduce((a, b) => (b[1] < a[1] ? b : a))[0]).toLowerCase()}. Five minutes a day will help!`), 0, 'mt-24')}
      <div class="section-title reveal"><span>${V('Bốn tiêu chí', 'Four criteria')}</span></div>
      <section class="card reveal">${CRIT.map(c => {
        const v = S.scores[c.k], dlt = v - PREV[c.k];
        return `<div class="crit">
          <span class="ic">${img(c.icon)}</span>
          <div class="grow"><div class="row between"><span class="nm">${L(c.name)}</span><span><b>${v}%</b> <span class="delta">${dlt >= 0 ? '▲' : '▼'} ${Math.abs(dlt)}</span></span></div>
            <div class="track light"><i data-w="${v}%" style="background:${scoreColor(v)}"></i></div>
            ${v < 65 ? `<button class="btn sm lantern mt-8" style="height:36px" onclick="practiseThis('${c.k}')">${V('Luyện ngay', 'Practise this')} ${icon('right', 'sm')}</button>` : ''}
          </div></div>`;
      }).join('')}</section>
      <section class="card reveal mt-24">
        <div class="cefr"><div class="band">${band}</div><div><b>${V('Trình độ ước tính', 'Estimated level')}</b><p class="small muted">${L(desc)}</p></div></div>
        <p class="tiny muted mt-16">${V('Đây chỉ là ước tính từ điểm AI, không phải chứng chỉ chính thức.', 'This is an estimate from AI scores, not an official certificate.')}</p>
      </section>
      <div class="section-title reveal"><span>${V('Tiến bộ 6 tuần', '6-week progress')}</span></div>
      <section class="card reveal line-chart">${lineChart()}
        <div class="grid2 mt-16" style="gap:12px">
          <div class="stat-tile" style="box-shadow:none;background:var(--tint)"><b style="margin:0">${S.sessions}</b><span>${V('phiên luyện tập', 'sessions')}</span></div>
          <div class="stat-tile" style="box-shadow:none;background:var(--tint)"><b style="margin:0">${S.minutes}</b><span>${V('phút đã nói', 'minutes spoken')}</span></div>
        </div>
      </section>`;
    },
  };

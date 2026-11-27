'use strict';
// Current skill scores and recorded practice totals.
VIEWS.radar = {
  render() {
    const score = avgScore(), estimate = score === null ? null : cefr(score);
    return `
      <div class="topbar reveal">
        <a class="icon-btn" href="#home" aria-label="${V('Quay lại', 'Back')}">${icon('left')}</a>
        <div class="grow"><h1>${V('Bản đồ lỗi', 'Error Radar')}</h1></div>
        ${estimate ? `<span class="pill navy">${estimate[1]} · ${V('ước tính', 'estimate')}</span>` : ''}
      </div>
      ${estimate ? `<section class="card reveal"><div class="radar-wrap">${radarSvg()}</div></section>` : ''}
      <section class="card reveal">${CRIT.map(c => `
        <div class="crit">
          <span class="ic">${img(c.icon)}</span>
          <div class="grow">
            <div class="row between"><span class="nm">${L(c.name)}</span><b>${skillScoreText(c.k)}</b></div>
            ${hasSkillScore(c.k) ? `<div class="track light"><i data-w="${S.scores[c.k]}%" style="background:${scoreColor(S.scores[c.k])}"></i></div>` : ''}
            <button class="btn sm lantern mt-8" onclick="practiseThis('${c.k}')">${V('Luyện ngay', 'Practise this')} ${icon('right', 'sm')}</button>
          </div>
        </div>`).join('')}</section>
      ${CRIT.some(c => hasSkillScore(c.k)) ? '' : `<p class="muted mt-16">${V('Chưa có điểm kỹ năng. Kết quả sẽ hiện sau khi có bài luyện được chấm.', 'No skill scores yet. Results will appear after a scored exercise.')}</p>`}
      <div class="grid2 mt-16">
        <div class="stat-tile"><b>${S.sessions}</b><span>${V('phiên luyện tập', 'practice sessions')}</span></div>
        <div class="stat-tile"><b>${S.minutes}</b><span>${V('phút đã nói', 'minutes spoken')}</span></div>
      </div>`;
  },
};

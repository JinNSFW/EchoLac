'use strict';
// Tutor queue, attempt history and mastery indicators.

const sortedErrors = () => [...S.errors].sort((a, b) => (a.status === b.status ? b.at - a.at || a.best - b.best : a.status === 'open' ? -1 : 1));
function tutorList() {
  const list = sortedErrors().filter(e => S.tutorCat === 'all' || e.cat === S.tutorCat);
  return list.map((e, i) => `
    <a class="err-item reveal ${e.status}" style="--d:${Math.min(i, 5) * 50}ms" href="#practice/${e.id}">
      <div class="mini-ring">${ringSvg(e.best, 21, 5, scoreColor(e.best), 'var(--line)')}<b>${e.best}</b></div>
      <div class="grow"><div class="w" style="${e.word.length > 16 ? 'font-size:15px' : ''}">${esc(e.word)}</div>${e.ipa ? `<div class="ipa">${ipaHl(e)}</div>` : ''}
        <div class="src"><span class="tag ${e.status === 'mastered' ? 'green' : 'amber'}">${e.status === 'mastered' ? V('Thành thạo', 'Mastered') : L(ERR_CAT[e.cat])}</span><span>${V('từ', 'from')} ${L(scen(e.scen).name)}</span></div></div>
      ${icon('chevR')}
    </a>`).join('');
}
const attemptsHtml = e => e.attempts.slice(-5).map(a => `<span class="tag ${a >= 80 ? 'green' : a >= 60 ? '' : 'amber'}">${a}</span>`).join('') || `<span class="tiny muted">${V('Chưa có lượt thử', 'No attempts yet')}</span>`;
const masteryHtml = e => [0, 1].map(i => `<i class="${e.days.length > i ? 'on' : ''}"></i>`).join('');

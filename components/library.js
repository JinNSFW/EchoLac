'use strict';
// Scenario search and library cards (R-01).

function libraryHtml() {
  return `
    <div class="row mt-24 reveal">
      <label class="search">${icon('search', 'sm')}<span class="sr">${V('Tìm', 'Search')}</span><input id="q" placeholder="${V('Tìm tình huống', 'Search scenarios')}" oninput="renderLib()"></label>
      <button class="icon-btn" onclick="toast(V('Lọc theo trình độ sắp có','Level filter coming soon'))" aria-label="${V('Lọc', 'Filter')}">${icon('filter')}</button>
    </div>
    <div class="chips mt-16 reveal">${[['all', { vi: 'Tất cả', en: 'All' }], ...Object.entries(CATS)].map(([k, n]) => `<button class="chip ${S.libCat === k ? 'active' : ''}" onclick="S.libCat='${k}';setRpMode('library')">${L(n)}</button>`).join('')}</div>
    <div id="lib" class="mt-16">${libCards('')}</div>`;
}
function libCards(q) {
  const list = SCEN.filter(s => (S.libCat === 'all' || s.cat === S.libCat) && (!q || (s.en + ' ' + s.name.vi).toLowerCase().includes(q.toLowerCase())));
  if (!list.length) return `<div class="card center reveal"><p class="muted">${V('Không tìm thấy tình huống phù hợp.', 'No matching scenarios.')}</p></div>`;
  return list.map(s => {
    const lock = isLocked(s.id), done = S.done.includes(s.id);
    return `<a class="scen-card reveal" href="#scenario/${s.id}" onclick="return guardLocked('${s.id}')">
      <div class="scen-img" style="background:linear-gradient(135deg,${s.bg[0]},${s.bg[1]})">${img(s.icon)}<span class="tag navy lvl">${s.level}</span><span class="dur">${s.min} ${V('phút', 'min')}</span>${done ? '<span class="bar" style="width:100%"></span>' : ''}</div>
      <div class="scen-body"><h3>${s.en}${lock ? ' 🔒' : ''}</h3>
        <div class="meta">${s.name.vi} • ${L(CATS[s.cat])} • ${s.persona.name}</div>
        <div class="meta2">${s.vocab.length} ${V('từ vựng', 'words')} · ${s.xp} XP${done ? ' · ' + V('Đã hoàn thành', 'Completed') : ''}</div></div>
    </a>`;
  }).join('');
}

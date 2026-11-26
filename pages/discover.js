'use strict';
// Tourist home: approved public places from public.locations (docs/connect-plan.md §4.C).
VIEWS.discover = {
  render() {
    const places = S.connect.locations;
    return `
    <header class="c-head">
      <p class="c-slogan">${CONNECT_SLOGAN}</p>
      <h1>${V('Khám phá Đà Nẵng và Hội An', 'Discover Da Nang and Hoi An')}</h1>
      <p class="muted">${V('Xem các địa điểm công khai đã được duyệt.', 'Browse approved public places.')}</p>
    </header>
    ${S.connect.status !== 'ready' ? connectGate() : places.length ? `<div class="c-grid">${places.map(p => `
      <a class="c-place" href="#spot/${encodeURIComponent(p.id)}">
        <span class="c-photo">${locPhoto(p.id)}</span>
        <span class="c-body"><b>${placeName(p.id)}</b><small>${esc(L(loc(p.id)?.description) || '')}</small>
          <span class="c-tags">${(LOCATION_TAGS[p.id] || []).slice(0, 3).map(t => `<span class="tag">${interestName(t)}</span>`).join('')}</span></span>
      </a>`).join('')}</div>`
      : `<div class="card center"><p class="muted">${V('Chưa có địa điểm được duyệt.', 'No approved places yet.')}</p></div>`}
    ${safetyNote()}`;
  },
  mount: () => connectMount(),
};

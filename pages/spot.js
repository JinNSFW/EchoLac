'use strict';
// Tourist place detail. Group sessions are visible only to school members (RLS), so tourists see no people here.
VIEWS.spot = {
  render(id) {
    const back = `<a class="icon-btn" href="#discover" aria-label="${V('Quay lại', 'Back')}">${icon('left')}</a>`;
    if (S.connect.status !== 'ready') return `<div class="topbar">${back}<h1>${V('Địa điểm', 'Place')}</h1></div>${connectGate()}`;
    if (!approvedPlace(id)) return `<div class="topbar">${back}<h1>${V('Không tìm thấy', 'Not found')}</h1></div>
      <div class="card center" role="alert"><p>${V('Địa điểm này không nằm trong danh sách được duyệt.', 'This place is not on the approved list.')}</p><a class="btn white sm mt-16" href="#discover">${V('Về Khám phá', 'Back to Discover')}</a></div>`;
    return `
    <div class="topbar">${back}<h1>${placeName(id)}</h1></div>
    <section class="c-hero"><span class="c-photo">${locPhoto(id)}</span>
      <p>${esc(L(loc(id)?.description) || '')}</p>
      <p class="tiny muted">${V('Thông tin công khai, ai cũng xem được.', 'Public information anyone can view.')}</p></section>
    ${notOpen(V('Kết nối với du khách', 'Connecting with tourists'), V('Cần xác minh danh tính du khách (sắp có). Hiện chỉ có buổi nhóm do trường tổ chức cho học sinh.', 'Tourist identity verification is needed (coming soon). For now only school-run group sessions for students exist.'))}
    ${safetyNote()}`;
  },
  mount: () => connectMount(),
};

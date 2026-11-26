'use strict';
// Tourist requests from public.connection_requests (RLS: only the two parties). Cancel goes through connect-respond.
VIEWS.connections = {
  render() {
    const me = S.connect.me, list = me ? S.connect.requests.filter(r => r.tourist_id === me.id) : [];
    return `
    <header class="c-head"><h1>${V('Kết nối của bạn', 'Your connections')}</h1>
      <p class="muted">${V('Yêu cầu bạn đã gửi tới học sinh địa phương.', 'Requests you sent to local students.')}</p></header>
    ${S.connect.status !== 'ready' ? connectGate() : list.length ? `<div class="c-list">${list.map(r => requestRow(r, r.student_id, [
      ['pending', 'accepted'].includes(r.status) ? `<button class="btn white sm" onclick="answerConnect(this,'cancelled')">${r.status === 'accepted' ? V('Huỷ kết nối', 'Cancel connection') : V('Huỷ yêu cầu', 'Cancel request')}</button>` : '',
      r.status !== 'blocked' && r.student_id ? `<button class="btn white sm" data-u="${esc(r.student_id)}" data-r="${esc(r.id)}" onclick="openReport(this.dataset.u,this.dataset.r)">${V('Báo cáo hoặc chặn', 'Report or block')}</button>` : '',
    ].join(''))).join('')}</div>`
      : `<div class="card center"><p class="muted">${V('Chưa có yêu cầu nào.', 'No requests yet.')}</p><a class="btn sm mt-16" href="#discover">${V('Xem địa điểm', 'See places')}</a></div>`}
    ${safetyNote()}`;
  },
  mount: () => connectMount(),
};

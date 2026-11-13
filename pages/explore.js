'use strict';
// explore screen. Shared pieces live in components/.
VIEWS.explore = {
    render() {
      const started = Object.keys(S.cam).length;
      return `
      <div class="topbar reveal">
        <a class="icon-btn" href="#home" aria-label="${V('Quay lại', 'Back')}">${icon('left')}</a>
        <h1>${V('Học qua ống kính', 'Camera learning')}</h1>
        <span class="tag amber">${V('Chế độ Demo', 'Demo Mode')}</span>
      </div>
      <section class="cam-hero reveal zoom">
        <div class="vf" aria-hidden="true"><i></i><i></i><i></i><i></i>${img('bridge')}</div>
        <h2>${V('Hướng camera, xác minh vị trí, khám phá văn hoá Việt', 'Point your camera, verify your location, discover Vietnamese culture')}</h2>
        <p>${V('và học tiếng Anh từ chính thế giới quanh bạn.', 'and learn English through the world around you.')}</p>
      </section>
      <ol class="how reveal">
        <li><span class="n">1</span><span><b>${V('Khớp GPS', 'GPS matching')}</b><small>${V('Lọc ra các địa danh hỗ trợ trong bán kính. GPS chỉ thu hẹp khu vực, không biết camera đang nhìn gì.', 'Lists supported places within range. GPS only narrows the area; it can’t tell what the camera sees.')}</small></span></li>
        <li><span class="n">2</span><span><b>${V('Khớp ảnh', 'Image matching')}</b><small>${V('Ảnh bạn chụp được so độc lập với ảnh tham chiếu của mọi địa danh.', 'Your photo is compared, on its own, with every place’s reference images.')}</small></span></li>
        <li><span class="n">3</span><span><b>${V('Đối chiếu chéo', 'Cross-check')}</b><small>${V('Chỉ khi hai kết quả trùng nhau, bài học mới được mở tự động. Lệch nhau thì bạn tự xác nhận.', 'A lesson opens automatically only when both agree. If they differ, you confirm.')}</small></span></li>
      </ol>
      <div class="section-title reveal"><span>${V('Kịch bản demo', 'Demo scenario')}</span></div>
      <div class="chips reveal" role="radiogroup" aria-label="${V('Kịch bản demo', 'Demo scenario')}">${Object.entries(SCENARIOS).map(([k, s]) => `<button class="chip ${CL.scen === k ? 'active' : ''}" role="radio" aria-checked="${CL.scen === k}" onclick="setScen('${k}')">${L(s)}</button>`).join('')}</div>
      <div class="demo-note reveal" id="scen-note">${scenNote()}</div>
      <div class="section-title reveal"><span>${V('Địa danh được hỗ trợ', 'Supported places')}</span><span class="tiny muted">${LOCS.length}</span></div>
      ${LOCS.length ? `<p class="tiny muted reveal" style="margin:-6px 0 12px">${V('Mở từ danh sách là học kiểu thư viện, không xác minh vị trí.', 'Opening from this list is library study, with no location check.')}</p><div class="reveal">${LOCS.map(l => locRow(l, null, 'library', progLabel(l))).join('')}</div>`
        : `<div class="card center reveal"><p class="muted">${V('Chưa có địa danh nào. Quản trị viên thêm địa danh trong assets/data/locations.js.', 'No places configured yet. Admins add them in assets/data/locations.js.')}</p></div>`}
      <section class="card soft reveal mt-24 priv">
        <div class="row" style="gap:10px">${icon('shield')}<b>${V('Quyền riêng tư', 'Your privacy')}</b></div>
        <ul>
          <li>${V('Vị trí chỉ được kiểm tra khi bạn mở camera, không lưu lại và không chia sẻ với ai.', 'Location is checked only when you open the camera. It is never saved or shared.')}</li>
          <li>${V('Ảnh chỉ nằm trên máy này và mất khi bạn tải lại trang. Không có gì được tải lên.', 'Photos stay on this device and are gone when you reload. Nothing is uploaded.')}</li>
          <li>${V('Ứng dụng chỉ lưu tiến độ học của từng địa danh.', 'The app saves only your lesson progress for each place.')}</li>
        </ul>
        ${started ? `<button class="btn white sm mt-16" onclick="clearCamSheet()">${icon('trash', 'sm')} ${V('Xoá lịch sử học qua ống kính', 'Delete camera-learning history')}</button>` : ''}
      </section>
      <div class="sticky-cta">${LOCS.length ? `<button class="btn" onclick="camIntro()">${icon('camera')} ${V('Mở camera', 'Open camera')}</button>` : ''}</div>`;
    },
  };

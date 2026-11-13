'use strict';
// GPS status and supported-place list.

const names = ids => ids.map(id => esc(loc(id).name.en)).join(', ');
const gpsTone = g => (g.gpsStatus !== 'available' || g.status === 'none' ? 'warn' : 'ok');
const gpsShort = g => (g.gpsStatus === 'unavailable' ? V('Không có GPS · chỉ xác minh bằng ảnh', 'No GPS · image-only check')
  : g.gpsStatus === 'inaccurate' ? V(`GPS chưa chính xác (±${km(g.approx.acc)})`, `GPS imprecise (±${km(g.approx.acc)})`)
  : g.status === 'none' ? V('Không có địa danh hỗ trợ ở gần', 'No supported place nearby')
  : g.status === 'matched' ? `${V('Gần', 'Near')} ${names([g.candidates[0].id])} · ${km(g.candidates[0].d)}`
  : V(`${g.candidates.length} địa danh ở gần`, `${g.candidates.length} places nearby`));
const GPS_ST = { available: ['Khả dụng', 'Available'], unavailable: ['Không khả dụng', 'Unavailable'], inaccurate: ['Chưa chính xác', 'Inaccurate'] };
const GPS_MT = { matched: ['Khớp 1 nơi', 'Matched'], multiple: ['Nhiều ứng viên', 'Multiple candidates'], none: ['Không có địa danh hỗ trợ', 'No supported location'] };
function locateHtml() {
  const g = G.gps, none = g.gpsStatus === 'available' && g.status === 'none';
  return `
    <section class="card reveal">
      <div class="row" style="gap:12px"><span class="gps-dot" data-s="${gpsTone(g)}">${icon('pin')}</span><div class="grow"><b>${gpsShort(g)}</b>${isDemo() ? `<div class="tiny muted">${V('Vị trí mẫu, mô phỏng', 'Sample location, simulated')}</div>` : ''}</div></div>
      <dl class="kv mt-16">
        <div><dt>${V('Trạng thái GPS', 'GPS status')}</dt><dd>${V(...GPS_ST[g.gpsStatus])}</dd></div>
        <div><dt>${V('Vị trí gần đúng', 'Approximate location')}</dt><dd>${g.approx ? `${g.approx.lat}, ${g.approx.lng} (±${km(g.approx.acc)})` : '—'}</dd></div>
        <div><dt>${V('Kết quả khớp GPS', 'GPS matching')}</dt><dd>${V(...GPS_MT[g.status])}</dd></div>
        <div><dt>${V('Số ứng viên', 'Candidates')}</dt><dd>${g.candidates.length}</dd></div>
      </dl>
    </section>
    ${g.candidates.length ? `<div class="section-title reveal"><span>${V('Địa danh trong bán kính', 'Places within range')}</span></div>
      ${g.candidates.map(c => `<div class="loc-row reveal">${tile(loc(c.id))}<span class="grow"><b>${esc(loc(c.id).name.en)}</b><small>${km(c.d)} · ${V('bán kính', 'radius')} ${km(c.radius)} · ${c.refs} ${V('ảnh tham chiếu', 'reference image(s)')}</small></span></div>`).join('')}` : ''}
    <p class="tiny muted mt-16 reveal">${V('GPS chỉ thu hẹp khu vực tìm kiếm. Nó không xác nhận camera đang hướng vào đâu: bước khớp ảnh sẽ làm việc đó.', 'GPS only narrows the search area. It doesn’t confirm what the camera points at; image matching does that next.')}</p>
    ${none
      ? `<div class="verdict bad mt-16 reveal">${icon('x')}<div><b>${V('EchoLạc chưa hỗ trợ địa điểm này', 'EchoLạc doesn’t support this place yet')}</b><p>${V('Bạn có thể xem các địa danh được hỗ trợ hoặc luyện tiếng Anh chung.', 'See the supported places, or practise general English.')}</p></div></div>
        <div class="sticky-cta"><a class="btn" href="#roleplay">${icon('chat')} ${V('Luyện tiếng Anh chung', 'Practise general English')}</a><a class="btn white mt-16" href="#explore">${V('Xem địa danh được hỗ trợ', 'See supported places')}</a></div>`
      : `<div class="sticky-cta"><a class="btn" href="#cam">${icon('camera')} ${V('Tiếp: mở camera', 'Next: open camera')}</a></div>`}`;
}

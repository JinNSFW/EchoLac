'use strict';
// Clearly labelled camera demo modes and their controls.

/* Demo Mode, spec §10: sample GPS fixes + simulated similarity scores, labelled wherever they show */
const SCENARIOS = {
  live: { vi: 'Thật: GPS + camera', en: 'Live: GPS + camera' },
  agree: { vi: '1 · Hai bên khớp', en: '1 · Both agree', at: 'dragon-bridge', sim: { 'dragon-bridge': 0.91, 'han-market': 0.31, 'marble-mountains': 0.18 } },
  conflict: { vi: '2 · GPS và ảnh lệch', en: '2 · GPS vs image differ', at: 'dragon-bridge', sim: { 'marble-mountains': 0.88, 'dragon-bridge': 0.27 } },
  multi: { vi: '3 · Nhiều nơi gần nhau', en: '3 · Several nearby', at: 'covered-bridge', sim: { 'covered-bridge': 0.86, 'hoi-an-ancient-town': 0.58 } },
  imgfail: { vi: '4 · Ảnh không nhận ra', en: '4 · Image fails', at: 'han-market', sim: { 'han-market': 0.34, 'dragon-bridge': 0.21 } },
  nogps: { vi: '5 · Không có GPS', en: '5 · No GPS', at: null, sim: { 'hoi-an-ancient-town': 0.84, 'covered-bridge': 0.49 } },
  model: { vi: '6 · Model thật, GPS mẫu Hội An', en: '6 · Real model, sample GPS (Hoi An)', at: 'covered-bridge', real: true },
};
const isDemo = () => CL.scen !== 'live';
const realImage = () => !isDemo() || !!SCENARIOS[CL.scen].real; // image result comes from the actual model
const demoLabel = () => (realImage() ? V('Demo: GPS mẫu, ảnh nhận diện thật', 'Demo: sample GPS, real image model') : V('Demo, mô phỏng', 'Demo, simulated'));
const topSim = s => Object.entries(s.sim).sort((a, b) => b[1] - a[1])[0][0];
const MODEL_NOTE = () => V('Ảnh được nhận diện bằng model Teachable Machine thật trong thư mục model/. Model hiện chỉ học vài địa danh; nơi khác sẽ ra “không nhận diện được”.', 'Photos are recognised by the real Teachable Machine model in model/. It only knows a few places so far; others come out “not recognised”.');
function scenNote() {
  const s = SCENARIOS[CL.scen];
  if (!isDemo()) return `${icon('bulb')}<p>${V('<b>Chế độ thật.</b> Dùng GPS và camera của bạn.', '<b>Live mode.</b> Uses your real GPS and camera.')} ${MODEL_NOTE()}</p>`;
  if (s.real) return `${icon('bulb')}<p><b>${demoLabel()}.</b> ${V('GPS mẫu: cạnh Chùa Cầu (Chùa Cầu và Phố cổ Hội An đều trong bán kính).', 'Sample GPS: next to the Covered Bridge (it and Hoi An Ancient Town are both in range).')} ${MODEL_NOTE()} ${V('Thử chụp ảnh Chùa Cầu, Ngũ Hành Sơn, hoặc nơi khác.', 'Try a photo of the Covered Bridge, the Marble Mountains, or somewhere else.')}</p>`;
  const at = loc(s.at), top = loc(topSim(s));
  return `${icon('bulb')}<p><b>${V('Chế độ Demo, kết quả mô phỏng.', 'Demo Mode, simulated results.')}</b> ${V('GPS mẫu', 'Sample GPS')}: ${at ? `${V('cạnh', 'next to')} ${esc(at.name.en)}` : V('bị tắt', 'off')} · ${V('Ảnh mô phỏng', 'Simulated image')}: ${esc(top?.name.en || '?')} ${s.sim[topSim(s)].toFixed(2)}. ${V('Camera vẫn là thật; không có camera thì nút chụp dùng ảnh mẫu.', 'The camera is still real; without one, the shutter uses a sample image.')}</p>`;
}
function setScen(k) { CL.scen = k; G.gps = null; const y = scrollY; route(); scrollTo(0, y); document.querySelectorAll('.reveal').forEach(show); }

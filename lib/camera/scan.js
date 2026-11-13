'use strict';
// Continuous on-device landmark recognition (R-11).

/* ================= Camera recognition (R-11) =================
   Frames never leave the device: predict() runs in the browser, nothing is stored or sent. */
const SC = { ok: false, stream: null, model: null, raf: 0, tok: null, last: 0, busy: false, hold: { cls: -1, since: 0 }, map: {}, warned: false, canvas: null };
const BG_CLASS = /^(background|nothing|none|other|nền|khác)$/i; // "nothing here" classes only ever show the hint

// Class index → scenario id, by class NAME from metadata.json.
// shortcut: a missing name falls back to index 2 (the spec's "3rd class is Cầu Rồng"); fine for one mapped class, give each class its real name in Teachable Machine before mapping more.
function resolveMap(labels) {
  const out = {};
  Object.entries(CAM.map).forEach(([name, id]) => {
    let i = labels.findIndex(l => norm(l) === norm(name));
    if (i < 0) { i = 2; if (!SC.warned) { SC.warned = true; console.warn(`[EchoLac] class "${name}" not found in metadata.json, using index 2 ("${labels[2]}")`); } }
    if (i < labels.length) out[i] = id;
  });
  return out;
}
// A class counts only after it stays >= threshold for holdMs without a break, so a flicker never triggers
function holdStep(hold, cls, p, now) {
  if (p < CAM.threshold) return { cls: -1, since: 0, hit: false };
  const since = hold.cls === cls ? hold.since : now;
  return { cls, since, hit: now - since >= CAM.holdMs };
}
const loadScanModel = () => loadTmLibs().then(() => tmImage.load(CAM.modelUrl + 'model.json', CAM.modelUrl + 'metadata.json'));
const firstSentence = s => s.split(/(?<=[.!?])\s/)[0];

function scanState(st) {
  const tm = $('#tm'); if (!tm) return;
  tm.dataset.state = st;
  const back = `<a class="btn white mt-16" href="#roleplay">${V('Quay lại Nhập vai', 'Back to Roleplay')}</a>`;
  const retry = `<button class="btn mt-24" onclick="startScan()">${icon('refresh')} ${V('Thử lại', 'Try again')}</button>`;
  $('#tm-panel').innerHTML = {
    intro: `<span class="tm-ic">${icon('camera', 'lg')}</span><h2>${V('Vì sao cần camera?', 'Why the camera?')}</h2>
      <p>${V('EchoLạc dùng camera sau để nhận ra địa danh trước mặt bạn rồi mở đúng bài nói. Hình ảnh được xử lý ngay trên máy, không lưu và không gửi đi đâu.', 'EchoLạc uses your back camera to recognise the landmark in front of you and open its speaking lesson. Images are processed on this device only, never stored or sent anywhere.')}</p>
      <button class="btn mt-24" onclick="SC.ok=true;startScan()">${icon('camera')} ${V('Bật camera', 'Turn on camera')}</button>${back}`,
    loading: `<div class="tm-skel" aria-hidden="true"><i></i><i></i><i></i></div><p role="status">${V('Đang tải model nhận diện…', 'Loading the recognition model…')}</p>`,
    live: '',
    denied: `<h2>${V('Camera đang bị chặn', 'Camera access is blocked')}</h2><p>${V('Trên máy tính: bấm biểu tượng ổ khoá cạnh địa chỉ web → Camera → Cho phép. Trên điện thoại: Cài đặt → trình duyệt → Camera → Cho phép. Sau đó bấm Thử lại.', 'On a computer: click the lock icon next to the address → Camera → Allow. On a phone: Settings → your browser → Camera → Allow. Then tap Try again.')}</p>${retry}${back}`,
    nocam: `<h2>${V('Không tìm thấy camera', 'No camera found')}</h2><p>${V('Thiết bị này không có camera, hoặc camera đang được ứng dụng khác dùng.', 'This device has no camera, or another app is using it.')}</p>${retry}${back}`,
    model: `<h2>${V('Không tải được model', 'The model didn’t load')}</h2><p>${V('Kiểm tra kết nối mạng rồi thử lại.', 'Check your connection and try again.')}</p>${retry}${back}`,
    offline: `<h2>${V('Bạn đang ngoại tuyến', 'You’re offline')}</h2><p>${V('Lần đầu cần mạng để tải model nhận diện (khoảng 3 MB). Hãy kết nối rồi thử lại.', 'The first scan needs internet to download the recognition model (about 3 MB). Connect and try again.')}</p>${retry}${back}`,
    paused: `<p>${V('Camera đã tắt.', 'The camera is off.')}</p><button class="btn mt-16" onclick="startScan()">${icon('scan')} ${V('Quét lại', 'Scan again')}</button>`,
  }[st];
  $('#tm-label').innerHTML = st === 'live' ? `<span>${V('Hướng camera vào địa danh', 'Point the camera at a landmark')}</span>` : '';
}

async function startScan() {
  stopScan();
  const tok = SC.tok = {};
  if (!navigator.onLine && !window.tmImage) return scanState('offline'); // no service worker caches the model yet
  if (!navigator.mediaDevices?.getUserMedia) return scanState('nocam');
  scanState('loading');
  const [cam, mdl] = await Promise.allSettled([
    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false }),
    SC.model ? Promise.resolve(SC.model) : loadScanModel(),
  ]);
  if (SC.tok !== tok) { cam.value?.getTracks().forEach(t => t.stop()); if (mdl.value && mdl.value !== SC.model) try { mdl.value.model.dispose(); } catch { /* already freed */ } return; } // learner left while loading
  if (mdl.status === 'fulfilled') SC.model = mdl.value;
  if (cam.status === 'rejected') return scanState(['NotAllowedError', 'SecurityError'].includes(cam.reason?.name) ? 'denied' : 'nocam');
  if (mdl.status === 'rejected') { cam.value.getTracks().forEach(t => t.stop()); console.warn('[EchoLac] model failed to load', mdl.reason); return scanState(navigator.onLine ? 'model' : 'offline'); }
  SC.stream = cam.value; SC.map = resolveMap(SC.model.getClassLabels()); SC.hold = { cls: -1, since: 0 };
  const v = $('#tm-v'); v.srcObject = SC.stream; await v.play().catch(() => {});
  scanState('live');
  SC.raf = requestAnimationFrame(scanLoop);
}
async function scanLoop(now) {
  const tok = SC.tok; if (!tok) return;
  SC.raf = requestAnimationFrame(scanLoop);
  const v = $('#tm-v');
  if (SC.busy || now - SC.last < 200 || !v || v.readyState < 2) return; // ~5 fps
  SC.last = now; SC.busy = true;
  let preds = null;
  try {
    // Centre square at 224 px, as Teachable Machine trained it; a <video> has no usable width/height for tmImage's own crop
    const c = SC.canvas ||= Object.assign(document.createElement('canvas'), { width: 224, height: 224 }), s = Math.min(v.videoWidth, v.videoHeight);
    c.getContext('2d').drawImage(v, (v.videoWidth - s) / 2, (v.videoHeight - s) / 2, s, s, 0, 0, 224, 224);
    preds = await SC.model.predict(c);
  } catch (e) { console.warn('[EchoLac] predict failed', e); } finally { SC.busy = false; }
  if (SC.tok !== tok || !preds) return;
  const top = preds.reduce((b, p, i) => (p.probability > b.p ? { i, p: p.probability, name: p.className.trim() } : b), { i: -1, p: 0, name: '' });
  const bg = BG_CLASS.test(top.name);
  SC.hold = bg ? { cls: -1, since: 0, hit: false } : holdStep(SC.hold, top.i, top.p, now);
  const id = SC.map[top.i], lbl = $('#tm-label');
  lbl.innerHTML = bg || top.p < CAM.threshold ? `<span>${V('Hướng camera vào địa danh', 'Point the camera at a landmark')}</span>`
    : `<b>${esc(id ? L(scen(id).name) : top.name)}</b> <span class="tm-pct">${Math.round(top.p * 100)}%</span>${SC.hold.hit && !id ? ` · ${V('Chưa có bài cho địa danh này', 'No lesson for this place yet')}` : ''}`;
  if (SC.hold.hit && id) recognised(id);
}
function recognised(id) {
  const s = scen(id);
  stopScan(); scanState('paused');
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) confetti();
  openSheet(`
    <div class="center"><span class="tile-3d" style="margin:0 auto;background:linear-gradient(145deg,${s.bg[0]},${s.bg[1]})">${img(s.icon)}</span>
      <h2 class="mt-16" style="font-size:24px">${esc(L(s.name))}</h2></div>
    <p class="muted mt-8 center">${esc(firstSentence(L(s.facts)))}</p>
    <a class="btn mt-24" href="#scenario/${id}">${icon('mic')} ${V('Bắt đầu nói', 'Start talking')}</a>
    <button class="btn white mt-16" onclick="closeSheet();startScan()">${icon('scan')} ${V('Quét lại', 'Scan again')}</button>`);
}
function stopScan(dispose) {
  SC.tok = null; cancelAnimationFrame(SC.raf);
  SC.stream?.getTracks().forEach(t => t.stop()); SC.stream = null; // turns the camera light off
  const v = $('#tm-v'); if (v) v.srcObject = null;
  // tmImage 0.8.5's own dispose() throws on a loaded model, so free the tf.LayersModel inside; never let this break route()
  if (dispose && SC.model) { try { SC.model.model.dispose(); } catch (e) { console.warn('[EchoLac] model dispose failed', e); } SC.model = null; }
}
document.addEventListener('visibilitychange', () => { if (document.hidden && SC.stream) { stopScan(); scanState('paused'); } });

'use strict';
// Camera lifecycle, photo capture and recognition.

function camIntro() {
  G.gps = null; // every run starts with a fresh GPS stage
  if (CL.intro) { location.hash = '#locate'; return; }
  openSheet(`
    <h2>${V('Trước khi mở camera', 'Before we open the camera')}</h2>
    <p class="small muted mt-8">${V('Trình duyệt sẽ hỏi quyền. Bạn có thể từ chối và vẫn chọn địa điểm thủ công.', 'Your browser will ask for permission. You can say no and still choose a place by hand.')}</p>
    <div class="perm mt-16"><span class="ic">${icon('pin')}</span><div><b>${V('Vị trí', 'Location')}</b><p>${isDemo() ? V('Chế độ Demo dùng vị trí mẫu, không hỏi quyền GPS.', 'Demo Mode uses a sample location and doesn’t ask for GPS.') : V('Để biết bạn đang ở gần địa danh nào được hỗ trợ. Chỉ kiểm tra lúc này, không lưu và không chia sẻ.', 'To see which supported landmark you are near. Checked only now, never saved or shared.')}</p></div></div>
    <div class="perm"><span class="ic">${icon('camera')}</span><div><b>Camera</b><p>${V('Để chụp một tấm ảnh địa danh. Ảnh ở lại trên máy này, không tải lên.', 'To take one photo of the landmark. It stays on this device and is never uploaded.')}</p></div></div>
    <button class="btn mt-24" onclick="CL.intro=true;closeSheet();location.hash='#locate'">${V('Tiếp tục', 'Continue')}</button>
    <button class="btn white mt-16" onclick="choosePlace('library')">${V('Chọn địa điểm thủ công', 'Choose a place manually')}</button>`);
}
async function startCam() {
  const tok = CL.tok = {};
  if (!navigator.mediaDevices?.getUserMedia) return camFail('');
  try {
    const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
    if (CL.tok !== tok) return s.getTracks().forEach(t => t.stop()); // learner left while the permission prompt was open
    CL.stream = s;
    const v = $('#cam-v'); v.srcObject = s; await v.play().catch(() => {});
    $('#shutter').disabled = false;
    if (s.getVideoTracks()[0].getCapabilities?.().torch) $('#torch').hidden = false;
  } catch (e) { if (CL.tok === tok) camFail(e.name); }
}
function camFail(name) {
  $('#cam').classList.add('nocam');
  $('#cam-hint').textContent = name === 'NotAllowedError'
    ? V('Camera đang bị chặn. Bật quyền camera trong cài đặt trình duyệt, chọn một ảnh có sẵn, hoặc chọn nơi thủ công.', 'Camera access is blocked. Allow it in your browser settings, pick a photo, or choose the place by hand.')
    : V('Không mở được camera trên thiết bị này. Hãy chọn một ảnh có sẵn hoặc chọn nơi thủ công.', 'The camera can’t open on this device. Pick a photo or choose the place by hand.');
  if (!realImage()) { $('#shutter').disabled = false; $('#cam-hint').textContent += ' ' + V('Demo: nút chụp sẽ dùng ảnh mẫu.', 'Demo: the shutter will use a sample image.'); }
}
function stopCam() { CL.tok = null; CL.stream?.getTracks().forEach(t => t.stop()); CL.stream = null; }
async function toggleTorch(b) {
  const tr = CL.stream?.getVideoTracks()[0], on = b.getAttribute('aria-pressed') !== 'true';
  try { await tr.applyConstraints({ advanced: [{ torch: on }] }); b.setAttribute('aria-pressed', on); } catch { toast(V('Không bật được đèn flash', 'Couldn’t switch the flash')); }
}
const setPhoto = url => { if (CL.photo.startsWith('blob:')) URL.revokeObjectURL(CL.photo); CL.photo = url; CL.photoFor = ''; };
function shoot() {
  const v = $('#cam-v');
  if (!CL.stream && !realImage()) { stopCam(); setPhoto(refUrl(loc(topSim(SCENARIOS[CL.scen])))); return recognise(); } // no camera: sample image, still simulated
  if (!CL.stream || !v.videoWidth) return;
  const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight;
  c.getContext('2d').drawImage(v, 0, 0);
  stopCam(); // one still, then the camera turns off: no footage keeps streaming
  c.toBlob(usePhoto, 'image/jpeg', 0.85);
}
function usePhoto(file) {
  if (!file?.type?.startsWith('image/')) return file && toast(V('Hãy chọn một tệp ảnh', 'Please pick an image file'));
  stopCam(); setPhoto(URL.createObjectURL(file));
  recognise();
}
async function recognise() {
  const cam = $('#cam'), rec = $('#rec'), shot = $('#cam-shot'), g = G.gps, s = SCENARIOS[CL.scen];
  cam.classList.add('scanning'); shot.src = CL.photo; shot.hidden = false; rec.hidden = false;
  rec.innerHTML = `<h2>${V('Đang xác minh…', 'Verifying…')}</h2><ol class="rec-steps">${[V('Kết quả khớp GPS', 'GPS matching result'), V('Khớp ảnh với ảnh tham chiếu', 'Image vs reference images'), V('Đối chiếu chéo', 'Cross-validation')].map(t => `<li><b>${t}</b><small></small></li>`).join('')}</ol><div id="rec-out"></div>`;
  const li = [...rec.querySelectorAll('li')], step = (i, st, note = '') => { li[i].dataset.s = st; li[i].querySelector('small').innerHTML = note; };
  const wait = ms => new Promise(r => setTimeout(r, ms)), gone = () => !rec.isConnected;
  step(0, gpsTone(g) === 'ok' ? 'done' : 'warn', `${V(...GPS_ST[g.gpsStatus])} · ${V(...GPS_MT[g.status])}`);
  step(1, 'run', realImage() ? V('Đang chạy model nhận diện ảnh…', 'Running the image model…') : '');
  const [scores] = await Promise.all([realImage() ? similarityService(CL.photo) : s.sim, wait(1100)]); if (gone()) return;
  const im = imageMatch(scores, !realImage());
  step(1, im.status === 'matched' ? 'done' : im.status === 'uncertain' ? 'warn' : 'fail', `${V(...IMG_ST[im.status])}${im.simulated ? ` <span class="tag amber">${V('mô phỏng', 'simulated')}</span>` : ''}`);
  step(2, 'run'); await wait(600); if (gone()) return;
  const v = crossValidate(g, im);
  step(2, { confirmed: 'done', needs_confirmation: 'warn', rejected: 'fail' }[v.status], V(...XV_ST[v.status]));
  cam.classList.add('done'); rec.querySelector('h2').textContent = V('Kết quả xác minh', 'Verification result');
  $('#rec-out').innerHTML = imageHtml(im) + crossHtml(v) + actionsHtml(v)
    + `<details class="raw"><summary>${V('Kết quả có cấu trúc (JSON)', 'Structured result (JSON)')}</summary><pre>${esc(JSON.stringify({ ...v, reason: v.reason.en }, null, 2))}</pre></details>`;
}

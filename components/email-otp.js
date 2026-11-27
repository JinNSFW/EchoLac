'use strict';
// Email one-time-code form (X-01): "Add email" in Profile (mode 'link') and "Sign in with email" on #signin (mode 'signin').
const OTP = { mode: '', step: '', email: '', code: '', until: 0, busy: false, msg: '' };
let otpTimer = null;
const OTP_TEXT = {
  sent: ['Đã gửi mã. Kiểm tra hộp thư (cả thư rác); mã dùng được trong 1 giờ.', 'Code sent. Check your inbox (and spam); it works for 1 hour.'],
  email: ['Email chưa đúng định dạng.', 'That email address doesn’t look right.'],
  format: ['Mã gồm 6–10 chữ số.', 'The code is 6–10 digits.'],
  wait: ['Đợi hết thời gian chờ rồi gửi lại.', 'Wait for the timer before sending again.'],
  code: ['Mã sai hoặc đã hết hạn. Kiểm tra lại hoặc gửi mã mới.', 'Wrong or expired code. Check it or send a new one.'],
  rate: ['Bạn thử quá nhiều lần. Đợi vài phút rồi thử lại.', 'Too many tries. Wait a few minutes and try again.'],
  send: ['Hệ thống đang giới hạn gửi email. Thử lại sau ít phút.', 'Email sending is limited right now. Try again in a few minutes.'],
  offline: ['Bạn đang ngoại tuyến. Kết nối mạng rồi thử lại.', 'You’re offline. Connect and try again.'],
  unavailable: ['Bản này chưa bật đồng bộ đám mây.', 'Cloud sync isn’t set up in this build.'],
  noaccount: ['Không tìm thấy tài khoản cho email này. Hãy gắn email trong Hồ sơ trên máy cũ trước.', 'No account uses this email. Add it in Profile on your original device first.'],
  taken: ['Email này đã gắn với một tài khoản khác.', 'This email is already linked to another account.'],
  captcha: ['Chưa qua bước kiểm tra bảo mật. Thử lại.', 'The security check didn’t pass. Try again.'],
  pull: ['Đã đăng nhập nhưng chưa tải được tiến độ. Bấm Thử lại.', 'Signed in, but your progress didn’t load yet. Tap Try again.'],
  other: ['Chưa thực hiện được. Thử lại sau.', 'That didn’t work. Try again later.'],
};
const otpLeft = () => Math.max(0, Math.ceil((OTP.until - Date.now()) / 1000));
const otpResendLabel = () => otpLeft() ? `${V('Gửi lại mã', 'Resend code')} (${otpLeft()} s)` : V('Gửi lại mã', 'Resend code');

function otpBox(mode) {
  if (OTP.mode !== mode) Object.assign(OTP, { mode, step: mode === 'signin' ? 'email' : 'closed', email: '', code: '', msg: '' });
  return `<div id="otp-box" class="mt-16">${otpView()}</div>`;
}

function otpView() {
  const msg = OTP.msg ? `<p class="small mt-8" role="${OTP.msg === 'sent' ? 'status' : 'alert'}"${OTP.msg === 'sent' ? '' : ' style="color:var(--danger)"'}>${V(...OTP_TEXT[OTP.msg])}</p>` : '';
  const busy = OTP.busy ? ' disabled aria-busy="true"' : '';
  if (OTP.step === 'closed') return `<button class="btn white sm" onclick="otpStep('email')">${icon('mail', 'sm')} ${V('Gắn email', 'Add email')}</button>
    <p class="tiny muted mt-8">${V('Gắn email để đăng nhập trên máy khác mà vẫn giữ tiến độ.', 'Add an email to sign in on another device and keep your progress.')}</p>`;
  if (OTP.step === 'pull') return `${msg}<button class="btn mt-16" onclick="otpFinish()"${busy}>${V('Thử lại', 'Try again')}</button>`;
  if (OTP.step === 'email') return `<form class="field" onsubmit="event.preventDefault();otpSend()" novalidate>
      <label for="otp-email">Email</label>
      <div class="input-wrap">${icon('mail')}<input id="otp-email" type="email" inputmode="email" autocomplete="email" maxlength="254" value="${esc(OTP.email)}" placeholder="${V('ban@vidu.com', 'you@example.com')}"></div>
      ${msg}<button class="btn mt-16"${busy}>${V('Gửi mã', 'Send code')} ${icon('right')}</button>
    </form>`;
  return `<form class="field" onsubmit="event.preventDefault();otpVerify()" novalidate>
      <p class="small">${V('Nhập mã đã gửi tới', 'Enter the code sent to')} <b>${esc(OTP.email)}</b></p>
      <label for="otp-code" class="mt-8">${V('Mã xác nhận', 'Verification code')}</label>
      <div class="input-wrap">${icon('key')}<input id="otp-code" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6,10}" minlength="6" maxlength="10" value="${esc(OTP.code)}" oninput="this.value=otpDigits(this.value)"></div>
      ${msg}<button class="btn mt-16"${busy}>${V('Xác nhận', 'Verify')}</button>
    </form>
    <div class="row between mt-8">
      <button id="otp-resend" class="small" onclick="otpSend(true)"${otpLeft() || OTP.busy ? ' disabled' : ''}>${otpResendLabel()}</button>
      <button class="small" onclick="otpStep('email')">${V('Đổi email', 'Change email')}</button>
    </div>`;
}

function otpPaint(msg = OTP.msg) {
  OTP.msg = msg;
  const box = $('#otp-box');
  if (box) box.innerHTML = otpView();
  clearInterval(otpTimer);
  if (OTP.step === 'code' && otpLeft()) otpTimer = setInterval(otpTick, 1000);
}

function otpTick() {
  const btn = $('#otp-resend');
  if (!btn || !otpLeft()) clearInterval(otpTimer);
  if (btn) { btn.textContent = otpResendLabel(); btn.disabled = !!otpLeft() || OTP.busy; }
}

function otpStep(step) {
  OTP.step = step;
  otpPaint('');
  $(step === 'email' ? '#otp-email' : '#otp-code')?.focus();
}

// One request at a time; the task resolves to a notice key, a failure to an error key.
async function otpRun(task) {
  if (OTP.busy) return;
  OTP.busy = true;
  otpPaint('');
  let msg = '';
  try { msg = await task() || ''; } catch (e) { msg = otpProblem(e); }
  OTP.busy = false;
  otpPaint(msg);
}

function otpSend(resend) {
  if (!resend) OTP.email = String($('#otp-email')?.value || '').trim();
  if (!validEmail(OTP.email)) { OTP.step = 'email'; return otpPaint('email'); }
  if (otpLeft()) return otpPaint('wait'); // cooldown between sends (Resend and Supabase email limits)
  return otpRun(async () => {
    await sendEmailCode(OTP.mode, OTP.email);
    Object.assign(OTP, { step: 'code', code: '', until: Date.now() + OTP_COOLDOWN * 1000 });
    return 'sent';
  });
}

function otpVerify() {
  OTP.code = otpDigits($('#otp-code')?.value);
  if (!validOtp(OTP.code)) return otpPaint('format');
  return otpRun(async () => {
    await verifyEmailCode(OTP.mode, OTP.email, OTP.code);
    OTP.code = '';
    if (OTP.mode === 'signin') { OTP.step = 'pull'; return otpSignedIn(); }
    store.set('user', S.user);
    Object.assign(OTP, { mode: '', step: '' });
    toast(V('Đã gắn email', 'Email added'));
    route(); // the account card now shows the linked email
    return '';
  });
}

async function otpSignedIn() {
  await finishEmailSignIn();
  Object.assign(OTP, { mode: '', step: '' });
  toast(V('Đã đăng nhập', 'Signed in'));
  location.hash = S.user.placeId ? '#home' : '#place';
  return '';
}
const otpFinish = () => otpRun(otpSignedIn);

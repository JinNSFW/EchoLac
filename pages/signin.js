'use strict';
// signin screen (X-01): with an account on this device, "continue on this device"; without one, sign in with an
// email one-time code (components/email-otp.js). There is no password or class code.
VIEWS.signin = {
    render: () => (!S.user ? `
      ${authHead(V('Đăng nhập bằng email', 'Sign in with email'), V('Dùng email bạn đã gắn trong Hồ sơ', 'Use the email you added in Profile'))}
      <section class="card mt-32 reveal">
        ${otpBox('signin')}
        <p class="tiny muted mt-16">${V('Đăng nhập là bạn tiếp tục đồng ý lưu và đồng bộ dữ liệu như khi tạo tài khoản.', 'By signing in you keep agreeing to the data saving and syncing you accepted when you created the account.')}</p>
      </section>
      <div class="switch-auth reveal">${V('Chưa có tài khoản?', 'New here?')} <a href="#signup">${V('Tạo tài khoản', 'Create account')}</a></div>` : `
      ${authHead(V('Tiếp tục trên máy này', 'Continue on this device'), V('Chào mừng trở lại! Tiếp tục luyện nói nhé', 'Welcome back! Keep practising'))}
      <section class="card mt-32 reveal">
        <div class="row"><span class="ic">${icon('user')}</span><b id="acct-name" class="grow" style="font-size:18px">${esc(S.user.name)}</b></div>
        <div id="acct-status" class="mt-16" role="status">${acctStatus()}</div>
        ${deviceNote()}
      </section>
      <a id="acct-next" class="btn mt-24 reveal" href="${S.user.placeId ? '#home' : '#place'}">${V('Tiếp tục', 'Continue')} ${icon('right')}</a>
      <div class="switch-auth reveal">${V('Không phải bạn?', 'Not you?')} <a href="#signup" role="button" onclick="event.preventDefault();signOut()">${V('Đăng xuất', 'Sign out')}</a></div>`),
    mount: () => refreshAccount(),
  };

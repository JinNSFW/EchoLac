'use strict';
// signin screen. Shared pieces live in components/.
VIEWS.signin = {
    render: () => `
      ${authHead(V('Đăng nhập', 'Sign In'), V('Chào mừng trở lại! Tiếp tục luyện nói nhé', 'Welcome back! Keep practising'))}
      <div class="seg mt-32 reveal" role="tablist">
        <button id="m-email" class="on" onclick="signinMode('email')">${V('Email', 'Email')}</button>
        <button id="m-code" onclick="signinMode('code')">${V('Mã lớp', 'Class code')}</button>
      </div>
      <form id="f" class="mt-24" novalidate>
        <div id="by-email">
          ${field('email', V('Email', 'Email Address'), 'mail', 'email', V('Nhập địa chỉ email', 'Enter your email address'), 0, { ac: 'email' })}
          ${field('pw', V('Mật khẩu', 'Password'), 'lock', 'password', V('Nhập mật khẩu', 'Enter your password'), 60, { ac: 'current-password' })}
        </div>
        <div id="by-code" hidden>
          ${field('code', V('Mã lớp do giáo viên cấp', 'Class code from your teacher'), 'key', 'text', V('VD: PCT-11A2', 'e.g. PCT-11A2'), 0)}
          ${field('name', V('Tên của bạn', 'Your name'), 'person', 'text', V('Nhập tên', 'Enter your name'), 60, { ac: 'name' })}
        </div>
        <button class="btn mt-32 reveal" id="submit" disabled>${V('Đăng nhập', 'Sign in')}</button>
      </form>
      <div class="divider reveal"><span>${V('Hoặc tiếp tục với', 'Or continue with')}</span></div>
      <div class="social reveal"><button type="button" onclick="googleSignIn()" aria-label="Google">${GOOGLE}</button></div>
      <div class="switch-auth reveal">${V('Chưa có tài khoản?', 'New here?')} <a href="#signup">${V('Đăng ký', 'Sign up')}</a></div>`,
    mount() {
      const f = $('#f'), val = id => $('#' + id).value.trim();
      const check = () => {
        const byCode = !$('#by-code').hidden;
        const ok = { email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val('email')), pw: $('#pw').value.length >= 6, code: val('code').length >= 4, name: val('name').length >= 2 };
        Object.entries(ok).forEach(([k, v]) => $(`[data-ok="${k}"]`)?.classList.toggle('on', v));
        $('#submit').disabled = byCode ? !(ok.code && ok.name) : !(ok.email && ok.pw);
      };
      f.addEventListener('input', check);
      f.addEventListener('submit', e => {
        e.preventDefault(); if ($('#submit').disabled) return;
        S.user = { name: $('#by-code').hidden ? val('email').split('@')[0] : val('name') }; save(); location.hash = '#home';
      });
      window.signinCheck = check;
    },
  };

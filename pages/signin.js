'use strict';
// signin screen = "continue on this device": anonymous accounts live in this browser, so there is no email, password or class code (X-01).
VIEWS.signin = {
    init() { if (!S.user) location.replace('#signup'); }, // no account on this device yet
    render: () => (!S.user ? '' : `
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

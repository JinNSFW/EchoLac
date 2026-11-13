'use strict';
// signup screen. Shared pieces live in components/.
VIEWS.signup = {
    render: () => `
      ${steps(1)}
      ${authHead(V('Tạo tài khoản', 'Create Account'), V('Cùng kể chuyện quê hương bằng tiếng Anh', 'Tell your hometown’s story in English'), 'event.preventDefault();location.reload()')}
      <form id="f" class="mt-32" novalidate>
        ${field('name', V('Họ và tên', 'Full name'), 'person', 'text', V('Nhập họ và tên', 'Enter your full name'), 0, { ac: 'name' })}
        ${field('email', 'Gmail', 'mail', 'email', 'tenban@gmail.com', 60, { ac: 'email', after: `<p class="field-hint" id="email-hint" hidden>${V('Vui lòng dùng địa chỉ Gmail (…@gmail.com).', 'Please use a Gmail address (…@gmail.com).')}</p>` })}
        ${field('dob', V('Ngày sinh', 'Date of birth'), 'cal', 'date', '', 120, { ac: 'bday', attrs: `min="1920-01-01" max="${iso()}"` })}
        <div class="field reveal" style="--d:180ms"><span class="label" id="g-lbl">${V('Giới tính', 'Gender')}</span>
          <div class="choice-row" role="radiogroup" aria-labelledby="g-lbl" onkeydown="radioKeys(event)">${GENDERS.map(([k, vi, en], i) => `<button type="button" class="choice ${F.gender === k ? 'on' : ''}" role="radio" aria-checked="${F.gender === k}" tabindex="${F.gender === k || (!F.gender && i === 0) ? 0 : -1}" data-v="${k}" onclick="pickGender('${k}')">${V(vi, en)}</button>`).join('')}</div>
        </div>
        <label class="check-box reveal"><input type="checkbox" id="terms"><span>${V('Tôi đồng ý với <b class="link">Điều khoản dịch vụ</b> và <b class="link">Chính sách bảo mật</b>.', 'I agree to the <b class="link">Terms of Service</b> and <b class="link">Privacy Policy</b>.')}</span></label>
        <label class="check-box" id="guardian-box" hidden><input type="checkbox" id="guardian"><span>${V('Mình dưới 18 tuổi và cha mẹ hoặc người giám hộ đã đồng ý cho mình dùng EchoLạc.', 'I am under 18 and my parent or guardian agrees to me using EchoLạc.')}</span></label>
        <button class="btn mt-24 reveal" id="submit" disabled>${V('Tạo tài khoản', 'Create Account')} ${icon('right')}</button>
      </form>
      <div class="divider reveal"><span>${V('Hoặc tiếp tục với', 'Or continue with')}</span></div>
      <div class="social reveal"><button type="button" onclick="googleSignIn()" aria-label="Google">${GOOGLE}</button></div>
      <div class="switch-auth reveal">${V('Đã có tài khoản?', 'Already have an account?')} <a href="#signin">${V('Đăng nhập', 'Sign in')}</a></div>`,
    mount() {
      const f = $('#f'), val = id => $('#' + id).value.trim(), u = S.user;
      if (u) { // back from step 2: keep everything already typed
        $('#name').value = u.name || ''; $('#email').value = u.email || ''; $('#dob').value = u.dob || '';
        if (u.gender) pickGender(u.gender);
        $('#terms').checked = !!u.consent?.terms; $('#guardian').checked = !!u.consent?.guardian;
      }
      const check = () => {
        const age = ageOf($('#dob').value), email = val('email'), minor = age >= 0 && age < 18;
        const ok = { name: val('name').length >= 2, email: /^[^\s@]+@gmail\.com$/i.test(email), dob: age >= 6 && age <= 100 };
        Object.entries(ok).forEach(([k, v]) => $(`[data-ok="${k}"]`)?.classList.toggle('on', v));
        $('#email-hint').hidden = ok.email || !email.includes('@');
        $('#guardian-box').hidden = !minor;
        $('#submit').disabled = !(ok.name && ok.email && ok.dob && F.gender && $('#terms').checked && (!minor || $('#guardian').checked));
      };
      window.signupCheck = check;
      f.addEventListener('input', check); f.addEventListener('change', check);
      check();
      f.addEventListener('submit', e => {
        e.preventDefault(); if ($('#submit').disabled) return;
        const minor = ageOf($('#dob').value) < 18;
        S.user = { ...(S.user || {}), name: val('name'), email: val('email'), dob: $('#dob').value, gender: F.gender, consent: { terms: true, guardian: minor && $('#guardian').checked } };
        save(); location.hash = '#place';
      });
    },
  };

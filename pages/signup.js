'use strict';
// signup screen (X-01 step 1): no email or password; the account is anonymous and tied to this device.
function signupAge(dob) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return -1;
  const [year, month, day] = dob.split('-').map(Number), today = new Date();
  const birth = new Date(year, month - 1, day);
  if (birth.getFullYear() !== year || birth.getMonth() !== month - 1 || birth.getDate() !== day || birth > today) return -1;
  const beforeBirthday = today.getMonth() < birth.getMonth()
    || (today.getMonth() === birth.getMonth() && today.getDate() < day);
  return today.getFullYear() - year - Number(beforeBirthday);
}

VIEWS.signup = {
    init() { if (S.user?.placeId) location.replace('#signin'); },
    render: () => `
      ${steps(1)}
      ${authHead(V('Tạo tài khoản', 'Create Account'), V('Kể chuyện quê hương bằng ngoại ngữ', 'Tell your hometown’s story in another language'), 'event.preventDefault();location.reload()')}
      <form id="f" class="mt-32" novalidate>
        ${field('name', V('Họ và tên', 'Full name'), 'person', 'text', V('Nhập họ và tên', 'Enter your full name'), 0, { ac: 'name', attrs: 'maxlength="60"' })}
        ${field('dob', V('Ngày sinh', 'Date of birth'), 'cal', 'date', '', 60, { ac: 'bday', attrs: `min="1920-01-01" max="${iso()}"` })}
        <div class="field reveal" style="--d:120ms"><span class="label" id="g-lbl">${V('Giới tính (không bắt buộc)', 'Gender (optional)')}</span>
          <div class="choice-row" role="radiogroup" aria-labelledby="g-lbl" onkeydown="radioKeys(event)">${GENDERS.map(([k, vi, en], i) => `<button type="button" class="choice ${F.gender === k ? 'on' : ''}" role="radio" aria-checked="${F.gender === k}" tabindex="${F.gender === k || (!F.gender && i === 0) ? 0 : -1}" data-v="${k}" onclick="pickGender('${k}')">${V(vi, en)}</button>`).join('')}</div>
        </div>
        <p class="small muted">${V('Ngày sinh đầy đủ và giới tính được lưu trên máy này. Khi có mạng, EchoLạc có thể đồng bộ tên, năm sinh, thông tin đồng ý, lựa chọn học tập và tiến độ với tài khoản ẩn danh.', 'Your full date of birth and gender stay on this device. When online, EchoLạc can sync your name, birth year, consent, learning preferences, and progress to an anonymous account.')}</p>
        <label class="check-box reveal"><input type="checkbox" id="terms"><span>${V('Tôi đồng ý để EchoLạc lưu và đồng bộ dữ liệu như mô tả ở trên.', 'I agree to EchoLạc saving and syncing my data as described above.')}</span></label>
        <label class="check-box" id="guardian-box" hidden><input type="checkbox" id="guardian"><span>${V('Mình dưới 18 tuổi và cha mẹ hoặc người giám hộ đã đồng ý cho mình dùng EchoLạc.', 'I am under 18 and my parent or guardian agrees to me using EchoLạc.')}</span></label>
        <button class="btn mt-24 reveal" id="submit" disabled>${V('Tạo tài khoản', 'Create Account')} ${icon('right')}</button>
      </form>
      ${deviceNote()}`,
    mount() {
      if (S.user?.placeId) return;
      const f = $('#f'), val = id => $('#' + id).value.trim(), u = S.user;
      if (u) { // back from step 2: keep everything already typed
        $('#name').value = u.name || ''; $('#dob').value = u.dob || '';
        if (u.gender) pickGender(u.gender);
        $('#terms').checked = !!u.consent?.terms; $('#guardian').checked = !!u.consent?.guardian;
      }
      const check = () => {
        const age = signupAge($('#dob').value), minor = age >= 0 && age < 18;
        const ok = { name: val('name').length >= 2 && val('name').length <= 60, dob: age >= 6 && age <= 100 };
        Object.entries(ok).forEach(([k, v]) => $(`[data-ok="${k}"]`)?.classList.toggle('on', v));
        $('#guardian-box').hidden = !minor;
        $('#submit').disabled = !(ok.name && ok.dob && $('#terms').checked && (!minor || $('#guardian').checked));
        return !$('#submit').disabled;
      };
      window.signupCheck = check;
      f.addEventListener('input', check); f.addEventListener('change', check);
      check();
      f.addEventListener('submit', e => {
        e.preventDefault(); if (!check()) return;
        const minor = signupAge($('#dob').value) < 18;
        // dob stays on this device; the cloud profile gets the birth year only
        S.user = { ...(S.user || {}), name: val('name'), dob: $('#dob').value, gender: F.gender, consent: { terms: true, guardian: minor && $('#guardian').checked } };
        save(); location.hash = '#place'; syncAccount();
      });
    },
  };

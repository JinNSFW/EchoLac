'use strict';
// Prototype sign-in actions; no real authentication service is connected.

function toggleEye(btn, id) { const el = $('#' + id), show_ = el.type === 'password'; el.type = show_ ? 'text' : 'password'; btn.innerHTML = icon(show_ ? 'eyeOff' : 'eye'); }
function signinMode(m) { $('#by-email').hidden = m !== 'email'; $('#by-code').hidden = m === 'email'; $('#m-email').classList.toggle('on', m === 'email'); $('#m-code').classList.toggle('on', m !== 'email'); observe($('#f')); window.signinCheck?.(); }
function googleSignIn() {
  S.user = { ...(S.user || {}), name: S.user?.name || 'Nguyễn Thị Lan', email: S.user?.email || 'lan@gmail.com' };
  save(); location.hash = S.user.placeId ? '#home' : '#place'; toast(V('Đăng nhập Google (demo)', 'Google sign-in (demo)'));
}
function signOut() { S.user = null; save(); location.hash = '#signin'; }
function resetDemo() { try { Object.keys(localStorage).filter(k => k.startsWith('lt:') && k !== 'lt:user' && k !== 'lt:lang').forEach(k => localStorage.removeItem(k)); } catch { /* ignore */ } location.reload(); }

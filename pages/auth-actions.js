'use strict';
// Anonymous-account actions (X-01): data is saved on this device first; the cloud sync never blocks the UI.

function syncAccount() {
  toast(V('Đã lưu trên máy', 'Saved on this device'));
  syncProfileChange()?.then(() => { if (isSynced()) toast(V('Đã đồng bộ', 'Synced')); });
}

function paintAccountStatus() {
  if (!S.user) return;
  const status = $('#acct-status'), voice = $('#acct-voice'), name = $('#acct-name'), next = $('#acct-next');
  if (status) status.innerHTML = acctStatus();
  if (voice) {
    voice.classList.toggle('on', !!S.user.voiceConsentAt);
    voice.setAttribute('aria-pressed', String(!!S.user.voiceConsentAt));
  }
  if (name) name.textContent = S.user.name;
  if (next) next.href = S.user.placeId ? '#home' : '#place';
}

function syncProfileChange() {
  if (typeof syncProfile === 'function') return syncProfile().then(paintAccountStatus);
}

function refreshAccount() {
  if (typeof hasLocalCloudProfile !== 'function' || !hasLocalCloudProfile()) return;
  return recoverCloudConfig().then(() => {
    if (cloudReady()) return reconcileCloudAccount();
  }).then(paintAccountStatus);
}

document.addEventListener('DOMContentLoaded', () => {
  if (S.user && typeof voiceConsentRecord === 'function' && voiceConsentRecord()) S.user.voiceConsentAt = currentVoiceConsent();
  refreshAccount();
});
window.addEventListener('online', refreshAccount);

function setVoiceConsent(on) {
  if (!S.user) return;
  const value = on ? new Date().toISOString() : null;
  if (typeof recordVoiceConsent === 'function') recordVoiceConsent(value);
  else S.user.voiceConsentAt = value;
  store.set('user', S.user);
  syncProfileChange();
  paintAccountStatus();
}

function forgetAccount() {
  S.user = null;
  location.replace('#signup');
  location.reload();
}

window.addEventListener('storage', event => {
  if (!S.user) return;
  if (event.key === 'lt:voice-consent' && typeof currentVoiceConsent === 'function') {
    S.user.voiceConsentAt = currentVoiceConsent();
    paintAccountStatus();
  }
  if (S.user.consent?.terms && event.newValue === null && [null, 'lt:user', 'lt:cloud-owner'].includes(event.key)) {
    if (typeof stopCloudWork === 'function') stopCloudWork();
    forgetAccount();
  }
});

// An anonymous account cannot be recovered once its browser session is gone.
async function signOut() {
  if (!S.user || !confirm(V('Đăng xuất sẽ xoá tiến độ trên máy này và mất liên kết với tài khoản ẩn danh. Không thể khôi phục. Tiếp tục?',
    'Signing out deletes your progress on this device and the link to your anonymous account. This cannot be undone. Continue?'))) return;
  const closing = typeof cloudSignOut === 'function' ? cloudSignOut() : null;
  S.user = null;
  $('#app').inert = true;
  try { Object.keys(localStorage).filter(k => k.startsWith('lt:') && k !== 'lt:lang').forEach(k => localStorage.removeItem(k)); } catch { /* storage blocked: nothing was persisted */ }
  if (closing) {
    let timeout;
    await Promise.race([closing, new Promise(resolve => { timeout = setTimeout(resolve, 3000); })]).catch(() => {});
    clearTimeout(timeout);
  }
  forgetAccount();
}

// Keep account linkage and unsent changes when clearing local demo progress.
function resetDemo() { try { Object.keys(localStorage).filter(k => k.startsWith('lt:') && !/^lt:(?:user|lang|sync-queue|cloud-owner|profile-synced|profile-dirty|voice-consent|sb-.*)$/.test(k)).forEach(k => localStorage.removeItem(k)); } catch { /* ignore */ } location.reload(); }

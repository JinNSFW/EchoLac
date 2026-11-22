'use strict';
// PWA: service worker, persistent storage and the iOS "Add to Home Screen" hint. Skipped in ?test and on insecure origins.

function pwaInit() {
  if (/[?&]test\b/.test(location.search)) return;
  const secure = location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname);
  if (!secure) return;
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => { /* offline shell is optional */ });
  try { Promise.resolve(navigator.storage?.persist?.()).catch(() => {}); } catch { /* best effort */ }
  pwaIosHint();
}

function pwaIosHint() {
  const ua = navigator.userAgent;
  const ios = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
  if (!ios || standalone || store.get('pwa-hint', false)) return;
  const box = document.createElement('div');
  box.setAttribute('role', 'status');
  box.style.cssText = 'position:fixed;left:12px;right:12px;bottom:12px;z-index:50;display:flex;gap:10px;align-items:center;padding:12px 14px;border-radius:14px;background:var(--navy);color:#fff;font-size:14px;box-shadow:0 6px 20px rgba(0,0,0,.25)';
  const msg = document.createElement('span');
  msg.style.flex = '1';
  msg.textContent = V('Thêm vào Màn hình chính: bấm Chia sẻ, rồi "Thêm vào Màn hình chính".', 'Add to Home Screen: tap Share, then "Add to Home Screen".');
  const ok = document.createElement('button');
  ok.textContent = V('Đóng', 'Close');
  ok.style.cssText = 'border:0;border-radius:10px;padding:8px 12px;background:#fff;color:var(--navy);font-weight:600';
  ok.onclick = () => { store.set('pwa-hint', true); box.remove(); };
  box.append(msg, ok);
  document.body.append(box);
}

window.addEventListener('load', pwaInit);

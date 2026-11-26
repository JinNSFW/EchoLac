'use strict';
// Cloudflare Turnstile before anonymous sign-in, only when TURNSTILE_SITE_KEY is set; Supabase Auth verifies the token.
// Cloudflare updates api.js in place and forbids pinning or proxying it, so it has no SRI hash (and no crossorigin).
const TURNSTILE_LIB = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let turnstileLoading = null;

function loadTurnstile() {
  if (window.turnstile?.render) return Promise.resolve();
  turnstileLoading ||= new Promise((ok, fail) => {
    const s = Object.assign(document.createElement('script'), { src: TURNSTILE_LIB, async: true });
    s.onload = ok;
    s.onerror = () => { turnstileLoading = null; fail(new Error('captcha unavailable')); };
    document.head.append(s);
  });
  return turnstileLoading;
}

// Resolves to a one-time token, or undefined when Turnstile is off. Rejects when the check fails, expires or times out.
async function captchaToken() {
  if (!CLOUD.turnstileSiteKey) return undefined;
  await loadTurnstile();
  // Fixed box: the widget stays hidden unless Cloudflare asks this visitor to interact.
  const box = Object.assign(document.createElement('div'), { className: 'captcha-box' });
  document.body.append(box);
  let id;
  try {
    return await new Promise((ok, fail) => {
      const stop = () => fail(new Error('captcha failed'));
      id = window.turnstile.render(box, {
        sitekey: CLOUD.turnstileSiteKey, appearance: 'interaction-only', language: S.lang === 'vi' ? 'vi' : 'en',
        callback: ok, 'error-callback': stop, 'expired-callback': stop, 'timeout-callback': stop, 'unsupported-callback': stop,
      });
    });
  } finally {
    if (id !== undefined) window.turnstile.remove(id);
    box.remove();
  }
}

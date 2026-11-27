'use strict';
// Email one-time codes (X-01): link an email to the current anonymous account, or sign in on another device.
// Never log the email or the code: errors are mapped to a short key only.
const OTP_COOLDOWN = 60; // seconds between sends, the Supabase default per-address limit
const otpDigits = v => String(v ?? '').replace(/\D/g, '').slice(0, 10);
const validOtp = v => /^\d{6,10}$/.test(v); // project uses 8 digits; Supabase allows 6-10
const validEmail = v => typeof v === 'string' && v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

// Supabase Auth error -> message key (components/email-otp.js). Codes: supabase.com/docs/guides/auth/debugging/error-codes
function otpProblem(e) {
  const code = e?.code || '';
  if (code === 'offline' || navigator.onLine === false || e?.name === 'AuthRetryableFetchError' || e?.status === 0) return 'offline';
  if (code === 'unavailable') return 'unavailable';
  if (code === 'otp_expired' || code === 'invalid_credentials') return 'code';
  if (['over_email_send_rate_limit', 'email_address_not_authorized'].includes(code)
    || (e?.status >= 500 && /send|email/i.test(e?.message || ''))) return 'send';
  if (code === 'over_request_rate_limit' || e?.status === 429) return 'rate';
  if (['otp_disabled', 'user_not_found', 'signup_disabled'].includes(code)) return 'noaccount';
  if (['email_exists', 'user_already_exists', 'identity_already_exists'].includes(code)) return 'taken';
  if (code === 'captcha_failed' || /captcha/i.test(e?.message || '')) return 'captcha';
  if (['email_address_invalid', 'validation_failed'].includes(code)) return 'email';
  if (code === 'pull') return 'pull';
  return 'other';
}

async function otpClient() {
  if (navigator.onLine === false) throw { code: 'offline' };
  await recoverCloudConfig();
  const c = await cloudClient();
  if (!c) throw { code: CLOUD.enabled ? 'offline' : 'unavailable' };
  return c;
}

async function sendEmailCode(mode, email) {
  const c = await otpClient();
  if (mode === 'link') {
    // updateUser on the anonymous session sends the "Change email address" code; the user id and progress stay.
    if (!await ensureSession()) throw { code: navigator.onLine === false ? 'offline' : 'other' };
    const { error } = await c.auth.updateUser({ email });
    if (error) throw error;
    return;
  }
  const token = await captchaToken(); // undefined when Turnstile is off
  const { error } = await c.auth.signInWithOtp({ email, options: { shouldCreateUser: false, captchaToken: token } });
  if (error) throw error;
}

async function verifyEmailCode(mode, email, token) {
  const c = await otpClient();
  const { data, error } = await c.auth.verifyOtp({ email, token, type: mode === 'link' ? 'email_change' : 'email' });
  if (error) throw error;
  const user = data?.user || data?.session?.user;
  if (!user?.id) throw { code: 'other' };
  if (mode === 'link') {
    if (user.id !== cloudOwner()) throw { code: 'other' }; // linking never switches accounts
  } else {
    if (S.user) throw { code: 'other' }; // sign-in is only offered when this device has no account
    adoptCloudOwner(user.id);
    // The account holder agreed to the terms when the account was created; the cloud profile carries guardian consent.
    S.user = { name: '', consent: { terms: true } };
  }
  S.user.email = user.email || email;
  return user;
}

// After an email sign-in: the existing pull restores the cloud profile and practice errors before anything is saved.
async function finishEmailSignIn() {
  if (!await pullOnSignIn()) throw { code: navigator.onLine === false ? 'offline' : 'pull' };
  save();
}

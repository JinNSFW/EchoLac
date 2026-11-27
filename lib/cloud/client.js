'use strict';
// Lazy Supabase client with an anonymous session (or one with a linked email). Needs loadScript from lib/camera/model.js (resolved at call time).

// Pinned supabase-js UMD (published 2026-11-04); the integrity hash pins the CDN file (SRI).
const SUPABASE_LIB = ['https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.0/dist/umd/supabase.js', 'sha384-uteMfOloLDGt042uDz+xHGF3ym63/WQ6rFq7murQRG8Ih7QrXGEGNtWd8688sb4O'];
const CLOUD_AUTH_KEY = 'lt:sb-auth';
const cloudOwner = () => store.get('cloud-owner', null);
const storedLegacyUser = store.get('user', null)?.consent?.terms === true;
let knownCloudOwner = cloudOwner();
let cloudUid = null;
let cloudVerifiedAdult = false;
let cloudClosed = false;
let closingToken = null;
let sessionPromise = null;
let cloudRequests = null;
let cloudPromise = null;

function hasLocalCloudProfile() {
  const account = S.user, consent = account?.consent;
  if (cloudClosed || consent?.terms !== true) return false;
  if (account.dob && typeof signupAge === 'function') {
    const age = signupAge(account.dob);
    if (age < 0 || (age < 18 && consent.guardian !== true)) return false;
  }
  return (!knownCloudOwner || cloudOwner() === knownCloudOwner)
    && (!storedLegacyUser || store.get('user', null)?.consent?.terms === true);
}

function canUseCloud() { return CLOUD.enabled && hasLocalCloudProfile(); }

function cloudUserId() {
  return canUseCloud() && cloudUid === cloudOwner() ? cloudUid : null;
}

function cloudSignal() {
  if (typeof AbortController !== 'function') return undefined;
  cloudRequests ||= new AbortController();
  return cloudRequests.signal;
}

function readAuthStorage(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

const cloudAuthStorage = {
  getItem(key) {
    if (cloudClosed) return key === CLOUD_AUTH_KEY ? closingToken : null;
    if (knownCloudOwner && cloudOwner() !== knownCloudOwner) return null;
    return readAuthStorage(key);
  },
  setItem(key, value) {
    // A sign-in or refresh may complete after logout has started. It cannot restore shared storage.
    if (cloudClosed || (knownCloudOwner && cloudOwner() !== knownCloudOwner)) return;
    try { localStorage.setItem(key, value); } catch { /* local persistence unavailable */ }
  },
  removeItem(key) {
    if (cloudClosed) {
      if (key === CLOUD_AUTH_KEY) closingToken = null;
      return;
    }
    if (knownCloudOwner && cloudOwner() !== knownCloudOwner) return;
    try { localStorage.removeItem(key); } catch { /* local persistence unavailable */ }
  },
};

// Resolves to a client, or null when cloud is off or the library cannot load (never rejects).
function cloudClient() {
  if (!CLOUD.enabled) return Promise.resolve(null);
  cloudPromise ||= (async () => {
    if (window.__supabaseForTest) return window.__supabaseForTest;
    if (!window.supabase?.createClient) await loadScript(SUPABASE_LIB);
    return window.supabase.createClient(CLOUD.url, CLOUD.key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: CLOUD_AUTH_KEY, storage: cloudAuthStorage },
    });
  })().catch(() => { console.warn('[EchoLac] cloud unavailable'); cloudPromise = null; return null; });
  return cloudPromise;
}

async function recoverCloudSession() {
  if (!canUseCloud()) return null;
  const c = await cloudClient();
  if (!c || !canUseCloud()) return null;
  const result = await c.auth.getSession();
  if (!canUseCloud()) return null;
  const owner = cloudOwner();
  let user = result.data?.session?.user;
  if (result.error) throw result.error;
  // An account already linked to this browser must recover the same identity.
  if (owner && user?.id !== owner) return null;
  // Earlier versions stored a token without an owner. Adopt it only for a previously saved account.
  if (user && !owner && !storedLegacyUser) return null;
  if (!user) {
    if (navigator.onLine === false) return null;
    const token = await captchaToken(); // undefined when Turnstile is off: the request is unchanged
    if (!canUseCloud()) return null; // signed out while the check was open: create no account
    const signedIn = await c.auth.signInAnonymously({ options: { captchaToken: token } });
    if (signedIn.error) throw signedIn.error;
    user = signedIn.data?.session?.user || signedIn.data?.user;
  }
  // Accounts start anonymous; after an email is linked (lib/cloud/email.js) the same id is permanent.
  if (!canUseCloud() || !user?.id) return null;
  if (cloudOwner() && cloudOwner() !== user.id) return null;
  store.set('cloud-owner', user.id);
  if (cloudOwner() !== user.id) return null;
  knownCloudOwner = cloudUid = user.id;
  cloudVerifiedAdult = user.app_metadata?.echolac_verified_adult === true;
  return user;
}

// Email sign-in on a device without a local account: the verified user becomes this browser's owner.
function adoptCloudOwner(id) {
  store.set('cloud-owner', id);
  knownCloudOwner = id;
}

function withCloudLock(name, task) {
  return navigator.locks?.request ? navigator.locks.request(name, task) : task();
}

function ensureSession() {
  if (!canUseCloud()) return Promise.resolve(null);
  if (!sessionPromise) {
    // Hold one lock across recovery and enrollment so two tabs cannot enroll in parallel.
    sessionPromise = Promise.resolve().then(() => withCloudLock('echolac-anonymous-session', recoverCloudSession))
      .catch(() => { console.warn('[EchoLac] sign-in failed'); return null; })
      .then(user => {
        if (user && cloudUserId() === user.id) return user;
        cloudUid = null;
        cloudVerifiedAdult = false;
        return null;
      })
      .finally(() => { sessionPromise = null; });
  }
  return sessionPromise;
}

function stopCloudWork() {
  cloudClosed = true;
  cloudUid = null;
  cloudVerifiedAdult = false;
  cloudRequests?.abort();
}

// Clear the browser token immediately. Supabase can use the in-memory copy for best-effort revocation.
async function cloudSignOut() {
  if (cloudClosed) return;
  closingToken = readAuthStorage(CLOUD_AUTH_KEY);
  stopCloudWork();
  try { localStorage.removeItem(CLOUD_AUTH_KEY); } catch { /* local persistence unavailable */ }
  try {
    const c = await (cloudPromise || (closingToken && cloudClient()));
    const result = await c?.auth.signOut({ scope: 'local' });
    if (result?.error) console.warn('[EchoLac] sign-out could not revoke the remote session');
  } catch { console.warn('[EchoLac] sign-out could not revoke the remote session'); }
  finally { closingToken = null; }
}

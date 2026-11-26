const { runtime, scripts, read } = require('./runtime.cjs');

const CLOUD_FILES = ['lib/cloud/config.js', 'lib/cloud/captcha.js', 'lib/cloud/client.js', 'lib/cloud/sync.js'];
const FAKE = `window.__log = []; window.__rows = []; window.__remote = { profiles: null, error_items: [] }; window.__fail = 0;
window.__signIns = 0; window.__sessionReads = 0; window.__session = null; window.__queries = [];
window.__supabaseForTest = {
  auth: {
    getSession: async () => {
      window.__sessionReads++;
      return { data: { session: window.__session } };
    },
    signInAnonymously: async () => {
      window.__signIns++;
      if (window.__authGate) await window.__authGate;
      window.__session = { user: { id: 'u1' } };
      return { data: window.__session, error: null };
    },
    signOut: async () => { window.__session = null; return { error: null }; },
  },
  from: t => ({
    upsert: async (row, opt) => {
      window.__log.push([t, row.id ?? row.item_id, row.user_id, opt.onConflict]);
      window.__rows.push(row);
      const gate = window.__writeGate;
      if (gate) { window.__writeGate = null; window.__writeStarted(); await gate; }
      if (window.__fail > 0) { window.__fail--; return { error: { message: 'x' } }; }
      return { error: null };
    },
    select: columns => ({ eq: (column, value) => {
      window.__queries.push([t, columns, column, value]);
      return t === 'profiles'
        ? { maybeSingle: async () => ({ data: window.__remote.profiles, error: null }) }
        : Promise.resolve({ data: window.__remote.error_items, error: null });
    } }),
  }),
};`;
function app(cfg, seed) {
  // index.html loads the cloud files too; load them here only after the test config, so CLOUD sees it.
  const a = runtime(scripts().filter(f => !CLOUD_FILES.includes(f)), seed);
  if (cfg) a.run(`window.ECHOLAC_CONFIG = ${JSON.stringify(cfg)}`);
  a.run(FAKE);
  a.run("location.search = ''; S.lang = 'en'; S.user = { name: 'Lan', consent: { terms: true } };");
  for (const f of CLOUD_FILES) a.run(read(f));
  return a;
}
const ON = { supabaseUrl: 'https://x.supabase.co', supabaseKey: 'sb_publishable_x' };
const J = (a, s) => JSON.parse(a.run(`JSON.stringify(${s})`));
const pausedWrite = a => a.run(`
  window.__writeGate = new Promise(resolve => { window.__finishWrite = resolve; });
  new Promise(resolve => { window.__writeStarted = resolve; })
`);
const pausedSignIn = a => a.run(`
  window.__authGate = new Promise(resolve => { window.__finishAuth = resolve; });
  new Promise(resolve => {
    const signIn = window.__supabaseForTest.auth.signInAnonymously;
    window.__supabaseForTest.auth.signInAnonymously = () => { resolve(); return signIn(); };
  })
`);


module.exports = { app, ON, J, pausedWrite, pausedSignIn };

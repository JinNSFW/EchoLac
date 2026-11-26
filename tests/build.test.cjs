const test = require('node:test');
const assert = require('node:assert/strict');
const { siteFiles, shellFiles, headers, MIME } = require('../scripts/site.cjs');
const { cloudConfig, parseEnv, loadEnv } = require('../scripts/env.cjs');

test('site files include pronunciation content and never config.js', () => {
  const files = siteFiles();
  assert.ok([...files].some(f => f.startsWith('content/pronunciation/') && f.endsWith('.json')));
  assert.ok(!files.has('config.js'));
  for (const ext of ['.webmanifest', '.mp3', '.m4a']) assert.ok(MIME[ext]);
});

test('offline shell includes startup scripts/styles/icons, excluding config and large models', () => {
  const shell = shellFiles(), publicFiles = siteFiles();
  for (const file of ['index.html', 'app.js', 'styles.css', 'manifest.webmanifest', 'assets/icons/pwa-192.png', 'lib/cloud/config.js',
    'assets/logo.svg', 'assets/logo-32.png', 'assets/logo-192.png']) {
    assert.ok(shell.includes(file), file);
  }
  for (const file of ['config.js', 'sw.js', 'model/model.json', '.env.local']) assert.ok(!shell.includes(file), file);
  for (const file of shell) assert.ok(publicFiles.has(file), file);
});

test('config is {} when unset, accepts aliases, refuses secrets', () => {
  assert.deepEqual(cloudConfig({}), {});
  assert.deepEqual(cloudConfig({ NEXT_PUBLIC_SUPABASE_URL: 'https://a.supabase.co/x', SUPABASE_ANON_KEY: 'sb_publishable_t' }), { supabaseUrl: 'https://a.supabase.co', supabaseKey: 'sb_publishable_t' });
  const url = 'https://a.supabase.co';
  assert.throws(() => cloudConfig({ SUPABASE_URL: url, SUPABASE_PUBLISHABLE_KEY: 'sb_secret_x' }), /secret/);
  assert.throws(() => cloudConfig({ SUPABASE_URL: url, SUPABASE_PUBLISHABLE_KEY: 'my_service_role_key' }), /secret/);
  const jwt = 'a.' + Buffer.from('{"role":"service_role"}').toString('base64url') + '.c';
  assert.throws(() => cloudConfig({ SUPABASE_URL: url, SUPABASE_PUBLISHABLE_KEY: jwt }), /secret/);
  assert.throws(() => cloudConfig({ SUPABASE_URL: url }), /both/);
});

test('CSP allows the configured cloud, without unused phase-1 hosts or eval', () => {
  const csp = headers({ supabaseUrl: 'https://a.supabase.co' })['Content-Security-Policy'];
  assert.match(csp, /connect-src 'self' https:\/\/a\.supabase\.co https:\/\/cdn\.jsdelivr\.net/);
  assert.match(csp, /connect-src [^;]*https:\/\/huggingface\.co https:\/\/\*\.huggingface\.co https:\/\/\*\.hf\.co/);
  assert.doesNotMatch(csp, /hf\.space|'unsafe-eval'/);
  const script = csp.split('; ').find(s => s.startsWith('script-src '));
  // Speech-to-text: the exact pinned library path and wasm compile only; model hosts never serve scripts.
  assert.match(script, /'wasm-unsafe-eval'.*@huggingface\/transformers@3\.7\.6\/dist\//);
  assert.doesNotMatch(script, /\*|huggingface\.co|hf\.co/);
  assert.doesNotMatch(script, /unsafe-inline/);
  assert.match(csp, /script-src-attr 'unsafe-inline'/);
  assert.match(script, /@supabase\/supabase-js@2\.119\.0\/dist\/umd\/supabase\.js/);
  assert.match(csp, /worker-src 'self' blob:/);
  assert.deepEqual(parseEnv('A=1\nexport B="x y"\n'), { A: '1', B: 'x y' });
});

test('config rejects unrelated credentials and URLs with userinfo', () => {
  const config = key => cloudConfig({ SUPABASE_URL: 'https://a.supabase.co', SUPABASE_PUBLISHABLE_KEY: key });
  for (const value of ['unrelated-api-key', 'a.e30.c', 'sb_publishable_', 'sb_publishable_x\nother']) {
    assert.throws(() => config(value), /publishable/);
  }
  const anon = 'a.' + Buffer.from('{"role":"anon"}').toString('base64url') + '.c';
  assert.equal(config(anon).supabaseKey, anon);
  assert.throws(() => cloudConfig({ SUPABASE_URL: 'https://user:pass@a.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_x' }), /credentials/);
});

test('malformed URL errors do not contain the raw configuration or Node input metadata', () => {
  const canary = 'private-canary-invalid-url';
  let error;
  try { cloudConfig({ SUPABASE_URL: canary, SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test' }); } catch (caught) { error = caught; }
  assert.ok(error);
  assert.doesNotMatch(require('node:util').inspect(error), new RegExp(canary));
  assert.equal(Object.hasOwn(error, 'input'), false);
  assert.equal(Object.hasOwn(error, 'cause'), false);
});

test('process aliases override local canonical names, and local aliases override base values', () => {
  const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'echolac-env-'));
  try {
    fs.writeFileSync(path.join(dir, '.env'), 'SUPABASE_URL=https://base.supabase.co\nSUPABASE_PUBLISHABLE_KEY=sb_publishable_base');
    fs.writeFileSync(path.join(dir, '.env.local'), 'NEXT_PUBLIC_SUPABASE_URL=https://local.supabase.co\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_local');
    assert.deepEqual(cloudConfig(loadEnv({}, dir)), { supabaseUrl: 'https://local.supabase.co', supabaseKey: 'sb_publishable_local' });
    fs.writeFileSync(path.join(dir, '.env.local'), 'SUPABASE_URL=https://local.supabase.co\nSUPABASE_PUBLISHABLE_KEY=sb_publishable_local');
    const config = cloudConfig(loadEnv({ NEXT_PUBLIC_SUPABASE_URL: 'https://process.supabase.co', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_process' }, dir));
    assert.deepEqual(config, { supabaseUrl: 'https://process.supabase.co', supabaseKey: 'sb_publishable_process' });
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('build refuses project paths and nonempty external folders without modifying them', () => {
  const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
  const { spawnSync } = require('node:child_process'), root = path.join(__dirname, '..');
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'echolac-unowned-'));
  try {
    const sentinel = path.join(out, 'keep.txt'); fs.writeFileSync(sentinel, 'keep');
    for (const target of [root, path.join(root, 'pages'), out]) {
      const result = spawnSync(process.execPath, [path.join(root, 'scripts/build-site.cjs'), target], { encoding: 'utf8' });
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /Build only|Refusing to clear/);
    }
    assert.equal(fs.readFileSync(sentinel, 'utf8'), 'keep');
  } finally { fs.rmSync(out, { recursive: true, force: true }); }
});

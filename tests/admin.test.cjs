// The local admin console (admin/) never ships, binds to loopback only, and its page loads nothing it cannot pin.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const { root, read } = require('../scripts/project.cjs');
const { siteFiles, shellFiles } = require('../scripts/site.cjs');
const { listenAdmin } = require('../scripts/admin-serve.cjs');

const ADMIN_FILES = fs.readdirSync(path.join(root, 'admin'));
const ADMIN_ONLY = ADMIN_FILES.filter(f => f !== 'index.html'); // the public site has its own index.html
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));

test('the site build never contains the admin console', () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'echolac-build-'));
  try {
    const run = spawnSync(process.execPath, [path.join(root, 'scripts/build-site.cjs'), out], { cwd: root, encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr);
    const files = walk(out).map(f => path.relative(out, f).split(path.sep).join('/'));
    assert.ok(files.includes('index.html') && files.includes('pwa-shell.json'));
    for (const f of files) {
      assert.ok(!f.startsWith('admin/') && !ADMIN_ONLY.includes(path.basename(f)), f);
      if (/\.(?:js|html|json|css)$/.test(f)) assert.doesNotMatch(fs.readFileSync(path.join(out, f), 'utf8'), /admin_set_learner|mfa\.enroll|admin-serve/, f);
    }
    const shell = JSON.parse(fs.readFileSync(path.join(out, 'pwa-shell.json'), 'utf8'));
    assert.ok(shell.every(f => !f.startsWith('admin/') && !ADMIN_ONLY.includes(path.basename(f))));
  } finally { fs.rmSync(out, { recursive: true, force: true }); }
  assert.ok([...siteFiles(), ...shellFiles()].every(f => !f.startsWith('admin/')));
  // The service worker would refuse to cache admin paths even if they were served.
  const STATIC = new RegExp(read('sw.js').match(/const STATIC = \/(.+)\/;/)[1]);
  for (const f of ADMIN_FILES) assert.equal(STATIC.test('/admin/' + f), false, f);
});

test('admin page: pinned supabase-js with SRI, no inline code, no secrets, files under 300 lines', () => {
  const html = read('admin/index.html');
  const pinned = read('lib/cloud/client.js').match(/'(https:\/\/cdn\.jsdelivr\.net[^']+)', '(sha384-[^']+)'/);
  const tags = [...html.matchAll(/<script\b[^>]*>/g)].map(m => m[0]);
  assert.ok(tags.every(t => /\ssrc="/.test(t)), 'no inline script');
  const cdn = tags.find(t => t.includes('cdn.jsdelivr.net'));
  assert.ok(cdn.includes(`src="${pinned[1]}"`) && cdn.includes(`integrity="${pinned[2]}"`) && cdn.includes('crossorigin="anonymous"'));
  for (const f of ADMIN_FILES) {
    const text = read('admin/' + f);
    assert.doesNotMatch(text, /service_role|sb_secret_|\son[a-z]+="|style="|user_metadata/i, f);
    assert.ok(text.trimEnd().split(/\r?\n/).length <= 300, f);
  }
  assert.doesNotMatch(read('admin/admin.js'), /signUp\(/); // admins are created in the Dashboard only
});

test('admin views escape every database value', () => {
  const ctx = {};
  vm.runInNewContext(read('admin/views.js') + ';this.V = VIEWS;', ctx);
  const evil = '<img src=x onerror=alert(1)>"\'';
  const html = [
    ctx.V.learners({ profiles: [{ id: evil, display_name: evil, role: evil, verification_status: 'unverified', level: evil, age_group: evil }] }),
    ctx.V.sessions({ sessions: [{ id: evil, location_id: evil, capacity: evil, status: 'scheduled' }], places: [{ id: evil, name_vi: evil }] }),
    ctx.V.requests({ requests: [{ tourist_id: evil, location_id: evil, mode: evil, status: evil }], reports: [{ id: evil, reason: evil, status: 'open' }],
      blocks: [{ blocker_id: evil }], people: {} }),
    ctx.V.audit({ audit: [{ actor_id: evil, action: evil, target_table: evil, target_id: evil, details: { x: evil } }] }),
  ].join('');
  assert.doesNotMatch(html, /<img|onerror=alert\(1\)>|"'/);
  assert.match(html, /&lt;img src=x/);
});

test('admin server: loopback only, strict CSP, publishable config, nothing outside admin/', async () => {
  const server = await new Promise(ok => { const s = listenAdmin({ supabaseUrl: 'https://a.supabase.co', supabaseKey: 'sb_publishable_test' }, 0, () => ok(s)); });
  try {
    const { address, port } = server.address();
    assert.equal(address, '127.0.0.1');
    const get = (p, init) => fetch(`http://127.0.0.1:${port}${p}`, init);
    const page = await get('/');
    assert.equal(page.status, 200);
    const csp = page.headers.get('content-security-policy');
    assert.match(csp, /default-src 'none'/);
    assert.match(csp, /script-src 'self' https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2\.119\.0\/dist\/umd\/supabase\.js;/);
    assert.match(csp, /connect-src https:\/\/a\.supabase\.co;/);
    assert.match(csp, /frame-ancestors 'none'/);
    assert.doesNotMatch(csp, /unsafe-inline|unsafe-eval|\*/);
    assert.equal(await (await get('/config.js')).text(), 'window.ECHOLAC_CONFIG={"supabaseUrl":"https://a.supabase.co","supabaseKey":"sb_publishable_test"};\n');
    for (const p of ['/../scripts/env.cjs', '/%2e%2e/package.json', '/.env.local', '/admin/index.html', '/app.js']) assert.equal((await get(p)).status, 404, p);
    assert.equal((await get('/', { method: 'POST' })).status, 405);
    const rebound = await new Promise(ok => require('node:http').get({ host: '127.0.0.1', port, path: '/config.js', headers: { Host: 'evil.test' } }, r => ok(r.statusCode)));
    assert.equal(rebound, 421); // DNS rebinding: a foreign Host header gets nothing
  } finally { server.close(); }
  assert.throws(() => listenAdmin({}, 0), /SUPABASE_URL/);
});

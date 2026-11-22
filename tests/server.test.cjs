const test = require('node:test');
const assert = require('node:assert/strict');
const { createSiteServer } = require('../scripts/serve.cjs');

test('local HTTP serves public PWA/content/config with security headers and hides private files', async () => {
  const server = createSiteServer({});
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const [file, type] of [['/', 'text/html'], ['/manifest.webmanifest', 'application/manifest+json'],
      ['/content/pronunciation/index.json', 'application/json'], ['/sw.js', 'text/javascript'], ['/lib/pwa.js', 'text/javascript'],
      ['/pwa-shell.json', 'application/json']]) {
      const response = await fetch(origin + file);
      assert.equal(response.status, 200, file);
      assert.ok(response.headers.get('content-type').startsWith(type), file);
      assert.match(response.headers.get('content-security-policy'), /frame-ancestors 'none'/);
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    }
    const config = await fetch(origin + '/config.js?v=1');
    assert.equal(await config.text(), 'window.ECHOLAC_CONFIG={};\n');
    assert.equal(config.headers.get('cache-control'), 'no-store');
    const shell = await (await fetch(origin + '/pwa-shell.json')).json();
    assert.ok(shell.includes('index.html') && shell.includes('styles.css'));
    assert.ok(!shell.includes('config.js'));
    for (const path of ['/.env.local', '/.git/config', '/README.md', '/docs/handoff-codex.md', '/scripts/env.cjs', '/tests/auth.test.cjs', '/%2e%2e/.env.local']) {
      assert.equal((await fetch(origin + path)).status, 404, path);
    }
    assert.equal((await fetch(origin + '/config.js', { method: 'POST', body: 'test' })).status, 404);
    assert.equal(await (await fetch(origin + '/', { method: 'HEAD' })).text(), '');
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});

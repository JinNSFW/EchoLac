const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { read } = require('../scripts/project.cjs');

function worker() {
  const handlers = {}, buckets = new Map(), deleted = [], writes = [];
  const response = body => ({ ok: true, type: 'basic', body, redirected: state.redirected, clone: () => response(body) });
  const state = { fetches: 0, offline: false, quota: false, redirected: false, shell: ['index.html', 'app.js', 'styles.css'] };
  const sandbox = {
    URL, location: { origin: 'https://app.test' }, Response: { error: () => 'network-error' },
    self: { addEventListener: (k, f) => { handlers[k] = f; }, skipWaiting: async () => {}, clients: { claim: async () => {} } },
    fetch: async url => {
      state.fetches++; if (state.offline) throw new Error('offline');
      return String(url).endsWith('/pwa-shell.json') ? { ok: true, json: async () => state.shell } : response(state.fetches);
    },
    caches: {
      keys: async () => [...buckets.keys()],
      delete: async key => { deleted.push(key); return buckets.delete(key); },
      open: async name => {
        if (!buckets.has(name)) buckets.set(name, new Map());
        const bucket = buckets.get(name), key = req => typeof req === 'string' ? req : req.url;
        return {
          match: async req => bucket.get(key(req)),
          put: async (req, res) => { if (state.quota) throw new Error('quota'); writes.push(key(req)); bucket.set(key(req), res); },
        };
      },
    },
  };
  vm.runInNewContext(read('sw.js'), sandbox);
  const fetch = (path, opts = {}) => {
    let result;
    const request = { url: new URL(path, sandbox.location.origin).href, method: 'GET', mode: 'cors', headers: { has: () => false }, ...opts };
    handlers.fetch({ request, respondWith: p => { result = p; } });
    return result;
  };
  return { handlers, buckets, deleted, writes, state, fetch };
}

test('PWA never intercepts config with query strings, APIs, cross-origin or non-GET/range requests', () => {
  const w = worker();
  for (const path of ['/config.js', '/config.js?v=1', '/%63onfig.js', '/api/private', '/.env.local', 'https://other.test/app.js']) {
    assert.equal(w.fetch(path), undefined, path);
  }
  assert.equal(w.fetch('/app.js', { method: 'POST' }), undefined);
  assert.equal(w.fetch('/assets/audio/pron/a.mp3', { headers: { has: () => true } }), undefined);
  assert.equal(w.state.fetches, 0);
});

test('first installation warms the shell before activation, enabling immediate offline reload', async () => {
  const w = worker(); let install;
  w.handlers.install({ waitUntil: p => { install = p; } }); await install;
  assert.deepEqual(w.writes.sort(), ['https://app.test/app.js', 'https://app.test/index.html', 'https://app.test/styles.css']);
  w.state.offline = true;
  assert.equal((await w.fetch('/')).ok, true);
  assert.equal((await w.fetch('/app.js')).ok, true);
  assert.equal((await w.fetch('/styles.css')).ok, true);
});

test('installation rejects config or API paths in a malformed shell manifest', async () => {
  for (const file of ['config.js', 'config.js?v=1', '../config.js', 'api/private']) {
    const w = worker(); w.state.shell.push(file); let install;
    w.handlers.install({ waitUntil: p => { install = p; } });
    await assert.rejects(install, /Invalid offline shell/);
    assert.deepEqual(w.writes, []);
  }
});

test('PWA only deletes its own old caches and does not read unrelated caches', async () => {
  const w = worker();
  w.buckets.set('other-app', new Map([['https://app.test/app.js', 'foreign']]));
  w.buckets.set('echolac-v1', new Map());
  let activation; w.handlers.activate({ waitUntil: p => { activation = p; } }); await activation;
  assert.deepEqual(w.deleted, ['echolac-v1']);
  w.state.offline = true;
  assert.equal(await w.fetch('/app.js'), 'network-error');
  assert.ok(w.buckets.has('other-app'));
});

test('PWA keeps a shared offline shell and uses cache-first for sample audio', async () => {
  const w = worker();
  const online = await w.fetch('/');
  assert.deepEqual(w.writes, ['https://app.test/index.html']);
  const audio = await w.fetch('/assets/audio/pron/a.mp3');
  const fetched = w.state.fetches;
  w.state.offline = true;
  assert.equal((await w.fetch('/index.html')).body, online.body);
  assert.equal((await w.fetch('/assets/audio/pron/a.mp3')).body, audio.body);
  assert.equal(w.state.fetches, fetched + 1, 'only the navigation tries the network');
});

test('cache quota errors do not turn a successful network response into an error', async () => {
  const w = worker(); w.state.quota = true;
  assert.equal((await w.fetch('/app.js')).ok, true);
  assert.deepEqual(w.writes, []);
});

test('redirected responses cannot place configuration or API content under a public asset cache key', async () => {
  const w = worker(); w.state.redirected = true;
  assert.equal((await w.fetch('/app.js')).ok, true);
  assert.deepEqual(w.writes, []);
  let install; w.handlers.install({ waitUntil: p => { install = p; } });
  await assert.rejects(install, /Offline shell file unavailable/);
});

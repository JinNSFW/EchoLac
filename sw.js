'use strict';
// Offline shell. Bump VERSION when shipping so old caches are dropped.
const VERSION = 'echolac-v2';
const CACHE_PREFIX = 'echolac-';
// Only public app files may enter this cache. Runtime config and API routes never do.
const STATIC = /^\/(?:app\.js|styles\.css|manifest\.webmanifest|da-nang-question-bank\.json|(?:assets|model|content|pages|components|lib|data|styles)\/.+\.(?:js|css|json|svg|png|webp|bin|txt|mp3|m4a))$/;

async function precacheShell() {
  const response = await fetch(new URL('/pwa-shell.json', location.origin).href, { cache: 'no-store' });
  if (!response.ok) throw new Error('Offline shell manifest unavailable');
  const files = await response.json();
  if (!Array.isArray(files) || !files.length || !files.every(f => typeof f === 'string'
    && !f.includes('..') && (f === 'index.html' || STATIC.test('/' + f)))) throw new Error('Invalid offline shell manifest');
  const cache = await caches.open(VERSION);
  await Promise.all(files.map(async file => {
    const url = new URL('/' + file, location.origin).href;
    const res = await fetch(url, { cache: 'reload' });
    if (!res.ok || res.type !== 'basic' || res.redirected) throw new Error('Offline shell file unavailable');
    await cache.put(url, res);
  }));
}
self.addEventListener('install', e => e.waitUntil(precacheShell().then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith(CACHE_PREFIX) && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())));

async function put(req, res) {
  try {
    if (res.ok && res.type === 'basic' && !res.redirected) { const c = await caches.open(VERSION); await c.put(req, res.clone()); }
  } catch { /* quota or private mode: keep serving the network response */ }
  return res;
}
const match = async req => (await caches.open(VERSION)).match(req);
const networkFirst = (req, key = req) => fetch(req).then(res => put(key, res)).catch(() => match(key).then(r => r || Response.error()));
const cacheFirst = req => match(req).then(hit => hit || fetch(req).then(res => put(req, res)));

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (req.headers.has('range')) return; // partial audio responses cannot be cached
  const page = url.pathname === '/' || url.pathname === '/index.html';
  if (!page && !STATIC.test(url.pathname)) return;
  // Query strings affect routing, not the static shell; keep one offline shell for both entry URLs.
  e.respondWith(page ? networkFirst(req, new URL('/index.html', location.origin).href)
    : url.pathname.startsWith('/assets/audio/') ? cacheFirst(req) : networkFirst(req));
});

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { root } = require('./project.cjs');
const { cloudConfig, configJs } = require('./env.cjs');

// Local admin console: serves admin/ plus a generated config.js on 127.0.0.1 only. scripts/site.cjs never lists admin/,
// so the Netlify build and the public dev server never ship it (tests/admin.test.cjs builds and checks).
// Only the Supabase URL and publishable key are served; cloudConfig() refuses secret-looking values.
const DIR = path.join(root, 'admin');
const FILES = { 'index.html': 'text/html; charset=utf-8', 'admin.js': 'text/javascript; charset=utf-8',
  'views.js': 'text/javascript; charset=utf-8', 'admin.css': 'text/css; charset=utf-8' };
const SUPABASE_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.0/dist/umd/supabase.js';

// Cloudflare forbids pinning Turnstile's api.js, so it is allowed by origin only, and only when a site key is set
// (Supabase Auth captcha then also applies to admin sign-in).
const TURNSTILE = 'https://challenges.cloudflare.com';

// No inline script, style or handler anywhere; the TOTP QR code is an SVG data URL.
const adminCsp = (supabaseUrl, turnstile) => [
  "default-src 'none'", `script-src 'self' ${SUPABASE_JS}${turnstile ? ' ' + TURNSTILE : ''}`, "style-src 'self'", "img-src 'self' data:",
  `connect-src ${supabaseUrl}`, ...(turnstile ? [`frame-src ${TURNSTILE}`] : []),
  "base-uri 'none'", "form-action 'none'", "frame-ancestors 'none'", "object-src 'none'",
].join('; ');

function createAdminServer({ supabaseUrl, supabaseKey, turnstileSiteKey }) {
  if (!supabaseUrl || !supabaseKey) throw new Error('Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in .env.local first.');
  const headers = {
    'Content-Security-Policy': adminCsp(supabaseUrl, !!turnstileSiteKey), 'X-Frame-Options': 'DENY', 'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer', 'Cross-Origin-Opener-Policy': 'same-origin', 'Cache-Control': 'no-store',
  };
  const server = http.createServer((request, response) => {
    // DNS-rebinding guard: answer only requests addressed to this loopback port.
    const port = server.address().port;
    if (![`127.0.0.1:${port}`, `localhost:${port}`].includes(request.headers.host)) { response.writeHead(421).end(); return; }
    if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405).end(); return; }
    let name;
    try { name = decodeURIComponent(new URL(request.url, 'http://localhost').pathname).slice(1) || 'index.html'; }
    catch { response.writeHead(400).end(); return; }
    const send = (type, body) => {
      response.writeHead(200, { ...headers, 'Content-Type': type });
      response.end(request.method === 'HEAD' ? undefined : body);
    };
    if (name === 'config.js') return send(FILES['admin.js'], configJs({ supabaseUrl, supabaseKey, ...(turnstileSiteKey && { turnstileSiteKey }) }));
    if (!Object.hasOwn(FILES, name)) { response.writeHead(404).end(); return; }
    fs.readFile(path.join(DIR, name), (error, body) => (error ? response.writeHead(404).end() : send(FILES[name], body)));
  });
  return server;
}

// Always loopback: the admin console is never reachable from the network.
const listenAdmin = (config, port, done) => createAdminServer(config).listen(port, '127.0.0.1', done);

if (require.main === module) {
  const port = Number(process.env.ADMIN_PORT || 4174);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid ADMIN_PORT');
  listenAdmin(cloudConfig(), port, () => console.log(`EchoLạc admin (local only): http://127.0.0.1:${port}/`));
}
module.exports = { createAdminServer, listenAdmin, adminCsp };

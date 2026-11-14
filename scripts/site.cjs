const fs = require('node:fs');
const path = require('node:path');
const { root, read, scripts } = require('./project.cjs');

// One list of public files and one set of security headers, shared by the dev server and the Netlify build.
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.bin': 'application/octet-stream',
  '.txt': 'text/plain; charset=utf-8',
};

// shortcut: 'unsafe-inline' is needed by the prototype's inline onclick handlers; drop it once handlers use addEventListener.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const HEADERS = {
  'Content-Security-Policy': CSP,
  'Permissions-Policy': 'camera=(self), microphone=(self), geolocation=(self)',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
};

const walk = dir => fs.readdirSync(path.join(root, dir), { withFileTypes: true })
  .flatMap(e => (e.isDirectory() ? walk(dir + '/' + e.name) : [dir + '/' + e.name]));

// Pages, scripts, stylesheets, plus assets/ and model/ files of a served type. Docs, tests and tooling stay private.
function siteFiles() {
  const files = new Set(['index.html', 'styles.css', ...scripts()]);
  for (const m of read('styles.css').matchAll(/@import url\("([^"]+)"\)/g)) files.add(m[1]);
  for (const dir of ['assets', 'model']) walk(dir).filter(f => Object.hasOwn(MIME, path.extname(f))).forEach(f => files.add(f));
  return files;
}

module.exports = { MIME, HEADERS, siteFiles };

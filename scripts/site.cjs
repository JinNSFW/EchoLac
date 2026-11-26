const fs = require('node:fs');
const path = require('node:path');
const { root, read, scripts } = require('./project.cjs');
const { cloudConfig } = require('./env.cjs');

// One list of public files and one set of security headers, shared by the dev server and the Netlify build.
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.bin': 'application/octet-stream',
  '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4',
};

const CDN_SCRIPTS = [
  'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.0/dist/umd/supabase.js',
];
// On-device speech-to-text: the pinned transformers.js build and its WebAssembly runtime (same dist path), loaded inside lib/asr-worker.js.
const ASR_LIB = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.6/dist/';
// Model weights: huggingface.co redirects to its CDN hosts. connect-src only; weights are fetched by the worker.
const ASR_MODEL_HOSTS = ['https://huggingface.co', 'https://*.huggingface.co', 'https://*.hf.co'];
// Turnstile needs its script and iframe origin (Cloudflare's CSP reference); allowed only when a site key is set.
const TURNSTILE = 'https://challenges.cloudflare.com';
// Inline event handlers remain in the prototype; inline script elements are blocked.
// Add model-host and WebAssembly permissions with the phase-1 engine, when its actual requests can be tested.
const csp = config => [
  "default-src 'self'",
  ["script-src 'self' 'wasm-unsafe-eval'", ...CDN_SCRIPTS, ASR_LIB, config.turnstileSiteKey && TURNSTILE].filter(Boolean).join(' '),
  config.turnstileSiteKey && `frame-src ${TURNSTILE}`,
  "script-src-attr 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https://api.dictionaryapi.dev",
  ['connect-src', "'self'", config.supabaseUrl, 'https://cdn.jsdelivr.net', ...ASR_MODEL_HOSTS, 'https://api.dictionaryapi.dev'].filter(Boolean).join(' '),
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].filter(Boolean).join('; ');

// The Supabase origin comes from the environment, so headers are built per call (cloudConfig throws on a secret).
const headers = (config = cloudConfig()) => ({
  'Content-Security-Policy': csp(config),
  'Permissions-Policy': 'camera=(self), microphone=(self), geolocation=(self)',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
});

const walk = dir => fs.existsSync(path.join(root, dir)) ? fs.readdirSync(path.join(root, dir), { withFileTypes: true })
  .flatMap(e => (e.isDirectory() ? walk(dir + '/' + e.name) : [dir + '/' + e.name])) : [];

// Pages, scripts, stylesheets, plus assets/ (icons, audio) and model/ files of a served type, pronunciation JSON and PWA files.
// Docs, tests and tooling stay private.
function siteFiles() {
  // config.js is generated (build writes it, serve.cjs answers it), never a file in the repo tree.
  const files = new Set(['index.html', 'styles.css', 'da-nang-question-bank.json', 'lib/asr-worker.js', 'lib/pron-worker.js', ...scripts().filter(f => f !== 'config.js')]);
  for (const f of ['manifest.webmanifest', 'sw.js']) if (fs.existsSync(path.join(root, f))) files.add(f); // PWA files, when present
  for (const m of read('styles.css').matchAll(/@import url\("([^"]+)"\)/g)) files.add(m[1]);
  for (const dir of ['assets', 'model']) walk(dir).filter(f => Object.hasOwn(MIME, path.extname(f))).forEach(f => files.add(f));
  walk('content/pronunciation').filter(f => f.endsWith('.json')).forEach(f => files.add(f));
  return files;
}

// Install-time offline shell, shared by build and local server. Large scenes/models remain on demand.
const shellFiles = () => [...siteFiles()].filter(f => f !== 'sw.js' && (f === 'index.html'
  || f === 'styles.css' || f === 'manifest.webmanifest' || f.endsWith('.js')
  || f.startsWith('styles/') || f.startsWith('assets/icons/') || /^assets\/logo(?:-\d+)?\.(?:svg|png)$/.test(f)));

module.exports = { MIME, headers, siteFiles, shellFiles };

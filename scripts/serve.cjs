const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { root, read, scripts } = require('./project.cjs');

// Serve application files only. Local secrets and the ignored Next.js sandbox stay private.
const allowed = new Set(['index.html', 'styles.css', ...scripts()]);
for (const match of read('styles.css').matchAll(/@import url\("([^"]+)"\)/g)) allowed.add(match[1]);
const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.bin': 'application/octet-stream',
  '.txt': 'text/plain; charset=utf-8',
};
const port = Number(process.env.PORT || 4173);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');

http.createServer((request, response) => {
  let name;
  try { name = decodeURIComponent(new URL(request.url, 'http://localhost').pathname).slice(1) || 'index.html'; }
  catch { response.writeHead(400).end(); return; }
  const file = path.resolve(root, name);
  const inside = file.startsWith(root + path.sep);
  const relative = path.relative(root, file).split(path.sep).join('/');
  const asset = /^(assets|model)\//.test(relative) && Object.hasOwn(mime, path.extname(relative));
  if (!inside || !(allowed.has(relative) || asset) || !['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(404).end(); return;
  }
  fs.readFile(file, (error, body) => {
    if (error) { response.writeHead(404).end(); return; }
    response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(request.method === 'HEAD' ? undefined : body);
  });
}).listen(port, '127.0.0.1', () => console.log(`EchoLạc: http://127.0.0.1:${port}/?demo`));

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { root } = require('./project.cjs');
const { MIME, HEADERS, siteFiles } = require('./site.cjs');

// Serve the same public files and headers as the Netlify build. Local secrets and the ignored Next.js sandbox stay private.
const allowed = siteFiles();
const port = Number(process.env.PORT || 4173);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');

http.createServer((request, response) => {
  let name;
  try { name = decodeURIComponent(new URL(request.url, 'http://localhost').pathname).slice(1) || 'index.html'; }
  catch { response.writeHead(400).end(); return; }
  const file = path.resolve(root, name);
  const inside = file.startsWith(root + path.sep);
  const relative = path.relative(root, file).split(path.sep).join('/');
  if (!inside || !allowed.has(relative) || !['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(404).end(); return;
  }
  fs.readFile(file, (error, body) => {
    if (error) { response.writeHead(404).end(); return; }
    response.writeHead(200, { ...HEADERS, 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(request.method === 'HEAD' ? undefined : body);
  });
}).listen(port, '127.0.0.1', () => console.log(`EchoLạc: http://127.0.0.1:${port}/?demo`));

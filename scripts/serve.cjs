const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { root } = require('./project.cjs');
const { MIME, headers, siteFiles, shellFiles } = require('./site.cjs');
const { cloudConfig, configJs } = require('./env.cjs');

// Serve the same public files and headers as the Netlify build. Local secrets and the ignored Next.js sandbox stay private.
function createSiteServer(config = cloudConfig()) {
const allowed = siteFiles();
return http.createServer((request, response) => {
  let name;
  try { name = decodeURIComponent(new URL(request.url, 'http://localhost').pathname).slice(1) || 'index.html'; }
  catch { response.writeHead(400).end(); return; }
  const readOnly = ['GET', 'HEAD'].includes(request.method);
  if (name === 'pwa-shell.json' && readOnly) {
    response.writeHead(200, { ...headers(config), 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
    response.end(request.method === 'HEAD' ? undefined : JSON.stringify(shellFiles())); return;
  }
  if (name === 'config.js' && readOnly) { // generated in memory, same as the build's dist/config.js
    response.writeHead(200, { ...headers(config), 'Content-Type': MIME['.js'], 'Cache-Control': 'no-store' });
    response.end(request.method === 'HEAD' ? undefined : configJs(config)); return;
  }
  const file = path.resolve(root, name);
  const inside = file.startsWith(root + path.sep);
  const relative = path.relative(root, file).split(path.sep).join('/');
  if (!inside || !allowed.has(relative) || !readOnly) {
    response.writeHead(404).end(); return;
  }
  fs.readFile(file, (error, body) => {
    if (error) { response.writeHead(404).end(); return; }
    response.writeHead(200, { ...headers(config), 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(request.method === 'HEAD' ? undefined : body);
  });
});
}

if (require.main === module) {
  const port = Number(process.env.PORT || 4173);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
  createSiteServer().listen(port, '127.0.0.1', () => console.log(`EchoLạc: http://127.0.0.1:${port}/?demo`));
}
module.exports = { createSiteServer };

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
// config.js is generated from env by build-site.cjs / serve.cjs and never lives in the repo.
const scripts = () => [...read('index.html').matchAll(/<script\b[^>]*src="([^"]+)"[^>]*>/g)].map(m => m[1]).filter(f => f !== 'config.js');

module.exports = { root, read, scripts };

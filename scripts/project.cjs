const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const scripts = () => [...read('index.html').matchAll(/<script\b[^>]*src="([^"]+)"[^>]*>/g)].map(m => m[1]);

module.exports = { root, read, scripts };

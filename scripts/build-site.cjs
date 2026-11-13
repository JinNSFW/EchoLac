const fs = require('node:fs');
const path = require('node:path');
const { root } = require('./project.cjs');
const { HEADERS, siteFiles } = require('./site.cjs');

// Netlify build: copy only the public app files to dist/ (or the given folder) and write Netlify's _headers.
const out = path.resolve(root, process.argv[2] || 'dist');
if ((root + path.sep).startsWith(out + path.sep)) throw new Error('Refusing to build into ' + out); // never wipe the project or a parent
fs.rmSync(out, { recursive: true, force: true });
const files = siteFiles();
for (const file of files) {
  fs.mkdirSync(path.dirname(path.join(out, file)), { recursive: true });
  fs.copyFileSync(path.join(root, file), path.join(out, file));
}
fs.writeFileSync(path.join(out, '_headers'), '/*\n' + Object.entries(HEADERS).map(([k, v]) => `  ${k}: ${v}`).join('\n') + '\n');
console.log(`Built ${files.size} files into ${path.relative(root, out) || out}.`);

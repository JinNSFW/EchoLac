const fs = require('node:fs');
const path = require('node:path');
const { root } = require('./project.cjs');
const { headers, siteFiles, shellFiles } = require('./site.cjs');
const { cloudConfig, configJs } = require('./env.cjs');

// Netlify build: copy only the public app files to dist/ (or the given folder) and write Netlify's _headers and config.js.
const out = path.resolve(root, process.argv[2] || 'dist');
const relative = path.relative(root, out);
const inside = relative && !relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative);
const marker = '.echolac-build';
if (!relative || (inside && relative !== 'dist') || (!inside && (root + path.sep).startsWith(out + path.sep))) {
  throw new Error('Build only into dist/ or an empty external output folder.');
}
if (fs.existsSync(out)) {
  if (fs.lstatSync(out).isSymbolicLink() || !fs.statSync(out).isDirectory()) throw new Error('Build output must be a real directory.');
  const entries = fs.readdirSync(out);
  if (entries.length && (relative !== 'dist' || !fs.existsSync(path.join(out, marker))
    || fs.readFileSync(path.join(out, marker), 'utf8') !== 'EchoLac generated output\n')) {
    throw new Error('Refusing to clear an unowned or nonempty output folder. Use a new empty folder.');
  }
}
const config = cloudConfig(); // throws before anything is wiped if a secret-looking value is set
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, marker), 'EchoLac generated output\n'); // an interrupted dist build remains safe to retry
const files = siteFiles();
for (const file of files) {
  fs.mkdirSync(path.dirname(path.join(out, file)), { recursive: true });
  fs.copyFileSync(path.join(root, file), path.join(out, file));
}
fs.writeFileSync(path.join(out, '_headers'), '/*\n' + Object.entries(headers(config)).map(([k, v]) => `  ${k}: ${v}`).join('\n') + '\n');
fs.writeFileSync(path.join(out, 'config.js'), configJs(config)); // public settings only; {} when Supabase is not configured
fs.writeFileSync(path.join(out, 'pwa-shell.json'), JSON.stringify(shellFiles()));
console.log(`Built ${files.size} files into ${path.relative(root, out) || out}.`);

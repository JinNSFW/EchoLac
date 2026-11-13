const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { root, read, scripts } = require('./project.cjs');

// No package installation is needed to check the static prototype.
const files = scripts();
assert.equal(new Set(files).size, files.length, 'Duplicate scripts in index.html');
for (const file of files) {
  const code = read(file);
  new vm.Script(code, { filename: file });
  assert.ok(code.trimEnd().split(/\r?\n/).length <= 300, file + ' exceeds 300 lines');
}
const css = [...read('styles.css').matchAll(/@import url\("([^"]+)"\)/g)].map(m => m[1]);
for (const file of css) {
  assert.ok(fs.existsSync(path.join(root, file)), 'Missing stylesheet ' + file);
  assert.ok(read(file).trimEnd().split(/\r?\n/).length <= 300, file + ' exceeds 300 lines');
}
for (const match of read('index.html').matchAll(/(?:src|href)="([^"#]+)"/g)) {
  if (!/^https?:/.test(match[1])) assert.ok(fs.existsSync(path.join(root, match[1])), 'Missing asset ' + match[1]);
}
console.log(`Checked syntax, file limits and asset paths: ${files.length} scripts, ${css.length} stylesheets.`);

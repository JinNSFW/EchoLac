const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { read, runtime, templates } = require('../tests/helpers/runtime.cjs');

// Optional one-time comparison against a pre-refactor snapshot directory.
const baseline = process.argv[2];
assert.ok(baseline, 'Usage: node scripts/compare-refactor.cjs <snapshot-directory>');
const before = JSON.parse(fs.readFileSync(path.join(baseline, 'templates.json'), 'utf8'));
const after = JSON.parse(JSON.stringify(templates(runtime())));
assert.deepEqual(after, before);
console.log('All 40 screen templates match the pre-refactor snapshot.');
const imported = [...read('styles.css').matchAll(/url\("([^"]+)"\)/g)].map(m => read(m[1]));
const original = fs.readFileSync(path.join(baseline, 'styles.css'), 'utf8');
assert.equal(imported.join('\n').replaceAll(/\s/g, ''), original.replaceAll(/\s/g, ''));
console.log('All CSS rules and their cascade order match the pre-refactor snapshot.');

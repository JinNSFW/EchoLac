const { test } = require('node:test');
const assert = require('node:assert/strict');
const { runtime, templates } = require('./helpers/runtime.cjs');

test('all screens render in Vietnamese and English in script loading order', () => {
  const output = templates(runtime());
  assert.equal(Object.keys(output).length, 40);
  for (const [name, html] of Object.entries(output)) {
    assert.ok(html.length > 100, name);
    assert.ok(!html.includes('undefined'), name + ' contains undefined');
  }
  assert.match(output['vi/home'], /Trang chủ|Chào|Lan/);
  assert.match(output['en/tutor'], /Tutor/);
  assert.notEqual(output['vi/profile'], output['en/profile']);
});

test('existing contrast, camera matching and language diagnostics pass', () => {
  assert.equal(runtime().run('selfTest().length'), 0);
});

test('onboarding previews do not persist until the journey starts', () => {
  const app = runtime();
  app.run("S.user = { name: 'Lan' }; previewPlace('hoian');");
  assert.equal(app.run('S.place'), 'other');
  assert.ok(!app.storage.has('lt:place'));
  app.run('startJourney()');
  assert.equal(app.run('S.place'), 'hoian');
  assert.equal(app.storage.get('lt:place'), '"hoian"');
  assert.equal(app.run('S.user.themeId'), 'hoian');
  assert.equal(app.run('location.hash'), '#home');
});

test('saved state retains the existing browser storage keys', () => {
  const app = runtime(undefined, { lang: 'en', place: 'hue', xp: 125 });
  assert.equal(app.run('S.lang'), 'en');
  assert.equal(app.run('S.place'), 'hue');
  app.run('S.xp += 25; save()');
  assert.equal(app.storage.get('lt:xp'), '150');
  assert.ok(![...app.storage.keys()].some(k => /gps|photo/.test(k)));
});

test('practice recommendations preserve the learning loop', () => {
  const app = runtime();
  app.run("practiseThis('pron')");
  assert.equal(app.run('location.hash'), '#tutor');
  app.run("practiseThis('vocab')");
  assert.match(app.run('location.hash'), /^#scenario\//);
  app.run("practiseThis('fluency')");
  assert.match(app.run('location.hash'), /^#talk\//);
});

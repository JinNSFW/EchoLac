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

test('the Netlify build publishes app files and security headers, never docs or tooling', () => {
  const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), { execFileSync } = require('node:child_process');
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'echolac-dist-'));
  try {
    execFileSync(process.execPath, [path.join(__dirname, '..', 'scripts', 'build-site.cjs'), out]);
    for (const f of ['index.html', 'styles.css', 'app.js', 'model/model.json', 'model/weights.bin', 'assets/data/locations.js']) assert.ok(fs.existsSync(path.join(out, f)), f);
    for (const f of ['EchoLac_PRD.md', 'AGENTS.md', 'README.md', 'netlify.toml', 'package.json', 'tests', 'scripts', '.env.example', 'outputs']) assert.ok(!fs.existsSync(path.join(out, f)), f + ' must stay private');
    const headers = fs.readFileSync(path.join(out, '_headers'), 'utf8');
    assert.match(headers, /Content-Security-Policy: default-src 'self'/);
    assert.match(headers, /Permissions-Policy: camera=\(self\)/);
  } finally { fs.rmSync(out, { recursive: true, force: true }); }
});

test('curriculum lessons are complete, sourced, unverified and render', () => {
  const app = runtime();
  const lessons = JSON.parse(app.run('JSON.stringify(SCEN.filter(s => s.lesson))'));
  assert.deepEqual(lessons.map(s => s.lesson).sort(), ['A1-02', 'A1-03', 'A1-04', 'A2-03', 'A2-06', 'B1-01', 'B1-02', 'B1-05', 'B2-01', 'B2-02', 'B2-04', 'B2-06', 'C1-01', 'C1-03', 'C1-04']);
  assert.equal(new Set(app.run('SCEN.map(s => s.id)')).size, app.run('SCEN.length'), 'unique ids');
  for (const s of lessons) {
    assert.ok(['A1', 'A2', 'B1', 'B2', 'C1'].includes(s.level), s.id);
    assert.ok(s.cando.vi && s.cando.en && s.facts.vi && s.facts.en && s.sources.length, s.id + ' fields');
    assert.equal(s.verified, false, s.id);
    assert.ok(s.vocab.length >= 8 && s.vocab.length <= 12, s.id + ' has ' + s.vocab.length + ' words');
    for (const v of s.vocab) assert.ok(v.length === 4 && v.every(Boolean) && /^\/.+\/$/.test(v[1]), s.id + ' ' + v[0]);
    assert.ok(app.run(`!!WORDS[${JSON.stringify(s.pron.word)}] && !!ERR_CAT[${JSON.stringify(s.pron.cat)}]`), s.id + ' pron');
    assert.ok(s.talk.some(t => t.me && t.me.toLowerCase().split(/[^a-z’'-]+/).includes(s.pron.word)), s.id + ' talk uses ' + s.pron.word);
    for (const lang of ['vi', 'en']) {
      const html = app.run(`S.lang = '${lang}'; VIEWS.scenario.render('${s.id}')`);
      assert.ok(!html.includes('undefined') && html.includes(s.lesson ? s.vocab[0][0] : ''), s.id + ' ' + lang);
    }
  }
});

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
  assert.match(output['vi/home'], /Chuỗi học/);
  assert.match(output['en/home'], /Continue lesson/);
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
    for (const f of ['index.html', 'styles.css', 'app.js', 'model/model.json', 'model/metadata.json', 'model/group1-shard1of2.bin', 'model/group1-shard2of2.bin', 'assets/data/locations.js']) assert.ok(fs.existsSync(path.join(out, f)), f);
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

test('every camera model label maps to a place, and every mapped class to a real lesson', () => {
  const app = runtime(), fs = require('node:fs'), path = require('node:path');
  const labels = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'model', 'metadata.json'), 'utf8')).labels;
  for (const l of labels) assert.ok(app.run(`!!labelLoc(${JSON.stringify(l)})`), `label "${l}" has no location record`);
  const map = JSON.parse(app.run('JSON.stringify(CAM.map)'));
  for (const [name, id] of Object.entries(map)) {
    assert.ok(labels.some(l => l.normalize('NFC').toLowerCase() === name.normalize('NFC').toLowerCase()), `CAM.map class "${name}" is not a model label`);
    assert.ok(app.run(`!!scen(${JSON.stringify(id)})`), `CAM.map → missing lesson ${id}`);
  }
  // Every class opens its own lesson (no two classes share one), and each label maps to a distinct place
  assert.deepEqual(labels.map(l => Object.keys(map).find(k => k.normalize('NFC').toLowerCase() === l.normalize('NFC').toLowerCase())).filter(Boolean).length, labels.length, 'every model label is in CAM.map');
  assert.equal(new Set(Object.values(map)).size, Object.keys(map).length, 'one lesson per class');
  assert.equal(new Set(labels.map(l => app.run(`labelLoc(${JSON.stringify(l)}).id`))).size, labels.length, 'one place per class');
});

test('camera landmark lessons are complete, sourced, unverified and render in both languages', () => {
  const app = runtime();
  for (const id of ['han-bridge', 'apec', 'lady-buddha', 'dragon-carp']) {
    const s = JSON.parse(app.run(`JSON.stringify(scen(${JSON.stringify(id)}))`));
    assert.ok(s.cando.vi && s.cando.en && s.facts.vi && s.facts.en && s.sources.length && s.verified === false, id + ' fields');
    assert.ok(s.vocab.length >= 8 && s.vocab.length <= 12 && s.vocab.every(v => /^\/.+\/$/.test(v[1])), id + ' vocab');
    assert.ok(s.talk.some(t => t.me && t.me.toLowerCase().split(/[^a-z’'-]+/).includes(s.pron.word)), id + ' talk uses ' + s.pron.word);
    for (const lang of ['vi', 'en']) assert.ok(!app.run(`S.lang = '${lang}'; VIEWS.scenario.render('${id}')`).includes('undefined'), id + ' ' + lang);
  }
});

test('landmark line art exists for every camera landmark and is used for place cards', () => {
  const app = runtime(), fs = require('node:fs'), path = require('node:path');
  const ids = JSON.parse(app.run('JSON.stringify(LANDMARK_ART)'));
  assert.equal(ids.length, 5);
  for (const id of ids) {
    assert.ok(fs.existsSync(path.join(__dirname, '..', 'assets', 'landmarks', id + '.png')), id + '.png');
    assert.ok(app.run(`!!loc(${JSON.stringify(id)})`), id + ' is a location');
  }
  const cards = app.run("S.lang = 'vi'; placeCards('danang', 'pickPlace')");
  assert.match(cards, /5 địa danh/);
  assert.ok(!cards.includes('undefined'));
});

test('every declared place scene has its image, and no scene image is left unused', () => {
  const app = runtime(), fs = require('node:fs'), path = require('node:path');
  const themes = JSON.parse(app.run('JSON.stringify(Object.fromEntries(Object.entries(THEMES).map(([id, t]) => [id, (t.scenes || []).map(s => s[0])])))'));
  const declared = new Set();
  for (const [id, files] of Object.entries(themes)) for (const f of files) {
    const p = path.join('assets', 'scenes', id, f + '.webp'); declared.add(p);
    assert.ok(fs.existsSync(path.join(__dirname, '..', p)), p);
  }
  const root = path.join(__dirname, '..', 'assets', 'scenes');
  const onDisk = fs.readdirSync(root).flatMap(d => fs.readdirSync(path.join(root, d)).map(f => path.join('assets', 'scenes', d, f)));
  assert.deepEqual(onDisk.filter(p => !declared.has(p)), [], 'unused scene files');
});

test('every owner-drawn icon name has its PNG and renders as a mask, not an empty svg', () => {
  const app = runtime(), fs = require('node:fs'), path = require('node:path');
  for (const [set, list] of [['ui', 'UI_ART'], ['lesson', 'LESSON_ART'], ['place', 'PLACE_ART']]) {
    for (const n of JSON.parse(app.run(`JSON.stringify(${list})`))) assert.ok(fs.existsSync(path.join(__dirname, '..', 'assets', 'icons', set, n + '.png')), `${set}/${n}.png`);
  }
  assert.match(app.run("icon('home')"), /data-mk="ui-home"/);
  assert.match(app.run("icon('eye')"), /<svg/);
  assert.match(app.run("img('fire')"), /data-art="fire"/);
  assert.match(app.run("placeArt('hue')"), /place-hue/);
});

test('every camera landmark shows a real reference photo, not the sample illustration', () => {
  const app = runtime(), fs = require('node:fs'), path = require('node:path');
  for (const id of JSON.parse(app.run('JSON.stringify(LANDMARK_ART)'))) {
    const url = app.run(`refUrl(loc(${JSON.stringify(id)}))`);
    assert.match(url, /^assets\/reference\/.+\.webp$/, id);
    assert.ok(fs.existsSync(path.join(__dirname, '..', url)), url);
  }
});

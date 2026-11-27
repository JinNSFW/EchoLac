const { test } = require('node:test');
const assert = require('node:assert/strict');
const { runtime, templates } = require('./helpers/runtime.cjs');

test('all screens render in Vietnamese and English in script loading order', () => {
  const output = templates(runtime());
  assert.equal(Object.keys(output).length, 48); // 24 views x 2 languages (the school view was removed with schools, 0008)
  for (const [name, html] of Object.entries(output)) {
    assert.ok(html.length > 100, name);
    assert.ok(!html.includes('undefined'), name + ' contains undefined');
  }
  assert.match(output['vi/home'], /Chuỗi học/);
  assert.doesNotMatch(output['en/home'], /Continue lesson|Today’s mission/);
  assert.match(output['en/roleplay'], /class="resume-pin/);
  assert.match(output['en/tutor'], /Tutor/);
  assert.notEqual(output['vi/profile'], output['en/profile']);
});

test('Connect screens follow the server role and never name minors to tourists', () => {
  const app = runtime();
  app.run("S.user = { name: 'Lan' }; S.lang = 'en'; S.connect = { ...connectBlank('ready'), me: { id: 'u1', role: 'student' } };");
  assert.equal(app.run("roleView('tutor')"), 'tutor');
  assert.equal(app.run("roleView('discover')"), 'connect');
  app.run(`S.connect = { ...connectBlank('ready'), me: { id: 'u1', role: 'tourist', verification_status: 'unverified' },
    locations: [{ id: 'hoi-an-ancient-town', name_vi: 'Phố cổ Hội An', name_en: 'Hoi An Ancient Town' }] };`);
  assert.equal(app.run("roleView('tutor')"), 'discover');
  assert.equal(app.run("roleView('home')"), 'discover');
  assert.doesNotMatch(app.run('VIEWS.profile.render()'), /Lv\.|Total XP|Achievements|Simulation|>Demo/);
  const spot = app.run("VIEWS.spot.render('hoi-an-ancient-town')");
  assert.match(spot, /Not open yet/);
  assert.doesNotMatch(spot, /Send request|Simulation/);
  assert.match(app.run("VIEWS.spot.render('nowhere')"), /not on the approved list/);
});

test('existing contrast, camera matching and language diagnostics pass', () => {
  assert.equal(runtime().run('selfTest().length'), 0);
});

test('onboarding previews do not persist until the journey starts', () => {
  const app = runtime();
  app.run("S.user.name = 'Lan'; previewPlace('hoian');");
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
  assert.equal(app.run("store.get('xp')"), 150);
  assert.ok(![...app.storage.keys()].some(k => /gps|photo/.test(k)));
});

test('legacy progress keeps earned XP and actual errors while dropping demo defaults', () => {
  const app = runtime(undefined, {
    xp: 1270, sessions: 12, minutes: 96, done: ['dragon'],
    scores: { fluency: 62, vocab: 71, grammar: 58, pron: 49 },
    errors: [
      { id: 'w-nice', attempts: [41, 52] },
      { id: 'pron-U01-w01', word: 'cap', attempts: [50] },
    ],
  });
  assert.equal(app.run('S.xp'), 30);
  assert.equal(app.run('streakNow()'), 0);
  assert.equal(app.run('S.done.length'), 0);
  assert.equal(app.run('S.errors.map(e => e.word).join()'), 'cap');
  assert.equal(app.run('avgScore()'), null);
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
    for (const f of ['index.html', 'styles.css', 'app.js', 'da-nang-question-bank.json', 'model/model.json', 'model/metadata.json', 'model/group1-shard1of2.bin', 'model/group1-shard2of2.bin', 'assets/data/locations.js']) assert.ok(fs.existsSync(path.join(out, f)), f);
    for (const f of ['EchoLac_PRD.md', 'AGENTS.md', 'README.md', 'netlify.toml', 'package.json', 'tests', 'scripts', '.env.example', 'outputs']) assert.ok(!fs.existsSync(path.join(out, f)), f + ' must stay private');
    const headers = fs.readFileSync(path.join(out, '_headers'), 'utf8');
    assert.match(headers, /Content-Security-Policy: default-src 'self'/);
    assert.match(headers, /Permissions-Policy: camera=\(self\)/);
  } finally { fs.rmSync(out, { recursive: true, force: true }); }
});

test('Da Nang bank validates and grades all six question types while holding back flagged questions', () => {
  const app = runtime();
  app.run(`const rawBank = ${JSON.stringify(require('../da-nang-question-bank.json'))};
    const bank = readDanangBank(rawBank);
    const allQuestions = rawBank.nodes.flatMap(n => n.questions);
    const playableQuestions = [...bank.nodes.values()].flatMap(n => n.questions);`);
  assert.equal(app.run('allQuestions.filter(q => !validDanangQuestion(q)).length'), 0);
  assert.equal(app.run('new Set(allQuestions.map(q => q.id)).size'), 120);
  assert.equal(app.run('playableQuestions.length'), 118);
  assert.equal(app.run('new Set(playableQuestions.map(q => q.type)).size'), 6);
  assert.equal(app.run('playableQuestions.every(q => !q.needsVerification)'), true);
  assert.equal(app.run(`playableQuestions.every(q => {
    const answer = danangSolution(q);
    const response = q.type === 'fill_blank' ? ['  ' + answer[0].toUpperCase() + '  '] : answer;
    return validDanangResponse(q, response) && gradeDanangResponse(q, response);
  })`), true);
  assert.equal(app.run(`(() => {
    const q = playableQuestions.find(q => q.type === 'ordering');
    const answer = danangSolution(q);
    return !validDanangResponse(q, answer.map(() => answer[0])) && !gradeDanangResponse(q, [...answer].reverse());
  })()`), true);
});

test('Da Nang progress restores drafts and submitted responses without grading twice', () => {
  const bankData = JSON.stringify(require('../da-nang-question-bank.json'));
  const prepare = `const bank = readDanangBank(${bankData}), node = bank.nodes.get('A1-01');`;
  const app = runtime();
  app.run(prepare + `const run = danangRun(node); run.draft = ['0'];
    saveDanangProgress({version: bank.version, active: node.id, runs: {[node.id]: run}});`);
  const reopen = previous => runtime(undefined, {}, previous.storage);
  const draft = reopen(app);
  draft.run(prepare + `const progress = restoreDanangProgress(bank), run = progress.runs[progress.active];`);
  assert.equal(draft.run('run.draft[0]'), '0');
  assert.equal(draft.run('submitDanangResponse(node, run, run.draft)'), true);
  draft.run('saveDanangProgress(progress)');
  const reviewed = reopen(draft);
  reviewed.run(prepare + 'const run = restoreDanangProgress(bank).runs[node.id];');
  assert.equal(reviewed.run('run.index'), 0);
  assert.equal(reviewed.run('gradeDanangResponse(node.questions[0], run.answers[0])'), true);
  assert.equal(reviewed.run("submitDanangResponse(node, run, ['1'])"), false);
  assert.equal(reviewed.run('run.answers.length'), 1);
  assert.equal(reviewed.run("Object.keys(restoreDanangProgress({...bank, version: 'next'}).runs).length"), 0);
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
test('scripted roleplay shows examples without recording scores or errors', () => {
  const app = runtime();
  const result = JSON.parse(app.run(`(() => {
    S.lang = 'en';
    const before = JSON.stringify([S.scores, S.errors]);
    let example = '';
    addMsg = (_, html) => { example = html; };
    confetti = () => {};
    openSheet = () => {};
    const sessions = S.sessions;
    startTalk('hoian', true);
    T.steps = [{ me: 'Old example', gram: { fix: 'Correct example' }, pron: [['example', 42]] }];
    T.meTotal = 1;
    nextStep();
    completeScriptedTurn();
    completeScriptedTurn();
    finishTalk();
    finishTalk();
    return JSON.stringify([example, T.meDone, S.sessions - sessions, before === JSON.stringify([S.scores, S.errors])]);
  })()`));
  assert.match(result[0], /Model answer.*Correct example/);
  assert.doesNotMatch(result[0], /Old example|42/);
  assert.deepEqual(result.slice(1), [1, 1, true]);
});

test('tourist screens are always English, learners keep their language', () => {
  const app = runtime();
  app.run("S.lang = 'vi'; S.connect.me = { role: 'tourist' }");
  assert.equal(app.run("V('Khám phá', 'Discover')"), 'Discover');
  assert.equal(app.run("L({ vi: 'Cầu Rồng', en: 'Dragon Bridge' })"), 'Dragon Bridge');
  app.run("S.connect.me = { role: 'student' }");
  assert.equal(app.run("V('Khám phá', 'Discover')"), 'Khám phá');
});

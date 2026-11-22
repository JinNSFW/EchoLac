const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { runtime } = require('./helpers/runtime.cjs');

const root = path.join(__dirname, '..');
const dir = path.join(root, 'content', 'pronunciation');
const readText = f => fs.readFileSync(f, 'utf8');
const json = f => JSON.parse(readText(path.join(dir, f)));
const index = json('index.json');
const categories = json('categories.json');
const tokens = json('tokens.json');
const credits = json('credits.json');
const app = runtime();
const ERR_CAT = JSON.parse(app.run('JSON.stringify(ERR_CAT)'));
const SCEN = JSON.parse(app.run('JSON.stringify(SCEN)'));
const scenIds = new Set(SCEN.map(s => s.id));
const catIds = Object.keys(ERR_CAT).filter(k => k !== 'grammar').sort();

// Units that exist on disk; missing files are reported by the index test.
const units = index.units.filter(e => fs.existsSync(path.join(dir, e.file)))
  .map(e => ({ e, u: json(e.file) }));
const english = new Set(tokens.english);
const loose = new Set([...tokens.english, ...tokens.variant]);
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];
const CAP = { 'A1-A2': 'A2', B1: 'B1', 'B2-C1': 'B2' };
const BAND = { A1: 'A1-A2', A2: 'A1-A2', B1: 'B1', B2: 'B2-C1', C1: 'B2-C1' };
const MAXW = { 'A1-A2': 10, B1: 15, 'B2-C1': 22 };
const rank = c => LEVELS.indexOf(c);
const within = (n, [lo, hi]) => n >= lo && n <= hi;
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function walk(o, fn) {
  if (Array.isArray(o)) o.forEach(x => walk(x, fn));
  else if (o && typeof o === 'object') { fn(o); Object.values(o).forEach(x => walk(x, fn)); }
}
const each = fn => units.forEach(({ u }) => fn(u));

test('index lists U01..U20 in order with matching, level-ordered units', () => {
  assert.deepEqual(index.units.map(e => e.id), Array.from({ length: 20 }, (_, i) => 'U' + String(i + 1).padStart(2, '0')));
  let prev = 0;
  for (const { e, u } of units) {
    for (const k of ['id', 'level', 'band', 'category']) assert.equal(u[k], e[k], e.id + ' ' + k);
    assert.equal(e.band, BAND[e.level], e.id + ' band from level');
    assert.ok(rank(e.level) >= prev, e.id + ' level order');
    prev = rank(e.level);
  }
  assert.equal(units.length, index.units.length, 'every index file exists');
});

test('taxonomy enum matches ERR_CAT, PRD section 6 and unit categories', () => {
  assert.equal(catIds.length, 14);
  assert.deepEqual(Object.keys(categories).sort(), catIds);
  const prd = readText(path.join(root, 'EchoLac_PRD.md'));
  const sec = prd.slice(prd.indexOf('# **6\\.'), prd.indexOf('# **7\\.'));
  const ids = [...sec.matchAll(/^\| `([a-z_]+)`/gm)].map(m => m[1]).sort();
  assert.deepEqual(ids, catIds, 'PRD section 6 ids');
  for (const [id, c] of Object.entries(categories)) {
    assert.ok(['endings', 'clusters', 'consonants', 'vowels', 'stress', 'flow'].includes(c.group), id + ' group');
    assert.ok(['P1', 'P2', 'P3'].includes(c.priority), id + ' priority');
    assert.ok(['high', 'medium', 'low'].includes(c.confidence), id + ' confidence');
  }
  for (const s of SCEN) if (s.pron) assert.ok(ERR_CAT[s.pron.cat], s.id + ' pron.cat ' + s.pron.cat);
  const used = new Set(units.map(({ u }) => u.category));
  for (const c of catIds) assert.ok(used.has(c), c + ' has no unit');
  each(u => walk(u, o => {
    for (const x of o.targets || []) assert.ok(categories[x.category], u.id + ' target ' + x.category);
    for (const x of o.expectedErrors || []) assert.ok(categories[x.category], u.id + ' expectedErrors ' + x.category);
    if (o.type && o.a && o.b) assert.ok(categories[o.category], o.id + ' pair category');
  }));
});

test('every text is bilingual and ERR_CAT labels are filled', () => {
  for (const [id, c] of Object.entries(ERR_CAT)) assert.ok(c.vi && c.en, 'ERR_CAT ' + id);
  each(u => walk(u, o => {
    if (!('vi' in o) && !('en' in o)) return;
    for (const l of ['vi', 'en']) assert.ok(typeof o[l] === 'string' && o[l].trim(), u.id + ' missing ' + l + ' near ' + JSON.stringify(o).slice(0, 60));
  }));
});

test('prerequisites point only to earlier units', () => {
  const seen = new Set();
  for (const { e, u } of units) {
    assert.ok(Array.isArray(u.prereq), e.id + ' prereq array');
    for (const p of u.prereq) assert.ok(seen.has(p), e.id + ' prereq ' + p + ' not earlier');
    seen.add(e.id);
  }
});

test('content counts follow the per-kind table', () => {
  each(u => {
    const id = u.id, n = a => a.length;
    assert.ok(within(n(u.why), [2, 3]), id + ' why');
    assert.ok(within(n(u.howTo), [3, 5]), id + ' howTo');
    assert.ok(within(n(u.contrasts), [2, 4]), id + ' contrasts');
    assert.ok(u.selfCheck && u.selfCheck.vi && u.selfCheck.en, id + ' selfCheck');
    if (u.kind === 'segmental') {
      assert.ok(within(n(u.words), [8, 12]), id + ' words ' + n(u.words));
      assert.ok(within(n(u.pairs), [4, 6]), id + ' pairs ' + n(u.pairs));
      assert.ok(within(n(u.sentences), [3, 5]), id + ' sentences ' + n(u.sentences));
    } else if (u.kind === 'stress') {
      assert.ok(within(n(u.words), [8, 12]), id + ' words ' + n(u.words));
      assert.ok(within(n(u.pairs), [0, 6]), id + ' pairs');
      assert.ok(within(n(u.sentences), [3, 5]), id + ' sentences ' + n(u.sentences));
    } else {
      assert.equal(u.kind, 'prosody', id + ' kind');
      assert.equal(n(u.words), 0, id + ' prosody words');
      assert.ok(within(n(u.sentences), [8, 12]), id + ' sentences ' + n(u.sentences));
      const range = { intonation: [4, 6], weak_form: [2, 4], rhythm: [0, 0], linking: id === 'U20' ? [0, 4] : [4, 6] }[u.category];
      assert.ok(range && within(n(u.pairs), range), id + ' pairs ' + n(u.pairs));
    }
    if (u.category === 'cluster' || u.kind === 'prosody') assert.ok(n(u.chain) > 0, id + ' chain required');
  });
});

test('IPA tokens are inside the allowed token sets', () => {
  assert.ok(tokens.vowels.every(t => english.has(t)), 'vowels subset of english');
  for (const [k, v] of Object.entries(tokens.normalize)) assert.ok(v.every(t => english.has(t)), 'normalize ' + k);
  for (const pair of tokens.equivalent) assert.ok(pair.every(t => loose.has(t)), 'equivalent ' + pair);
  const chk = (id, arr, set, what) => { for (const t of arr || []) assert.ok(set.has(t), id + ' ' + what + ' token ' + t); };
  each(u => {
    for (const w of u.words) {
      chk(w.id, w.ipa, english, 'ipa');
      (w.ipaAlt || []).forEach(a => chk(w.id, a, english, 'ipaAlt'));
      (w.expectedErrors || []).forEach(x => chk(w.id, x.variantIpa, loose, 'variantIpa'));
    }
    for (const p of u.pairs) { chk(p.id, p.a.ipa, english, 'a'); chk(p.id, p.b.ipa, english, 'b'); }
    for (const s of u.sentences) for (const w of s.words) chk(s.id, w.ipa, english, 'word ' + w.w);
    for (const c of u.contrasts) {
      if (c.wrongText !== undefined) {
        // Text contrasts (stress, tunes, links) cannot be written as IPA; allowed only outside segmental units.
        assert.notEqual(u.kind, 'segmental', c.id + ' text contrast in a segmental unit');
        assert.ok(c.wrongText.trim() && c.rightText.trim() && c.wrongText !== c.rightText, c.id + ' text contrast');
        continue;
      }
      chk(c.id, c.wrongIpa, loose, 'wrongIpa'); chk(c.id, c.rightIpa, english, 'rightIpa');
      assert.ok(c.wrongIpa.length && c.rightIpa.length, c.id + ' contrast needs wrongIpa and rightIpa');
    }
    for (const s of u.sentences) for (const t of s.targets) {
      if (t.category === 'weak_form') assert.ok((t.expectedErrors || []).length, s.id + ' weak_form target needs the strong form');
      for (const x of t.expectedErrors || []) chk(s.id, x.variantIpa, loose, 'variantIpa');
    }
    u.chain.forEach((c, i) => (c.steps || []).forEach(s => chk(u.id + ' chain' + i, s, loose, 'step')));
  });
});

test('targets, expected errors and alternatives are consistent', () => {
  each(u => {
    const tgt = [];
    const check = (it, ipaOf) => {
      if (u.kind !== 'prosody') assert.ok((it.targets || []).length >= 1, it.id + ' needs a target');
      for (const t of it.targets || []) {
        tgt.push(t.category);
        const ipa = ipaOf(t);
        assert.ok(ipa, it.id + ' target word has no ipa');
        for (const i of t.index) assert.ok(Number.isInteger(i) && i >= 0 && i < ipa.length, it.id + ' index ' + i);
      }
      for (const x of it.expectedErrors || []) assert.ok(!eq(x.variantIpa, it.ipa), it.id + ' variantIpa equals ipa');
      for (const a of it.ipaAlt || []) if (!it.allowElision) assert.equal(a.length, it.ipa.length, it.id + ' ipaAlt length');
      if (it.allowElision) {
        const ok = u.category === 'linking' || (it.ipaAlt || []).every(a => (it.targets || []).every(t => t.index.every(i => i < a.length)));
        assert.ok(ok, it.id + ' allowElision outside linking deletes a target');
      }
    };
    for (const w of u.words) check(w, () => w.ipa);
    for (const s of u.sentences) check(s, t => (s.words[t.word] || {}).ipa);
    if (u.kind !== 'prosody' && tgt.length) {
      const share = tgt.filter(c => c === u.category).length / tgt.length;
      assert.ok(share >= 0.7, u.id + ' only ' + Math.round(share * 100) + '% targets in ' + u.category);
    }
  });
});

test('stress data is valid', () => {
  each(u => {
    for (const w of u.words) {
      assert.equal(w.syllables, w.ipa.filter(t => tokens.vowels.includes(t)).length, w.id + ' syllables');
      if (u.kind === 'stress') assert.ok(Number.isInteger(w.stress) && w.stress >= 1 && w.stress <= w.syllables, w.id + ' stress');
    }
    if (u.id === 'U14') for (const s of u.sentences.filter(x => x.prosody && x.prosody.stressWord !== undefined)) {
      assert.ok(Number.isInteger(s.prosody.stressWord) && s.words[s.prosody.stressWord], s.id + ' stressWord');
    }
  });
});

test('minimal pairs satisfy their type and perception references exist', () => {
  const PT = ['2afc', 'stress-tap', '2afc-tune', 'dictation', '2afc-juncture', 'beats'];
  const sub = (a, b) => (a.length === b.length ? a.map((t, i) => (t !== b[i] ? i : -1)).filter(i => i >= 0) : null);
  each(u => {
    const pr = u.perception;
    assert.ok(PT.includes(pr.type), u.id + ' perception.type ' + pr.type);
    const ids = { pairIds: u.pairs, wordIds: u.words, sentenceIds: u.sentences };
    for (const [k, list] of Object.entries(ids)) for (const id of pr[k] || []) assert.ok(list.some(x => x.id === id), u.id + ' perception ' + k + ' ' + id);
    for (const p of u.pairs) {
      const { a, b } = p, d = p.diffIndex;
      if (p.type === 'substitution') {
        const diff = sub(a.ipa, b.ipa);
        assert.ok(diff && diff.length === 1 && diff[0] === d, p.id + ' substitution must differ at exactly diffIndex');
        assert.deepEqual(p.contrast, [a.ipa[d], b.ipa[d]], p.id + ' contrast');
      } else if (p.type === 'deletion' || p.type === 'insertion') {
        assert.ok(eq(b.ipa.filter((_, i) => i !== d), a.ipa), p.id + ' ' + p.type + ': removing b[diffIndex] must give a');
        assert.deepEqual(p.contrast, ['∅', b.ipa[d]], p.id + ' contrast');
      } else if (p.type === 'stress') {
        const f = x => JSON.stringify([x.stress, x.stressWord, x.prosody && x.prosody.stressWord]);
        assert.notEqual(f(a), f(b), p.id + ' stress values must differ');
      } else if (p.type === 'tune' || p.type === 'nucleus') {
        const key = p.type === 'tune' ? 'final' : 'nucleus';
        const v = x => (x.prosody ? x.prosody[key] : x[key]);
        assert.equal(a.text, b.text, p.id + ' same text');
        assert.notEqual(JSON.stringify(v(a)), JSON.stringify(v(b)), p.id + ' ' + key + ' must differ');
      } else if (p.type === 'juncture') {
        assert.notEqual(a.text, b.text, p.id + ' texts');
        assert.deepEqual(a.ipa.flat(), b.ipa.flat(), p.id + ' juncture ipa must be identical');
      } else if (p.type === 'stress_phrase') {
        assert.equal(u.kind, 'stress', p.id + ' stress_phrase only in stress units');
        assert.notEqual(a.text.split(' ').length, b.text.split(' ').length, p.id + ' one compound, one phrase');
        assert.deepEqual(a.ipa, b.ipa, p.id + ' compound and phrase must share the same sounds');
        assert.notEqual(JSON.stringify([a.stressWord, a.stressSyllable]), JSON.stringify([b.stressWord, b.stressSyllable]), p.id + ' stress must differ');
      } else {
        assert.equal(p.type, 'weak', p.id + ' unknown pair type ' + p.type);
        assert.notEqual(a.text, b.text, p.id + ' weak pair texts');
      }
    }
  });
});

test('CEFR labels respect the band cap', () => {
  each(u => {
    const cap = rank(CAP[u.band]);
    let nulls = 0;
    for (const w of u.words) {
      assert.ok(w.cefr === null || LEVELS.slice(0, 4).includes(w.cefr), w.id + ' cefr ' + w.cefr);
      if (w.cefr === null) {
        assert.ok(u.band === 'B2-C1' || scenIds.has(w.scenarioVocab), w.id + ' null cefr outside B2-C1 needs scenarioVocab');
        if (u.band !== 'B2-C1') nulls++;
      } else assert.ok(rank(w.cefr) <= cap, w.id + ' cefr ' + w.cefr + ' above ' + CAP[u.band]);
    }
    assert.ok(nulls <= 2, u.id + ' has ' + nulls + ' null-CEFR words');
    for (const s of u.sentences) if (s.cefr !== null) assert.ok(rank(s.cefr) <= cap, s.id + ' cefr above cap');
    for (const p of u.pairs) assert.ok([p.a, p.b].some(x => x.cefr !== null && rank(x.cefr) <= cap), p.id + ' neither side within cap');
  });
});

test('sentences are original, well formed and fact free', () => {
  const INT = ['fall', 'rise', 'fall-rise'];
  const TYPES = ['statement', 'wh', 'yesno', 'choice', 'list', 'tag', 'echo'];
  each(u => {
    for (const s of u.sentences) {
      assert.ok(s.source, s.id + ' source');
      assert.equal(s.source.type, 'original', s.id + ' source.type');
      assert.equal(s.source.author, 'EchoLạc', s.id + ' author');
      const plain = s.text.replace(/[.,?!;:"“”]/g, '').trim().split(/\s+/);
      assert.deepEqual(s.words.map(w => w.w), plain, s.id + ' words vs text');
      for (const w of s.words) if (w.ipa === null) assert.ok(/^[A-Z]/.test(w.w) || /[^\x00-\x7f]/.test(w.w), s.id + ' unscored word ' + w.w);
      assert.ok(plain.length <= MAXW[u.band], s.id + ' has ' + plain.length + ' words');
      assert.ok(!/\d/.test(s.text), s.id + ' contains digits');
      const p = s.prosody;
      if (p && p.final !== undefined) assert.ok(INT.includes(p.final), s.id + ' final');
      if (p && p.type !== undefined) assert.ok(TYPES.includes(p.type), s.id + ' type');
      if (p && p.nucleus != null) assert.ok(Number.isInteger(p.nucleus) && p.nucleus < s.words.length, s.id + ' nucleus');
    }
  });
});

test('ids are unique and well formed', () => {
  const seen = new Set();
  each(u => walk(u, o => {
    if (typeof o.id !== 'string' || o === u) return;
    assert.match(o.id, /^U\d{2}-(w|p|s|c)\d{2}$/, o.id);
    assert.ok(!seen.has(o.id), 'duplicate id ' + o.id);
    seen.add(o.id);
  }));
});

test('review state is consistent', () => {
  each(u => {
    if (u.verified === true) {
      assert.ok(typeof u.reviewedBy === 'string' && u.reviewedBy.trim(), u.id + ' reviewedBy');
      assert.match(String(u.reviewedAt), /^\d{4}-\d{2}-\d{2}$/, u.id + ' reviewedAt');
      assert.ok(!Number.isNaN(Date.parse(u.reviewedAt)), u.id + ' reviewedAt is a date');
    } else {
      assert.equal(u.verified, false, u.id);
      assert.equal(u.reviewedBy, null, u.id);
    }
  });
});

test('credits name CMUdict and CEFR-J', () => {
  const by = id => credits.data.find(d => d.id === id);
  assert.equal((by('cmudict') || {}).license, 'BSD-2-Clause');
  assert.ok(by('cefrj'), 'cefrj credit');
});

test('JSON files are canonical two-space UTF-8 without BOM', () => {
  const files = ['index.json', 'categories.json', 'tokens.json', 'credits.json', ...index.units.map(e => e.file)];
  for (const f of files) {
    const p = path.join(dir, f);
    if (!fs.existsSync(p)) continue;
    const t = readText(p);
    assert.ok(t.charCodeAt(0) !== 0xfeff, f + ' has BOM');
    assert.equal(t, JSON.stringify(JSON.parse(t), null, 2) + '\n', f + ' format');
  }
});

test('lesson plan document is complete', () => {
  const doc = readText(path.join(root, 'docs', 'giao-an-phat-am.md'));
  for (let i = 1; i <= 20; i++) assert.ok(doc.includes('### U' + String(i).padStart(2, '0')), 'doc missing unit U' + i);
  for (const s of ['Tài liệu tham khảo', 'Trạng thái: ', 'duyệt']) assert.ok(doc.includes(s), 'doc missing ' + s);
  for (const c of catIds) assert.ok(doc.includes('`' + c + '`'), 'doc missing category ' + c);
});

test('package test script runs this file', () => {
  const pkg = JSON.parse(readText(path.join(root, 'package.json')));
  assert.ok(pkg.scripts.test.includes('tests/pronunciation-content.test.cjs'));
});

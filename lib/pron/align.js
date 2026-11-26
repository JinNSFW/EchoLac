'use strict';
// Normalise phones with content/pronunciation/tokens.json, then weighted Levenshtein alignment (PRD §6, T-04).
// `tk` is the parsed tokens.json. Glottal stops are removed before scoring but kept as `glottal` for classification.
function pronNormalise(phones, tk, wordEnds) {
  const out = [], glottal = new Set(), finals = new Set();
  for (const [i, raw] of phones.entries()) {
    const stripped = raw.replace(/[ˈˌ.‿]/g, '');
    const p = tk.rules.stripGeminateLength && !tk.vowels.includes(stripped) ? stripped.replace(/^([^ː]+)ː$/, (s, base) => tk.english.includes(base) && !tk.vowels.includes(base) ? base : s) : stripped;
    if (p === 'ʔ') { glottal.add(out.length); continue; }
    if (p) {
      for (const q of Object.hasOwn(tk.normalize, p) ? tk.normalize[p] : [p]) {
        if (!tk.rules.stripGeminateLength || out.at(-1) !== q || pronIsVowel(q, tk)) out.push(q);
      }
    }
    if (wordEnds?.has(i) && out.length) finals.add(out.length - 1);
  }
  return { phones: out, glottal, finals };
}

const pronIsVowel = (p, tk) => tk.vowels.includes(p) || tk.variant.includes(p) && /[eoaɐɔɒᵻ]/.test(p);
const pronEquiv = (a, b, tk) => a === b || tk.equivalent.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

// ops: { op: 'match'|'sub'|'del'|'ins', i: index in expected (-1 for ins), j: index in heard, exp, got, cost }
function pronAlign(expected, heard, tk) {
  const n = expected.length, m = heard.length;
  const sub = (a, b) => pronEquiv(a, b, tk) ? 0 : pronIsVowel(a, tk) === pronIsVowel(b, tk) ? PRON_MIN_COST : 1;
  // postvocalic /ɹ/ is optional (tokens.json rules): deleting it after a vowel is free
  const del = i => tk.rules.postvocalicROptional && expected[i] === 'ɹ' && i > 0 && pronIsVowel(expected[i - 1], tk) ? 0 : 1;
  const d = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) d[i][0] = d[i - 1][0] + del(i - 1);
  for (let j = 1; j <= m; j++) d[0][j] = j;
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++)
    d[i][j] = Math.min(d[i - 1][j - 1] + sub(expected[i - 1], heard[j - 1]), d[i - 1][j] + del(i - 1), d[i][j - 1] + 1);
  const ops = [];
  for (let i = n, j = m; i > 0 || j > 0;) {
    const s = i && j ? sub(expected[i - 1], heard[j - 1]) : 0;
    if (i && j && d[i][j] === d[i - 1][j - 1] + s) { ops.push({ op: s ? 'sub' : 'match', i: i - 1, j: j - 1, exp: expected[i - 1], got: heard[j - 1], cost: s }); i--; j--; }
    else if (i && d[i][j] === d[i - 1][j] + del(i - 1)) { ops.push({ op: 'del', i: i - 1, j, exp: expected[i - 1], cost: del(i - 1) }); i--; }
    else { ops.push({ op: 'ins', i: i - 1, j: j - 1, got: heard[j - 1], cost: 1 }); j--; }
  }
  return ops.reverse();
}

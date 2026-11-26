'use strict';
// Error classification (PRD §6): expectedErrors of the item first, then the §6 table order. Pure; `tk` = tokens.json, `cats` = categories.json.
const PRON_VOICELESS = { b: 'p', d: 't', ɡ: 'k', v: 'f', z: 's', ʒ: 'ʃ', dʒ: 'tʃ' };
const PRON_SIBILANT = ['s', 'z', 'ʃ', 'ʒ', 'tʃ', 'dʒ'];
const PRON_LENGTH = [['iː', 'ɪ'], ['uː', 'ʊ']];

function pronCandidates(o, ctx) {
  const { tk, ex, finals, targets } = ctx, vow = p => pronIsVowel(p, tk), out = [];
  const consBefore = o.i > 0 && !vow(ex[o.i - 1]), consAfter = o.i + 1 < ex.length && !vow(ex[o.i + 1]);
  if (o.op === 'ins') {
    if (vow(o.got) && (o.i + 1 < ex.length && !vow(ex[o.i + 1]) || o.i >= 0 && !vow(ex[o.i]))) out.push('cluster');
    return out;
  }
  const fin = finals.has(o.i), isCons = !vow(o.exp);
  if (fin && isCons && (o.op === 'del' || o.got === 'ʔ')) out.push(targets.has('s_ed_ending') && 'szdt'.includes(o.exp[0]) ? 's_ed_ending' : 'final_consonant');
  if (fin && o.op === 'sub' && PRON_VOICELESS[o.exp] === o.got) out.push('final_voicing');
  if (isCons && o.op === 'del' && (consBefore || consAfter)) out.push('cluster');
  if (o.op === 'sub' && (o.exp === 'θ' || o.exp === 'ð')) out.push('th');
  if (o.op === 'sub' && PRON_SIBILANT.includes(o.exp) && PRON_SIBILANT.includes(o.got)) out.push('sibilant');
  if (o.op === 'sub' && isCons && !vow(o.got)) out.push('consonant_sub');
  if (o.op === 'sub' && PRON_LENGTH.some(([a, b]) => (a === o.exp && b === o.got) || (b === o.exp && a === o.got))) out.push('vowel_length');
  if (!isCons && (o.op === 'sub' || o.op === 'del')) out.push('vowel_quality');
  return out;
}

// item: { category, expectedErrors: [{category, variantIpa, note}], finals: Set of indices at word ends, targets: Set of categories }
function pronClassify(ops, item, tk, ex, heard, glottal) {
  const bad = ops.filter(o => o.op !== 'match' && o.cost > 0);
  if (!bad.length) return [];
  const first = bad[0], sameGlottal = v => v.size === glottal.size && [...v].every(k => glottal.has(k));
  for (const e of item.expectedErrors || []) {
    const v = pronNormalise(e.variantIpa, tk);
    if (v.phones.join(' ') === heard.join(' ') && sameGlottal(v.glottal)) return [{ cat: e.category, i: first.i, exp: first.exp, got: first.got, op: first.op, note: e.note }];
  }
  const ctx = { tk, ex, finals: item.finals || new Set([ex.length - 1]), targets: item.targets || new Set([item.category]) };
  return bad.map(o => {
    const c = pronCandidates(o, ctx), cat = c.includes(item.category) ? item.category : c[0] || null;
    return { cat, i: o.i, exp: o.exp, got: o.got, op: o.op };
  });
}

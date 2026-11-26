'use strict';
// Loads tokens/categories/units from content/pronunciation (served JSON) and turns practice items into scoring items.
let pronTk, pronCats, pronIdx;
const pronJson = async f => { const r = await fetch('content/pronunciation/' + f); if (!r.ok) throw new Error(f); return r.json(); };
async function pronContent() {
  pronTk ||= await pronJson('tokens.json'); pronCats ||= await pronJson('categories.json'); pronIdx ||= await pronJson('index.json');
  return { tk: pronTk, cats: pronCats, index: pronIdx };
}
// "/θɪŋk/" -> ['θ','ɪ','ŋ','k'] by longest match against the espeak inventory.
function pronParseIpa(str, tk) {
  const inv = [...tk.english, ...tk.variant, ...Object.keys(tk.normalize)].sort((a, b) => b.length - a.length);
  const s = str.replace(/[\/\[\]ˈˌ.\s]/g, '').replace(/g/g, 'ɡ'), out = [];
  for (let i = 0; i < s.length;) { const t = inv.find(x => s.startsWith(x, i)); if (!t) return null; out.push(t); i += t.length; }
  return out;
}
const pronItemFromError = (e, tk) => { const ipa = e?.ipa && pronParseIpa(e.ipa, tk); return ipa?.length ? { id: e.id, text: e.word, ipa, category: e.cat } : null; };
// A unit word/sentence -> item; sentences flatten their words and mark word ends.
function pronItemFromUnit(u, x) {
  if (x.words) { const ipa = [], finals = new Set(); x.words.forEach(w => { ipa.push(...w.ipa); finals.add(ipa.length - 1); }); return { id: x.id, text: x.text, ipa, finals, category: u.category }; }
  return { id: x.id, text: x.text, ipa: x.ipa, category: u.category, expectedErrors: x.expectedErrors, targets: new Set(x.targets?.map(t => t.category)) };
}

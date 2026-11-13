'use strict';
// Demo grammar rules and fact-sheet lookup, without an LLM.

// C. Practice. shortcut: scripted questions + rule-based feedback stand in for the LLM tutor; replace checkAnswer/factFor with a server call (fact sheet + learner level in the prompt) once one exists.
const FIXES = [
  [/\b(it|this|that|the (?:bridge|town|market|temple|place))\s+(?:have|has)\s+(.+?)\s+years\b(?!\s+old)/i, (m, s, n) => `${s} is ${n} years old`, { vi: 'Nói tuổi dùng "be … years old", không dùng "have".', en: 'Talk about age with "be … years old", not "have".' }],
  [/\b(it|he|she|this|that|the (?:bridge|town|market|temple|street|place|river))\s+have\b/i, (m, s) => `${s} has`, { vi: 'Chủ ngữ số ít (it, he, she, the bridge…) đi với "has".', en: 'Singular subjects (it, he, she, the bridge…) take "has".' }],
  [/\b(is|are)\s+((?:more than |over |about )?[a-z0-9,]+(?: [a-z]+)?)\s+years\b(?!\s+old)/i, (m, v, n) => `${v} ${n} years old`, { vi: 'Khi nói tuổi, thêm "old" sau "years".', en: 'Add "old" after "years" when you talk about age.' }],
  [/(^|\s)i(?=[\s'’])/, (m, p) => `${p}I`, { vi: 'Đại từ "I" luôn viết hoa.', en: 'Always write "I" with a capital letter.' }],
  [/\bvery (nice|good|beautiful|big|old)\b/i, (m, a) => ({ nice: 'lovely', good: 'great', beautiful: 'stunning', big: 'huge', old: 'ancient' })[a.toLowerCase()], { vi: 'Thử một tính từ mạnh hơn thay cho "very …" để nghe tự nhiên hơn.', en: 'Try one stronger adjective instead of "very …"; it sounds more natural.' }],
];
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
// Opens with what went well, then at most one thing to fix (AGENTS.md "Friendly UX")
function checkAnswer(text, l, easy = true) {
  const words = text.split(/\s+/).filter(Boolean);
  const used = l.vocab.map(v => v.word).find(w => new RegExp(`\\b${w.replace(/[^a-z ]/gi, '')}`, 'i').test(text));
  const good = used ? { vi: `Bạn đã dùng từ “${used}”. Rất tốt!`, en: `You used “${used}”. Nice!` }
    : words.length >= 8 ? { vi: 'Câu trả lời đầy đủ, rõ ý.', en: 'A full, clear answer.' } : { vi: 'Bạn đã trả lời bằng tiếng Anh. Tốt lắm!', en: 'You answered in English. Well done!' };
  for (const [re, fn, why] of FIXES) if (re.test(text)) return { good, fix: { better: cap(text.replace(re, fn)), why } };
  if (words.length < 4) return { good, fix: { better: '', why: { vi: 'Thử nói cả câu, bắt đầu bằng câu gợi ý.', en: 'Try a full sentence. The starter can help.' } } };
  if (!easy && !/\bbecause\b/i.test(text)) return { good, fix: { better: '', why: { vi: 'Thêm một lý do với "because" để nói sâu hơn.', en: 'Add a reason with "because" to say more.' } } };
  return { good, fix: null };
}
const isQuestion = t => /\?\s*$/.test(t) || /^(what|who|why|which|can you|could you|do you|does it|is it|is there|are there)\b/i.test(t);
const STOP = new Set('what when where which with this that there they them have does about tell many much from your their place'.split(' '));
// Answers only from the fact sheet; null means "I don't know", never a guess (R-04)
function factFor(t, l) {
  const q = t.toLowerCase();
  const topic = [[/\b(when|built|build|year|old|age|open)/, l.built], [/\b(history|historical|past)/, l.historicalSignificance], [/\b(why|important|culture|meaning)/, l.culturalBackground], [/\b(architect|unique|special|look|design|roof)/, l.architecture]].find(([re, v]) => re.test(q) && v);
  if (topic) return topic[1];
  const names = new Set(l.name.en.toLowerCase().split(/\s+/));
  const keys = (q.match(/[a-z]{4,}/g) || []).filter(w => !STOP.has(w) && !names.has(w)).map(w => w.replace(/s$/, ''));
  const pool = [l.description, l.built, l.historicalSignificance, l.culturalBackground, l.architecture, ...l.interestingFacts].filter(Boolean);
  const best = pool.map(f => ({ f, n: keys.filter(k => f.en.toLowerCase().includes(k)).length })).sort((a, b) => b.n - a.n)[0];
  return best?.n ? best.f : null;
}

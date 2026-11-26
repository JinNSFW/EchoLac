'use strict';
// Greedy CTC decoding. ids/probs hold the argmax token and its posterior per frame; vocab maps id -> token.
function pronDecode(ids, probs, vocab) {
  const tokens = [], conf = [];
  if (!ids?.length || ids.length !== probs?.length || !vocab) return { tokens, conf: 0 };
  for (let start = 0; start < ids.length;) {
    const id = ids[start], tok = vocab[id];
    let end = start, peak = 0;
    while (end < ids.length && ids[end] === id) {
      const p = probs[end++];
      if (!Number.isFinite(p) || p < 0 || p > 1) return { tokens: [], conf: 0 };
      peak = Math.max(peak, p);
    }
    if (typeof tok !== 'string' || tok === '<unk>' || tok === '??') return { tokens: [], conf: 0 };
    if (!tok.startsWith('<') && tok !== '|') { tokens.push(tok); conf.push(peak); }
    start = end;
  }
  const mean = conf.length ? conf.reduce((a, b) => a + b, 0) / conf.length : 0;
  return { tokens, conf: mean };
}

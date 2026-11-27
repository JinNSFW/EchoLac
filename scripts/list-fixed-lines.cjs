// Prints every fixed English line the app speaks (JSON array), for scripts/render-lines.py.
const { runtime } = require('../tests/helpers/runtime.cjs');
const lines = runtime().run(`(() => {
  const out = new Set();
  const add = t => { if (typeof t === 'string' && t.trim()) out.add(t); };
  for (const s of SCEN) {
    add(s.hello);
    for (const v of s.vocab || []) { add(v[0]); add(v[3]); }
    for (const st of TALK[s.id] || s.talk || genericTalk(s)) { add(st.ai); add(st.me); add(st.gram && st.gram.fix); }
  }
  for (const l of (LOCS)) {
    for (const v of l.vocab || []) { add(v.word); add(v.example); }
    for (const t of l.topics || []) add(t.q);
  }
  return [...out];
})()`);
process.stdout.write(JSON.stringify(lines));

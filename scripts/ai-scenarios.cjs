// Builds supabase/functions/_shared/scenarios.json from the app's scenario content, so the converse
// function builds its system prompt from the scenario only (PRD §9). Run after changing scenarios:
//   node scripts/ai-scenarios.cjs
// tests/ai-converse.test.cjs fails when the JSON is out of date.
const fs = require('node:fs');
const path = require('node:path');
const { root } = require('./project.cjs');
const { runtime } = require('../tests/helpers/runtime.cjs');

const OUT = path.join(root, 'supabase/functions/_shared/scenarios.json');

function build() {
  const list = runtime().run(`SCEN.map(s => [s.id, {
    place: s.name.en, persona: s.persona.name + ', ' + s.persona.en, level: s.level,
    goal: s.cando?.en || '', facts: s.facts?.en || '', hello: s.hello || (s.talk || []).find(x => x.ai)?.ai || '',
    words: (s.vocab || []).map(v => v[0]),
  }])`);
  return JSON.stringify(Object.fromEntries(list), null, 1) + '\n';
}

if (require.main === module) { fs.writeFileSync(OUT, build()); console.log('Wrote ' + path.relative(root, OUT)); }
module.exports = { build, OUT };

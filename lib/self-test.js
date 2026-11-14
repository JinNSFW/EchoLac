'use strict';
// Existing contrast and camera diagnostics, available with ?test.

// Open the app with ?test: every theme must keep text contrast >= 4.5:1 (WCAG AA)
function selfTest() {
  const lum = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return +((x + 0.05) / (y + 0.05)).toFixed(2); };
  const rows = Object.entries(THEMES).map(([id, { c }]) => ({ id, 'navy/bg1': cr(c.navy, c.bg1), 'muted/bg1': cr(c.muted, c.bg1), 'muted/card': cr(c.muted, c['card-blue']), 'faint/white': cr(c.faint, '#FFFFFF'), 'faint/bg1': cr(c.faint, c.bg1), 'white/navy-2': cr('#FFFFFF', c['navy-2']) }));
  const bad = rows.flatMap(r => Object.entries(r).filter(([k, v]) => k !== 'id' && v < 4.5).map(([k, v]) => `${r.id} ${k} ${v}`));
  console.table(rows);
  console.assert(!bad.length, 'Contrast below 4.5:1 →', bad);
  // Camera learning: double matching (cases A–F), language feedback, fact lookup
  const db = loc('dragon-bridge'), cb = loc('covered-bridge'), fix = t => checkAnswer(t, { vocab: [] }).fix?.better;
  if (db && loc('han-market')) { const d = distM(db, loc('han-market')); console.assert(d > 700 && d < 1000, 'distM Dragon Bridge → Han Market', d); }
  if (db && cb) {
    const at = (l, acc = 20) => gpsMatch({ lat: l.lat, lng: l.lng, acc }), xv = (g, sim) => crossValidate(g, imageMatch(sim, true));
    console.assert(at(cb).status === 'multiple' && at(db).status === 'matched' && at(db, 900).gpsStatus === 'inaccurate', 'gpsMatch');
    console.assert(imageMatch({ [db.id]: 0.6 }, true).status === 'uncertain' && imageMatch({ [db.id]: 0.3 }, true).bestId === null && !imageMatch(null).service, 'imageMatch');
    const cases = {
      A: xv(at(db), { [db.id]: 0.9 }), B: xv(at(cb), { [cb.id]: 0.9 }), C: xv(at(db), { [cb.id]: 0.9 }),
      D: xv(gpsMatch(null), { [db.id]: 0.9 }), E: xv(at(db), { [db.id]: 0.2 }), F: xv(gpsMatch({ lat: 21.03, lng: 105.85, acc: 20 }), { [db.id]: 0.9 }),
    };
    const want = { A: 'confirmed', B: 'confirmed', C: 'needs_confirmation', D: 'needs_confirmation', E: 'needs_confirmation', F: 'rejected' };
    Object.entries(cases).forEach(([k, v]) => console.assert(v.case === k && v.status === want[k], `crossValidate case ${k}`, v.case, v.status));
    console.assert(cases.A.finalId === db.id && cases.C.finalId === null && cases.F.finalId === null, 'only agreement yields a final id');
    const named = resolveMap(['Chùa Cầu', 'Ngũ Hành Sơn', 'Cầu Rồng']), fallback = resolveMap(['Chùa Cầu', 'Ngũ Hành Sơn', 'Class 3']);
    console.assert(named[2] === 'dragon' && !(2 in fallback) && !named[0] && !named[1], 'resolveMap: by name only, never by index');
    console.assert(!holdStep({ cls: -1, since: 0 }, 2, 0.9, 1000, 0.1).since && imageMatch({ [db.id]: 0.8, [cb.id]: 0.7 }, true).status === 'uncertain', 'C-04 margin: a close runner-up is never a hit');
    const h0 = holdStep({ cls: -1, since: 0 }, 2, 0.9, 1000);
    console.assert(!h0.hit && !holdStep(h0, 2, 0.9, 1700).hit && holdStep(h0, 2, 0.9, 1800).hit, 'holdStep: needs holdMs');
    console.assert(holdStep(h0, 2, 0.6, 1500).cls === -1 && !holdStep(holdStep(h0, 2, 0.6, 1500), 2, 0.9, 1900).hit && !holdStep(h0, 1, 0.95, 1900).hit, 'holdStep: a dip or a class switch restarts the timer');
    console.assert(labelLoc('Chùa Cầu') === cb && labelLoc('Chùa Cầu') === cb && labelLoc('Class 3') === undefined, 'model labels map to places (NFC-safe)');
  }
  console.assert(fix('It have more than four hundred years') === 'It is more than four hundred years old', fix('It have more than four hundred years'));
  console.assert(fix('The bridge have a small temple.') === 'The bridge has a small temple.', fix('The bridge have a small temple.'));
  console.assert(fix('i think it is lovely.') === 'I think it is lovely.', fix('i think it is lovely.'));
  console.assert(checkAnswer('It is 666 metres long and it crosses the river.', { vocab: [] }).fix === null, 'clean answer has no fix');
  if (db) console.assert(factFor('How long is the bridge?', db)?.en === 'It is 666 metres long.' && factFor('Why is it important?', db) === null, 'factFor');
  return bad;
}

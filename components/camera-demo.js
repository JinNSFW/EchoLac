'use strict';
// Clearly labelled camera demo modes and their controls.

/* Demo Mode, spec §10: sample GPS fixes + simulated similarity scores, labelled wherever they show */
const SCENARIOS = {
  live: { vi: 'Thật: GPS + camera', en: 'Live: GPS + camera' },
  agree: { vi: '1 · Hai bên khớp', en: '1 · Both agree', at: 'dragon-bridge', sim: { 'dragon-bridge': 0.91, 'han-market': 0.31, 'marble-mountains': 0.18 } },
  conflict: { vi: '2 · GPS và ảnh lệch', en: '2 · GPS vs image differ', at: 'dragon-bridge', sim: { 'marble-mountains': 0.88, 'dragon-bridge': 0.27 } },
  multi: { vi: '3 · Nhiều nơi gần nhau', en: '3 · Several nearby', at: 'covered-bridge', sim: { 'covered-bridge': 0.86, 'hoi-an-ancient-town': 0.58 } },
  imgfail: { vi: '4 · Ảnh không nhận ra', en: '4 · Image fails', at: 'han-market', sim: { 'han-market': 0.34, 'dragon-bridge': 0.21 } },
  nogps: { vi: '5 · Không có GPS', en: '5 · No GPS', at: null, sim: { 'hoi-an-ancient-town': 0.84, 'covered-bridge': 0.49 } },
  model: { vi: '6 · Model thật, GPS mẫu Cầu Rồng', en: '6 · Real model, sample GPS (Dragon Bridge)', at: 'dragon-bridge', real: true },
};
const isDemo = () => CL.scen !== 'live';
const realImage = () => !isDemo() || !!SCENARIOS[CL.scen].real; // image result comes from the actual model
const demoLabel = () => (realImage() ? V('Demo: GPS mẫu, ảnh nhận diện thật', 'Demo: sample GPS, real image model') : V('Demo, mô phỏng', 'Demo, simulated'));
const topSim = s => Object.entries(s.sim).sort((a, b) => b[1] - a[1])[0][0];

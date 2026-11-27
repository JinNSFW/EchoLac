'use strict';
// Prototype radar and progress chart markup (E-02, E-06).

function radarSvg() {
  const c = 150, r = 88, ang = [-90, 0, 90, 180];
  const pt = (v, i) => { const a = (ang[i] * Math.PI) / 180; return [(c + Math.cos(a) * r * v / 100).toFixed(1), (c + Math.sin(a) * r * v / 100).toFixed(1)]; };
  const poly = vals => vals.map((v, i) => pt(v, i).join(',')).join(' ');
  const cur = CRIT.map(x => S.scores[x.k]);
  return `<svg viewBox="0 0 300 300" role="img" aria-label="${V('Biểu đồ mạng nhện bốn tiêu chí', 'Four-criteria radar chart')}">
    ${[25, 50, 75, 100].map(l => `<polygon class="grid" points="${poly([l, l, l, l])}"/>`).join('')}
    ${[0, 1, 2, 3].map(i => `<line class="axis" x1="${c}" y1="${c}" x2="${pt(100, i)[0]}" y2="${pt(100, i)[1]}"/>`).join('')}
    <g class="cur"><polygon points="${poly(cur)}"/>${cur.map((v, i) => `<circle class="pt" cx="${pt(v, i)[0]}" cy="${pt(v, i)[1]}" r="5"/>`).join('')}</g>
  </svg>`;
}

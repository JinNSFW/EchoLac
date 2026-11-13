'use strict';
// Prototype radar and progress chart markup (E-02, E-06).

function radarSvg() {
  const c = 150, r = 88, ang = [-90, 0, 90, 180];
  const pt = (v, i) => { const a = (ang[i] * Math.PI) / 180; return [(c + Math.cos(a) * r * v / 100).toFixed(1), (c + Math.sin(a) * r * v / 100).toFixed(1)]; };
  const poly = vals => vals.map((v, i) => pt(v, i).join(',')).join(' ');
  const cur = CRIT.map(x => S.scores[x.k]), prev = CRIT.map(x => PREV[x.k]);
  return `<svg viewBox="0 0 300 300" role="img" aria-label="${V('Biểu đồ mạng nhện bốn tiêu chí', 'Four-criteria radar chart')}">
    ${[25, 50, 75, 100].map(l => `<polygon class="grid" points="${poly([l, l, l, l])}"/>`).join('')}
    ${[0, 1, 2, 3].map(i => `<line class="axis" x1="${c}" y1="${c}" x2="${pt(100, i)[0]}" y2="${pt(100, i)[1]}"/>`).join('')}
    <polygon class="prev" points="${poly(prev)}"/>
    <g class="cur"><polygon points="${poly(cur)}"/>${cur.map((v, i) => `<circle class="pt" cx="${pt(v, i)[0]}" cy="${pt(v, i)[1]}" r="5"/>`).join('')}</g>
  </svg>`;
}
function lineChart() {
  const colors = { fluency: '#5E9EA0', vocab: 'var(--success)', grammar: 'var(--lantern-a)', pron: 'var(--navy)' };
  const X = i => 24 + i * 57, Y = v => 132 - v * 1.2;
  const weeks = Array.from({ length: 6 }, (_, i) => (S.lang === 'vi' ? 'T' : 'W') + (i + 1));
  return `<svg viewBox="0 0 330 160" role="img" aria-label="${V('Biểu đồ tiến bộ', 'Progress chart')}">
    ${[25, 50, 75, 100].map(v => `<line x1="24" x2="310" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)" stroke-dasharray="3 4"/><text x="0" y="${Y(v) + 4}" font-size="10" fill="var(--faint)">${v}</text>`).join('')}
    ${weeks.map((w, i) => `<text x="${X(i)}" y="156" font-size="10" fill="var(--faint)" text-anchor="middle">${w}</text>`).join('')}
    ${CRIT.map(c => `<polyline stroke="${colors[c.k]}" points="${[...HISTORY[c.k], S.scores[c.k]].map((v, i) => `${X(i)},${Y(v)}`).join(' ')}"/>`).join('')}
  </svg>
  <div class="legend">${CRIT.map(c => `<span><i style="background:${colors[c.k]}"></i>${L(c.name)}</span>`).join('')}</div>`;
}

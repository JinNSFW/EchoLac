'use strict';
// Entry point: place-theme configuration, then application startup.

'use strict';
// EchoLạc clickable prototype. Mock data only: no real ASR, scoring or LLM yet (see AGENTS.md for the target stack).

/* ---------- Place themes: the ONE source for every theme (X-06) ----------
   c      colour tokens → written as :root[data-theme="<id>"] { --<token>: … } by installThemes()
   frame  CSS background of the patterned border around the page (none for "other")
   pattern optional faint CSS background over the whole page
   land() SVG silhouette at the bottom of the page (viewBox 400×160, classes a/b/g/s/thin/w)
   fx()   light ambient animation in the fixed layer (transform/opacity only)
   To add a place: add an entry here; selfTest() (open with ?test) checks its text contrast. */
const waveSvg = amp => `<svg viewBox="0 0 800 60" preserveAspectRatio="none"><path d="M0 30Q50 ${30 - amp} 100 30${Array.from({ length: 7 }, (_, i) => ` T${(i + 2) * 100} 30`).join('')}V60H0Z"/></svg>`;
const waves = (b, h, t, o, amp) => `<div class="waves" style="--b:${b}px;--h:${h}px;--t:${t}s;--o:${o}%">${waveSvg(amp)}${waveSvg(amp * 0.6)}</div>`;
const pine = (x, base, h) => `<path class="b" d="M${x} ${base - h}L${x - h * 0.3} ${base}H${x + h * 0.3}Z"/><rect class="b" x="${x - 1.5}" y="${base}" width="3" height="6"/>`;
const BOAT = '<svg viewBox="0 0 64 48"><path d="M30 28L31 4Q46 12 46 28Z" fill="#C8553D"/><path d="M17 28L18 10Q28 16 28 28Z" fill="#D9774F"/><path d="M4 32Q32 44 60 32L54 27H10Z" fill="#6B3F1D" opacity=".8"/></svg>';
const LAND = inner => `<svg viewBox="0 0 400 160" aria-hidden="true">${inner}</svg>`;
const THEMES = {
  danang: {
    icon: 'dragon', name: { vi: 'Đà Nẵng', en: 'Da Nang' }, scene: { vi: 'Cầu Rồng & biển Mỹ Khê', en: 'Dragon Bridge & My Khe Beach' },
    c: { navy: '#1F4E79', 'navy-2': '#2E6A99', primary: '#2E8BC7', accent: '#E2B23A', 'primary-soft': '#D5EAF7', 'card-blue': '#E4F2FB', tint: '#EEF5FA', 'tint-2': '#DDE9F1', line: '#E2EDF4', muted: '#4A6072', faint: '#50667A', 'accent-line': '#A9CBE0', bg1: '#C9E5F6', bg2: '#DDF0FA', bg3: '#F1F8FC', bg4: '#FFF6E3', page: '#E3EEF5' },
    frame: 'repeating-linear-gradient(135deg, var(--primary) 0 10px, #fff 10px 12px, var(--accent) 12px 17px, #fff 17px 19px)',
    land: () => LAND(`<circle class="g" cx="335" cy="38" r="20"/>
      ${[60, 140, 220, 300].map(x => `<rect class="b" x="${x}" y="116" width="8" height="28"/>`).join('')}
      <rect class="b" x="0" y="110" width="400" height="7"/>
      <path class="s" d="M8 110C38 58 70 58 100 110S160 156 190 110 250 58 280 110 340 156 362 110"/>
      <circle class="g" cx="372" cy="98" r="10"/><path class="g" d="M378 90l14-10-4 14z"/>
      <path class="a" d="M0 136q25-10 50 0t50 0 50 0 50 0 50 0 50 0 50 0 50 0V160H0z"/>`),
    fx: () => waves(56, 84, 9, 30, 14),
  },
  hoian: {
    icon: 'lantern', name: { vi: 'Hội An', en: 'Hoi An' }, scene: { vi: 'Phố cổ đèn lồng', en: 'Lantern-lit old town' },
    c: { navy: '#6E3410', 'navy-2': '#9A4A16', primary: '#D99A16', accent: '#C8372D', 'primary-soft': '#FCE8BE', 'card-blue': '#FFF1CF', tint: '#FFF7E6', 'tint-2': '#F5E5C8', line: '#F3E5CE', muted: '#714F2E', faint: '#7E6044', 'accent-line': '#EBC48A', bg1: '#FFE6A6', bg2: '#FFF0CC', bg3: '#FFF8E8', bg4: '#FFFBF3', page: '#F6E9D2' },
    frame: 'radial-gradient(circle, var(--accent) 0 2.6px, transparent 3px) 0 0 / 14px 14px, radial-gradient(circle, var(--primary) 0 2.6px, transparent 3px) 7px 7px / 14px 14px, var(--navy-2)',
    land: () => LAND(Array.from({ length: 6 }, (_, i) => { const x = i * 70 - 10; return `<rect class="a" x="${x + 6}" y="122" width="58" height="38"/><path class="b" d="M${x} 124L${x + 16} 104H${x + 54}L${x + 70} 124Z"/><rect class="b" x="${x + 26}" y="134" width="18" height="26"/><circle class="g" cx="${x + 14}" cy="131" r="4"/><circle class="g" cx="${x + 56}" cy="131" r="4"/>`; }).join('')),
    fx: () => {
      const cols = ['#C8372D', '#E8A317', '#C8372D', '#E8A317', '#C8372D', '#E8A317'];
      const lan = [40, 105, 170, 235, 300, 365].map((x, i) => {
        const y = 14 + Math.sin(i * 1.3) * 6;
        return `<g class="sway" style="animation-delay:-${i * 0.6}s"><line class="thin" x1="${x}" y1="${y}" x2="${x}" y2="${y + 14}"/>
          <rect x="${x - 5}" y="${y + 13}" width="10" height="3" rx="1" fill="#6B3F1D"/><ellipse class="lan" cx="${x}" cy="${y + 30}" rx="11" ry="14" fill="${cols[i]}"/>
          <rect x="${x - 5}" y="${y + 43}" width="10" height="3" rx="1" fill="#6B3F1D"/></g>`;
      }).join('');
      return `<div class="fx-top"><svg viewBox="0 0 400 90"><path class="thin" d="M0 8Q100 32 200 14T400 10"/>${lan}</svg></div>`;
    },
  },
  hue: {
    icon: 'crown', name: { vi: 'Huế', en: 'Hue' }, scene: { vi: 'Đại Nội & sông Hương', en: 'Imperial City & Perfume River' },
    c: { navy: '#4B2A6B', 'navy-2': '#67418C', primary: '#8C5CC0', accent: '#C9A227', 'primary-soft': '#E9DDF6', 'card-blue': '#F2EAFA', tint: '#F7F2FB', 'tint-2': '#E8DEF1', line: '#ECE4F3', muted: '#5A4670', faint: '#625077', 'accent-line': '#C9B3E0', bg1: '#E2D3F2', bg2: '#EFE6F8', bg3: '#F9F5FC', bg4: '#FFF8EA', page: '#ECE4F2' },
    frame: 'repeating-linear-gradient(90deg, var(--accent) 0 3px, transparent 3px 8px), repeating-linear-gradient(0deg, var(--accent) 0 3px, var(--navy) 3px 8px)',
    pattern: 'radial-gradient(circle, color-mix(in srgb, var(--accent) 22%, transparent) 0 2px, transparent 2.5px) 0 0 / 24px 24px, repeating-linear-gradient(45deg, color-mix(in srgb, var(--accent) 9%, transparent) 0 1px, transparent 1px 12px), repeating-linear-gradient(-45deg, color-mix(in srgb, var(--accent) 9%, transparent) 0 1px, transparent 1px 12px)',
    land: () => LAND(`<circle class="g" cx="200" cy="46" r="4"/>
      <path class="a" d="M145 62Q200 50 255 62L240 52Q200 44 160 52Z"/><rect class="a" x="160" y="62" width="80" height="12"/>
      <path class="b" d="M98 92Q200 76 302 92L288 82Q200 68 112 82Z"/><rect class="b" x="112" y="92" width="176" height="22"/>
      <path class="b" d="M50 160V114H350V160H218V140A18 18 0 0 0 182 140V160H142V146A12 12 0 0 0 118 146V160H50ZM258 160V146A12 12 0 0 1 282 146V160Z"/>
      <path class="a" d="M0 152q50-6 100 0t100 0 100 0 100 0V160H0z"/>`),
    fx: () => waves(56, 46, 16, 18, 6),
  },
  hanoi: {
    icon: 'turtle', name: { vi: 'Hà Nội', en: 'Hanoi' }, scene: { vi: 'Hồ Gươm & cầu Thê Húc', en: 'Hoan Kiem Lake & The Huc Bridge' },
    c: { navy: '#2F4F2A', 'navy-2': '#46683A', primary: '#6B8E45', accent: '#C0392B', 'primary-soft': '#E2EDD3', 'card-blue': '#EEF5E6', tint: '#F4F8EF', 'tint-2': '#E2EBD8', line: '#E6EEDD', muted: '#485C40', faint: '#52664A', 'accent-line': '#B7CC9C', bg1: '#D5E5C5', bg2: '#E6F0DC', bg3: '#F5F9F0', bg4: '#FBFCF8', page: '#E3EBDA' },
    frame: 'repeating-linear-gradient(45deg, var(--accent) 0 8px, var(--primary) 8px 16px)',
    land: () => LAND(`<rect class="a" x="0" y="128" width="400" height="32"/>
      <path class="s" style="stroke-width:6" d="M-10 112Q110 66 230 112"/>
      ${[20, 60, 100, 140, 180].map(x => `<line class="thin" x1="${x}" y1="${112 - (1 - ((x - 110) / 120) ** 2) * 24}" x2="${x}" y2="${100 - (1 - ((x - 110) / 120) ** 2) * 24}"/>`).join('')}
      <ellipse class="b" cx="322" cy="128" rx="42" ry="6"/>
      <rect class="b" x="302" y="108" width="40" height="18"/><rect class="b" x="308" y="94" width="28" height="14"/><rect class="b" x="314" y="82" width="16" height="12"/>
      <path class="b" d="M310 82L322 70 334 82Z"/>`),
    fx: () => `<div class="lake"></div>${[[18, 112, 0], [62, 132, -1.4], [40, 98, -2.6], [80, 118, -3.4], [28, 140, -0.8]].map(([l, b, d]) => `<i class="ripple-ring" style="left:${l}%;bottom:${b}px;animation-delay:${d}s"></i>`).join('')}`,
  },
  halong: {
    icon: 'sailboat', name: { vi: 'Hạ Long', en: 'Ha Long' }, scene: { vi: 'Vịnh & núi đá vôi', en: 'Bay & limestone islands' },
    c: { navy: '#0F5B57', 'navy-2': '#1A7670', primary: '#17A08F', accent: '#C8553D', 'primary-soft': '#D0EFEA', 'card-blue': '#E0F5F1', tint: '#EFF8F6', 'tint-2': '#D9ECE8', line: '#E0EFEC', muted: '#3B5D5B', faint: '#456764', 'accent-line': '#9FD3CB', bg1: '#BFE7E1', bg2: '#DAF1EE', bg3: '#F0FAF8', bg4: '#F8FCFB', page: '#DCEDEA' },
    frame: 'linear-gradient(180deg, var(--primary), var(--navy-2) 50%, var(--primary))',
    land: () => LAND(`<path class="a" d="M40 140C45 80 90 70 100 140ZM250 140C255 70 300 66 310 140Z"/>
      <path class="b" d="M0 140C5 96 40 86 52 140ZM90 140C95 60 150 50 160 140ZM300 140C306 40 370 45 384 140Z"/>
      <path class="a" d="M0 140q25-8 50 0t50 0 50 0 50 0 50 0 50 0 50 0 50 0V160H0z"/>`),
    fx: () => `${waves(56, 60, 14, 20, 6)}<div class="boat" style="bottom:96px;--w:64px;--t:46s;--dl:-12s">${BOAT}</div><div class="boat" style="bottom:118px;--w:42px;--t:64s;--dl:-40s">${BOAT}</div>`,
  },
  sapa: {
    icon: 'rice', name: { vi: 'Sa Pa', en: 'Sa Pa' }, scene: { vi: 'Ruộng bậc thang & mây núi', en: 'Rice terraces in the clouds' },
    c: { navy: '#3B5320', 'navy-2': '#52722C', primary: '#7FA637', accent: '#FFFFFF', 'primary-soft': '#E3EFCD', 'card-blue': '#EEF6DF', tint: '#F5F9EC', 'tint-2': '#E4EDD3', line: '#E8F0DA', muted: '#4F5C3A', faint: '#586545', 'accent-line': '#C2D89A', bg1: '#D6EAB8', bg2: '#E9F4D8', bg3: '#F7FBEF', bg4: '#FCFDF8', page: '#E6EDDA' },
    frame: 'repeating-linear-gradient(0deg, var(--primary) 0 9px, #fff 9px 12px, var(--navy-2) 12px 21px, #fff 21px 24px)',
    land: () => LAND([70, 84, 98, 112, 126, 140, 152].map((y, i) => `<path class="${i % 2 ? 'b' : 'a'}" d="M0 ${y}Q100 ${y - 24} 200 ${y - 6}T400 ${y - 14}V160H0Z"/>`).join('')),
    fx: () => particles('mist', 6, [8, 55]),
  },
  dalat: {
    icon: 'pine', name: { vi: 'Đà Lạt', en: 'Da Lat' }, scene: { vi: 'Đồi thông & mai anh đào', en: 'Pine hills & cherry blossoms' },
    c: { navy: '#2F4A40', 'navy-2': '#46665A', primary: '#D46A93', accent: '#2F6B4F', 'primary-soft': '#F8DCE7', 'card-blue': '#FCEAF1', tint: '#FBF3F6', 'tint-2': '#F0DFE6', line: '#F2E6EB', muted: '#574F5A', faint: '#615966', 'accent-line': '#E9B3C8', bg1: '#F5D6E3', bg2: '#FAE8EF', bg3: '#FDF6F9', bg4: '#F3F8F5', page: '#EFE3E8' },
    frame: 'radial-gradient(circle, var(--primary) 0 2.8px, transparent 3.2px) 0 0 / 12px 12px, var(--accent)',
    land: () => LAND(`<path class="a" d="M0 132Q100 96 200 120T400 108V160H0Z"/>
      ${[[18, 136, 40], [46, 128, 56], [80, 122, 34], [250, 118, 46], [282, 112, 62], [318, 114, 40], [352, 108, 54], [384, 112, 38]].map(p => pine(...p)).join('')}
      <path class="a" d="M0 150Q200 134 400 146V160H0Z"/>`),
    fx: () => particles('petal', 14) + particles('mist', 3, [30, 70]),
  },
  hcm: {
    icon: 'city', name: { vi: 'TP. Hồ Chí Minh', en: 'Ho Chi Minh City' }, scene: { vi: 'Phố thị lên đèn', en: 'City lights' },
    c: { navy: '#2B1F4A', 'navy-2': '#47376F', primary: '#FF7A2F', accent: '#B05CFF', 'primary-soft': '#FFE1CF', 'card-blue': '#F1EAFB', tint: '#F8F4FC', 'tint-2': '#E7DFF2', line: '#EEE8F5', muted: '#4D4566', faint: '#605877', 'accent-line': '#FFB98F', bg1: '#E6DCF6', bg2: '#F2ECFA', bg3: '#FBF8FD', bg4: '#FFF3EA', page: '#E9E3F1' },
    frame: 'repeating-linear-gradient(0deg, var(--primary) 0 12px, var(--navy) 12px 16px, var(--accent) 16px 26px, var(--navy) 26px 30px)',
    land: () => {
      const blds = [[0, 96, 34], [36, 80, 26], [64, 110, 40], [106, 70, 30], [138, 100, 28], [168, 86, 36], [206, 104, 30], [238, 76, 34], [336, 92, 30], [368, 84, 32]];
      const win = blds.flatMap(([x, y, w], j) => Array.from({ length: 6 }, (_, k) => `<rect class="w" style="animation-delay:-${((j * 7 + k * 3) % 11) * 0.23}s" x="${x + 5 + (k % 2) * (w / 2 - 2)}" y="${y + 8 + Math.floor(k / 2) * 14}" width="5" height="6"/>`)).join('');
      return LAND(`${blds.map(([x, y, w]) => `<rect class="b" x="${x}" y="${y}" width="${w}" height="${160 - y}"/>`).join('')}
        <path class="b" d="M282 160V64Q288 34 298 22Q306 34 314 64V160Z"/><ellipse class="g" cx="300" cy="50" rx="13" ry="3.5"/>
        ${win}<path class="a" d="M0 152q50-5 100 0t100 0 100 0 100 0V160H0z"/>`);
    },
    fx: () => particles('star', 18),
  },
  other: {
    icon: 'pin', name: { vi: 'Nơi khác', en: 'Somewhere else' }, scene: { vi: 'Giao diện EchoLạc', en: 'Classic EchoLạc' },
    c: { navy: '#726958', 'navy-2': '#776D5B', primary: '#9C8466', accent: '#C98A1B', 'primary-soft': '#F3E6D0', 'card-blue': '#FFF4E1', tint: '#F7F1E7', 'tint-2': '#ECE6DB', line: '#EFE8DC', muted: '#6E6453', faint: '#776C5B', 'accent-line': '#D2C4AC', bg1: '#FFF4E2', bg2: '#FEF6E8', bg3: '#FCF9F3', bg4: '#F1EFEB', page: '#EEE9E1' },
  },
};
const theme = id => THEMES[id] || THEMES.other;

installThemes();
applyTheme(S.place);
if (new URLSearchParams(location.search).has('test')) selfTest();
splash();

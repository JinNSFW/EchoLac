'use strict';
// Fictional Dragon Bridge-area maps for the PRD §5.8 directions slice.
const directionsLabels = {
  left: { vi: 'Rẽ trái', en: 'Left' },
  right: { vi: 'Rẽ phải', en: 'Right' },
  bridge: { vi: 'Cầu Rồng', en: 'Dragon Bridge' },
  garden: { vi: 'Vườn hoa', en: 'Flower garden' },
  square: { vi: 'Quảng trường', en: 'Square' },
  cafe: { vi: 'Quán cà phê', en: 'Café' },
  museum: { vi: 'Bảo tàng', en: 'Museum' },
  market: { vi: 'Chợ', en: 'Market' },
  gate: { vi: 'Cổng', en: 'Gate' },
  boat: { vi: 'Thuyền', en: 'Boat' },
  unclear: { vi: 'Không nghe rõ', en: 'Unclear' },
};
const directionsFields = {
  turn: { label: { vi: 'Hướng rẽ', en: 'Turn' }, options: ['left', 'right'] },
  landmark: { label: { vi: 'Mốc nhận biết', en: 'Landmark' }, options: ['bridge', 'garden', 'square'] },
  destination: { label: { vi: 'Điểm đến', en: 'Destination' }, options: ['boat', 'cafe', 'gate', 'market', 'museum'] },
};
const directionsMaps = {
  a: {
    junctions: [
      { landmark: 'garden', left: 'cafe', right: 'museum' },
      { landmark: 'bridge', left: 'gate', right: 'market' },
    ],
    answer: { turn: 'right', landmark: 'bridge', destination: 'market' },
    word: 'market',
  },
  b: {
    junctions: [
      { landmark: 'bridge', left: 'market', right: 'cafe' },
      { landmark: 'square', left: 'gate', right: 'museum' },
    ],
    answer: { turn: 'left', landmark: 'square', destination: 'gate' },
    word: 'gate',
  },
  c: {
    junctions: [
      { landmark: 'square', left: 'market', right: 'gate' },
      { landmark: 'garden', left: 'boat', right: 'cafe' },
    ],
    answer: { turn: 'left', landmark: 'garden', destination: 'boat' },
    word: 'boat',
  },
};
const directionsQuestion = 'Excuse me, how do I get to the meeting point?';

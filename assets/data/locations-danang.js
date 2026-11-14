/* EchoLạc — the three extra places the camera model v3 recognises (with dragon-bridge in locations.js).
   Same record format as locations.js. Coordinates are approximate: check on a map before production.
   Facts come from lesson B1-05 (content/curriculum/b1.js) and its sources; all await teacher verification (PRD R-04). */
window.ECHOLAC_LOCATIONS = (window.ECHOLAC_LOCATIONS || []).concat([
  {
    id: 'han-river-bridge', demo: true, verified: false,
    name: { vi: 'Cầu Sông Hàn', en: 'Han River Swing Bridge' },
    description: { vi: 'Cầu quay bắc qua sông Hàn ở trung tâm Đà Nẵng.', en: 'A swing bridge across the Han River in central Da Nang.' },
    lat: 16.0719, lng: 108.2265, radius: 300,
    icon: 'bridge', bg: ['#E4E6FF', '#A6ACF2'],
    referenceImages: [], streetView: null,
    visualKeywords: ['cable-stayed bridge', 'single central pylon', 'fan of cables', 'coloured lights at night'],
    built: { vi: 'Cầu khánh thành năm 2000.', en: 'It opened in 2000.' },
    historicalSignificance: null, culturalBackground: null, architecture: null,
    interestingFacts: [
      { vi: 'Đây là cầu quay đầu tiên của Việt Nam.', en: 'It was Vietnam’s first swing bridge.' },
      { vi: 'Người dân Đà Nẵng đóng góp 30% kinh phí xây cầu.', en: 'Da Nang residents paid 30% of its cost.' },
    ],
    vocab: [
      { word: 'swing bridge', ipa: '/ˈswɪŋ brɪdʒ/', en: 'a bridge that turns so ships can pass', vi: 'cầu quay', example: 'It was Vietnam’s first swing bridge.' },
      { word: 'contribute', ipa: '/kənˈtrɪbjuːt/', en: 'to give money or help', vi: 'đóng góp', example: 'Residents contributed 30% of the cost.' },
      { word: 'symbol', ipa: '/ˈsɪmbl/', en: 'something that stands for an idea', vi: 'biểu tượng', example: 'The bridge is a symbol of the city.' },
    ],
    topics: [
      { q: 'Why is this bridge special?', start: 'It is special because…' },
      { q: 'Who helped to pay for the bridge?', start: 'Local people…' },
    ],
    sources: [{ label: 'Lesson B1-05 fact sheet (pending teacher verification)' }, { label: 'Danang Fantasticity – Cầu quay sông Hàn', url: 'https://danangfantasticity.com/cac-cay-cau/cau-quay-song-han' }],
  },
  {
    id: 'apec-park', demo: true, verified: false,
    name: { vi: 'Công viên APEC', en: 'APEC Park' },
    description: { vi: 'Công viên bên sông Hàn, có mái vòm trắng lớn.', en: 'A riverside park with a large white canopy.' },
    lat: 16.0598, lng: 108.2238, radius: 250,
    icon: 'city', bg: ['#E3F4E9', '#A6DBBB'],
    referenceImages: [], streetView: null,
    visualKeywords: ['white lattice canopy', 'kite-shaped dome', 'sculpture garden', 'riverside park'],
    built: { vi: 'Công viên khánh thành ngày 9/11/2017.', en: 'It opened on 9 November 2017.' },
    historicalSignificance: null, culturalBackground: null,
    architecture: { vi: 'Mái vòm có hình “cánh diều bay cao”.', en: 'Its canopy is shaped like a kite soaring high.' },
    interestingFacts: [
      { vi: 'Công viên trưng bày tượng do các nền kinh tế APEC tặng.', en: 'It displays sculptures donated by APEC member economies.' },
    ],
    vocab: [
      { word: 'canopy', ipa: '/ˈkænəpi/', en: 'a roof that covers an open space', vi: 'mái vòm', example: 'The canopy looks like a kite.' },
      { word: 'sculpture', ipa: '/ˈskʌlptʃə/', en: 'a work of art made from stone, metal or wood', vi: 'tác phẩm điêu khắc', example: 'The park displays sculptures.' },
      { word: 'donate', ipa: '/dəʊˈneɪt/', en: 'to give something as a gift', vi: 'tặng', example: 'APEC economies donated the sculptures.' },
    ],
    topics: [
      { q: 'What does the canopy look like?', start: 'It looks like…' },
      { q: 'Where did the sculptures come from?', start: 'They were donated by…' },
    ],
    sources: [{ label: 'Lesson B1-05 fact sheet (pending teacher verification)' }, { label: 'Danang Fantasticity – Công viên APEC', url: 'https://danangfantasticity.com/apec-viet-nam-2017-vn/cong-vien-apec' }],
  },
  {
    id: 'linh-ung-lady-buddha', demo: true, verified: false,
    name: { vi: 'Tượng Quan Âm - Chùa Linh Ứng', en: 'Lady Buddha, Linh Ung Pagoda' },
    description: { vi: 'Tượng Quan Âm trắng ở chùa Linh Ứng, bán đảo Sơn Trà.', en: 'The white Lady Buddha statue at Linh Ung Pagoda on the Son Tra peninsula.' },
    lat: 16.1003, lng: 108.2777, radius: 400,
    icon: 'mountain', bg: ['#F7F1E7', '#E6D7BD'],
    referenceImages: [], streetView: null,
    visualKeywords: ['tall white statue', 'pagoda tower', 'hillside by the sea'],
    built: null, historicalSignificance: null, culturalBackground: null, architecture: null,
    interestingFacts: [], // no sourced facts yet: never guess (PRD R-04)
    vocab: [
      { word: 'statue', ipa: '/ˈstætʃuː/', en: 'a figure of a person made of stone or metal', vi: 'bức tượng', example: 'The white statue looks over the sea.' },
      { word: 'pagoda', ipa: '/pəˈɡəʊdə/', en: 'a Buddhist temple or tower', vi: 'chùa, tháp chùa', example: 'The statue stands at Linh Ung Pagoda.' },
      { word: 'peninsula', ipa: '/pəˈnɪnsjələ/', en: 'land with water on three sides', vi: 'bán đảo', example: 'The pagoda is on the Son Tra peninsula.' },
    ],
    topics: [
      { q: 'What can you see from here?', start: 'From here, I can see…' },
      { q: 'How would you describe the statue?', start: 'The statue is…' },
    ],
    sources: [{ label: 'Camera model v3 class “Tượng Quan Âm - Chùa linh ứng”; fact sheet not written yet' }],
  },
]);

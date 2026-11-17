/* EchoLạc — the four extra places the camera model v4 recognises (with dragon-bridge in locations.js).
   Same record format as locations.js. Coordinates are approximate: check on a map before production.
   Facts come from lesson B1-05 (content/curriculum/b1.js) and docs/research-quan-am-ca-chep.md; all await teacher verification (PRD R-04).
   modelLabel: the class name in model/metadata.json when it differs from name.vi. */
window.ECHOLAC_LOCATIONS = (window.ECHOLAC_LOCATIONS || []).concat([
  {
    id: 'han-river-bridge', demo: true, verified: false,
    name: { vi: 'Cầu Sông Hàn', en: 'Han River Swing Bridge' },
    description: { vi: 'Cầu quay bắc qua sông Hàn ở trung tâm Đà Nẵng.', en: 'A swing bridge across the Han River in central Da Nang.' },
    lat: 16.0719, lng: 108.2265, radius: 300,
    icon: 'bridge', bg: ['#E4E6FF', '#A6ACF2'],
    referenceImages: [{ url: 'assets/reference/han-river-bridge.webp', credit: 'Ảnh trong bộ val của nhóm (model v4), chọn làm tham chiếu', license: 'Nguồn ảnh chưa ghi: kiểm tra quyền dùng trước khi phát hành' }], streetView: null,
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
    referenceImages: [{ url: 'assets/reference/apec-park.webp', credit: 'Ảnh trong bộ val của nhóm (model v4), chọn làm tham chiếu', license: 'Nguồn ảnh chưa ghi: kiểm tra quyền dùng trước khi phát hành' }], streetView: null,
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
    referenceImages: [{ url: 'assets/reference/linh-ung-lady-buddha.webp', credit: 'Ảnh trong bộ val của nhóm (model v4), chọn làm tham chiếu', license: 'Nguồn ảnh chưa ghi: kiểm tra quyền dùng trước khi phát hành' }], streetView: null,
    visualKeywords: ['tall white statue', 'pagoda tower', 'hillside by the sea'],
    built: { vi: 'Chùa Linh Ứng khánh thành năm 2010.', en: 'Linh Ung Pagoda opened in 2010.' },
    historicalSignificance: null, architecture: { vi: 'Tượng cao 67 mét, bằng một toà nhà khoảng 30 tầng; bên trong có 17 tầng.', en: 'The statue is 67 metres tall, as tall as a 30-floor building, with 17 floors inside.' },
    culturalBackground: { vi: 'Người dân tin tượng Quan Âm che chở ngư dân trên biển.', en: 'People believe she keeps fishermen safe at sea.' },
    interestingFacts: [
      { vi: 'Tượng quay lưng vào núi và nhìn ra biển.', en: 'The statue has its back to the mountain and looks at the sea.' },
      { vi: 'Một tay tượng cầm bình nước nhỏ.', en: 'She holds a small vase of water in one hand.' },
    ],
    vocab: [
      { word: 'statue', ipa: '/ˈstætʃuː/', en: 'a figure of a person made of stone or metal', vi: 'bức tượng', example: 'The white statue looks over the sea.' },
      { word: 'pagoda', ipa: '/pəˈɡəʊdə/', en: 'a Buddhist temple or tower', vi: 'chùa, tháp chùa', example: 'The statue stands at Linh Ung Pagoda.' },
      { word: 'peninsula', ipa: '/pəˈnɪnsjələ/', en: 'land with water on three sides', vi: 'bán đảo', example: 'The pagoda is on the Son Tra peninsula.' },
    ],
    topics: [
      { q: 'What can you see from here?', start: 'From here, I can see…' },
      { q: 'How would you describe the statue?', start: 'The statue is…' },
    ],
    sources: [{ label: 'docs/research-quan-am-ca-chep.md (Q1–Q3, Q6, Q9, Q10, Q12, Q14), pending teacher verification' }, { label: 'Danang Fantasticity – Linh Ung Pagoda', url: 'https://danangfantasticity.com/en/linh-ung-pagoda' }],
  },
  {
    id: 'dragon-carp', demo: true, verified: false, modelLabel: 'Cá chép rồng',
    name: { vi: 'Tượng Cá chép hoá Rồng', en: 'Dragon Carp statue' },
    description: { vi: 'Tượng đá cẩm thạch trắng ở bờ Đông sông Hàn, gần Cầu Rồng.', en: 'A white marble statue on the east bank of the Han River, near the Dragon Bridge.' },
    lat: 16.0617, lng: 108.2296, radius: 200,
    icon: 'dragon', bg: ['#E8F1FB', '#B8CFEA'],
    referenceImages: [{ url: 'assets/reference/dragon-carp.webp', credit: 'Ảnh trong bộ val của nhóm (model v4), chọn làm tham chiếu', license: 'Nguồn ảnh chưa ghi: kiểm tra quyền dùng trước khi phát hành' }], streetView: null,
    visualKeywords: ['white marble carp with a dragon head', 'stone base', 'river bank', 'Dragon Bridge behind'],
    built: { vi: 'Tượng được lắp đặt tháng 4/2015.', en: 'It was installed in April 2015.' },
    historicalSignificance: null,
    culturalBackground: { vi: 'Truyện kể cá chép vượt qua những con sóng lớn thì hoá thành rồng.', en: 'In the story, a carp jumps over big waves and becomes a dragon.' },
    architecture: { vi: 'Cao 7,5 mét, làm bằng đá cẩm thạch trắng, nặng gần 200 tấn.', en: '7.5 metres tall, made of white marble, almost 200 tonnes.' },
    interestingFacts: [
      { vi: 'Khoảng 30 nghệ nhân làng đá Non Nước làm tượng trong ba tháng.', en: 'About 30 artisans from Non Nuoc stone village made it in three months.' },
      { vi: 'Đầu rồng có thể phun nước.', en: 'The dragon head can spray water.' },
    ],
    vocab: [
      { word: 'carp', ipa: '/kɑːp/', en: 'a large fish that lives in rivers and lakes', vi: 'cá chép', example: 'The carp jumps over big waves.' },
      { word: 'marble', ipa: '/ˈmɑːbl/', en: 'a hard, smooth stone used for statues', vi: 'đá cẩm thạch', example: 'The statue is made of white marble.' },
      { word: 'wave', ipa: '/weɪv/', en: 'a moving line of water', vi: 'con sóng', example: 'The carp jumps over three big waves.' },
    ],
    topics: [
      { q: 'What does the carp become in the story?', start: 'In the story, the carp…' },
      { q: 'What is the statue made of?', start: 'It is made of…' },
    ],
    sources: [{ label: 'docs/research-quan-am-ca-chep.md (K1, K3–K7, K9, K13), pending teacher verification' }, { label: 'VietnamPlus (14/04/2015)', url: 'https://www.vietnamplus.vn/da-nang-lap-dat-thanh-cong-tuong-ca-chep-hoa-rong-nang-200-tan-post317561.vnp' }],
  },
]);

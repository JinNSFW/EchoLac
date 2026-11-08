/* EchoLạc — supported locations for camera learning.
   Admins add, edit or remove places here; no app code changes needed. Each record:
     id                    lowercase-dash id (used in links)
     demo, verified        demo = sample record; verified = a teacher has checked every fact (only then show in production)
     name {vi,en}, description {vi,en}
     lat, lng, radius      decimal degrees + GPS recognition radius in metres (sample coordinates are approximate: check on a map before production)
     icon, bg              illustration from assets/3d/ + two gradient colours, used when the learner has no photo
     referenceImages       [{ url, credit, license, sample? }] photos the team may use for image matching; sample = demo illustration, not a real photo
     streetView            { panoId, attribution } when Google Maps Platform terms permit; null otherwise. Never copy Street View imagery here.
     visualKeywords        what the landmark looks like, for the image-matching service
     built, historicalSignificance, culturalBackground, architecture   {vi,en} or null. null shows "not verified yet": never guess.
     interestingFacts      [{vi,en}] 3–5 facts
     vocab                 [{ word, ipa, en, vi, example, tip? {vi,en} }]  learning content (AI-drafted, teacher review pending)
     topics                [{ q, start }] English conversation questions + a sentence starter for A1–A2 learners
     sources               [{ label, url? }]
   Facts below come from EchoLạc's own scenario fact sheets, which are still awaiting teacher verification (PRD R-04). */
window.ECHOLAC_LOCATIONS = [
  {
    id: 'dragon-bridge', demo: true, verified: false,
    name: { vi: 'Cầu Rồng', en: 'Dragon Bridge' },
    description: { vi: 'Cây cầu bắc qua sông Hàn ở Đà Nẵng.', en: 'A bridge across the Han River in Da Nang.' },
    lat: 16.0612, lng: 108.2272, radius: 300,
    icon: 'dragon', bg: ['#DCE7FF', '#9DB7F4'],
    referenceImages: [{ url: 'assets/3d/dragon.png', credit: 'EchoLạc 3D icon set (illustration, not a photo)', license: 'assets/3d/LICENSE.txt', sample: true }], streetView: null,
    visualKeywords: ['dragon head', 'bridge over a river', 'arches'],
    built: { vi: 'Cầu khánh thành năm 2013.', en: 'It opened in 2013.' },
    historicalSignificance: null, culturalBackground: null, architecture: null,
    interestingFacts: [
      { vi: 'Cầu dài 666 mét.', en: 'It is 666 metres long.' },
      { vi: 'Cầu bắc qua sông Hàn.', en: 'It crosses the Han River.' },
      { vi: 'Tối thứ Bảy và Chủ nhật lúc 21 giờ, đầu rồng phun lửa và phun nước.', en: 'On Saturday and Sunday nights at 9 pm, the dragon head breathes fire and water.' },
    ],
    vocab: [
      { word: 'dragon', ipa: '/ˈdræɡən/', en: 'a large imaginary animal that can breathe fire', vi: 'con rồng', example: 'The dragon breathes fire.' },
      { word: 'breathe fire', ipa: '/briːð ˈfaɪə/', en: 'to send out fire from the mouth', vi: 'phun lửa', example: 'It breathes fire on weekends.', tip: { vi: '"breathe" kết thúc bằng /ð/: đặt lưỡi giữa hai hàm răng và rung nhẹ.', en: '"breathe" ends in /ð/: tongue between your teeth, with voice.' } },
      { word: 'weekend', ipa: '/ˌwiːkˈend/', en: 'Saturday and Sunday', vi: 'cuối tuần', example: 'Come on Saturday or Sunday night.' },
      { word: 'river', ipa: '/ˈrɪvə/', en: 'a long, natural flow of water', vi: 'dòng sông', example: 'The bridge crosses the Han River.' },
      { word: 'cross', ipa: '/krɒs/', en: 'to go from one side to the other', vi: 'bắc qua, băng qua', example: 'We can cross the river on this bridge.' },
    ],
    topics: [
      { q: 'What can visitors see at Dragon Bridge on weekend nights?', start: 'On weekend nights, visitors can see…' },
      { q: 'How would you describe this bridge to a tourist?', start: 'This bridge is…' },
      { q: 'When do you think is the best time to visit?', start: 'I think the best time is…' },
      { q: 'Would you recommend this place to a friend? Why?', start: 'Yes, I would, because…' },
    ],
    sources: [{ label: 'EchoLạc scenario fact sheet “Cầu Rồng” (pending teacher verification)' }],
  },
  {
    id: 'covered-bridge', demo: true, verified: false,
    name: { vi: 'Chùa Cầu', en: 'Japanese Covered Bridge' },
    description: { vi: 'Cây cầu có mái che nhỏ trong phố cổ Hội An.', en: 'A small covered bridge in Hoi An Ancient Town.' },
    lat: 15.8771, lng: 108.3262, radius: 120,
    icon: 'bridge', bg: ['#FDE3D6', '#F3AE96'],
    referenceImages: [{ url: 'assets/3d/bridge.png', credit: 'EchoLạc 3D icon set (illustration, not a photo)', license: 'assets/3d/LICENSE.txt', sample: true }], streetView: null,
    visualKeywords: ['small covered bridge', 'tiled roof', 'old town'],
    built: { vi: 'Cộng đồng người Nhật xây cầu vào khoảng những năm 1590.', en: 'The Japanese community built it in the 1590s.' },
    historicalSignificance: null, culturalBackground: null,
    architecture: { vi: 'Một bên cầu có một ngôi miếu nhỏ.', en: 'It has a small temple on one side.' },
    interestingFacts: [
      { vi: 'Cây cầu đã hơn 400 năm tuổi.', en: 'The bridge is more than 400 years old.' },
      { vi: 'Cây cầu được in trên tờ tiền 20.000 đồng.', en: 'It is pictured on the 20,000-dong banknote.' },
      { vi: 'Bên trong có một ngôi miếu nhỏ.', en: 'There is a small temple inside.' },
    ],
    vocab: [
      { word: 'covered', ipa: '/ˈkʌvəd/', en: 'having a roof or something over the top', vi: 'có mái che', example: 'It is a covered bridge.' },
      { word: 'temple', ipa: '/ˈtempl/', en: 'a building where people pray', vi: 'ngôi miếu, đền', example: 'There is a small temple inside.' },
      { word: 'banknote', ipa: '/ˈbæŋknəʊt/', en: 'a piece of paper money', vi: 'tờ tiền', example: 'It is on the 20,000-dong banknote.' },
      { word: 'century', ipa: '/ˈsentʃəri/', en: 'a period of 100 years', vi: 'thế kỷ', example: 'It was built in the 16th century.' },
      { word: 'community', ipa: '/kəˈmjuːnəti/', en: 'a group of people who live in the same place', vi: 'cộng đồng', example: 'The Japanese community built the bridge.', tip: { vi: 'Nhấn âm thứ hai: com-MU-ni-ty.', en: 'Stress the second syllable: com-MU-ni-ty.' } },
    ],
    topics: [
      { q: 'What is special about this bridge?', start: 'This bridge is special because…' },
      { q: 'Where can people see a picture of this bridge?', start: 'People can see it on…' },
      { q: 'How would you explain this place to a visitor from Japan?', start: 'This bridge was built by…' },
      { q: 'What do you like about old buildings like this?', start: 'I like old buildings because…' },
    ],
    sources: [{ label: 'EchoLạc scenario fact sheet “Chùa Cầu” (pending teacher verification)' }],
  },
  {
    id: 'hoi-an-ancient-town', demo: true, verified: false,
    name: { vi: 'Phố cổ Hội An', en: 'Hoi An Ancient Town' },
    description: { vi: 'Một thương cảng cổ, Di sản Thế giới UNESCO.', en: 'An ancient trading port and a UNESCO World Heritage Site.' },
    lat: 15.8775, lng: 108.3300, radius: 700,
    icon: 'houses', bg: ['#FFEBCB', '#FFC27F'],
    referenceImages: [{ url: 'assets/3d/houses.png', credit: 'EchoLạc 3D icon set (illustration, not a photo)', license: 'assets/3d/LICENSE.txt', sample: true }], streetView: null,
    visualKeywords: ['yellow merchant houses', 'lanterns', 'narrow streets'],
    built: null,
    historicalSignificance: { vi: 'Thương nhân Nhật, Hoa và châu Âu sống và buôn bán ở đây từ thế kỷ 15 đến 19.', en: 'Japanese, Chinese and European traders lived and traded here from the 15th to the 19th century.' },
    culturalBackground: null,
    architecture: { vi: 'Nhà cổ, hội quán và Chùa Cầu cho thấy dấu ấn của các thương nhân ấy.', en: 'Its merchant houses, assembly halls and the Japanese Covered Bridge show the mark of those traders.' },
    interestingFacts: [
      { vi: 'Phố cổ là Di sản Thế giới UNESCO từ năm 1999.', en: 'It has been a UNESCO World Heritage Site since 1999.' },
      { vi: 'Đêm 14 âm lịch hằng tháng, phố cổ tắt đèn điện và lung linh ánh đèn lồng.', en: 'On the 14th day of each lunar month, the old town turns off its electric lights and glows with lanterns.' },
      { vi: 'Đèn lồng Hội An có khung tre bọc lụa.', en: 'Hoi An lanterns are a bamboo frame covered with silk.' },
    ],
    vocab: [
      { word: 'ancient', ipa: '/ˈeɪnʃənt/', en: 'very old; from a long time ago', vi: 'cổ kính', example: 'Hoi An is an ancient trading port.', tip: { vi: '/ʃ/ ở giữa từ: tròn môi như "suỵt".', en: 'The middle sound is /ʃ/, like "shh".' } },
      { word: 'heritage', ipa: '/ˈherɪtɪdʒ/', en: 'important history and traditions passed down', vi: 'di sản', example: 'It is a World Heritage Site.' },
      { word: 'lantern', ipa: '/ˈlæntən/', en: 'a light with a cover around it', vi: 'đèn lồng', example: 'The lanterns are beautiful at night.' },
      { word: 'merchant', ipa: '/ˈmɜːtʃənt/', en: 'a person who buys and sells goods', vi: 'thương nhân', example: 'Merchants built these old houses.' },
      { word: 'narrow street', ipa: '/ˈnærəʊ striːt/', en: 'a street that is not wide', vi: 'con phố hẹp', example: 'Walk along the narrow streets.', tip: { vi: 'Nói /str/ liền một hơi, không chèn âm "ơ".', en: 'Say /str/ together, with no extra vowel.' } },
      { word: 'I recommend', ipa: '/aɪ ˌrekəˈmend/', en: 'a polite way to give advice', vi: 'tôi gợi ý', example: 'I recommend the Japanese Covered Bridge.' },
    ],
    topics: [
      { q: 'What can tourists see in Hoi An Ancient Town?', start: 'Tourists can see…' },
      { q: 'What happens here on the 14th day of the lunar month?', start: 'On that night, the old town…' },
      { q: 'What would you recommend a visitor do first?', start: 'I recommend…' },
      { q: 'Why do you think people want to protect old towns?', start: 'I think people protect old towns because…' },
    ],
    sources: [
      { label: 'UNESCO World Heritage List: Hoi An Ancient Town', url: 'https://whc.unesco.org/en/list/948' },
      { label: 'EchoLạc scenario fact sheets “Phố cổ Hội An”, “Làm đèn lồng” (pending teacher verification)' },
    ],
  },
  {
    id: 'marble-mountains', demo: true, verified: false,
    name: { vi: 'Ngũ Hành Sơn', en: 'Marble Mountains' },
    description: { vi: 'Năm ngọn núi đá vôi và cẩm thạch ở Đà Nẵng.', en: 'Five marble and limestone hills in Da Nang.' },
    lat: 16.0040, lng: 108.2630, radius: 500,
    icon: 'mountain', bg: ['#E3E6EE', '#B6C0D4'],
    referenceImages: [{ url: 'assets/3d/mountain.png', credit: 'EchoLạc 3D icon set (illustration, not a photo)', license: 'assets/3d/LICENSE.txt', sample: true }], streetView: null,
    visualKeywords: ['limestone hills', 'cave entrance', 'pagoda'],
    built: null, historicalSignificance: null, culturalBackground: null, architecture: null,
    interestingFacts: [
      { vi: 'Mỗi ngọn núi mang tên một hành: Kim, Thủy, Mộc, Hỏa, Thổ.', en: 'Each hill is named after one of the five elements: metal, water, wood, fire and earth.' },
      { vi: 'Du khách khám phá hang động và chùa.', en: 'Visitors explore caves and pagodas.' },
    ],
    vocab: [
      { word: 'marble', ipa: '/ˈmɑːbl/', en: 'a hard, smooth stone', vi: 'đá cẩm thạch', example: 'These hills are made of marble and limestone.' },
      { word: 'cave', ipa: '/keɪv/', en: 'a large hole in the side of a hill', vi: 'hang động', example: 'There are many caves inside.', tip: { vi: 'Giữ âm /v/ cuối: răng trên chạm môi dưới.', en: 'Keep the final /v/: top teeth on your bottom lip.' } },
      { word: 'pagoda', ipa: '/pəˈɡəʊdə/', en: 'a Buddhist temple building', vi: 'chùa', example: 'Visit the pagoda on the hill.' },
      { word: 'climb', ipa: '/klaɪm/', en: 'to go up using your feet and hands', vi: 'leo', example: 'You can climb to the top.' },
      { word: 'element', ipa: '/ˈelɪmənt/', en: 'one of the basic parts of nature', vi: 'nguyên tố, hành', example: 'Each hill is named after an element.' },
    ],
    topics: [
      { q: 'Why are these hills called the Marble Mountains?', start: 'They are called that because…' },
      { q: 'What can visitors do here?', start: 'Visitors can…' },
      { q: 'Would you like to climb to the top? Why?', start: 'I would like to climb because…' },
      { q: 'How would you describe this place to a friend?', start: 'It is a place with…' },
    ],
    sources: [{ label: 'EchoLạc scenario fact sheet “Ngũ Hành Sơn” (pending teacher verification)' }],
  },
  {
    id: 'han-market', demo: true, verified: false,
    name: { vi: 'Chợ Hàn', en: 'Han Market' },
    description: { vi: 'Khu chợ trong nhà nhộn nhịp gần sông Hàn.', en: 'A busy indoor market near the Han River.' },
    lat: 16.0683, lng: 108.2240, radius: 200,
    icon: 'bags', bg: ['#FCE4EF', '#EFAFCB'],
    referenceImages: [{ url: 'assets/3d/bags.png', credit: 'EchoLạc 3D icon set (illustration, not a photo)', license: 'assets/3d/LICENSE.txt', sample: true }], streetView: null,
    visualKeywords: ['market building', 'stalls', 'riverside street'],
    built: null, historicalSignificance: null, culturalBackground: null, architecture: null,
    interestingFacts: [
      { vi: 'Chợ bán đồ khô, đặc sản, quần áo và quà lưu niệm.', en: 'It sells dried food, local snacks, clothes and souvenirs.' },
    ],
    vocab: [
      { word: 'souvenir', ipa: '/ˌsuːvəˈnɪə/', en: 'something you buy to remember a place', vi: 'quà lưu niệm', example: 'This is a nice souvenir.', tip: { vi: 'Nhấn âm cuối: sou-ve-NIR.', en: 'Stress the last syllable: sou-ve-NIR.' } },
      { word: 'price', ipa: '/praɪs/', en: 'how much money something costs', vi: 'giá', example: 'What is the price?' },
      { word: 'discount', ipa: '/ˈdɪskaʊnt/', en: 'a lower price than usual', vi: 'giảm giá', example: 'Can I have a discount?' },
      { word: 'dried fruit', ipa: '/draɪd fruːt/', en: 'fruit with the water taken out', vi: 'trái cây sấy', example: 'Try the dried mango.', tip: { vi: 'Đừng bỏ /d/ cuối trong "dried".', en: 'Keep the final /d/ in "dried".' } },
    ],
    topics: [
      { q: 'What can people buy at Han Market?', start: 'People can buy…' },
      { q: 'What souvenir would you recommend?', start: 'I would recommend…' },
      { q: 'How do you ask for a discount politely?', start: 'You can say…' },
      { q: 'Do you prefer markets or shopping malls? Why?', start: 'I prefer… because…' },
    ],
    sources: [{ label: 'EchoLạc scenario fact sheet “Chợ Hàn” (pending teacher verification)' }],
  },
];

'use strict';
// EchoLạc clickable prototype. Mock data only: no real ASR, scoring or LLM yet (see AGENT.md for the target stack).

/* ================= Helpers ================= */
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem('lt:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('lt:' + k, JSON.stringify(v)); } catch { /* private mode: state lives in memory only */ } },
};
const iso = (d = new Date()) => d.toLocaleDateString('sv-SE');
const hhmm = () => new Date().toLocaleTimeString(S.lang === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' });
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const V = (vi, en) => (S.lang === 'vi' ? vi : en);
const L = o => (o && typeof o === 'object' ? o[S.lang] ?? o.en : o);
const fmt = n => n.toLocaleString(S.lang === 'vi' ? 'vi-VN' : 'en-US');

const I = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  micAi: '<rect x="8" y="5" width="6" height="10" rx="3"/><path d="M4.5 12a6.5 6.5 0 0 0 13 0M11 18.5V21"/><path d="M19 2v4M17 4h4"/>',
  radar: '<path d="M12 3 21 12 12 21 3 12z"/><path d="M12 8l3 4-3 5-4-5z"/>',
  user: '<circle cx="12" cy="12" r="9.5"/><circle cx="12" cy="10" r="3"/><path d="M6.8 18.6a6 6 0 0 1 10.4 0"/>',
  person: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  left: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  right: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  chevL: '<path d="m15 6-6 6 6 6"/>',
  chevR: '<path d="m9 6 6 6-6 6"/>',
  chevD: '<path d="m6 9 6 6 6-6"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  filter: '<path d="M3 5h18l-7 8.5V19l-4 2v-7.5z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.8-9.8M17 6l3 3M14.5 8.5l2 2"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7c1.9 0 3.5-.6 4.9-1.4M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  play: '<path d="M7 4.5v15l12.5-7.5z"/>',
  volume: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
  bulb: '<path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  cc: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 10.2a2.2 2.2 0 1 0 0 3.6M17 10.2a2.2 2.2 0 1 0 0 3.6"/>',
  gauge: '<path d="m12 14 4-4"/><path d="M3.3 19a10 10 0 1 1 17.4 0"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
  bookmark: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
  bolt: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
  cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  trend: '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
  star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/>',
};
const icon = (n, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${I[n]}</svg>`;
const img = (n, cls = '', alt = '') => `<img src="assets/3d/${n}.png" class="${cls}" alt="${alt}" loading="lazy">`;
const LOGO = (alt = 'EchoLạc') => `<img src="assets/logo.svg" alt="${alt}">`; // exported from echolac-logo.html
const GOOGLE = '<svg width="26" height="26" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';

/* ================= Content (mock; fact sheets need teacher verification, PRD R-04) ================= */
const SCEN = [
  { id: 'dragon', icon: 'dragon', cat: 'landmark', level: 'A1', min: 6, xp: 40, bg: ['#DCE7FF', '#9DB7F4'],
    name: { vi: 'Cầu Rồng', en: 'Dragon Bridge' }, en: 'Dragon Bridge',
    persona: { name: 'Liam', vi: 'Du khách ba lô từ Sydney', en: 'Backpacker from Sydney' },
    hello: "G'day! I'm Liam from Sydney. Someone told me this bridge breathes fire. Is that true?",
    facts: { vi: 'Khánh thành năm 2013, dài 666 mét. Tối thứ Bảy và Chủ nhật lúc 21 giờ, đầu rồng phun lửa và phun nước.', en: 'Opened in 2013, 666 metres long. On Saturday and Sunday nights at 9 pm the head breathes fire and water.' },
    vocab: [['dragon', '/ˈdræɡən/', 'con rồng', 'The dragon breathes fire.'], ['breathe fire', '/briːð ˈfaɪə/', 'phun lửa', 'It breathes fire on weekends.'], ['weekend', '/ˌwiːkˈend/', 'cuối tuần', 'Come on Saturday or Sunday night.'], ['river', '/ˈrɪvə/', 'dòng sông', 'The bridge crosses the Han River.']] },
  { id: 'hoian', icon: 'houses', cat: 'landmark', level: 'A2', min: 8, xp: 50, bg: ['#FFEBCB', '#FFC27F'],
    name: { vi: 'Phố cổ Hội An', en: 'Hoi An Ancient Town' }, en: 'Hoi An Ancient Town',
    persona: { name: 'Emma', vi: 'Du khách đến từ London', en: 'Tourist from London' },
    facts: { vi: 'Di sản Thế giới UNESCO từ năm 1999. Nhà cổ, hội quán và Chùa Cầu cho thấy dấu ấn của thương nhân Nhật, Hoa và châu Âu từ thế kỷ 15 đến 19.', en: 'A UNESCO World Heritage Site since 1999. Its merchant houses, assembly halls and the Japanese Covered Bridge show how Japanese, Chinese and European traders lived here from the 15th to the 19th century.' },
    vocab: [['ancient', '/ˈeɪnʃənt/', 'cổ kính', 'Hoi An is an ancient trading port.'], ['heritage', '/ˈherɪtɪdʒ/', 'di sản', 'It is a World Heritage Site.'], ['lantern', '/ˈlæntən/', 'đèn lồng', 'The lanterns are beautiful at night.'], ['merchant', '/ˈmɜːtʃənt/', 'thương nhân', 'Merchants built these old houses.'], ['narrow street', '/ˈnærəʊ striːt/', 'con phố hẹp', 'Walk along the narrow streets.'], ['full moon', '/ˌfʊl ˈmuːn/', 'trăng rằm', 'There is a festival on the full moon.'], ['tailor', '/ˈteɪlə/', 'thợ may', 'You can visit a tailor shop.'], ['I recommend', '/aɪ ˌrekəˈmend/', 'tôi gợi ý', 'I recommend the Japanese Covered Bridge.']] },
  { id: 'bridge', icon: 'bridge', cat: 'landmark', level: 'A2', min: 7, xp: 50, bg: ['#FDE3D6', '#F3AE96'],
    name: { vi: 'Chùa Cầu', en: 'Japanese Covered Bridge' }, en: 'Japanese Covered Bridge',
    persona: { name: 'Kenji', vi: 'Du khách đến từ Osaka', en: 'Traveller from Osaka' },
    hello: "Konnichiwa! I'm Kenji from Osaka. Is this the Japanese Covered Bridge? Why is it called that?",
    facts: { vi: 'Do cộng đồng người Nhật xây vào khoảng những năm 1590, có một ngôi miếu nhỏ ở một bên cầu. Cây cầu được in trên tờ tiền 20.000 đồng.', en: 'Built by the Japanese community in the 1590s, with a small temple on one side. It is pictured on the 20,000-dong banknote.' },
    vocab: [['bridge', '/brɪdʒ/', 'cây cầu', 'The bridge is over 400 years old.'], ['temple', '/ˈtempl/', 'ngôi miếu', 'There is a small temple inside.'], ['banknote', '/ˈbæŋknəʊt/', 'tờ tiền', 'It is on the 20,000-dong banknote.'], ['century', '/ˈsentʃəri/', 'thế kỷ', 'It was built in the 16th century.']] },
  { id: 'han', icon: 'bags', cat: 'food', level: 'A1', min: 6, xp: 40, bg: ['#FCE4EF', '#EFAFCB'],
    name: { vi: 'Chợ Hàn', en: 'Han Market' }, en: 'Han Market',
    persona: { name: 'Priya', vi: 'Blogger ẩm thực từ Mumbai', en: 'Food blogger from Mumbai' },
    hello: "Hi! I'm Priya. What should I buy at Han Market as a souvenir?",
    facts: { vi: 'Khu chợ trong nhà nhộn nhịp gần sông Hàn, bán đồ khô, đặc sản, quần áo và quà lưu niệm.', en: 'A busy indoor market near the Han River selling dried food, local snacks, clothes and souvenirs.' },
    vocab: [['souvenir', '/ˌsuːvəˈnɪə/', 'quà lưu niệm', 'This is a nice souvenir.'], ['price', '/praɪs/', 'giá', 'What is the price?'], ['discount', '/ˈdɪskaʊnt/', 'giảm giá', 'Can I have a discount?'], ['dried fruit', '/draɪd fruːt/', 'trái cây sấy', 'Try the dried mango.']] },
  { id: 'food', icon: 'bowl', cat: 'food', level: 'A1', min: 7, xp: 40, bg: ['#FFF1D4', '#F6CB7E'],
    name: { vi: 'Cao lầu & mì Quảng', en: 'Cao lầu & mì Quảng' }, en: 'Cao lầu and mì Quảng',
    persona: { name: 'Tom', vi: 'Đầu bếp từ New York', en: 'Chef from New York' },
    hello: "Hey, I'm Tom, a chef from New York. What is cao lầu? I really want to try it!",
    facts: { vi: 'Cao lầu là món mì của Hội An với thịt heo, rau sống và bánh đa giòn. Mì Quảng dùng sợi mì vàng nghệ to bản với ít nước dùng đậm đà.', en: 'Cao lầu is a Hoi An noodle dish with pork, fresh herbs and crispy crackers. Mì Quảng uses wide turmeric noodles with a little rich broth.' },
    vocab: [['noodles', '/ˈnuːdlz/', 'mì, sợi mì', 'Cao lầu noodles are chewy.'], ['herbs', '/hɜːbz/', 'rau thơm', 'Add some fresh herbs.'], ['spicy', '/ˈspaɪsi/', 'cay', 'Is it spicy?'], ['delicious', '/dɪˈlɪʃəs/', 'ngon', 'Mì Quảng is delicious.']] },
  { id: 'mykhe', icon: 'beach', cat: 'landmark', level: 'A1', min: 6, xp: 40, bg: ['#D5F2F6', '#8ED2E5'],
    name: { vi: 'Biển Mỹ Khê', en: 'My Khe Beach' }, en: 'My Khe Beach',
    persona: { name: 'Sofia', vi: 'Người lướt sóng từ Tây Ban Nha', en: 'Surfer from Spain' },
    hello: "Hola! I'm Sofia. Is My Khe Beach good for swimming today?",
    facts: { vi: 'Bãi biển cát dài ở Đà Nẵng, được yêu thích để tắm biển, lướt sóng và ngắm bình minh.', en: 'A long sandy beach in Da Nang, popular for swimming, surfing and watching the sunrise.' },
    vocab: [['sunrise', '/ˈsʌnraɪz/', 'bình minh', 'The sunrise here is amazing.'], ['wave', '/weɪv/', 'con sóng', 'The waves are good for surfing.'], ['sunscreen', '/ˈsʌnskriːn/', 'kem chống nắng', "Don't forget your sunscreen."], ['seafood', '/ˈsiːfuːd/', 'hải sản', 'Try the fresh seafood.']] },
  { id: 'marble', icon: 'mountain', cat: 'landmark', level: 'A2', min: 8, xp: 50, bg: ['var(--tint-2)', '#B6C0D4'],
    name: { vi: 'Ngũ Hành Sơn', en: 'Marble Mountains' }, en: 'Marble Mountains',
    persona: { name: 'David', vi: 'Thầy giáo về hưu từ Canada', en: 'Retired teacher from Canada' },
    hello: "Hello, I'm David from Canada. Why are these hills called the Marble Mountains?",
    facts: { vi: 'Năm ngọn núi đá vôi và cẩm thạch mang tên ngũ hành: Kim, Thủy, Mộc, Hỏa, Thổ. Du khách khám phá hang động và chùa.', en: 'Five marble and limestone hills named after the five elements: metal, water, wood, fire and earth. Visitors explore caves and pagodas.' },
    vocab: [['cave', '/keɪv/', 'hang động', 'There are many caves inside.'], ['pagoda', '/pəˈɡəʊdə/', 'chùa', 'Visit the pagoda on the hill.'], ['climb', '/klaɪm/', 'leo', 'You can climb to the top.'], ['element', '/ˈelɪmənt/', 'nguyên tố', 'Each hill is named after an element.']] },
  { id: 'homestay', icon: 'hotel', cat: 'hospitality', level: 'A2', min: 8, xp: 50, bg: ['#E3F4E9', '#A6DBBB'],
    name: { vi: 'Nhận phòng homestay', en: 'Homestay check-in' }, en: 'Homestay check-in',
    persona: { name: 'Anna', vi: 'Khách đến từ Đức', en: 'Guest from Germany' },
    hello: 'Good afternoon! I\'m Anna. I have a booking for two nights.',
    facts: { vi: 'Đón khách: chào hỏi, hộ chiếu, nội quy phòng, Wi-Fi, giờ ăn sáng và gợi ý địa phương.', en: 'Welcoming guests: greeting, passport, room rules, Wi-Fi, breakfast time and local tips.' },
    vocab: [['check in', '/ˌtʃek ˈɪn/', 'nhận phòng', 'You can check in at 2 pm.'], ['passport', '/ˈpɑːspɔːt/', 'hộ chiếu', 'May I see your passport?'], ['breakfast', '/ˈbrekfəst/', 'bữa sáng', 'Breakfast is from 7 to 9.'], ['hotel', '/həʊˈtel/', 'khách sạn', 'Our homestay is quieter than a hotel.']] },
  { id: 'directions', icon: 'compass', cat: 'hospitality', level: 'A1', min: 6, xp: 40, bg: ['#EAE4FC', '#BCAEF0'],
    name: { vi: 'Chỉ đường', en: 'Giving directions' }, en: 'Giving directions',
    persona: { name: 'Lucas', vi: 'Sinh viên đến từ Pháp', en: 'Student from France' },
    hello: "Excuse me, I'm Lucas. How can I get to Han Market from here?",
    facts: { vi: 'Giúp du khách tìm đường: rẽ trái/phải, đi thẳng, nằm cạnh, mất năm phút đi bộ.', en: "Helping visitors find places: turn left or right, go straight, it's next to, it takes five minutes on foot." },
    vocab: [['turn left', '/tɜːn left/', 'rẽ trái', 'Turn left at the corner.'], ['straight', '/streɪt/', 'thẳng', 'Go straight for 200 metres.'], ['opposite', '/ˈɒpəzɪt/', 'đối diện', 'It is opposite the bank.'], ['on foot', '/ɒn fʊt/', 'đi bộ', 'It takes five minutes on foot.']] },
  { id: 'lantern', icon: 'lantern', cat: 'hospitality', level: 'B1', min: 10, xp: 60, bg: ['#FFE2D8', '#F6A68B'],
    name: { vi: 'Làm đèn lồng', en: 'Lantern making' }, en: 'Lantern making',
    persona: { name: 'Mia', vi: 'Hoạ sĩ đến từ Melbourne', en: 'Artist from Melbourne' },
    hello: "Hi, I'm Mia. Can you show me how to make a Hoi An lantern?",
    facts: { vi: 'Đèn lồng Hội An có khung tre bọc lụa. Đêm 14 âm lịch hằng tháng, phố cổ tắt đèn điện và lung linh ánh đèn lồng.', en: 'Hoi An lanterns are a bamboo frame covered with silk. On the 14th day of each lunar month the old town turns off its lights and glows with lanterns.' },
    vocab: [['bamboo', '/bæmˈbuː/', 'tre', 'The frame is made of bamboo.'], ['silk', '/sɪlk/', 'lụa', 'We cover it with silk.'], ['glue', '/ɡluː/', 'keo dán', 'Use glue on the edges.'], ['shape', '/ʃeɪp/', 'hình dáng', 'Choose a round shape.']] },
];
const scen = id => SCEN.find(s => s.id === id) || SCEN[1];
const CATS = { landmark: { vi: 'Địa danh', en: 'Landmarks' }, food: { vi: 'Ẩm thực & chợ', en: 'Food & market' }, hospitality: { vi: 'Đón khách', en: 'Hospitality' } };

// Vietnamese-learner error taxonomy, PRD §6
const ERR_CAT = {
  final_consonant: { vi: 'Âm cuối', en: 'Final sounds' }, s_ed_ending: { vi: 'Đuôi -s/-ed', en: '-s/-ed endings' },
  cluster: { vi: 'Cụm phụ âm', en: 'Clusters' }, th: { vi: 'Âm "th"', en: '"th" sounds' },
  sibilant: { vi: 'Âm /ʃ/ /s/', en: '/ʃ/ /s/ sounds' }, vowel_length: { vi: 'Nguyên âm dài', en: 'Vowel length' },
  word_stress: { vi: 'Trọng âm', en: 'Word stress' }, rhythm: { vi: 'Nhịp điệu', en: 'Rhythm' }, grammar: { vi: 'Ngữ pháp', en: 'Grammar' },
};
const WORDS = {
  nice: { ipa: '/naɪs/', hl: 's', cat: 'final_consonant', mean: 'đẹp, dễ chịu', tip: { vi: 'Đừng bỏ âm /s/ cuối. Nói "nai" rồi đặt lưỡi sau răng trên và thổi nhẹ "sss".', en: 'Keep the final /s/. Say "nai", then put your tongue behind your top teeth and hiss a soft "sss".' } },
  think: { ipa: '/θɪŋk/', hl: 'θ', cat: 'th', mean: 'nghĩ', tip: { vi: 'Đặt đầu lưỡi giữa hai hàm răng rồi thổi hơi nhẹ cho /θ/. Đừng đọc thành "tinh".', en: 'Put your tongue tip between your teeth and blow softly for /θ/, not /t/.' } },
  street: { ipa: '/striːt/', hl: 'str', cat: 'cluster', mean: 'con phố', tip: { vi: 'Nói /s/-/t/-/r/ liền một hơi, không chèn âm "ơ": không phải "sơ-trít".', en: 'Say /s/-/t/-/r/ together with no extra vowel: not "suh-treet".' } },
  hotel: { ipa: '/həʊˈtel/', hl: 'ˈtel', cat: 'word_stress', mean: 'khách sạn', tip: { vi: 'Nhấn âm tiết thứ hai: ho-TEL. Nói "TEL" to và dài hơn.', en: 'Stress the second syllable: ho-TEL. Make "TEL" louder and longer.' } },
  ship: { ipa: '/ʃɪp/', hl: 'ʃ', cat: 'sibilant', mean: 'con tàu', tip: { vi: '/ʃ/ giống tiếng "suỵt": tròn môi, lưỡi lùi về sau. Âm /s/ thì môi dẹt.', en: '/ʃ/ is the "shh" sound: round your lips and pull your tongue back.' } },
  beach: { ipa: '/biːtʃ/', hl: 'iː', cat: 'vowel_length', mean: 'bãi biển', tip: { vi: 'Kéo dài /iː/ và cười rộng môi. Đọc ngắn thành /ɪ/ sẽ ra một từ khác.', en: 'Stretch /iː/ with a wide smile; a short /ɪ/ makes a different word.' } },
};
const day = n => { const d = new Date(); d.setDate(d.getDate() - n); return iso(d); };
const SEED_ERRORS = [
  { id: 'w-nice', word: 'nice', ...WORDS.nice, scen: 'dragon', best: 52, attempts: [41, 52], days: [], status: 'open', at: 5 },
  { id: 'w-think', word: 'think', ...WORDS.think, scen: 'dragon', best: 45, attempts: [45], days: [], status: 'open', at: 4 },
  { id: 'w-street', word: 'street', ...WORDS.street, scen: 'dragon', best: 58, attempts: [50, 58], days: [], status: 'open', at: 3 },
  { id: 'w-hotel', word: 'hotel', ...WORDS.hotel, scen: 'dragon', best: 61, attempts: [61], days: [], status: 'open', at: 2 },
  { id: 'w-ship', word: 'ship', ...WORDS.ship, scen: 'dragon', best: 84, attempts: [70, 84], days: [day(2)], status: 'open', at: 1 },
  { id: 'w-beach', word: 'beach', ...WORDS.beach, scen: 'dragon', best: 90, attempts: [76, 85, 90], days: [day(6), day(4)], status: 'mastered', at: 0 },
];

// Scripted demo conversation for the polished scenario; others use genericTalk
const TALK = {
  hoian: [
    { ai: "Hello! I'm Emma from London. Is this Hoi An Ancient Town? It looks so beautiful!" },
    { me: 'Yes, this is Hoi An Ancient Town. It is very old and nice.', pron: [['nice', 54]] },
    { ai: 'It really is! How old is the town?' },
    { me: 'It have more than four hundred years.', gram: { fix: 'It is more than four hundred years old.', why: { vi: 'Nói tuổi dùng "be ... years old", không dùng "have".', en: 'Use "be ... years old" to talk about age, not "have".' } } },
    { ai: "Wow, that's amazing! What should I see first?" },
    { me: 'I think you should visit the Japanese Covered Bridge.', pron: [['think', 48]] },
    { ai: 'Great idea! Can I see lanterns here at night?' },
    { me: 'Yes! On full moon nights, the street have many lantern.', pron: [['street', 57]], gram: { fix: 'Yes! On full moon nights, the street has many lanterns.', why: { vi: '"The street" là số ít nên dùng "has"; nhiều đèn lồng thì thêm -s: "lanterns".', en: '"The street" is singular, so use "has"; many lanterns need -s: "lanterns".' } } },
    { ai: "That sounds magical. Thank you so much, you're a wonderful guide!" },
  ],
};
const genericTalk = s => [
  { ai: s.hello },
  { me: 'Yes! I think you will like it. It is very nice.', pron: [['think', 52]] },
  { ai: 'Great! What else do you recommend?' },
  { me: 'You should come back at night. It is more beautiful.' },
  { ai: 'Thank you so much! You are very helpful.' },
];

// Four criteria, PRD §7.1
const CRIT = [
  { k: 'fluency', icon: 'speech', name: { vi: 'Lưu loát', en: 'Fluency' }, d: { vi: 'Tốc độ & ngắt nghỉ', en: 'Pace & pauses' },
    subs: [[{ vi: 'Tốc độ nói', en: 'Speech rate' }, 66], [{ vi: 'Ngắt nghỉ dài', en: 'Long pauses' }, 55], [{ vi: 'Ngập ngừng', en: 'Hesitations' }, 60], [{ vi: 'Duy trì hội thoại', en: 'Keeping it going' }, 67]] },
  { k: 'vocab', icon: 'books', name: { vi: 'Từ vựng', en: 'Vocabulary' }, d: { vi: 'Độ đa dạng & từ mục tiêu', en: 'Range & target words' },
    subs: [[{ vi: 'Độ đa dạng', en: 'Range' }, 70], [{ vi: 'Dùng từ mục tiêu', en: 'Target words used' }, 78], [{ vi: 'Dùng từ phù hợp', en: 'Word choice' }, 65]] },
  { k: 'grammar', icon: 'brain', name: { vi: 'Ngữ pháp', en: 'Grammar' }, d: { vi: 'Thì & hoà hợp chủ–vị', en: 'Tense & agreement' },
    subs: [[{ vi: 'Lỗi trên 100 từ', en: 'Errors per 100 words' }, 52], [{ vi: 'Thì & hoà hợp', en: 'Tense & agreement' }, 55], [{ vi: 'Độ phức tạp câu', en: 'Sentence complexity' }, 67]] },
  { k: 'pron', icon: 'mic', name: { vi: 'Phát âm', en: 'Pronunciation' }, d: { vi: 'Âm cuối & trọng âm', en: 'Final sounds & stress' },
    subs: [[{ vi: 'Âm cuối', en: 'Final sounds' }, 38], [{ vi: 'Cụm phụ âm', en: 'Clusters' }, 47], [{ vi: 'Âm "th"', en: '"th" sounds' }, 44], [{ vi: 'Trọng âm', en: 'Word stress' }, 58], [{ vi: 'Ngữ điệu', en: 'Intonation' }, 60]] },
];
const HISTORY = { fluency: [44, 48, 51, 55, 58], vocab: [58, 61, 63, 66, 69], grammar: [40, 44, 47, 50, 54], pron: [32, 35, 38, 41, 45] };
const PREV = { fluency: 55, vocab: 66, grammar: 50, pron: 41 };
const CEFR = [[90, 'C1+', { vi: 'Vượt mục tiêu của ứng dụng', en: 'Above this product’s target range' }], [75, 'B2', { vi: 'Giao tiếp trôi chảy, tự nhiên về nhiều chủ đề', en: 'Interacts fluently on a range of topics' }], [60, 'B1', { vi: 'Mô tả trải nghiệm và địa điểm khá trôi chảy', en: 'Describes experiences and places with reasonable fluency' }], [40, 'A2', { vi: 'Trao đổi ngắn về chủ đề quen thuộc', en: 'Manages short exchanges on familiar topics' }], [0, 'A1', { vi: 'Trao đổi rất đơn giản, đã luyện trước', en: 'Handles very simple, rehearsed exchanges' }]];
const JOURNEY = ['dragon', 'hoian', 'bridge', 'han', 'food', 'mykhe', 'marble', 'homestay', 'directions', 'lantern'];
const RATES = { slow: 0.75, medium: 0.95, fast: 1.15 };
const ACCENTS = [['en-GB', 'Anh', 'UK'], ['en-US', 'Mỹ', 'US'], ['en-IN', 'Ấn', 'IN'], ['en-AU', 'Úc', 'AU']];
const GENDERS = [['male', 'Nam', 'Male'], ['female', 'Nữ', 'Female'], ['other', 'Khác', 'Other']];

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

/* ================= State ================= */
const S = {
  lang: store.get('lang', 'vi'),
  user: store.get('user', null),
  settings: store.get('settings', { accent: 'en-GB', rate: 'medium', subs: true }),
  errors: store.get('errors', SEED_ERRORS),
  scores: store.get('scores', { fluency: 62, vocab: 71, grammar: 58, pron: 49 }),
  xp: store.get('xp', 1240),
  sessions: store.get('sessions', 12),
  minutes: store.get('minutes', 96),
  done: store.get('done', ['dragon']),
  place: store.get('place', 'other'),
  streak: 3, // days in a row before today
  today: store.get('today', { date: iso(), min: 0 }),
  rpMode: 'journey', libCat: 'all', tutorCat: 'all', weekOff: 0, heard: new Set(),
};
if (S.today.date !== iso()) S.today = { date: iso(), min: 0 };
if (!S.user && new URLSearchParams(location.search).has('demo')) S.user = { name: 'Nguyễn Thị Lan' }; // ?demo skips sign-in for pitch demos
const save = () => ['lang', 'user', 'settings', 'errors', 'scores', 'xp', 'sessions', 'minutes', 'done', 'today', 'place'].forEach(k => store.set(k, S[k]));
const level = () => Math.floor(S.xp / 250) + 1;
const streakNow = () => S.streak + (S.today.min > 0 ? 1 : 0);
const avgScore = () => Math.round(CRIT.reduce((a, c) => a + S.scores[c.k], 0) / CRIT.length);
const cefr = v => CEFR.find(([min]) => v >= min);
const weakest = () => CRIT.reduce((w, c) => (S.scores[c.k] < S.scores[w.k] ? c : w));
const nextScen = () => scen(JOURNEY.find(id => !S.done.includes(id)) || 'hoian');
const stopState = i => (S.done.includes(JOURNEY[i]) ? 'done' : i <= S.done.length + 1 ? 'open' : 'locked');
const isLocked = id => stopState(JOURNEY.indexOf(id)) === 'locked';

/* ================= UI primitives ================= */
const ringSvg = (pct, r = 36, w = 8, color = 'var(--navy)', bg = 'rgba(255,255,255,.55)') => {
  const c = 2 * Math.PI * r, size = (r + w) * 2;
  return `<svg viewBox="0 0 ${size} ${size}" aria-hidden="true"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${bg}" stroke-width="${w}"/><circle class="fg" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c}" data-off="${c * (1 - pct / 100)}"/></svg>`;
};
const ipaHl = e => (e.hl ? esc(e.ipa).replace(esc(e.hl), `<span class="hl">${esc(e.hl)}</span>`) : esc(e.ipa || ''));
const scoreColor = v => (v >= 80 ? 'var(--success)' : v >= 60 ? 'var(--primary)' : 'var(--lantern-b)');
const langToggle = () => `<div class="lang-toggle" role="group" aria-label="${V('Ngôn ngữ', 'Language')}">${['vi', 'en'].map(l => `<button class="${S.lang === l ? 'on' : ''}" onclick="setLang('${l}')">${l.toUpperCase()}</button>`).join('')}</div>`;
const tutorSay = (html, d = 0, extra = '') => `<div class="tutor-say reveal ${extra}" style="--d:${d}ms"><div class="av">${LOGO('AI Tutor')}</div><div class="bubble">${html}</div></div>`;

function speak(text, opts = {}) {
  if (!('speechSynthesis' in window)) return Promise.resolve();
  return new Promise(res => {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = S.settings.accent;
    u.rate = opts.rate ?? RATES[S.settings.rate];
    const v = speechSynthesis.getVoices().find(x => x.lang.replace('_', '-') === u.lang);
    if (v) u.voice = v;
    u.onend = u.onerror = res;
    speechSynthesis.speak(u);
    setTimeout(res, 400 + text.length * 90); // some browsers never fire onend
  });
}
const stopAudio = () => { try { speechSynthesis.cancel(); } catch { /* unsupported */ } };

let toastTimer;
function toast(msg) {
  const el = $('#toast'); el.textContent = msg; el.classList.add('on');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('on'), 2400);
}
function openSheet(html) {
  const root = $('#sheet-root');
  root.innerHTML = `<div class="scrim" onclick="closeSheet()"></div><div class="sheet" role="dialog" aria-modal="true"><div class="grip"></div>${html}</div>`;
  requestAnimationFrame(() => root.querySelectorAll('.scrim,.sheet').forEach(e => e.classList.add('on')));
  root.querySelectorAll('[data-off]').forEach(c => setTimeout(() => (c.style.strokeDashoffset = c.dataset.off), 250));
  root.querySelectorAll('[data-w]').forEach(b => setTimeout(() => (b.style.width = b.dataset.w), 250));
}
function closeSheet() {
  const root = $('#sheet-root');
  root.querySelectorAll('.scrim,.sheet').forEach(e => e.classList.remove('on'));
  setTimeout(() => { if (!root.querySelector('.sheet.on')) root.innerHTML = ''; }, 400);
}
function confetti() {
  const box = document.createElement('div'); box.className = 'confetti';
  box.innerHTML = Array.from({ length: 16 }, (_, i) => `<img src="assets/3d/${['lantern', 'sparkles', 'star'][i % 3]}.png" alt="" style="left:${Math.random() * 92}%;animation-delay:${Math.random() * 0.6}s">`).join('');
  document.body.append(box); setTimeout(() => box.remove(), 2600);
}

/* ================= Place themes ================= */
const F = { ready: false, gender: '', placeType: 'hometown', placeId: '' }; // onboarding choices that are not plain inputs
const ageOf = d => (d ? (Date.now() - new Date(d)) / 31557600000 : -1);
const placeSub = t => (t === 'destination'
  ? V('Nơi bạn sắp đến: luyện trước những câu sẽ dùng ở đó.', 'Where you are heading: practise the phrases you will need there.')
  : V('Nơi bạn lớn lên: kể chuyện quê nhà bằng tiếng Anh.', 'Where you grew up: tell its story in English.'));
const placeCards = (sel, fn) => Object.entries(THEMES).map(([id, t]) => `
  <button type="button" class="place ${sel === id ? 'on' : ''}" data-place="${id}" aria-pressed="${sel === id}" style="--sw:linear-gradient(180deg,${t.c.bg1},${t.c.primary})" onclick="${fn}('${id}',event)">
    ${img(t.icon)}<span><b>${L(t.name)}</b><small>${L(t.scene)}</small></span></button>`).join('');
const themeNote = id => (id
  ? `${img(theme(id).icon)}<span>${V('Giao diện', 'Theme')}: <b>${L(theme(id).scene)}</b></span>`
  : `✨ ${V('Chọn một nơi, giao diện sẽ đổi theo cảnh sắc nơi đó.', 'Pick a place and the whole app takes on its scenery.')}`);
const rnd = (a, b) => a + Math.random() * (b - a);
function particles(type, n, band = [4, 55]) {
  const [s0, s1, t0, t1] = { petal: [8, 14, 9, 16], mist: [160, 260, 30, 50], star: [2, 4, 1.5, 3.5] }[type];
  return Array.from({ length: n }, () => {
    const s = rnd(s0, s1), t = rnd(t0, t1);
    const pos = type === 'mist' ? `top:${rnd(...band).toFixed(0)}%;left:-${s.toFixed(0)}px`
      : type === 'star' ? `top:${rnd(...band).toFixed(0)}%;left:${rnd(3, 97).toFixed(0)}%` : `left:${rnd(0, 96).toFixed(0)}%`;
    const dx = type === 'mist' ? '760px' : `${rnd(-60, 60).toFixed(0)}px`;
    return `<i class="fx ${type}" style="${pos};--s:${s.toFixed(1)}px;--t:${t.toFixed(1)}s;--dl:-${rnd(0, t).toFixed(1)}s;--dx:${dx}"></i>`;
  }).join('');
}
// Writes one :root[data-theme] block per entry of THEMES, so colours have a single source
function installThemes() {
  const css = Object.entries(THEMES).map(([id, t]) => `:root[data-theme="${id}"]{${Object.entries(t.c).map(([k, v]) => `--${k}:${v}`).join(';')}}`).join('\n');
  document.head.insertAdjacentHTML('beforeend', `<style id="themes">${css}</style>`);
}
// Crossfade: the new layer fades in while the old one fades out (400 ms)
function swapLayer(host, html) {
  host.querySelectorAll('.layer').forEach(l => { l.classList.add('leave'); setTimeout(() => l.remove(), 450); });
  host.insertAdjacentHTML('beforeend', `<div class="layer scene">${html}</div>`);
}
function applyTheme(id, from) {
  const t = theme(id);
  document.documentElement.dataset.theme = THEMES[id] ? id : 'other';
  $('meta[name="theme-color"]').content = t.c.bg1;
  swapLayer($('.bg'), `${t.pattern ? `<div class="pattern" style="background:${t.pattern}"></div>` : ''}${t.frame ? `<div class="frame" style="background:${t.frame}"></div>` : ''}${t.land ? `<div class="land">${t.land()}</div>` : ''}`);
  swapLayer($('.fx-layer'), t.fx ? t.fx() : '');
  if (from) {
    const b = document.createElement('i'); b.className = 'burst';
    b.style.left = from.x + 'px'; b.style.top = from.y + 'px';
    document.body.append(b); setTimeout(() => b.remove(), 800);
  }
}
// Open the app with ?test: every theme must keep text contrast >= 4.5:1 (WCAG AA)
function selfTest() {
  const lum = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return +((x + 0.05) / (y + 0.05)).toFixed(2); };
  const rows = Object.entries(THEMES).map(([id, { c }]) => ({ id, 'navy/bg1': cr(c.navy, c.bg1), 'muted/bg1': cr(c.muted, c.bg1), 'muted/card': cr(c.muted, c['card-blue']), 'faint/white': cr(c.faint, '#FFFFFF'), 'faint/bg1': cr(c.faint, c.bg1), 'white/navy-2': cr('#FFFFFF', c['navy-2']) }));
  const bad = rows.flatMap(r => Object.entries(r).filter(([k, v]) => k !== 'id' && v < 4.5).map(([k, v]) => `${r.id} ${k} ${v}`));
  console.table(rows);
  console.assert(!bad.length, 'Contrast below 4.5:1 →', bad);
  return bad;
}

/* ================= Scroll reveal ================= */
function show(el) {
  el.classList.add('in');
  el.querySelectorAll('[data-off]').forEach(c => (c.style.strokeDashoffset = c.dataset.off));
  el.querySelectorAll('[data-w]').forEach(b => (b.style.width = b.dataset.w));
  el.querySelectorAll('[data-left]').forEach(b => (b.style.left = b.dataset.left));
}
const io = 'IntersectionObserver' in window
  ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } }), { threshold: 0.08, rootMargin: '0px 0px -24px 0px' })
  : null;
const observe = root => root.querySelectorAll('.reveal:not(.in)').forEach(el => (io ? io.observe(el) : show(el)));

/* ================= Views ================= */
const field = (id, label, ico, type, ph, d, opts = {}) => `
  <div class="field reveal" style="--d:${d}ms"><label for="${id}">${label}</label>
    <div class="input-wrap">${icon(ico)}<input id="${id}" type="${type}" placeholder="${ph}" autocomplete="${opts.ac || 'off'}" ${opts.attrs || ''}>
      <span class="ok-badge" data-ok="${id}">${icon('check')}</span>
      ${type === 'password' ? `<button type="button" class="eye" onclick="toggleEye(this,'${id}')" aria-label="${V('Hiện mật khẩu', 'Show password')}" style="color:var(--faint)">${icon('eye')}</button>` : ''}
    </div>${opts.after || ''}</div>`;

const steps = n => `<div class="steps reveal" role="progressbar" aria-valuemin="1" aria-valuemax="2" aria-valuenow="${n}" aria-label="${V('Tiến trình', 'Progress')}"><span class="on"></span><span class="${n > 1 ? 'on' : ''}"></span><b>${V('Bước', 'Step')} ${n}/2</b></div>`;
const authHead = (title, sub, back = 'history.length>1&&(event.preventDefault(),history.back())') => `
  <div class="topbar reveal">
    <a class="icon-btn" href="#signup" onclick="${back}" aria-label="${V('Quay lại', 'Back')}">${icon('left')}</a>
    <div class="grow center"><h1 class="grad-title" style="font-size:26px">${title}</h1><p class="small muted mt-8" style="font-size:13px">${sub}</p></div>
    <button class="icon-btn" style="font-weight:700;font-size:13px" onclick="setLang('${S.lang === 'vi' ? 'en' : 'vi'}')" aria-label="${V('Switch to English', 'Chuyển sang tiếng Việt')}">${S.lang === 'vi' ? 'EN' : 'VI'}</button>
  </div>
  <div class="tile-3d logo-tile reveal zoom" style="--d:120ms">${LOGO()}</div>`;

const VIEWS = {
  signup: {
    render: () => `
      ${steps(1)}
      ${authHead(V('Tạo tài khoản', 'Create Account'), V('Cùng kể chuyện quê hương bằng tiếng Anh', 'Tell your hometown’s story in English'), 'event.preventDefault();location.reload()')}
      <form id="f" class="mt-32" novalidate>
        ${field('name', V('Họ và tên', 'Full name'), 'person', 'text', V('Nhập họ và tên', 'Enter your full name'), 0, { ac: 'name' })}
        ${field('email', 'Gmail', 'mail', 'email', 'tenban@gmail.com', 60, { ac: 'email', after: `<p class="field-hint" id="email-hint" hidden>${V('Vui lòng dùng địa chỉ Gmail (…@gmail.com).', 'Please use a Gmail address (…@gmail.com).')}</p>` })}
        ${field('dob', V('Ngày sinh', 'Date of birth'), 'cal', 'date', '', 120, { ac: 'bday', attrs: `min="1920-01-01" max="${iso()}"` })}
        <div class="field reveal" style="--d:180ms"><span class="label" id="g-lbl">${V('Giới tính', 'Gender')}</span>
          <div class="choice-row" role="radiogroup" aria-labelledby="g-lbl" onkeydown="radioKeys(event)">${GENDERS.map(([k, vi, en], i) => `<button type="button" class="choice ${F.gender === k ? 'on' : ''}" role="radio" aria-checked="${F.gender === k}" tabindex="${F.gender === k || (!F.gender && i === 0) ? 0 : -1}" data-v="${k}" onclick="pickGender('${k}')">${V(vi, en)}</button>`).join('')}</div>
        </div>
        <label class="check-box reveal"><input type="checkbox" id="terms"><span>${V('Tôi đồng ý với <b class="link">Điều khoản dịch vụ</b> và <b class="link">Chính sách bảo mật</b>.', 'I agree to the <b class="link">Terms of Service</b> and <b class="link">Privacy Policy</b>.')}</span></label>
        <label class="check-box" id="guardian-box" hidden><input type="checkbox" id="guardian"><span>${V('Mình dưới 18 tuổi và cha mẹ hoặc người giám hộ đã đồng ý cho mình dùng EchoLạc.', 'I am under 18 and my parent or guardian agrees to me using EchoLạc.')}</span></label>
        <button class="btn mt-24 reveal" id="submit" disabled>${V('Tạo tài khoản', 'Create Account')} ${icon('right')}</button>
      </form>
      <div class="divider reveal"><span>${V('Hoặc tiếp tục với', 'Or continue with')}</span></div>
      <div class="social reveal"><button type="button" onclick="googleSignIn()" aria-label="Google">${GOOGLE}</button></div>
      <div class="switch-auth reveal">${V('Đã có tài khoản?', 'Already have an account?')} <a href="#signin">${V('Đăng nhập', 'Sign in')}</a></div>`,
    mount() {
      const f = $('#f'), val = id => $('#' + id).value.trim(), u = S.user;
      if (u) { // back from step 2: keep everything already typed
        $('#name').value = u.name || ''; $('#email').value = u.email || ''; $('#dob').value = u.dob || '';
        if (u.gender) pickGender(u.gender);
        $('#terms').checked = !!u.consent?.terms; $('#guardian').checked = !!u.consent?.guardian;
      }
      const check = () => {
        const age = ageOf($('#dob').value), email = val('email'), minor = age >= 0 && age < 18;
        const ok = { name: val('name').length >= 2, email: /^[^\s@]+@gmail\.com$/i.test(email), dob: age >= 6 && age <= 100 };
        Object.entries(ok).forEach(([k, v]) => $(`[data-ok="${k}"]`)?.classList.toggle('on', v));
        $('#email-hint').hidden = ok.email || !email.includes('@');
        $('#guardian-box').hidden = !minor;
        $('#submit').disabled = !(ok.name && ok.email && ok.dob && F.gender && $('#terms').checked && (!minor || $('#guardian').checked));
      };
      window.signupCheck = check;
      f.addEventListener('input', check); f.addEventListener('change', check);
      check();
      f.addEventListener('submit', e => {
        e.preventDefault(); if ($('#submit').disabled) return;
        const minor = ageOf($('#dob').value) < 18;
        S.user = { ...(S.user || {}), name: val('name'), email: val('email'), dob: $('#dob').value, gender: F.gender, consent: { terms: true, guardian: minor && $('#guardian').checked } };
        save(); location.hash = '#place';
      });
    },
  },

  signin: {
    render: () => `
      ${authHead(V('Đăng nhập', 'Sign In'), V('Chào mừng trở lại! Tiếp tục luyện nói nhé', 'Welcome back! Keep practising'))}
      <div class="seg mt-32 reveal" role="tablist">
        <button id="m-email" class="on" onclick="signinMode('email')">${V('Email', 'Email')}</button>
        <button id="m-code" onclick="signinMode('code')">${V('Mã lớp', 'Class code')}</button>
      </div>
      <form id="f" class="mt-24" novalidate>
        <div id="by-email">
          ${field('email', V('Email', 'Email Address'), 'mail', 'email', V('Nhập địa chỉ email', 'Enter your email address'), 0, { ac: 'email' })}
          ${field('pw', V('Mật khẩu', 'Password'), 'lock', 'password', V('Nhập mật khẩu', 'Enter your password'), 60, { ac: 'current-password' })}
        </div>
        <div id="by-code" hidden>
          ${field('code', V('Mã lớp do giáo viên cấp', 'Class code from your teacher'), 'key', 'text', V('VD: PCT-11A2', 'e.g. PCT-11A2'), 0)}
          ${field('name', V('Tên của bạn', 'Your name'), 'person', 'text', V('Nhập tên', 'Enter your name'), 60, { ac: 'name' })}
        </div>
        <button class="btn mt-32 reveal" id="submit" disabled>${V('Đăng nhập', 'Sign in')}</button>
      </form>
      <div class="divider reveal"><span>${V('Hoặc tiếp tục với', 'Or continue with')}</span></div>
      <div class="social reveal"><button type="button" onclick="googleSignIn()" aria-label="Google">${GOOGLE}</button></div>
      <div class="switch-auth reveal">${V('Chưa có tài khoản?', 'New here?')} <a href="#signup">${V('Đăng ký', 'Sign up')}</a></div>`,
    mount() {
      const f = $('#f'), val = id => $('#' + id).value.trim();
      const check = () => {
        const byCode = !$('#by-code').hidden;
        const ok = { email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val('email')), pw: $('#pw').value.length >= 6, code: val('code').length >= 4, name: val('name').length >= 2 };
        Object.entries(ok).forEach(([k, v]) => $(`[data-ok="${k}"]`)?.classList.toggle('on', v));
        $('#submit').disabled = byCode ? !(ok.code && ok.name) : !(ok.email && ok.pw);
      };
      f.addEventListener('input', check);
      f.addEventListener('submit', e => {
        e.preventDefault(); if ($('#submit').disabled) return;
        S.user = { name: $('#by-code').hidden ? val('email').split('@')[0] : val('name') }; save(); location.hash = '#home';
      });
      window.signinCheck = check;
    },
  },

  // Onboarding step 2: hometown / destination picker that themes the whole app live (X-06)
  place: {
    init() { // first visit: start from what the account already holds; later visits keep the unsaved choice
      if (F.ready) return;
      F.ready = true; F.placeType = S.user.placeType || 'hometown'; F.placeId = S.user.placeId || '';
    },
    render: () => `
      ${steps(2)}
      <div class="topbar between reveal" style="margin-bottom:8px">
        <a class="icon-btn" href="#signup" aria-label="${V('Quay lại bước 1', 'Back to step 1')}">${icon('left')}</a>
        <button type="button" class="skip" onclick="skipPlace()">${V('Bỏ qua', 'Skip')}</button>
      </div>
      <h1 class="center grad-title reveal" style="font-size:26px">${V('Nơi gắn bó với bạn', 'Your place')}</h1>
      <p class="center muted mt-8 reveal" id="place-sub">${placeSub(F.placeType)}</p>
      <div class="seg mt-24 reveal" role="radiogroup" aria-label="${V('Loại địa điểm', 'Kind of place')}" onkeydown="radioKeys(event)">
        ${[['hometown', 'Quê hương', 'Hometown'], ['destination', 'Điểm đến', 'Destination']].map(([k, vi, en]) => `<button type="button" role="radio" data-v="${k}" class="${F.placeType === k ? 'on' : ''}" aria-checked="${F.placeType === k}" tabindex="${F.placeType === k ? 0 : -1}" onclick="pickType('${k}')">${V(vi, en)}</button>`).join('')}
      </div>
      <div class="place-grid mt-24 reveal">${placeCards(F.placeId, 'previewPlace')}</div>
      <p class="theme-note reveal" id="theme-note" aria-live="polite">${themeNote(F.placeId)}</p>
      <div class="sticky-cta"><button class="btn" id="start" onclick="startJourney()" ${F.placeId ? '' : 'disabled'}>${V('Bắt đầu hành trình', 'Start my journey')} ${icon('right')}</button></div>`,
  },

  home: {
    render() {
      const w = weakest(), s = nextScen(), goal = clamp(Math.round((S.today.min / 15) * 100), 0, 100);
      const rec = w.k === 'pron'
        ? { href: '#tutor', text: V(`Âm cuối đang là điểm yếu nhất. Luyện ${S.errors.filter(e => e.status === 'open').length} từ trong Gia sư để giữ chuỗi ngày học nhé!`, `Final sounds are your weakest point. Practise ${S.errors.filter(e => e.status === 'open').length} words in Tutor to keep your streak!`) }
        : { href: '#scenario/' + s.id, text: V(`${L(w.name)} là điểm yếu nhất. Hãy trò chuyện ở "${L(s.name)}" hôm nay.`, `${L(w.name)} is your weakest area. Try "${L(s.name)}" today.`) };
      return `
      <header class="row between reveal">
        <div class="row">
          <div class="avatar">${img('student', '', '')}<span class="online"></span></div>
          <div><div class="row" style="gap:8px"><span class="hello">${V('Chào', 'Hi')} ${esc(S.user.name.split(' ').pop())}!</span><span class="pill navy">Lv. ${level()}</span></div>
          <div class="xp-line">${img('bolt')} ${fmt(S.xp)} XP${S.place !== 'other' ? ` · <span class="place-chip">${img(theme(S.place).icon)} ${L(theme(S.place).name)}</span>` : ''}</div></div>
        </div>
        <button class="icon-btn" onclick="toast(V('Chưa có thông báo mới','No new notifications'))" aria-label="${V('Thông báo', 'Notifications')}">${icon('bell')}<span class="badge-dot"></span></button>
      </header>
      <a class="card blue hero reveal" href="${rec.href}" style="--d:80ms;display:block">
        ${img('target', 'peek')}
        <h2>${V('Luyện tập hôm nay!', 'Today’s practice!')}</h2>
        <p>${rec.text}</p>
        <div class="row mt-16">
          <div class="grow"><div class="track"><i data-w="${goal}%"></i><span class="knob" data-left="${goal}%" style="left:0"></span></div>
          <div class="tiny muted mt-8">${S.today.min}/15 ${V('phút hôm nay', 'min today')}</div></div>
          <span class="go-btn">${icon('right')}</span>
        </div>
      </a>
      <section class="card reveal mt-24">
        <div class="row between">
          <div class="row" style="gap:10px">${img('fire', '', '').replace('class=""', 'style="width:26px;height:26px"')}<h2 style="font-size:17px;font-weight:600">${V('Chuỗi ngày học', 'Daily Streak')}</h2></div>
          <span class="pill beige">${streakNow()} ${V('ngày', 'days')}</span>
        </div>
        <div class="week mt-24">${weekDays(0).map(d => `<div><div class="lbl">${d.lbl}</div><div class="flame ${d.on ? 'on' : ''} ${d.today && !d.on ? 'today' : ''}">${d.on ? img('fire') : '<i></i>'}</div></div>`).join('')}</div>
      </section>
      <section class="card reveal" id="cal">${calendarHtml()}</section>
      <div class="section-title reveal"><span>${V('Kỹ năng của bạn', 'Your skills at a glance')}</span><a href="#radar">${V('Xem tất cả', 'View all')}</a></div>
      <div class="grid2">
        ${CRIT.map((c, i) => `
          <a class="skill-card reveal" style="--d:${i * 70}ms" href="#radar">
            ${img(c.icon, 'peek')}
            <div class="ring">${ringSvg(S.scores[c.k])}<b>${S.scores[c.k]}%</b></div>
            <h3>${L(c.name)}</h3><p>${L(c.d)}</p>
          </a>`).join('')}
      </div>
      <div class="section-title reveal"><span>${V('Tiếp tục hành trình', 'Continue your journey')}</span><a href="#roleplay">${V('Bản đồ', 'Map')}</a></div>
      <a class="card soft reveal continue" href="#scenario/${s.id}">
        <div class="grow">
          <div class="row" style="gap:10px"><span class="play-sm">${icon('play', 'sm')}</span><b>${L(s.name)}</b></div>
          <p class="small muted mt-8">${V('Trò chuyện với', 'Talk with')} ${s.persona.name} · ${s.min} ${V('phút', 'min')} · ${s.level}</p>
        </div>
        <span class="go-btn" style="width:60px;height:60px">${icon('play')}</span>
      </a>`;
    },
  },

  roleplay: {
    render: () => `
      <div class="topbar reveal">
        <h1>${V('Nhập vai', 'Roleplay')}</h1>
        <div class="stats-mini"><span>${img('star')} ${fmt(S.xp)} XP</span><span style="color:var(--lantern-b)">${img('fire')} ${streakNow()}</span></div>
      </div>
      <div class="seg reveal" role="tablist">
        <button class="${S.rpMode === 'journey' ? 'on' : ''}" onclick="setRpMode('journey')">${V('Hành trình', 'Journey')}</button>
        <button class="${S.rpMode === 'library' ? 'on' : ''}" onclick="setRpMode('library')">${V('Tất cả tình huống', 'All scenarios')}</button>
      </div>
      <div id="rp-body">${S.rpMode === 'journey' ? journeyHtml() : libraryHtml()}</div>`,
  },

  scenario: {
    render(id) {
      const s = scen(id);
      return `
      <div class="topbar centered reveal">
        <a class="icon-btn" href="#roleplay" aria-label="${V('Quay lại', 'Back')}">${icon('left')}</a>
        <h1 style="font-size:19px">${V('Chi tiết tình huống', 'Scenario details')}</h1>
        <button class="icon-btn sq" onclick="toast(V('Đã lưu tình huống','Scenario saved'))" aria-label="${V('Lưu', 'Save')}">${icon('bookmark')}</button>
      </div>
      <section class="card reveal">
        <div class="detail-head">
          <div class="tile-3d" style="background:linear-gradient(145deg,${s.bg[0]},${s.bg[1]})">${img(s.icon)}</div>
          <div class="grow"><h2>${s.en}</h2><div class="sub">${s.name.vi} · ${L(CATS[s.cat])}</div>
            <div class="meta-row"><span>${icon('clock')} ${s.min} ${V('phút', 'min')}</span><span>${icon('star')} ${s.level}</span><span>${icon('bolt')} ${s.xp} XP</span></div></div>
        </div>
        <div class="row between mt-24 small"><b>${V('Chuẩn bị từ vựng', 'Vocabulary ready')}</b><b id="vc">0/${s.vocab.length}</b></div>
        <div class="track blue light mt-8"><i id="vbar" style="width:0"></i></div>
        <div class="row between tiny muted mt-8"><span>${V('Nghe từng từ trước khi nói', 'Listen to each word before you speak')}</span><span>${s.vocab.length} ${V('từ', 'words')}</span></div>
      </section>
      <section class="mt-24 reveal">
        <div class="small muted row" style="gap:6px">${icon('person', 'sm')} ${V('Bạn sẽ nói chuyện với', 'You will talk with')}</div>
        <div class="persona mt-8"><span class="face">${s.persona.name[0]}</span><div><b>${s.persona.name}</b><div class="small muted">${L(s.persona)}</div></div></div>
      </section>
      <section class="card soft reveal mt-24">
        <div class="row" style="gap:10px">${icon('book')}<b>${V('Về địa điểm này', 'About this place')}</b></div>
        <p class="muted mt-8">${L(s.facts)}</p>
        <div class="row mt-16" style="flex-wrap:wrap;gap:8px">${s.vocab.slice(0, 4).map(v => `<span class="tag">${v[0]}</span>`).join('')}</div>
      </section>
      <section class="card reveal mt-24">
        <div class="unit-head"><span class="unit-num">1</span><div class="grow"><div class="small muted">${V('Bước 1', 'Step 1')}</div><b>${V('Học từ vựng', 'Learn the words')}</b></div><span class="tag green">${s.vocab.length} ${V('từ', 'words')}</span></div>
        <div class="mt-16">${s.vocab.map((v, i) => `
          <div class="vocab reveal" style="--d:${i * 50}ms">
            <span class="n">${i + 1}</span>
            <div class="grow"><div class="w">${v[0]} <span class="ipa">${v[1]}</span></div><div class="m">${v[2]}</div><div class="ex">“${v[3]}”</div></div>
            <button class="play" onclick="hear(this,'${s.id}',${i})" aria-label="${V('Nghe', 'Listen')} ${v[0]}">${icon('volume')}</button>
          </div>`).join('')}</div>
      </section>
      <section class="card reveal">
        <div class="unit-head"><span class="unit-num">2</span><div class="grow"><div class="small muted">${V('Bước 2', 'Step 2')}</div><b>${V(`Trò chuyện với ${s.persona.name}`, `Talk with ${s.persona.name}`)}</b></div>${icon('chat')}</div>
        <p class="small muted mt-8">${V('Khoảng 4–8 lượt nói. AI tự ghi lại lỗi phát âm và ngữ pháp.', 'About 4–8 turns. The AI notes your pronunciation and grammar slips automatically.')}</p>
      </section>
      <section class="card reveal">
        <div class="unit-head"><span class="unit-num">3</span><div class="grow"><div class="small muted">${V('Bước 3', 'Step 3')}</div><b>${V('Sửa lỗi trong Gia sư', 'Fix them in Tutor')}</b></div>${icon('micAi')}</div>
      </section>
      <div class="sticky-cta reveal"><a class="btn" href="#talk/${s.id}">${icon('mic')} ${V('Bắt đầu nói', 'Start talking')}</a></div>`;
    },
  },

  talk: {
    render(id) {
      const s = scen(id);
      return `
      <div class="talk">
        <div class="talk-top">
          <div class="topbar">
            <a class="icon-btn" href="#scenario/${s.id}" aria-label="${V('Thoát', 'Leave')}">${icon('left')}</a>
            <div class="grow"><h1>${L(s.name)}</h1><div class="who">${V('Đang nói chuyện với', 'Talking with')} ${s.persona.name} · ${L(s.persona)}</div></div>
            <button class="icon-btn" onclick="talkSettings()" aria-label="${V('Cài đặt giọng nói', 'Voice settings')}">${icon('sliders')}</button>
          </div>
          <div class="turns"><span id="turn-lbl"></span><div class="track light"><i id="turn-bar" style="width:0;background:var(--primary)"></i></div></div>
        </div>
        <div class="msgs" id="msgs" aria-live="polite"></div>
        <div class="dock">
          <div class="dock-row">
            <button class="side" onclick="helpMe()"><span class="icon-btn">${icon('bulb')}</span>${V('Gợi ý', 'Help me')}</button>
            <button class="mic-btn" id="mic" onclick="micTap()" disabled aria-label="${V('Nhấn để nói', 'Tap to speak')}">${icon('mic')}</button>
            <button class="side" onclick="toggleSubs()"><span class="icon-btn" id="cc-btn" style="${S.settings.subs ? 'background:var(--navy);color:#fff' : ''}">${icon('cc')}</span>${V('Phụ đề', 'Subtitles')}</button>
          </div>
          <div class="hint" id="mic-hint">${V('Đợi nhân vật nói xong…', 'Wait for your partner…')}</div>
          <div class="disclaimer">${V('Thông tin địa danh lấy từ fact sheet do giáo viên kiểm duyệt.', 'Landmark facts come from a teacher-verified fact sheet.')}</div>
        </div>
      </div>`;
    },
    mount: id => startTalk(id),
  },

  tutor: {
    render() {
      const open = S.errors.filter(e => e.status === 'open'), mastered = S.errors.filter(e => e.status === 'mastered');
      const cats = [...new Set(S.errors.map(e => e.cat))];
      const first = open[0];
      return `
      <div class="topbar reveal">
        <div class="grow"><h1>${V('Gia sư phát âm', 'Pronunciation Tutor')}</h1><p class="small muted">${V('Lỗi tự động lưu từ các cuộc trò chuyện', 'Errors saved automatically from your conversations')}</p></div>
        <div class="stats-mini"><span style="color:var(--lantern-b)">${img('fire')} ${streakNow()}</span></div>
      </div>
      ${tutorSay(first ? V(`Bạn có <b>${open.length}</b> mục cần luyện. Bắt đầu với “<b>${esc(first.word)}</b>” nhé — chỉ mất 1 phút thôi!`, `You have <b>${open.length}</b> items to practise. Let’s start with “<b>${esc(first.word)}</b>” — it takes one minute!`) : V('Không còn lỗi nào! Đi trò chuyện để tìm thử thách mới nhé.', 'Nothing to fix! Go have a conversation to find new challenges.'), 60)}
      <div class="stat3 mt-24">
        <div class="card reveal"><b style="color:var(--lantern-b)">${open.length}</b><span>${V('Cần luyện', 'To practise')}</span></div>
        <div class="card reveal" style="--d:60ms"><b>${mastered.filter(e => e.days.at(-1) <= day(3)).length}</b><span>${V('Ôn hôm nay', 'Review today')}</span></div>
        <div class="card reveal" style="--d:120ms"><b style="color:var(--success)">${mastered.length}</b><span>${V('Thành thạo', 'Mastered')}</span></div>
      </div>
      <div class="chips mt-24 reveal">
        <button class="chip ${S.tutorCat === 'all' ? 'active' : ''}" onclick="setTutorCat('all')">${V('Tất cả', 'All')}</button>
        ${cats.map(c => `<button class="chip ${S.tutorCat === c ? 'active' : ''}" onclick="setTutorCat('${c}')">${L(ERR_CAT[c])}</button>`).join('')}
      </div>
      <div class="mt-8" id="tq">${tutorList()}</div>
      ${open.length ? '' : `<a class="btn mt-24 reveal" href="#roleplay">${icon('chat')} ${V('Đi trò chuyện', 'Start a conversation')}</a>`}`;
    },
  },

  practice: {
    render(id) {
      const list = sortedErrors(), e = S.errors.find(x => x.id === id) || list[0];
      if (!e) { location.hash = '#tutor'; return ''; }
      const idx = list.indexOf(e), next = list[(idx + 1) % list.length], s = scen(e.scen), sentence = e.word.includes(' ');
      return `
      <div class="topbar centered reveal">
        <a class="icon-btn" href="#tutor" aria-label="${V('Quay lại', 'Back')}">${icon('left')}</a>
        <h1 style="font-size:19px">${V('Luyện phát âm', 'Practice')}</h1>
        <span class="pill white">${idx + 1}/${list.length}</span>
      </div>
      <section class="card word-card reveal zoom">
        <span class="tag amber">${L(ERR_CAT[e.cat])}</span>
        ${e.wrong ? `<div class="compare bad mt-16" style="text-align:left"><small>${V('Bạn đã nói', 'You said')}</small>${esc(e.wrong)}</div>` : ''}
        <div class="big ${sentence ? 'sentence' : ''}">${esc(e.word)}</div>
        ${e.ipa ? `<div class="ipa-big">${ipaHl(e)}</div>` : ''}
        <div class="small muted mt-8">${e.mean ? esc(e.mean) + ' · ' : ''}${V('từ', 'from')} ${L(s.name)}</div>
        <div class="row mt-24" style="justify-content:center;gap:10px;flex-wrap:wrap">
          <button class="btn soft sm" onclick="speak(${esc(JSON.stringify(e.word))})">${icon('volume', 'sm')} ${V('Nghe mẫu', 'Listen')}</button>
          <button class="btn white sm" onclick="speak(${esc(JSON.stringify(e.word))},{rate:.6})">🐢 ${V('Chậm', 'Slow')}</button>
        </div>
      </section>
      ${tutorSay(`<b>${V('Cách sửa', 'How to fix it')}</b><br>${esc(L(e.tip))}<br><span class="small muted">${V('Bạn nên nói:', 'You should say:')} “${esc(e.word)}”</span>`, 0, 'mt-24')}
      <section class="card reveal mt-24 center">
        <div class="score-ring" id="sr">${ringSvg(e.best, 62, 12, scoreColor(e.best), 'var(--line)')}<div class="val"><div><b id="sv">${e.best}</b><span>${V('điểm cao nhất', 'best score')}</span></div></div></div>
        <p class="mt-16" id="fbt">${V('Nhấn micro và đọc to từ trên.', 'Tap the mic and say the word out loud.')}</p>
        <div class="attempts mt-16" id="att">${attemptsHtml(e)}</div>
      </section>
      <section class="card reveal">
        <div class="row between small"><b>${V('Tiến độ thành thạo', 'Mastery')}</b><span class="muted tiny">${V('≥80 điểm trong 2 ngày khác nhau', '≥80 on 2 different days')}</span></div>
        <div class="mastery-steps mt-8" id="ms">${masteryHtml(e)}</div>
      </section>
      <div class="dock mt-16">
        <div class="dock-row" style="justify-content:center;gap:32px">
          <button class="side" onclick="speak(${esc(JSON.stringify(e.word))})"><span class="icon-btn">${icon('volume')}</span>${V('Nghe', 'Listen')}</button>
          <button class="mic-btn" id="pmic" onclick="practiceRec('${e.id}')" aria-label="${V('Ghi âm', 'Record')}">${icon('mic')}</button>
          <a class="side" href="#practice/${next.id}"><span class="icon-btn">${icon('right')}</span>${V('Tiếp', 'Next')}</a>
        </div>
        <div class="hint" id="pm-hint">${V('Nhấn để ghi âm', 'Tap to record')}</div>
      </div>`;
    },
  },

  radar: {
    render() {
      const avg = avgScore(), [, band, desc] = cefr(avg), w = weakest();
      const best = CRIT.reduce((b, c) => (S.scores[c.k] - PREV[c.k] > S.scores[b.k] - PREV[b.k] ? c : b));
      return `
      <div class="topbar reveal">
        <div class="grow"><h1>${V('Bản đồ lỗi', 'Error Radar')}</h1><p class="small muted">${V('Trung bình 5 phiên gần nhất', 'Average of your last 5 sessions')}</p></div>
        <span class="pill navy">${band} · ${V('ước tính', 'estimate')}</span>
      </div>
      <section class="card reveal">
        <div class="radar-wrap">${radarSvg()}${CRIT.map((c, i) => {
          const pos = [[50, 7], [91, 50], [50, 93], [9, 50]][i];
          return `<button class="axis-lbl ${c.k === w.k ? 'weak' : ''}" style="left:${pos[0]}%;top:${pos[1]}%" onclick="critSheet('${c.k}')">${L(c.name)}<b>${S.scores[c.k]}%</b></button>`;
        }).join('')}</div>
        <div class="legend"><span><i></i>${V('Hiện tại', 'Now')}</span><span><i class="dash"></i>${V('Tháng trước', 'Last month')}</span></div>
        <p class="tiny muted center mt-8">${V('Chạm vào từng tiêu chí để xem chi tiết', 'Tap a criterion to see details')}</p>
      </section>
      ${tutorSay(V(`${L(best.name)} tiến bộ nhanh nhất (+${S.scores[best.k] - PREV[best.k]}). <b>${L(w.name)}</b> vẫn là điểm yếu lớn nhất — đặc biệt là ${w.k === 'pron' ? 'âm cuối' : L(w.subs.reduce((a, b) => (b[1] < a[1] ? b : a))[0]).toLowerCase()}. Luyện 5 phút mỗi ngày nhé!`, `${L(best.name)} improved the most (+${S.scores[best.k] - PREV[best.k]}). <b>${L(w.name)}</b> is still your biggest challenge — especially ${w.k === 'pron' ? 'final sounds' : L(w.subs.reduce((a, b) => (b[1] < a[1] ? b : a))[0]).toLowerCase()}. Five minutes a day will help!`), 0, 'mt-24')}
      <div class="section-title reveal"><span>${V('Bốn tiêu chí', 'Four criteria')}</span></div>
      <section class="card reveal">${CRIT.map(c => {
        const v = S.scores[c.k], dlt = v - PREV[c.k];
        return `<div class="crit">
          <span class="ic">${img(c.icon)}</span>
          <div class="grow"><div class="row between"><span class="nm">${L(c.name)}</span><span><b>${v}%</b> <span class="delta">${dlt >= 0 ? '▲' : '▼'} ${Math.abs(dlt)}</span></span></div>
            <div class="track light"><i data-w="${v}%" style="background:${scoreColor(v)}"></i></div>
            ${v < 65 ? `<button class="btn sm lantern mt-8" style="height:36px" onclick="practiseThis('${c.k}')">${V('Luyện ngay', 'Practise this')} ${icon('right', 'sm')}</button>` : ''}
          </div></div>`;
      }).join('')}</section>
      <section class="card reveal mt-24">
        <div class="cefr"><div class="band">${band}</div><div><b>${V('Trình độ ước tính', 'Estimated level')}</b><p class="small muted">${L(desc)}</p></div></div>
        <p class="tiny muted mt-16">${V('Đây chỉ là ước tính từ điểm AI, không phải chứng chỉ chính thức.', 'This is an estimate from AI scores, not an official certificate.')}</p>
      </section>
      <div class="section-title reveal"><span>${V('Tiến bộ 6 tuần', '6-week progress')}</span></div>
      <section class="card reveal line-chart">${lineChart()}
        <div class="grid2 mt-16" style="gap:12px">
          <div class="stat-tile" style="box-shadow:none;background:var(--tint)"><b style="margin:0">${S.sessions}</b><span>${V('phiên luyện tập', 'sessions')}</span></div>
          <div class="stat-tile" style="box-shadow:none;background:var(--tint)"><b style="margin:0">${S.minutes}</b><span>${V('phút đã nói', 'minutes spoken')}</span></div>
        </div>
      </section>`;
    },
  },

  profile: {
    render() {
      const lv = level(), toNext = lv * 250 - S.xp, pct = Math.round(((S.xp % 250) / 250) * 100), mastered = S.errors.filter(e => e.status === 'mastered').length;
      const ach = [
        ['speech', V('Cuộc trò chuyện đầu tiên', 'First conversation'), V('Hoàn thành tình huống đầu tiên', 'Finished your first scenario'), S.sessions > 0],
        ['lantern', V('Hướng dẫn viên Hội An', 'Hoi An guide'), V('Hoàn thành Phố cổ Hội An', 'Completed Hoi An Ancient Town'), S.done.includes('hoian')],
        ['calendar', V('Chiến binh 7 ngày', 'Week warrior'), V('Chuỗi 7 ngày luyện tập', '7-day practice streak'), streakNow() >= 7],
        ['target', V('Thợ săn âm cuối', 'Final-sound hunter'), V('Thành thạo 3 từ âm cuối', 'Master 3 final-sound words'), S.errors.filter(e => e.cat === 'final_consonant' && e.status === 'mastered').length >= 3],
        ['bolt', V('Nhà vô địch XP', 'XP champion'), V('Đạt 5.000 XP', 'Earn 5,000 XP'), S.xp >= 5000],
      ];
      return `
      <div class="profile-head reveal">
        <div class="row between"><a class="icon-btn" href="#home" aria-label="${V('Quay lại', 'Back')}">${icon('left')}</a><a class="icon-btn sq" href="#settings" onclick="event.preventDefault();$('#settings').scrollIntoView({behavior:'smooth'})" aria-label="${V('Cài đặt', 'Settings')}">${icon('sliders')}</a></div>
        <div class="big-avatar">${img('student')}<span class="pill navy lv">Lv.${lv}</span></div>
        <h2 class="center mt-16" style="font-size:24px;font-weight:700">${esc(S.user.name)}</h2>
        <p class="center muted">${S.place !== 'other'
          ? `${S.user.placeType === 'destination' ? V('Điểm đến', 'Destination') : V('Quê hương', 'Hometown')}: ${L(theme(S.place).name)}`
          : V('Học sinh · THPT Phan Châu Trinh', 'Student · Phan Chau Trinh High School')}</p>
        <div class="row between small muted mt-24"><span>Level ${lv}</span><span>${toNext} ${V('XP để lên cấp', 'XP to next level')}</span></div>
        <div class="track mt-8"><i data-w="${pct}%"></i></div>
      </div>
      <div class="section-title reveal"><span>${V('Thống kê', 'Your Stats')}</span></div>
      <div class="grid2">
        ${[['g-gold', 'bolt', fmt(S.xp), V('Tổng XP', 'Total XP')], ['g-orange', 'cal', `${streakNow()} ${V('ngày', 'days')}`, V('Chuỗi hiện tại', 'Current streak')], ['g-blue', 'book', S.sessions, V('Phiên đã luyện', 'Sessions done')], ['g-green', 'trend', mastered, V('Từ thành thạo', 'Words mastered')]]
          .map(([g, ic, v, l], i) => `<div class="stat-tile reveal" style="--d:${i * 60}ms"><span class="ic ${g}">${icon(ic)}</span><b>${v}</b><span>${l}</span></div>`).join('')}
      </div>
      <div class="section-title reveal"><span>${V('Thành tích', 'Achievements')}</span></div>
      ${ach.map(([ic, t, d, on], i) => `<div class="ach reveal ${on ? 'on' : ''}" style="--d:${i * 50}ms"><span class="ic">${img(ic)}</span><div class="grow"><div class="t">${t} ${on ? '🏅' : ''}</div><div class="d">${d}</div></div></div>`).join('')}
      <div class="section-title reveal" id="settings"><span>${V('Cài đặt', 'Settings')}</span></div>
      <section class="card reveal">
        <div class="set-row" style="display:block"><div class="row"><span class="ic">${img(theme(S.place).icon).replace('class=""', 'style="width:24px;height:24px"')}</span><span>${V('Địa điểm & giao diện', 'Place & theme')}</span></div>
          <div class="place-grid mt-16">${placeCards(S.place, 'pickPlace')}</div></div>
        <div class="set-row"><span class="ic">${icon('globe')}</span><span class="grow">${V('Ngôn ngữ giao diện', 'Interface language')}</span>${langToggle()}</div>
        <div class="set-row" style="display:block"><div class="row"><span class="ic">${icon('volume')}</span><span>${V('Giọng AI', 'AI accent')}</span></div><div class="seg four mt-16">${ACCENTS.map(([k, vi, en]) => `<button class="${S.settings.accent === k ? 'on' : ''}" onclick="setSetting('accent','${k}')">${V(vi, en)}</button>`).join('')}</div></div>
        <div class="set-row" style="display:block"><div class="row"><span class="ic">${icon('gauge')}</span><span>${V('Tốc độ nói của AI', 'AI speech rate')}</span></div><div class="seg three mt-16">${[['slow', 'Chậm', 'Slow'], ['medium', 'Vừa', 'Medium'], ['fast', 'Nhanh', 'Fast']].map(([k, vi, en]) => `<button class="${S.settings.rate === k ? 'on' : ''}" onclick="setSetting('rate','${k}')">${V(vi, en)}</button>`).join('')}</div></div>
        <div class="set-row"><span class="ic">${icon('cc')}</span><span class="grow">${V('Phụ đề', 'Subtitles')}</span><button class="toggle ${S.settings.subs ? 'on' : ''}" onclick="setSetting('subs',${!S.settings.subs})" aria-label="${V('Phụ đề', 'Subtitles')}" aria-pressed="${S.settings.subs}"></button></div>
        <div class="set-row"><span class="ic">${icon('refresh')}</span><span class="grow">${V('Đặt lại dữ liệu demo', 'Reset demo data')}</span><button class="btn white sm" onclick="resetDemo()">${V('Đặt lại', 'Reset')}</button></div>
        <div class="set-row"><span class="ic" style="color:var(--danger)">${icon('logout')}</span><button class="grow" style="text-align:left;color:var(--danger);font-weight:600" onclick="signOut()">${V('Đăng xuất', 'Sign out')}</button></div>
      </section>`;
    },
  },
};

/* ================= View parts ================= */
function weekDays(off) {
  const now = new Date(), mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7) + off * 7);
  const names = S.lang === 'vi' ? ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return names.map((lbl, i) => {
    const d = new Date(mon); d.setDate(mon.getDate() + i);
    const k = iso(d), today = k === iso(), back = Math.round((new Date(iso()) - new Date(k)) / 864e5);
    return { lbl, date: d, today, on: (back >= 1 && back <= S.streak) || (today && S.today.min > 0) };
  });
}
function calendarHtml() {
  const days = weekDays(S.weekOff), m = new Intl.DateTimeFormat(S.lang === 'vi' ? 'vi-VN' : 'en-US', { month: 'long', year: 'numeric' }).format(days[3].date);
  return `<div class="row between"><h2 style="font-size:17px;font-weight:600">${m.charAt(0).toUpperCase() + m.slice(1)}</h2>
    <div class="row" style="gap:4px"><button class="icon-btn" style="width:36px;height:36px;box-shadow:none;background:none" onclick="shiftWeek(-1)" aria-label="${V('Tuần trước', 'Previous week')}">${icon('chevL', 'sm')}</button><button class="icon-btn" style="width:36px;height:36px;box-shadow:none;background:none" onclick="shiftWeek(1)" aria-label="${V('Tuần sau', 'Next week')}">${icon('chevR', 'sm')}</button></div></div>
    <div class="week mt-24">${days.map(d => `<div><div class="lbl">${S.lang === 'vi' ? d.lbl : d.lbl.charAt(0)}</div><div class="cal-day ${d.today ? 'today' : ''} ${d.on ? 'done' : ''}">${d.date.getDate()}</div></div>`).join('')}</div>`;
}
function journeyHtml() {
  const XS = [50, 26, 72, 30, 68, 50, 24, 70, 32, 62], GAP = 150, TOP = 30;
  const pts = JOURNEY.map((_, i) => [XS[i], TOP + i * GAP + 35]);
  const H = TOP + JOURNEY.length * GAP;
  const seg = (a, b) => `C ${a[0]} ${a[1] + GAP / 2} ${b[0]} ${b[1] - GAP / 2} ${b[0]} ${b[1]}`;
  const full = 'M ' + pts[0].join(' ') + ' ' + pts.slice(1).map((p, i) => seg(pts[i], p)).join(' ');
  const doneN = Math.min(S.done.length, JOURNEY.length - 1);
  const donePath = 'M ' + pts[0].join(' ') + ' ' + pts.slice(1, doneN + 1).map((p, i) => seg(pts[i], p)).join(' ');
  const remaining = JOURNEY.length - S.done.length;
  return `
    <div class="journey reveal" style="height:${H}px">
      <svg class="path" viewBox="0 0 100 ${H}" preserveAspectRatio="none" aria-hidden="true"><path d="${full}" vector-effect="non-scaling-stroke"/><path class="done" d="${donePath}" vector-effect="non-scaling-stroke"/></svg>
      ${JOURNEY.map((id, i) => {
        const s = scen(id), st = stopState(i);
        return `<a class="stop ${st} reveal zoom" style="left:${XS[i]}%;top:${TOP + i * GAP}px;margin-left:-66px;--d:${i * 40}ms" href="#scenario/${id}" onclick="return guardLocked('${id}')" aria-label="${L(s.name)}${st === 'locked' ? ' (' + V('đã khoá', 'locked') + ')' : ''}">
          <div class="node">${img(s.icon)}<span class="num">${st === 'done' ? '✓' : i + 1}</span></div>
          <div class="label">${L(s.name)}${st === 'locked' ? img('lock', 'lock') : `<small>${st === 'done' ? V('Đã xong', 'Done') + ' ✓' : s.xp + ' XP'}</small>`}</div>
        </a>`;
      }).join('')}
    </div>
    <section class="card reveal center mt-16">
      <b style="font-size:17px">${V('Tiến độ của bạn', 'Your Progress')}</b>
      <p class="small muted">${V('Hành trình Đà Nẵng – Hội An', 'Da Nang – Hoi An journey')}</p>
      <div class="row mt-16" style="justify-content:center;gap:0">
        <div class="grow"><b style="font-size:28px">${S.done.length}</b><div class="small muted">${V('Hoàn thành', 'Complete')}</div></div>
        <div style="width:1px;height:44px;background:var(--line)"></div>
        <div class="grow"><b style="font-size:28px;color:var(--faint)">${remaining}</b><div class="small muted">${V('Còn lại', 'Remaining')}</div></div>
      </div>
      <div class="track light mt-16"><i data-w="${Math.round((S.done.length / JOURNEY.length) * 100)}%" style="background:var(--primary)"></i></div>
    </section>`;
}
function libraryHtml() {
  return `
    <div class="row mt-24 reveal">
      <label class="search">${icon('search', 'sm')}<span class="sr">${V('Tìm', 'Search')}</span><input id="q" placeholder="${V('Tìm tình huống', 'Search scenarios')}" oninput="renderLib()"></label>
      <button class="icon-btn" onclick="toast(V('Lọc theo trình độ sắp có','Level filter coming soon'))" aria-label="${V('Lọc', 'Filter')}">${icon('filter')}</button>
    </div>
    <div class="chips mt-16 reveal">${[['all', { vi: 'Tất cả', en: 'All' }], ...Object.entries(CATS)].map(([k, n]) => `<button class="chip ${S.libCat === k ? 'active' : ''}" onclick="S.libCat='${k}';setRpMode('library')">${L(n)}</button>`).join('')}</div>
    <div id="lib" class="mt-16">${libCards('')}</div>`;
}
function libCards(q) {
  const list = SCEN.filter(s => (S.libCat === 'all' || s.cat === S.libCat) && (!q || (s.en + ' ' + s.name.vi).toLowerCase().includes(q.toLowerCase())));
  if (!list.length) return `<div class="card center reveal"><p class="muted">${V('Không tìm thấy tình huống phù hợp.', 'No matching scenarios.')}</p></div>`;
  return list.map(s => {
    const lock = isLocked(s.id), done = S.done.includes(s.id);
    return `<a class="scen-card reveal" href="#scenario/${s.id}" onclick="return guardLocked('${s.id}')">
      <div class="scen-img" style="background:linear-gradient(135deg,${s.bg[0]},${s.bg[1]})">${img(s.icon)}<span class="tag navy lvl">${s.level}</span><span class="dur">${s.min} ${V('phút', 'min')}</span>${done ? '<span class="bar" style="width:100%"></span>' : ''}</div>
      <div class="scen-body"><h3>${s.en}${lock ? ' 🔒' : ''}</h3>
        <div class="meta">${s.name.vi} • ${L(CATS[s.cat])} • ${s.persona.name}</div>
        <div class="meta2">${s.vocab.length} ${V('từ vựng', 'words')} · ${s.xp} XP${done ? ' · ' + V('Đã hoàn thành', 'Completed') : ''}</div></div>
    </a>`;
  }).join('');
}
const sortedErrors = () => [...S.errors].sort((a, b) => (a.status === b.status ? b.at - a.at || a.best - b.best : a.status === 'open' ? -1 : 1));
function tutorList() {
  const list = sortedErrors().filter(e => S.tutorCat === 'all' || e.cat === S.tutorCat);
  return list.map((e, i) => `
    <a class="err-item reveal ${e.status}" style="--d:${Math.min(i, 5) * 50}ms" href="#practice/${e.id}">
      <div class="mini-ring">${ringSvg(e.best, 21, 5, scoreColor(e.best), 'var(--line)')}<b>${e.best}</b></div>
      <div class="grow"><div class="w" style="${e.word.length > 16 ? 'font-size:15px' : ''}">${esc(e.word)}</div>${e.ipa ? `<div class="ipa">${ipaHl(e)}</div>` : ''}
        <div class="src"><span class="tag ${e.status === 'mastered' ? 'green' : 'amber'}">${e.status === 'mastered' ? V('Thành thạo', 'Mastered') : L(ERR_CAT[e.cat])}</span><span>${V('từ', 'from')} ${L(scen(e.scen).name)}</span></div></div>
      ${icon('chevR')}
    </a>`).join('');
}
const attemptsHtml = e => e.attempts.slice(-5).map(a => `<span class="tag ${a >= 80 ? 'green' : a >= 60 ? '' : 'amber'}">${a}</span>`).join('') || `<span class="tiny muted">${V('Chưa có lượt thử', 'No attempts yet')}</span>`;
const masteryHtml = e => [0, 1].map(i => `<i class="${e.days.length > i ? 'on' : ''}"></i>`).join('');

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

/* ================= Actions ================= */
function setLang(l) { S.lang = l; document.documentElement.lang = l; save(); route(); }
// Radio groups (gender, hometown/destination): one tab stop, arrow keys move and select
function setRadio(group, v) {
  group.querySelectorAll('[role="radio"]').forEach(b => { const on = b.dataset.v === v; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); b.tabIndex = on ? 0 : -1; });
}
function radioKeys(e) {
  const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
  if (!d) return;
  e.preventDefault();
  const r = [...e.currentTarget.querySelectorAll('[role="radio"]')], i = r.indexOf(document.activeElement);
  const next = r[(Math.max(i, 0) + d + r.length) % r.length];
  next.focus(); next.click();
}
function pickGender(k) { F.gender = k; setRadio($('.choice-row'), k); window.signupCheck?.(); }
function pickType(t) { F.placeType = t; setRadio($('.seg[role="radiogroup"]'), t); $('#place-sub').textContent = placeSub(t); }
const markCards = id => document.querySelectorAll('.place').forEach(b => { const on = b.dataset.place === id; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
const burstFrom = ev => { const r = ev?.currentTarget?.getBoundingClientRect(); return r && { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
// Step 2: live preview only; nothing is saved until "Bắt đầu hành trình"
function previewPlace(id, ev) {
  F.placeId = id; markCards(id);
  applyTheme(id, burstFrom(ev));
  $('#theme-note').innerHTML = themeNote(id);
  $('#start').disabled = false;
}
function finishOnboarding(placeId) {
  Object.assign(S.user, { placeType: F.placeType, placeId, themeId: placeId });
  S.place = placeId; F.ready = false;
  save(); location.hash = '#home';
}
const startJourney = () => F.placeId && finishOnboarding(F.placeId);
function skipPlace() { applyTheme('other'); finishOnboarding('other'); }
// Profile → Settings: change place later, saved at once
function pickPlace(id, ev) {
  Object.assign(S.user, { placeId: id, themeId: id, placeType: S.user.placeType || 'hometown' });
  S.place = id; save();
  applyTheme(id, burstFrom(ev));
  const y = scrollY; route(); scrollTo(0, y); document.querySelectorAll('.reveal').forEach(show);
}
function setRpMode(m) { S.rpMode = m; const b = $('#rp-body'); b.innerHTML = m === 'journey' ? journeyHtml() : libraryHtml(); document.querySelectorAll('.seg button').forEach((x, i) => x.classList.toggle('on', (i === 0) === (m === 'journey'))); observe(b); }
function renderLib() { const box = $('#lib'); box.innerHTML = libCards($('#q').value); observe(box); }
function guardLocked(id) { if (!isLocked(id)) return true; toast(V('Hoàn thành chặng trước để mở khoá 🔒', 'Finish the previous stop to unlock 🔒')); return false; }
function shiftWeek(d) { S.weekOff += d; $('#cal').innerHTML = calendarHtml(); }
function setTutorCat(c) { S.tutorCat = c; document.querySelectorAll('.chips .chip').forEach(x => x.classList.toggle('active', x.getAttribute('onclick').includes(`'${c}'`))); const box = $('#tq'); box.innerHTML = tutorList(); observe(box); }
function setSetting(k, v) { S.settings[k] = v; save(); if (location.hash.startsWith('#profile')) { const y = scrollY; route(); scrollTo(0, y); document.querySelectorAll('.reveal').forEach(show); } else talkSettings(); }
function toggleEye(btn, id) { const el = $('#' + id), show_ = el.type === 'password'; el.type = show_ ? 'text' : 'password'; btn.innerHTML = icon(show_ ? 'eyeOff' : 'eye'); }
function signinMode(m) { $('#by-email').hidden = m !== 'email'; $('#by-code').hidden = m === 'email'; $('#m-email').classList.toggle('on', m === 'email'); $('#m-code').classList.toggle('on', m !== 'email'); observe($('#f')); window.signinCheck?.(); }
function googleSignIn() {
  S.user = { ...(S.user || {}), name: S.user?.name || 'Nguyễn Thị Lan', email: S.user?.email || 'lan@gmail.com' };
  save(); location.hash = S.user.placeId ? '#home' : '#place'; toast(V('Đăng nhập Google (demo)', 'Google sign-in (demo)'));
}
function signOut() { S.user = null; save(); location.hash = '#signin'; }
function resetDemo() { try { Object.keys(localStorage).filter(k => k.startsWith('lt:') && k !== 'lt:user' && k !== 'lt:lang').forEach(k => localStorage.removeItem(k)); } catch { /* ignore */ } location.reload(); }
function hear(btn, sid, i) {
  const s = scen(sid); speak(s.vocab[i][0]); btn.style.background = 'var(--success)';
  S.heard.add(sid + i); const n = s.vocab.filter((_, j) => S.heard.has(sid + j)).length;
  $('#vc').textContent = `${n}/${s.vocab.length}`; $('#vbar').style.width = (n / s.vocab.length) * 100 + '%';
}
function practiseThis(k) {
  const s = nextScen();
  if (k === 'pron') { S.tutorCat = 'all'; location.hash = '#tutor'; }
  else if (k === 'grammar') { S.tutorCat = S.errors.some(e => e.cat === 'grammar') ? 'grammar' : 'all'; location.hash = S.tutorCat === 'grammar' ? '#tutor' : '#talk/' + s.id; }
  else if (k === 'vocab') location.hash = '#scenario/' + s.id;
  else location.hash = '#talk/' + s.id;
}
function critSheet(k) {
  const c = CRIT.find(x => x.k === k), low = c.subs.reduce((a, b) => (b[1] < a[1] ? b : a));
  openSheet(`
    <div class="row"><span class="tile-3d" style="width:56px;height:56px;border-radius:16px">${img(c.icon)}</span><div class="grow"><h2>${L(c.name)}</h2><p class="small muted">${L(c.d)}</p></div><b style="font-size:28px">${S.scores[k]}%</b></div>
    <div class="card mt-24">${c.subs.map(([n, v]) => `<div class="mt-16" style="margin-top:${n === c.subs[0][0] ? 0 : 16}px"><div class="row between small"><span>${L(n)}${n === low[0] ? ' <span class="tag amber">' + V('Yếu nhất', 'Weakest') + '</span>' : ''}</span><b>${v}%</b></div><div class="track light mt-8"><i data-w="${v}%" style="width:0;background:${scoreColor(v)}"></i></div></div>`).join('')}</div>
    <button class="btn mt-24" onclick="closeSheet();practiseThis('${k}')">${V('Luyện ngay', 'Practise this')} ${icon('right')}</button>`);
}

/* ================= Talk engine (scripted demo) ================= */
let T = null;
function clearTalk() { if (T) T.timers.forEach(clearTimeout); T = null; stopAudio(); }
const later = (fn, ms) => { const t = T; t.timers.push(setTimeout(() => T === t && fn(), ms)); };
function startTalk(id) {
  clearTalk();
  const s = scen(id), steps = TALK[s.id] || genericTalk(s);
  T = { s, steps, i: 0, state: 'wait', timers: [], caught: [], gram: 0, pron: 0, meTotal: steps.filter(x => x.me).length, meDone: 0 };
  updateTurns(); later(nextStep, 500);
}
function updateTurns() { $('#turn-lbl').textContent = `${V('Lượt', 'Turn')} ${T.meDone}/${T.meTotal}`; $('#turn-bar').style.width = (T.meDone / T.meTotal) * 100 + '%'; }
function setMic(state) {
  T.state = state; const m = $('#mic'), h = $('#mic-hint');
  m.disabled = !['ready', 'listening'].includes(state);
  m.classList.toggle('rec', state === 'listening'); m.classList.toggle('pulse', state === 'listening');
  m.innerHTML = icon(state === 'listening' ? 'x' : 'mic');
  h.textContent = { wait: V('Đợi nhân vật nói xong…', 'Wait for your partner…'), ready: V('Nhấn micro để trả lời', 'Tap the mic to answer'), listening: V('Đang nghe… nhấn lần nữa để dừng', 'Listening… tap again to stop'), processing: V('Đang chấm điểm…', 'Scoring…') }[state] || '';
}
function addMsg(who, html) {
  const el = document.createElement('div'); el.className = 'msg ' + who;
  const av = who === 'ai' ? T.s.persona.name[0] : esc(S.user.name.trim()[0] || 'B');
  el.innerHTML = `<div class="av">${av}</div><div class="col" style="display:flex;flex-direction:column;align-items:${who === 'me' ? 'flex-end' : 'flex-start'};max-width:82%;min-width:0"><div class="bubble" style="max-width:100%">${html}</div></div>`;
  $('#msgs').append(el);
  requestAnimationFrame(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' }));
  return el;
}
function nextStep() {
  const st = T.steps[T.i];
  if (!st) return finishTalk();
  if (st.me) return setMic('ready');
  T.i++; setMic('wait');
  const el = addMsg('ai', '<span class="dots"><i></i><i></i><i></i></span>'), b = el.querySelector('.bubble');
  later(() => {
    speak(st.ai);
    if (!S.settings.subs) {
      b.innerHTML = `<span class="muted">🔊 ${V('Đang nói… (phụ đề tắt)', 'Speaking… (subtitles off)')}</span> <button class="link small" onclick="this.parentNode.innerHTML=${esc(JSON.stringify(esc(st.ai)))}">${V('Xem lời', 'Show text')}</button><span class="time">${hhmm()}</span>`;
      return later(nextStep, 1800 + st.ai.length * 30);
    }
    const words = st.ai.split(' '); let n = 0;
    const tick = () => {
      n++; b.innerHTML = esc(words.slice(0, n).join(' ')) + (n < words.length ? '<span class="caret"></span>' : `<span class="time">${hhmm()}</span>`);
      if (n < words.length) later(tick, 230 / RATES[S.settings.rate]); else later(nextStep, 700);
    };
    tick();
  }, 900);
}
function micTap() {
  if (!T) return;
  if (T.state === 'ready') {
    stopAudio(); setMic('listening');
    T.live = addMsg('me', '<span class="wave"><i></i><i></i><i></i><i></i><i></i></span>');
    later(() => T.state === 'listening' && micTap(), 4500);
  } else if (T.state === 'listening') {
    setMic('processing');
    T.live.querySelector('.bubble').innerHTML = '<span class="dots"><i></i><i></i><i></i></span>';
    later(finishTurn, 900);
  }
}
function finishTurn() {
  const st = T.steps[T.i], col = T.live.querySelector('.col'), b = col.querySelector('.bubble');
  let txt = esc(st.me);
  (st.pron || []).forEach(([w, sc]) => { txt = txt.replace(new RegExp(`\\b${w}\\b`, 'i'), m => `<button class="pw" onclick="pronSheet('${w}',${sc})">${m}</button>`); captureWord(w, sc); });
  b.innerHTML = `${txt}<span class="time">${hhmm()}</span>`;
  const fb = [];
  if (st.gram) { T.gram++; const gid = captureGram(st); fb.push(`<button class="fb amber" onclick="gramSheet('${gid}')">${V('1 lỗi ngữ pháp', '1 grammar tip')}</button>`); }
  if (st.pron?.length) { T.pron += st.pron.length; fb.push(`<button class="fb amber" onclick="pronSheet('${st.pron[0][0]}',${st.pron[0][1]})">${V('Phát âm', 'Pronunciation')}: ${st.pron[0][0]}</button>`); }
  if (!fb.length) fb.push(`<span class="fb green">✓ ${V('Tốt lắm!', 'Nice!')}</span>`);
  col.insertAdjacentHTML('beforeend', `<div class="feedback-row">${fb.join('')}</div>`);
  T.i++; T.meDone++; updateTurns(); setMic('wait'); later(nextStep, 700);
}
function captureWord(w, score) {
  const lib = WORDS[w]; if (!lib) return;
  let e = S.errors.find(x => x.word === w);
  if (!e) { e = { id: 'w-' + w, word: w, ...lib, scen: T.s.id, best: score, attempts: [score], days: [], status: 'open', at: Date.now() }; S.errors.push(e); }
  else { e.at = Date.now(); if (e.status === 'mastered') { e.status = 'open'; e.days = []; } }
  if (!T.caught.includes(e.id)) T.caught.push(e.id);
  save();
}
function captureGram(st) {
  const id = 'g-' + st.gram.fix.toLowerCase().replace(/[^a-z]+/g, '-').slice(0, 40);
  if (!S.errors.some(e => e.id === id)) S.errors.push({ id, word: st.gram.fix, wrong: st.me, cat: 'grammar', tip: st.gram.why, ipa: '', hl: '', mean: '', scen: T.s.id, best: 0, attempts: [], days: [], status: 'open', at: Date.now() });
  if (!T.caught.includes(id)) T.caught.push(id);
  save(); return id;
}
function pronSheet(w, sc) {
  const e = S.errors.find(x => x.word === w) || { word: w, ...WORDS[w] };
  openSheet(`
    <div class="center"><span class="tag amber">${L(ERR_CAT[e.cat])}</span><div style="font-size:38px;font-weight:800;margin-top:10px">${esc(w)}</div><div class="muted" style="font-size:18px">${ipaHl(e)}</div></div>
    <div class="mini-ring mt-16" style="width:72px;height:72px;margin:16px auto 0">${ringSvg(sc, 29, 7, scoreColor(sc), 'var(--line)')}<b style="font-size:17px">${sc}</b></div>
    ${tutorSay(esc(L(e.tip)), 0, 'in mt-24')}
    <p class="small center mt-16"><span class="tag green">✓ ${V('Đã lưu vào Gia sư', 'Saved to Tutor')}</span></p>
    <div class="row mt-24" style="gap:12px"><button class="btn white" onclick="speak('${w}')">${icon('volume')} ${V('Nghe', 'Listen')}</button><button class="btn" onclick="closeSheet()">${V('Tiếp tục nói', 'Keep talking')}</button></div>`);
}
function gramSheet(id) {
  const e = S.errors.find(x => x.id === id);
  openSheet(`
    <h2>${V('Gợi ý ngữ pháp', 'Grammar tip')}</h2>
    <div class="compare bad mt-16"><small>${V('Bạn nói', 'You said')}</small>${esc(e.wrong)}</div>
    <div class="compare good mt-8"><small>${V('Nên nói', 'Better')}</small>${esc(e.word)}</div>
    ${tutorSay(esc(L(e.tip)), 0, 'in mt-24')}
    <div class="row mt-24" style="gap:12px"><button class="btn white" onclick='speak(${esc(JSON.stringify(e.word))})'>${icon('volume')} ${V('Nghe', 'Listen')}</button><button class="btn" onclick="closeSheet()">${V('Đã hiểu', 'Got it')}</button></div>`);
}
function helpMe() {
  if (!T) return;
  const st = T.steps.slice(T.i).find(x => x.me), q = [...T.steps.slice(0, T.i)].reverse().find(x => x.ai);
  if (!st) return toast(V('Cuộc trò chuyện sắp kết thúc rồi!', 'The conversation is almost done!'));
  const model = st.gram?.fix || st.me, starter = model.split(' ').slice(0, 3).join(' ');
  openSheet(`
    <h2>💡 ${V('Gợi ý trả lời', 'Need a hand?')}</h2>
    ${q ? `<p class="muted mt-8">${T.s.persona.name}: “${esc(q.ai)}”</p>` : ''}
    <div class="card mt-16 flat"><div class="tiny muted">${V('Câu mở đầu', 'Starter')}</div><b>${esc(starter)}…</b></div>
    <div class="card flat"><div class="tiny muted">${V('Câu trả lời mẫu', 'Model answer')}</div><b>${esc(model)}</b>
      <div><button class="btn soft sm mt-16" onclick='speak(${esc(JSON.stringify(model))})'>${icon('volume', 'sm')} ${V('Nghe mẫu', 'Listen')}</button></div></div>
    <button class="btn mt-24" onclick="closeSheet()">${V('Mình thử nói nhé', 'I’ll try it')}</button>`);
}
function toggleSubs() { S.settings.subs = !S.settings.subs; save(); const b = $('#cc-btn'); b.style.background = S.settings.subs ? 'var(--navy)' : ''; b.style.color = S.settings.subs ? '#fff' : ''; toast(S.settings.subs ? V('Đã bật phụ đề', 'Subtitles on') : V('Đã tắt phụ đề', 'Subtitles off')); }
function talkSettings() {
  openSheet(`
    <h2>${V('Giọng nói AI', 'AI voice')}</h2><p class="small muted mt-8">${V('Thay đổi áp dụng từ câu trả lời tiếp theo.', 'Changes apply from the next reply.')}</p>
    <div class="mt-24 small bold">${V('Tốc độ', 'Speed')}</div>
    <div class="seg three mt-8">${[['slow', 'Chậm', 'Slow'], ['medium', 'Vừa', 'Medium'], ['fast', 'Nhanh', 'Fast']].map(([k, vi, en]) => `<button class="${S.settings.rate === k ? 'on' : ''}" onclick="setSetting('rate','${k}')">${V(vi, en)}</button>`).join('')}</div>
    <div class="mt-24 small bold">${V('Giọng', 'Accent')}</div>
    <div class="seg four mt-8">${ACCENTS.map(([k, vi, en]) => `<button class="${S.settings.accent === k ? 'on' : ''}" onclick="setSetting('accent','${k}')">${V(vi, en)}</button>`).join('')}</div>
    <div class="set-row mt-16"><span class="grow">${V('Phụ đề', 'Subtitles')}</span><button class="toggle ${S.settings.subs ? 'on' : ''}" onclick="toggleSubs();talkSettings()" aria-pressed="${S.settings.subs}" aria-label="${V('Phụ đề', 'Subtitles')}"></button></div>
    <button class="btn mt-24" onclick="closeSheet()">${V('Xong', 'Done')}</button>`);
}
function finishTalk() {
  const s = T.s;
  const sess = { fluency: 64 + T.meTotal * 2, vocab: 74, grammar: clamp(82 - T.gram * 10, 30, 95), pron: clamp(72 - T.pron * 6, 30, 95) };
  CRIT.forEach(c => (S.scores[c.k] = Math.round((S.scores[c.k] * 4 + sess[c.k]) / 5))); // rolling avg of last 5, PRD §7.2
  S.sessions++; S.minutes += s.min; S.xp += s.xp; S.today.min += s.min;
  if (!S.done.includes(s.id)) S.done.push(s.id);
  save(); setMic('done'); $('#mic-hint').textContent = V('Hoàn thành!', 'Finished!');
  const caught = T.caught.map(id => S.errors.find(e => e.id === id)).filter(Boolean);
  const pw = caught.find(e => e.cat !== 'grammar'), gw = caught.find(e => e.cat === 'grammar');
  confetti();
  openSheet(`
    <div class="center">${img('party', '', '').replace('class=""', 'style="width:72px;height:72px;margin:0 auto"')}<h2 class="mt-8" style="font-size:24px">${V('Hoàn thành!', 'Well done!')}</h2>
      <p class="muted">${V(`Bạn đã trò chuyện ${T.meTotal} lượt với ${s.persona.name}`, `You had ${T.meTotal} turns with ${s.persona.name}`)} · <b style="color:var(--lantern-b)">+${s.xp} XP</b></p></div>
    ${tutorSay(V(`Bạn giới thiệu ${L(s.name)} rất tự nhiên! ${pw ? `Chú ý từ “${esc(pw.word)}”` : ''}${pw && gw ? ' và ' : ''}${gw ? 'cấu trúc câu đã được gợi ý' : ''}${pw || gw ? ' — mình đã lưu vào Gia sư.' : ''}`, `You introduced ${L(s.name)} naturally! ${pw ? `Watch the word “${esc(pw.word)}”` : ''}${pw && gw ? ' and ' : ''}${gw ? 'the grammar tip' : ''}${pw || gw ? ' — I saved them to Tutor.' : ''}`), 0, 'in mt-16')}
    <div class="card mt-16 flat">${CRIT.map(c => `<div class="row" style="margin-top:10px"><span class="small grow">${L(c.name)}</span><div class="track light" style="width:45%"><i data-w="${sess[c.k]}%" style="width:0;background:${scoreColor(sess[c.k])}"></i></div><b class="small" style="width:34px;text-align:right">${sess[c.k]}</b></div>`).join('')}</div>
    ${caught.length ? `<div class="card soft flat"><b>${caught.length} ${V('mục đã lưu vào Gia sư', 'items saved to Tutor')}</b><div class="row mt-8" style="flex-wrap:wrap;gap:8px">${caught.map(e => `<span class="tag amber">${esc(e.word.length > 22 ? e.word.slice(0, 22) + '…' : e.word)}</span>`).join('')}</div></div>` : ''}
    <a class="btn mt-24" href="#tutor" onclick="closeSheet()">${icon('micAi')} ${V('Sửa lỗi ngay', 'Fix them now')}</a>
    <a class="btn white mt-16" href="#radar" onclick="closeSheet()">${V('Xem bản đồ lỗi', 'See my radar')}</a>`);
}

/* ================= Tutor practice (simulated scoring) ================= */
let P = null;
function practiceRec(id) {
  const e = S.errors.find(x => x.id === id), m = $('#pmic'), h = $('#pm-hint');
  if (P) return;
  stopAudio();
  P = setTimeout(() => {
    m.classList.remove('rec', 'pulse'); m.disabled = true; h.textContent = V('Đang chấm điểm…', 'Scoring…');
    P = setTimeout(() => {
      const score = clamp(Math.round(Math.max(e.best, 55) + 4 + Math.random() * 18), 35, 98);
      e.attempts.push(score); e.best = Math.max(e.best, score); e.at = Date.now();
      S.xp += 5; S.today.min += 1;
      S.scores.pron = clamp(Math.round(S.scores.pron + (score - S.scores.pron) * 0.06), 0, 100); // Tutor weighs less than Roleplay, PRD §7.2
      let msg;
      if (score >= 80) {
        if (!e.days.includes(iso())) e.days.push(iso());
        if (e.days.length >= 2 && e.status !== 'mastered') { e.status = 'mastered'; confetti(); msg = V('🎉 Thành thạo! Từ này sẽ quay lại để ôn sau vài ngày.', '🎉 Mastered! This word will come back for review in a few days.'); }
        else msg = e.status === 'mastered' ? V('Tuyệt vời! Vẫn chuẩn như cũ.', 'Great! Still spot on.') : V('Tuyệt vời! Ngày mai đạt ≥80 lần nữa là thành thạo.', 'Excellent! Score ≥80 again tomorrow to master it.');
      } else msg = V('Gần rồi! ', 'Almost! ') + esc(L(e.tip));
      save();
      const fg = $('#sr .fg'), c = +fg.getAttribute('stroke-dasharray');
      fg.style.stroke = scoreColor(score); fg.style.strokeDashoffset = c * (1 - score / 100);
      countUp($('#sv'), score); $('#sr .val span').textContent = V('điểm lần này', 'this attempt');
      $('#fbt').innerHTML = msg; $('#att').innerHTML = attemptsHtml(e); $('#ms').innerHTML = masteryHtml(e);
      $('#sr').scrollIntoView({ behavior: 'smooth', block: 'start' });
      m.disabled = false; h.textContent = V('Nhấn để thử lại', 'Tap to try again'); P = null;
    }, 800);
  }, 1800);
  m.classList.add('rec', 'pulse'); h.textContent = V('Đang nghe…', 'Listening…');
}
function countUp(el, to) { const from = +el.textContent || 0, t0 = performance.now(); const f = t => { const k = Math.min(1, (t - t0) / 900); el.textContent = Math.round(from + (to - from) * (1 - (1 - k) ** 3)); if (k < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); }

/* ================= Router ================= */
const TABS = [['home', 'home'], ['roleplay', 'chat'], ['tutor', 'micAi'], ['radar', 'radar'], ['profile', 'user']];
const TAB_NAMES = { home: ['Trang chủ', 'Home'], roleplay: ['Nhập vai', 'Roleplay'], tutor: ['Gia sư', 'Tutor'], radar: ['Bản đồ lỗi', 'Radar'], profile: ['Hồ sơ', 'Profile'] };
function renderNav(active) {
  const nav = $('#nav'), on = TABS.some(([k]) => k === active);
  nav.classList.toggle('hidden', !on);
  nav.innerHTML = TABS.map(([k, ic]) => `<a href="#${k}" class="${k === active ? 'active' : ''}" aria-label="${V(...TAB_NAMES[k])}" ${k === active ? 'aria-current="page"' : ''}>${icon(ic)}</a>`).join('');
}
function route() {
  const [name, arg] = (location.hash.slice(1) || (S.user ? 'home' : 'signup')).split('/');
  let view = VIEWS[name] ? name : 'home';
  if (!S.user && !['signup', 'signin'].includes(view)) view = 'signup';
  clearTalk(); clearTimeout(P); P = null; closeSheet();
  const app = $('#app');
  VIEWS[view].init?.(arg);
  app.innerHTML = VIEWS[view].render(arg);
  app.classList.toggle('no-nav', !TABS.some(([k]) => k === view));
  renderNav(view);
  document.documentElement.lang = S.lang;
  scrollTo(0, 0);
  VIEWS[view].mount?.(arg);
  observe(app);
}
window.addEventListener('hashchange', route);
installThemes();
applyTheme(S.place);
if (new URLSearchParams(location.search).has('test')) selfTest();
splash();

// Cold-start splash: stays at least 2.4s (1.8s with reduced motion) and until fonts are in, never past 4s.
// The first screen renders under it as it fades, so its own entrance animations play in view.
function splash() {
  const el = $('#splash');
  if (!el) return route();
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const min = matchMedia('(prefers-reduced-motion: reduce)').matches ? 1800 : 2400;
  Promise.race([Promise.all([wait(min), document.fonts?.ready]), wait(4000)]).then(() => {
    route();
    el.classList.add('out');
    setTimeout(() => el.remove(), 450);
  });
}

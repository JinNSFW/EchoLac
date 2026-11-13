'use strict';
// Demo error items and scripted conversations, not measured results.

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

'use strict';
// Demo progress, criteria and interface choices.

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

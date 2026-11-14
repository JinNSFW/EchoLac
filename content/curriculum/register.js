'use strict';
// Leveled Da Nang curriculum (PRD R-13, §5.7): lesson-derived scenarios added to the library.
// Facts come only from the lesson plan's source notes (line numbers in `sources`); every record stays unverified until a teacher checks it (R-04).

CATS.culture = { vi: 'Văn hoá & đời sống', en: 'Culture & life' };
const LESSON_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];
const LESSON_SRC = 'phôi giáo án.txt (tệp gốc), dòng ';

// Each lesson brings one pronunciation focus word (PRD §6); register it so Roleplay can log it as a Tutor item.
function addLessons(list) {
  for (const s of list) {
    if (!WORDS[s.pron.word]) { const { word, ...entry } = s.pron; WORDS[word] = entry; }
    SCEN.push({ ...s, en: s.name.en, verified: false });
  }
}

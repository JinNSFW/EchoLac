# Plan: Vietnamese-learner pronunciation taxonomy + lesson plan (giáo án phát âm)

Planner: Opus 5.5 high (stand-in for the "plan" role). Date 2026-11-22. Inputs: `research.md` (ids `[1]..[17]`, `[B1]..[B16]`), `lookup.py` (CMUdict → espeak tokens + CEFR-J 1.5), PRD §2.3/§3/§5/§6/§7/§12/§14, `content/practice.js`, `content/curriculum/*.js`, `tests/app.test.cjs`, `docs/ai-ml-opportunities.md` §6/§8.

Ground facts checked while planning (do not re-derive):
- `lookup.py` returns CEFR only for headwords. Inflected forms (`books`, `played`, `can't`, `noodles`) return `None`, so the generator looks up CEFR by an authored `lemma`.
- CMUdict often has spurious or proper-noun variants: `nice`→`n iː s` (the French city), `job`→`dʒ oʊ b` (the biblical name), `fine`→`f ɪ n ə`, `good`→`ɡ ɪ d`. Alternative variants are therefore **opt-in only**.
- CMUdict lists natural elisions as variants (`next`→`n ɛ k s`, `last`→`l æ s`, `asked`→`æ s t`, `hands`→`h æ n z`). If such a variant were accepted, it would hide the target error, so items whose target is the elided phone must not include it.
- CMUdict has **no weak form for `of`** (only `ʌ v`). Weak forms for `of` and similar words need author IPA (`ipaSource: "author"`).
- `dog` is `d ɔː ɡ` and `dock` is `d ɑː k`. They differ in 2 tokens, so they are **not** a valid minimal pair. The generator check must catch cases like this.
- Model vocab (`vocab.json`) contains `ʔ e o a ɐ ɔ ɒ r ɾ ᵻ əʊ eə ʊə` plus merged tokens `ɑːɹ ɔːɹ ɪɹ ɛɹ ʊɹ əl aɪɚ aɪə iə`. It has no stress marks.
- `npm test` runs only `tests/app.test.cjs`, so `package.json` must list the new test file. `scripts/site.cjs` deploys only files referenced by the app, so the new JSON is not deployed until the scorer integration exists. That is intended; do not change it now.

---

## A. Taxonomy design (closed enum, 14 ids)

Decision: keep the 8 existing ids unchanged and add 6 new ones: `final_voicing`, `vowel_quality`, `weak_form`, `consonant_sub`, `linking`, `intonation`. Rejected as separate ids:
- `/h ŋ ɡ–k/`: no evidence [research.md LOW].
- Aspiration: folded into `consonant_sub`.
- Diphthongs: folded into `vowel_quality`.
- Elision/assimilation: folded into `linking`.
- Nuclear/contrastive stress: folded into `intonation` (tonicity is part of intonation).
- Compound/suffix stress: folded into `word_stress`.
- Final /l/ omission: `final_consonant`. Final /l/→[n] substitution: `consonant_sub`.

Groups (used for E-03 drill-down): **Endings** (`final_consonant`, `s_ed_ending`, `final_voicing`), **Clusters** (`cluster`), **Consonants** (`th`, `sibilant`, `consonant_sub`), **Vowels** (`vowel_length`, `vowel_quality`), **Word stress** (`word_stress`), **Speech flow** (`rhythm`, `weak_form`, `linking`, `intonation`).

Priority (intelligibility, per Munro & Derwing [B14], Levis [B15], Lingua Franca Core [B16], Hahn [B13]):
- P1 = often causes misunderstanding.
- P2 = sometimes causes misunderstanding or strongly marks the speech.
- P3 = mainly naturalness or listening skill.

Detection confidence is a design estimate for the on-device stack (wav2vec2-lv-60-espeak-cv-ft phones + pitchy/Web Audio). It must be validated per category (§7.4):
- **high**: may label error items and lower the score.
- **medium**: may label error items, but the wording is hedged ("có thể…").
- **low**: practice tip only. It never labels an auto error item, and mismatches at its targets are excluded from the score.

### A.1 Category table

| # | id | vi label (ERR_CAT) | en label (ERR_CAT) | Definition | Typical Vietnamese realisation (IPA) | L1 reason | Evidence | Pri | Detection signal (on-device) | Conf. |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `final_consonant` | Âm cuối | Final sounds | Word-final consonant dropped, unreleased/glottalised; includes final /l/ dropped and final fricatives /f s ʃ/ dropped | cat [kæ]/[kæʔ]; nice [naɪ]; bike [baɪ]; ball [bɔː] | VN finals /p t k/ are unreleased; no final /s f l/ | [1],[8],[14],[12] research | P1 | Expected final C deleted in alignment, or raw output has `ʔ` in its slot | high |
| 2 | `s_ed_ending` | Đuôi -s/-ed | -s/-ed endings | Inflectional -s/-es/-'s (/s z ɪz/) or -ed (/t d ɪd/) missing or wrong allomorph | books [bʊk]; goes [ɡoʊ]; played [pleɪ]; asked [æs]/[æsk]; liked [laɪkɪd] | No inflection and no final clusters in VN | [2]=[B2] (28.4% /s z/ omitted, n=16), [13] research | P1 | Phones at a `morph` target (suffix) missing/substituted; known target text only (overlap rule A.3) | high |
| 3 | `cluster` | Cụm phụ âm | Clusters | Onset/coda cluster broken by an inserted vowel, or one consonant deleted | street [sə.tɹiːt]/[tɹiːt]/[siːt]; first [fɜːs]; texts [tɛk] | VN syllable C(w)V(C), no clusters | [4] (n=39), [15] (n=7), [1] research | P1 | Vowel token (`ə ɐ ɪ ᵻ`) inserted before or inside an expected C sequence, or deletion of a cluster member | high |
| 4 | `th` | Âm "th" | "th" sounds | /θ ð/ replaced | think [tɪŋk]/[tʰɪŋk]; bath [bæt]; this [zɪs]/[dɪs] | No /θ ð/ in VN; spelling "th" = VN [tʰ] | [3] research | P3 (non-core in LFC [B16]; still taught) | /θ/→t s f; /ð/→d z | high |
| 5 | `sibilant` | Âm /ʃ/ /s/ | /ʃ/ /s/ sounds | /ʃ ʒ tʃ dʒ/ vs /s z/ and each other | ship [sɪp]; she [siː]; cheese [ʃiːz]/[tiːs]; job [zɑːp] | No /ʃ ʒ tʃ dʒ/; VN "ch" is [c], "s/x" merge in North | [5],[6],[7] (n=58) research | P1 | Substitution inside {s z ʃ ʒ tʃ dʒ} (and tʃ→t) | high |
| 6 | `vowel_length` | Nguyên âm dài | Vowel length | Tense/lax pairs /iː–ɪ/, /uː–ʊ/ merged | ship = sheep [ʃiːp]; full [fuːl]; live [liːv] | No phonemic vowel length; one high front/back vowel | [10],[11] research (quality > length) | P1 (LFC core) | Vowel heard as the other member of the pair (quality); duration not judged | medium |
| 7 | `vowel_quality` | Nguyên âm & nguyên âm đôi | Vowels & diphthongs | /æ ɛ ʌ/ confused; diphthongs /eɪ oʊ aɪ aʊ/ reduced to one vowel | cat [kɛt]/[kat]; cut [kɑːt]/[kɔt]; day [de]; go [ɡo] | VN has no /æ ʌ/ contrast; VN [e o] are monophthongs | [research.md #9 U],[#14 teaching] | P2 | Substitution among {æ ɛ ʌ ɑː}; `e` for eɪ, `o`/`ɔ` for oʊ | medium |
| 8 | `final_voicing` | Âm cuối hữu thanh | Voiced endings | Final /b d ɡ v z ʒ dʒ/ devoiced; preceding vowel not lengthened | bed [bɛt]; bag [bæk]; eyes [aɪs]; five [faɪp]/[faɪ] | VN finals are voiceless stops only | [1],[12] research (n unverified) | P2 | Final voiced obstruent recognised as its voiceless pair | medium |
| 9 | `consonant_sub` | Phụ âm dễ lẫn | Confusable consonants | Other L1/dialect substitutions: /v w j b/, /z j dʒ/, /l n ɹ/, final /l/→[n w], initial /p/→[b] | very [jɛɹi]/[wɛɹi]; yes [zɛs]; zoo [juː]; light [naɪt]; red [zɛd]; pig [bɪk] | Dialect mergers (N: d/gi/r→[z]; S: v/d/gi→[j]); no native initial /p/ | [17] teaching, [research.md #11–13 U] | P2 | Substitution inside the listed sets; `r` accepted as /ɹ/ | medium |
| 10 | `word_stress` | Trọng âm | Word stress | Primary stress on wrong syllable; compound vs phrase stress; suffix shifts; noun/verb pairs | hotel [ˈhoʊtɛl]; photography stressed like PHOtograph; GREENhouse = green HOUSE | VN syllables carry tone, not stress; equal weight | [B3] (n=45), [B13], [B6] research | P2 | Per vowel nucleus (CTC timestamps): duration + RMS + mean F0; argmax vs expected `stress`; ≥2 syllables, margin required | medium |
| 11 | `rhythm` | Nhịp điệu | Rhythm | Syllable-timed delivery; content and function words equal; pause after each word | every syllable same length | VN is syllable-timed | [B4],[B5] research | P3 | Vowel-duration variability (nPVI) + inter-word pauses (VAD) | low |
| 12 | `weak_form` | Dạng yếu | Weak forms | Unstressed syllables and function words not reduced to /ə ɪ/ or weak form | to [tuː]; and [æn]; a cup of tea [eɪ kʌp ɔf tiː]; banana [ba.na.na] | VN has no vowel reduction | [9]=[B7] research | P3 | Strong vowel (`æ uː ɔː ʌ eɪ`) in a `weak_form` target slot | low |
| 13 | `linking` | Nối âm | Linking | No C→V / V→V linking; glottal stop or pause before vowel-initial word; vowel inserted between words; elision/assimilation absent | pick it up [pɪk ʔɪt ʔʌp]; Hoi An is [hɔɪ ʔæn ʔɪz]; next day [nɛkstə deɪ] | VN onsets begin with a glottal stop; words are separate syllables | [B7] (natives link ~4.5×) research; [B17] teaching (missing from bibliography) | P3 (P1 for listening) | `ʔ` or pause ≥ LINK_PAUSE_MS at an expected link; inserted vowel at a word boundary | low |
| 14 | `intonation` | Ngữ điệu | Intonation | Tone-like pitch on words; wrong final rise/fall (yes/no, wh, choice, list); nucleus on wrong word | yes/no question ending in a fall; high rise on every stressed word; nucleus always on last word | Lexical tone transfer (sắc tone) | [B1],[B8],[B4] research; [B11],[B12] visual feedback | P2 (nucleus = LFC core) | Final F0 slope (semitones over last voiced 300–500 ms) → rise/fall/level; nucleus = word with max F0 excursion + duration | medium (final direction); low (nucleus) |

The `grammar` key in `ERR_CAT` stays. It is a UI convenience for grammar error items and **not** a pronunciation category. The tests exclude it.

### A.2 Precedence for unexpected mismatches (scorer fallback; one category per mismatched phone)
Authored `expectedErrors` match first. For any other mismatch:
1. `s_ed_ending` if the phone is in a `morph` target.
2. `cluster` if the phone is inside an expected consonant sequence of length ≥2 in the same word, or a vowel is inserted there.
3. `final_consonant` if word-final consonant deleted or `ʔ`.
4. `final_voicing` if final voiced→voiceless.
5. `th`, then `sibilant`, then `consonant_sub` by phone set.
6. `vowel_length`, then `vowel_quality`.
7. `weak_form` if in a weak target.
8. Otherwise, no category. The score still drops, and the UI shows the generic "sound differs" text.

### A.3 `s_ed_ending` vs grammar overlap (handled)
- **Tutor / read-aloud (target text known):** a missing suffix sound is `s_ed_ending` (pronunciation). There is never a grammar item.
- **Roleplay free speech:** if the ASR transcript lacks the inflection ("three ticket", "I visit yesterday"), it is a grammar item (`agreement` / `tense`), and no pronunciation error is logged for that word. If the transcript has the inflection but the aligned phones lack the suffix, it is `s_ed_ending`. One word never gets both.
- Known risk: an ASR language model may "restore" a missing suffix (see G).

### A.4 Accent tolerance (not errors)
Expected IPA comes from CMUdict, which is US English. These are accepted:
- Non-rhotic speech: a post-vocalic `ɹ` may be absent.
- `ɒ` for `ɑː`, `əʊ` for `oʊ`, `eə` for `ɛ ɹ`, `ʊə` for `ʊ ɹ`.
- Flap `ɾ` for /t d/.
- Elisions listed in an item's `ipaAlt`.
- A trilled `r` for /ɹ/.

The goal is intelligibility, not a native accent (Levis [B15]).

### A.5 Dialect notes (Central / Đà Nẵng)
- Northern: d/gi/r → [z], so yes→[zɛs] and red→[zɛd]. Some speakers merge l/n.
- Southern: v/d/gi → [j], so very→[jɛɹi]. Final -n/-ng and -t/-c merge (teaching sources, [U]).
- Central (Huế, Đà Nẵng, Quảng Nam): reported to keep tr/ch, s/x and d/gi/r distinct, so z/j confusion should be rarer [teaching, 17]. A v/d merger is reported [U]. Quảng Nam vowel shifts (a→[ɔ]-like) may affect /æ ɑː/ [U, planner hypothesis].
- **Policy:** the app never detects or labels dialect. Units are the same for everyone. The doc gives teachers dialect notes per unit, and the pilot should measure which features Đà Nẵng students actually show (PRD §14).

---

## B. PRD changes (apply with exact find/replace; keep PRD in English)

### B.1 §6: replace the whole section
**Find**: everything from the line `# **6\. Vietnamese-Learner Pronunciation Error Taxonomy**` up to and including the paragraph that starts `Grammar issues use a separate closed set:` (it ends `...is not a ninth pronunciation category.`). Stop before `<a id="assessment"></a>`.
**Replace with**:

```markdown
# **6\. Vietnamese-Learner Pronunciation Error Taxonomy**

Vietnamese is a tonal, syllable-timed language. A syllable has at most one final consonant, final /p t k/ are unreleased, there are no consonant clusters and there is no native /θ ð ʃ ʒ tʃ dʒ/. Vietnamese speakers of English therefore show predictable error patterns. The Tutor classifies each pronunciation error into exactly one of the closed categories below. The stored ids are in code font; the app's Vietnamese and English labels live in `ERR_CAT`. Priority follows intelligibility: P1 errors most often cause misunderstanding, while P3 errors mainly affect naturalness or listening. Evidence, examples and practice items for every category are in the pronunciation lesson plan `docs/giao-an-phat-am.md`; its data is in `content/pronunciation/`.

| Category | Group (E-03) | Typical Vietnamese realisation | Detection signal | Detection confidence | Priority |
| :---- | :---- | :---- | :---- | :---- | :---- |
| `final_consonant` — Dropped, unreleased or glottalised final consonant (including final /l/) | Endings | “cat” → [kæ] or [kæʔ]; “nice” → [naɪ]; “ball” → [bɔː] | Expected final consonant missing, or heard as a glottal stop | High | P1 |
| `s_ed_ending` — Missing or wrong -s/-es/-’s and -ed endings | Endings | “books” → [bʊk]; “played” → [pleɪ]; “liked” → [laɪkɪd] | Expected suffix sounds missing when the target text is known (overlap rule below) | High | P1 |
| `final_voicing` — Final voiced consonant devoiced | Endings | “bed” → [bɛt]; “bag” → [bæk]; “eyes” → [aɪs] | Final /b d ɡ v z ʒ dʒ/ heard as its voiceless pair | Medium | P2 |
| `cluster` — Consonant cluster broken by an extra vowel or simplified | Clusters | “street” → [sə.tɹiːt] or [tɹiːt]; “first” → [fɜːs] | Inserted vowel inside or before the cluster, or one cluster consonant missing | High | P1 |
| `th` — “th” sounds /θ/ and /ð/ | Consonants | “think” → [tɪŋk]; “this” → [zɪs] or [dɪs] | /θ/ heard as /t s f/; /ð/ heard as /d z/ | High | P3 |
| `sibilant` — /ʃ ʒ tʃ dʒ/ versus /s z/ | Consonants | “ship” → [sɪp]; “she” → [siː]; “job” → [zɑːp] | Substitution among /s z ʃ ʒ tʃ dʒ/ | High | P1 |
| `consonant_sub` — Other substitutions: /v w j b/, /z j dʒ/, /l n ɹ/, initial /p/ | Consonants | “very” → [jɛɹi]; “yes” → [zɛs]; “light” → [naɪt]; “pig” → [bɪk] | Substitution within these sets (a trilled r is accepted) | Medium | P2 |
| `vowel_length` — Tense/lax pairs /iː–ɪ/ and /uː–ʊ/ | Vowels | “ship” and “sheep” both [ʃiːp]; “full” → [fuːl] | Vowel heard as the other member of the pair (by quality; duration is not judged) | Medium | P1 |
| `vowel_quality` — /æ ɛ ʌ/ and diphthongs /eɪ oʊ aɪ aʊ/ | Vowels | “cat” → [kɛt]; “cut” → [kɑːt]; “day” → [de]; “go” → [ɡo] | Vowel substitution, or a diphthong heard as a single vowel | Medium | P2 |
| `word_stress` — Wrong stressed syllable, including compounds, suffix shifts and noun/verb pairs | Word stress | “hotel” stressed on the first syllable; “photography” stressed like “photograph” | Relative length, loudness and pitch of each syllable versus the expected stress | Medium | P2 |
| `rhythm` — Syllable-by-syllable rhythm | Speech flow | Every syllable given equal length; a pause after each word | Variation of vowel lengths and pauses between words | Low | P3 |
| `weak_form` — Unstressed syllables and function words not reduced | Speech flow | “to” → [tuː]; “and” → [æn]; “a cup of tea” with full vowels | Strong vowel heard where a schwa or weak form is expected | Low | P3 |
| `linking` — Words not linked; glottal stop or pause before a vowel-initial word | Speech flow | “pick it up” → [pɪk ʔɪt ʔʌp] | Glottal stop, pause or inserted vowel at an expected linking point | Low | P3 |
| `intonation` — Tone-like pitch, wrong final rise or fall, or nucleus on the wrong word | Speech flow | A yes/no question ending in a fall; a high rise on every stressed word | Pitch direction at the end of the phrase; position of the main pitch movement | Medium (final rise/fall); Low (nucleus) | P2 |

**Detection confidence.** These ratings are design estimates and must be measured (Section 7.4).
- *High* and *Medium* categories may label error items (R-10) and lower the pronunciation score; Medium feedback is worded as a likely, not a certain, error.
- *Low* categories only give practice tips. They never become the category of an automatic error item, and they do not lower scores.
- A category is moved to a lower confidence level if its agreement with teacher labels is below the pilot target (Section 14).

**Overlap rules.**
- Each mismatched sound gets one category. Precedence: `s_ed_ending` > `cluster` > `final_consonant` > `final_voicing` > the other categories.
- When the target text is known (Tutor, read-aloud), a missing ending is `s_ed_ending`. In free Roleplay speech, a transcript without the inflection (“three ticket”, “I visit yesterday”) is a grammar error, and no pronunciation error is logged for that word. A word never receives both.

**Accent and dialect.**
- Reference IPA is American (CMUdict). Non-rhotic, British, Australian and other accepted variants listed with each practice item are not errors. The aim is intelligibility, not a native accent.
- Vietnamese dialects differ. Northern speakers may say d/gi/r as [z]; Southern speakers may say v/d/gi as [j]. Central speakers, including Đà Nẵng, are reported to keep more of these distinctions; this report is unverified.
- The app does not detect or label dialect; it reports only the categories above.

*Validation of this taxonomy: collect a sample of student recordings at the pilot school and have an English teacher label the errors. Then report, per category, how often it occurs and how well the system detects it (precision and recall against the teacher's labels).*

Grammar issues use a separate closed set: `tense`, `agreement`, `article`, `word_order`, `other`. These are distinct from the pronunciation categories; a generic grammar label is not a pronunciation category.
```

### B.2 §5.2 T-02
**Find**: `| T-02 | Phonetic error breakdown. | Should | For each word, the specific problem is identified using the categories in Section 6 (e.g., missing final /t/, cluster /str/ broken into syllables) and the faulty sound is highlighted. |`
**Replace** (one table row):
```markdown
| T-02 | Phonetic error breakdown. | Should | For each word or sentence, the specific problem is identified using the categories in Section 6 (e.g., missing final /t/, cluster /str/ broken into syllables, /eɪ/ reduced to [e]) and the faulty sound is highlighted. Categories with low detection confidence appear as practice tips, not errors. Explanations and drills come from the pronunciation lesson plan (`docs/giao-an-phat-am.md`; data in `content/pronunciation/`). |
```

### B.3 §5.3 E-03
**Find**: `| E-03 | Sub-criteria drill-down. | Should | Tapping an axis shows its sub-criteria (e.g., Pronunciation: final sounds, word stress, consonant clusters) without cluttering the main chart. |`
**Replace**: `| E-03 | Sub-criteria drill-down. | Should | Tapping an axis shows its sub-criteria without cluttering the main chart. Pronunciation shows the six groups of Section 6 (Endings, Clusters, Consonants, Vowels, Word stress, Speech flow). Only categories with high or medium detection confidence contribute to a group score; a group without such data shows practice suggestions instead of a number. |`

### B.4 §5.7 intake rule (4)
**Find**: `(4) it has R-02 vocabulary and a pronunciation focus from Section 6;`
**Replace**: `(4) it has R-02 vocabulary and a pronunciation focus whose category is a Section 6 id, linked where possible to the matching unit of the pronunciation lesson plan;`

### B.5 §7.1 Pronunciation row
**Find**: `| Pronunciation | Phoneme accuracy; final sounds; consonant clusters; word stress; intonation | Pronunciation assessment at phoneme and word level |`
**Replace**: `| Pronunciation | Phoneme accuracy grouped as in Section 6: endings, clusters, consonants, vowels, word stress and speech flow (intonation). Low-confidence categories (rhythm, weak forms, linking) give feedback only | Pronunciation assessment at phoneme and word level against the expected text; syllable length, loudness and pitch for stress and intonation |`

### B.6 §12: add two rows
Insert both after the row starting `| Speech recognition misreads accented speech`:
```markdown
| Automatic detection mislabels stress, rhythm or connected-speech errors, or flags acceptable accent and dialect variants as errors | Wrong feedback; learners practise the wrong thing or lose trust | Give every Section 6 category a detection confidence; low-confidence categories give tips only and never lower scores; accept listed accent variants; measure per-category agreement with teacher labels (Section 7.4) before raising a category's confidence |
| Pronunciation lesson content contains wrong IPA, false minimal pairs or unsuitable explanations | Learners practise wrong models | Generate IPA from CMUdict, check minimal pairs automatically, and keep every unit unverified until an English teacher reviews it with the checklist in `docs/giao-an-phat-am.md` |
```

### B.7 §14: append
```markdown
16. Which English teacher reviews the pronunciation lesson plan (`docs/giao-an-phat-am.md`) and sets each unit's verified flag, and which reference accent the review uses (the data is American CMUdict; R-06 also offers British, Indian and Australian voices).

17. The per-category detection accuracy required before a Section 6 category may label error items or count towards scores, and the size of the teacher-labelled sample used to measure it (Section 7.4).

18. Which dialect features (Section 6) Đà Nẵng pilot students actually show, so pronunciation units can be prioritised for that group.
```
Do not change anything else in the PRD. Appendix A row 8 is a historical pitch slide, so leave it.

---

## C. Lesson plan structure (20 units)

Bands:
- `A1-A2`: U01–U07, CEFR cap A2.
- `B1`: U08–U14, cap B1.
- `B2-C1`: U15–U20, cap B2. `null` (not in CEFR-J) is allowed in this band.

Each unit has one focus `category`. At least 70% of its targets carry that category; the rest may be other categories (e.g. U12 final-/l/ items use `final_consonant`). The seed words and pairs below were **checked with lookup.py** (variant index in brackets where it is not 0). Builders may swap seeds only for words that pass the generator checks.

| id | level | category | title vi / en | can-do (en; write vi equivalent) | prereq | kind |
|---|---|---|---|---|---|---|
| U01 | A1 | final_consonant | Âm cuối /p t k/ và /s/ / Final /p t k/ and /s/ | I can finish short words with a clear final /p t k s/ | – | segmental |
| U02 | A1 | s_ed_ending | Đuôi -s: /s z ɪz/ / Plural and -s endings | I can say plural and he/she -s endings | U01 | segmental |
| U03 | A1 | th | Âm /θ/ và /ð/ / The "th" sounds | I can say /θ/ and /ð/ in common words | – | segmental |
| U04 | A1 | sibilant | Âm /ʃ tʃ dʒ/ khác /s z/ / Sh, ch and j sounds | I can tell ship from sip and say /ʃ tʃ dʒ/ | – | segmental |
| U05 | A2 | vowel_length | Nguyên âm /iː–ɪ/, /uː–ʊ/ / Long and short vowels | I can make ship–sheep and full–fool sound different | – | segmental |
| U06 | A2 | word_stress | Trọng âm từ 2–3 âm tiết / Stress in 2–3 syllable words | I can stress the right syllable in place and food words | – | stress |
| U07 | A2 | intonation | Lên giọng, xuống giọng / Rising and falling tunes | I can end statements and wh-questions falling, yes/no questions rising | U06 | prosody |
| U08 | B1 | cluster | Cụm phụ âm đầu / Starting clusters | I can start words like street, play, spring with no extra vowel | U01 | segmental |
| U09 | B1 | s_ed_ending | Đuôi -ed: /t d ɪd/ / Past -ed endings | I can choose and say the right -ed ending | U02 | segmental |
| U10 | B1 | final_voicing | Âm cuối hữu thanh / Voiced final sounds | I can make bed–bet and rise–rice different | U01 | segmental |
| U11 | B1 | vowel_quality | /æ ɛ ʌ/ và nguyên âm đôi / Vowels and diphthongs | I can say cat–cut–bed and full diphthongs /eɪ oʊ/ | U05 | segmental |
| U12 | B1 | consonant_sub | Phụ âm dễ lẫn / Confusable consonants | I can keep v/w/j, l/n/r and p/b apart, and finish final /l/ | – | segmental |
| U13 | B1 | linking | Nối âm phụ âm–nguyên âm / Linking words | I can link a final consonant to the next vowel with no stop | U01 | prosody |
| U14 | B1 | word_stress | Trọng âm từ ghép / Compound vs phrase stress | I can say SEAfood, NIGHT market vs old TOWN | U06 | stress |
| U15 | B2 | cluster | Cụm phụ âm cuối / Final clusters | I can keep every consonant in texts, months, landmarks | U08, U09 | segmental |
| U16 | B2 | weak_form | Dạng yếu / Weak forms | I can reduce to, of, and, can, for in fluent sentences | U14 | prosody |
| U17 | B2 | rhythm | Nhịp tiếng Anh / Stress-timed rhythm | I can keep a steady beat on content words | U16 | prosody |
| U18 | B2 | word_stress | Trọng âm đổi theo hậu tố / Stress shifts | I can move stress in photograph → photography, REcord → reCORD | U14 | stress |
| U19 | C1 | intonation | Trọng âm câu và ngữ điệu / Focus and tunes | I can put the main stress on new or contrastive information and use choice/list tunes | U07, U17 | prosody |
| U20 | C1 | linking | Nối, nuốt và đồng hoá âm / Fluent connected speech | I can join words across consonants (next day, ten people) without extra vowels or gaps | U13, U15 | prosody |

In the JSON, `prereq` is an array (`[]` = none). Every prereq id must come earlier in the list.

### C.1 Seeds (checked with lookup.py)
Seed lists may hold more than 12 words: pick the best 8–12. Notation: `a–b` = minimal pair; `(1)` = CMUdict variant index 1; `lemma:` = the CEFR lemma for inflected forms.

- **U01**
  - Words: cat, kite, map, bike, book, night, cup, boat, white, lake, nice, rice.
  - Pairs (deletion): why–white, see–seat, buy–bike, lie–light, tie–tight, my–mike.
- **U02**
  - Words: books, maps, cats, bikes, bags, rooms, trees, goes, likes, bridges(1), beaches(1), dishes(1). Lemmas: book, map, cat, bike, bag, room, tree, go, like, bridge, beach, dish.
  - Pairs (deletion): bag–bags, bee–bees, tie–ties, book–books, cat–cats, map–maps.
- **U03**
  - Words: think, thank, three, thing, mouth, month, bath, birthday, this, that, they, mother, weather.
  - Pairs (substitution): thin–tin, three–tree, bath–bat, path–pass, they–day, then–den.
- **U04**
  - Words: ship, she, shoe, fish, fresh, sugar, shell, cheese, chair, beach, juice, job, bridge.
  - Pairs: ship–sip, she–see, shoe–sue, sheet–seat, chin–shin, chip–ship.
- **U05**
  - Words: sheep, leave, feel, seat, beach, sleep, green, pool, food, school, full, good, look, cook.
  - Pairs: ship–sheep, sit–seat, live(1)–leave, fill–feel, full–fool, pull–pool.
- **U06** (stress = 1-based syllable from lookup)
  - Words: hotel 2, banana 2, museum 2, delicious 2, computer 2, tomato 2, tonight 2, coffee 1, mountain 1, festival 1, market 1, temple 1, beautiful 1.
  - Pairs: none. Perception is stress-tap.
- **U07**: short sentences (see C.3). Tune pairs: "It's hot." ↘ / "It's hot?" ↗; "You like it." / "You like it?"; "It's far." / "It's far?"; "Here." / "Here?" (4–6 in total).
- **U08**
  - Words: street, stop, spoon, school, sky, small, snow, sleep, play, black, clean, bread, friend, train, spring, strong.
  - Pairs: sport–support (insertion of ə), play–pay, spot–pot, steam–team, snack–sack, pray–pay.
  - Chain: street = iː t → ɹ iː t → t ɹ iː t → s t ɹ iː t; also spring.
- **U09**
  - Words: asked (no alt), walked, watched, cooked, stopped, liked, played, opened, cleaned, rained, lived, visited, wanted, needed(1), started, painted. Lemmas are the base verbs.
  - Pairs (deletion): play–played, rain–rained, clean–cleaned, walk–walked, cook–cooked, stop–stopped.
- **U10**
  - Words: bed, bag, dog, food, card, prize, leave, save, five, eyes (lemma eye), cheese, noise, his.
  - Pairs: bed–bet, bag–back, cab–cap, prize–price, rise–rice, leave–leaf. Spares: eyes–ice, save–safe, card–cart, had–hat.
- **U11**
  - Words: cat, bag, man, hat, bed, pen, cup, run, fun, day, late, rain, plate, boat, go, home, phone.
  - Pairs: bad–bed, pan–pen, cat–cut, cap–cup, fan–fun, late–let.
- **U12**
  - Words: very, vote, five, wine, west, yes, yellow, zoo, red, right, light, line, pig, park, plus final /l/: ball, school, well, feel.
  - Pairs: wine–vine, wet–vet, yet–jet, light–right, line–nine, pig–big.
  - Subsets in the doc: v/w/j; z/j/dʒ; l/n/ɹ (+ final l); p/b.
- **U13**: phrases (see C.3): pick it up, an apple, look at, turn off, come in, hold on, go out (w-link), the end (j-link), Hoi An is old (Hoi An unscored).
  - Juncture pairs (identical phones): an aim / a name; an ice / a nice; ice cream / I scream; that's tough / that stuff.
- **U14**
  - Compounds: seafood, sunset, sunrise, bookshop, greenhouse, blackboard, bus stop, fish sauce, night market, weekend.
  - Phrases: old town, green house, black board, big boat.
  - Stress pairs: greenhouse / green house; blackboard / black board; hot dog (food) / hot dog (warm dog).
- **U15**
  - Words: texts (lemma text), months, landmarks, crafts, scripts, depths, helped, jumped, changed, guests, tasks, desks, lamps, hands, next, wildlife (all with no alt).
  - Pairs: pass–past, bell–belt, ten–tent, fell–felt, miss–mist.
- **U16**: weak-form sentences; targets to, of, and, can, for, a, the, from, was, some, them, at.
  - Weak pairs: "I can swim." / "I can't swim."; "We can go." / "We can't go."
  - Perception: function-word dictation, 10 trials.
- **U17**: rhythm sentences built on beat ladders: "Cats eat fish. / The cats eat fish. / The cats will eat the fish." Perception: count the beats (4 items). No pairs.
- **U18**
  - Words: photograph 1, photography 2, photographer 2, history 1, historical 2, economy 2, economic 3, celebrate 1, celebration 3, communicate 2, communication 4, tradition 2, traditional 2, architecture 1.
  - Stress pairs (noun/verb): record n(1)/v(0), present n(0)/v(1), increase n(1)/v(0), import n(1)/v(0). Pick each variant by its `stress`.
- **U19**: focus sentences with `nucleus`.
  - Nucleus pairs: "My FRIEND lives in Hội An." / "My friend lives in HỘI AN." (Vietnamese name unscored); "I want the RED lantern." / "I want the red LANTERN."
  - Tune pair: "Tea or coffee?" choice ↘ / yes-no ↗.
- **U20**: phrases next day, last time, old town, handmade (no alt), good boy, ten people, green park, hot dog, fish sauce.
  - Errors targeted: a vowel inserted between consonants, and a pause or glottal stop at the junction. Natural elision or assimilation counts as correct (`ipaAlt` + `allowElision`).
  - Pairs: 0–4 optional.

### C.2 Per-unit content counts (all text items need `vi` and `en`)

| Field | segmental | stress | prosody (intonation, weak_form, linking, rhythm) |
|---|---|---|---|
| `why` (evidence-tagged bullets) | 2–3 | 2–3 | 2–3 |
| `howTo` steps (teen-friendly, ≤ 25 words each) | 3–5 | 3–5 | 3–5 |
| `perception` | 2AFC on `pairs`, 10 trials | stress-tap on `words`, 10 trials | intonation: 2AFC rise/fall on pairs; weak_form: function-word dictation; linking: juncture 2AFC; rhythm: beat count (4 items) |
| `words` | 8–12 | 8–12 | 0 |
| `pairs` | 4–6 | 0–6 (`stress` type) | intonation 4–6, linking (U13) 4–6, U20 0–4, weak_form 2–4, rhythm 0 |
| `sentences` | 3–5 | 3–5 | 8–12 (these are the production items) |
| `contrasts` (wrong → right + note) | 2–4 | 2–4 | 2–4 |
| `chain` (back-chaining / shadowing steps) | required for cluster units, optional otherwise | optional | required (shadowing steps, 3–5) |
| `selfCheck` | required | required | required |

Perception design (HVPT [B9]):
- Each trial plays a TTS item in one of ≥3 different voices (from the R-06 accents), chosen at random. Immediate right/wrong feedback.
- Criterion: ≥ 8/10 correct before production.
- The JSON stores `voices: 3` and `trials: 10`; it does not store audio.

Production and success criteria (`selfCheck`):
- Each word or sentence is scored 0–100.
- Below `PRON_THRESHOLD = 60` (PRD §7.2) → R-10 error item (high/medium categories only).
- An item is mastered by T-05 (≥80 on two distinct days, Asia/Ho_Chi_Minh).
- A unit is **passed** when perception ≥ 80% and ≥ 80% of its production items have scored ≥ 80 at least once.
- Low-confidence units (rhythm, weak_form, linking) pass by perception + a learner self-check checklist + an optional teacher check. The app shows the score but never gates on it.
- The JSON stores `selfCheck: {threshold: 80, itemsToPass: 0.8, perceptionToPass: 0.8, gate: "score"|"selfcheck", vi, en}`.

### C.3 Authoring rules (builder must follow)
- **howTo**:
  - Articulation in plain Vietnamese for 15–17-year-olds (tongue, lips, air, voice "rung cổ").
  - One action per step.
  - Use Vietnamese analogies only when accurate, and add the warning where needed (e.g. Vietnamese "th" [tʰ] ≠ English /θ/).
  - No IPA jargon beyond the target symbols.
- **why**: each bullet ends with its ref ids from research.md (e.g. `[2]`, `[B7]`). Do not cite anything not in research.md. A claim from a `[teaching]`/`[U]` source is worded "thường gặp" or "được báo cáo", not as a statistic.
- **Sentences**:
  - Original text (`source: {type:"original", author:"EchoLạc"}`), or Tatoeba (`{type:"tatoeba", id:<int>, author:"<username>", license:"CC BY 2.0 FR"}`), and only if the builder actually fetched it (a sentence-page URL is recorded in credits).
  - Length ≤ 10 words at A1-A2, ≤ 15 at B1, ≤ 22 at B2-C1.
  - ≥ 2 target-phone instances per sentence.
  - ≥ 2 sentences per unit on Đà Nẵng/Hội An/Huế culture (beach, bridges, market, food, weather, lanterns).
  - **No dates, numbers, prices, opening hours or historical claims.** Opinions and descriptions only ("I like the night market.", "The beach is clean and quiet."), or a sentence copied verbatim from a `content/curriculum` talk line (then set `factFrom: "<scenario id>"`).
- **Proper nouns**: Vietnamese names (Đà Nẵng, Hội An, Mỹ Khê, mì Quảng, Sơn Trà) are always `ipa: null` (unscored), even if CMUdict has an anglicised entry. English names (Marble Mountains, Dragon Bridge) are scored only if every word is in CMUdict.
- **Contrasts**: `wrongIpa` = the Vietnamese realisation (may use variant tokens), `rightIpa` = target. The note says what to change physically.
- **Chain**:
  - Back-chaining for clusters/finals: from the end to the full word, e.g. "iːt → ɹiːt → tɹiːt → stɹiːt".
  - Shadowing for prosody: (1) listen ×2; (2) hum the tune; (3) whisper with the audio; (4) speak with the audio; (5) speak alone.
  - Visual pitch [B11][B12]: match the shape, do not copy the voice.

---

## D. Data contract: `content/pronunciation/`

### D.1 File layout
```
content/pronunciation/
  index.json        # unit order + file names
  categories.json   # 14 ids → {group, priority, confidence, signal}; labels stay in ERR_CAT
  tokens.json       # allowed tokens, model→canonical normalisation, equivalences
  credits.json      # CMUdict, CEFR-J, Tatoeba (if used), research refs
  units/u01-final-stops.json … units/u20-connected-speech.json   # one file per unit
```
- JSON is pretty-printed with 2 spaces and a trailing newline, UTF-8 (no BOM).
- Each unit file should stay readable (aim ≤ 600 lines). These are data, not code, so the 300-line code limit does not apply, but still keep them small.

### D.2 `index.json`
```json
{ "version": 1, "generated": "2026-11-22", "generator": "scratchpad build_pron.py (not shipped)",
  "units": [ { "id": "U01", "file": "units/u01-final-stops.json", "level": "A1", "band": "A1-A2", "category": "final_consonant" } ] }
```

### D.3 `categories.json`
```json
{ "final_consonant": { "group": "endings", "priority": "P1", "confidence": "high",
    "signal": "final consonant deleted or ʔ" },
  "intonation": { "group": "flow", "priority": "P2", "confidence": "medium", "confidenceNucleus": "low",
    "signal": "final F0 slope; nucleus position" } }
```
- Group enum: `endings | clusters | consonants | vowels | stress | flow`.
- Keys must equal the `ERR_CAT` keys minus `grammar`.

### D.4 `tokens.json`
```json
{
  "english": ["p","b","t","d","k","ɡ","f","v","θ","ð","s","z","ʃ","ʒ","h","tʃ","dʒ","m","n","ŋ","l","ɹ","w","j",
              "iː","i","ɪ","ɛ","æ","ɑː","ɔː","ʊ","uː","ʌ","ə","ɚ","ɜː","eɪ","aɪ","ɔɪ","oʊ","aʊ"],
  "vowels": ["iː","i","ɪ","ɛ","æ","ɑː","ɔː","ʊ","uː","ʌ","ə","ɚ","ɜː","eɪ","aɪ","ɔɪ","oʊ","aʊ"],
  "variant": ["ʔ","e","o","a","ɐ","ɔ","ɒ","r","ɾ","ᵻ"],
  "normalize": {
    "ɑːɹ": ["ɑː","ɹ"], "ɔːɹ": ["ɔː","ɹ"], "oːɹ": ["ɔː","ɹ"], "ɪɹ": ["ɪ","ɹ"], "ɛɹ": ["ɛ","ɹ"], "ʊɹ": ["ʊ","ɹ"],
    "eə": ["ɛ","ɹ"], "ʊə": ["ʊ","ɹ"], "aɪɚ": ["aɪ","ɚ"], "aɪə": ["aɪ","ə"], "əl": ["ə","l"], "iə": ["i","ə"],
    "r": ["ɹ"], "ɐ": ["ə"], "ɑ": ["ɑː"], "ɒ": ["ɑː"], "əʊ": ["oʊ"], "ɜ": ["ɜː"], "iːː": ["iː"]
  },
  "equivalent": [["t","ɾ"],["d","ɾ"],["ɪ","ᵻ"],["ə","ᵻ"],["ə","ɪ"],["i","iː"],["i","ɪ"],["ʌ","ə"],["ɚ","ɜː"],["ɑː","ɔː"]],
  "rules": { "postvocalicROptional": true, "stripGeminateLength": true, "glottalStop": "remove-before-scoring-keep-for-categories" },
  "source": "Tokens follow the espeak IPA vocabulary of facebook/wav2vec2-lv-60-espeak-cv-ft (Apache-2.0); vocab file not shipped."
}
```
Normalisation semantics (for the later scorer; the builder only writes the file):
1. **Model output:**
   - Expand `normalize` keys (merged tokens → canonical split, CMUdict-like).
   - Strip a trailing `ː` from consonant tokens (`pː`→`p`).
   - Drop `<pad> <s> </s> <unk>`.
2. **Score pass:** remove `ʔ`, then align with weighted Levenshtein. `equivalent` pairs cost 0. A missing post-vocalic `ɹ` costs 0. Other tokens not in `english ∪ variant` cost 1.
   - Stress and length are compared separately; ɚ vs ɜː is not a stress cue.
   - Expected `i` (CMUdict IY0, unstressed) accepts `i iː ɪ`.
   - `ᵻ` (espeak reduced vowel in -es/-ed) accepts expected `ɪ`/`ə`.
   - Flap `ɾ` accepts expected `t`/`d`.
3. **Category pass:** use raw tokens (with `ʔ`, `e`, `o`, `ɐ`) and match each item's `expectedErrors[].variantIpa` first, then the precedence in A.2.
4. **Accents:** `ɒ`, `əʊ`, `eə` are normalised to their US equivalents, so British output is not penalised.

### D.5 Unit file schema
```json
{
  "id": "U01", "level": "A1", "band": "A1-A2", "category": "final_consonant", "kind": "segmental",
  "prereq": [],
  "title":  { "vi": "Âm cuối /p t k/ và /s/", "en": "Final /p t k/ and /s/" },
  "cando":  { "vi": "Em nói rõ âm cuối /p t k s/ trong từ ngắn.", "en": "I can finish short words with a clear final /p t k s/." },
  "why":    [ { "vi": "…", "en": "…", "refs": ["[1]", "[8]"] } ],
  "howTo":  [ { "vi": "…", "en": "…" } ],
  "perception": { "type": "2afc", "pairIds": ["U01-p01"], "trials": 10, "voices": 3, "criterion": 0.8 },
  "words": [ {
      "id": "U01-w01", "text": "cat", "lemma": "cat", "cefr": "A1", "scenarioVocab": null,
      "ipa": ["k","æ","t"], "ipaSource": "cmudict", "variant": 0, "ipaAlt": [], "allowElision": false,
      "syllables": 1, "stress": 1,
      "targets": [ { "index": [2], "category": "final_consonant", "morph": false } ],
      "expectedErrors": [
        { "category": "final_consonant", "variantIpa": ["k","æ"],     "note": { "vi": "Bỏ mất /t/.", "en": "Final /t/ dropped." } },
        { "category": "final_consonant", "variantIpa": ["k","æ","ʔ"], "note": { "vi": "Tắc họng, không chạm lưỡi.", "en": "Glottal stop instead of /t/." } } ],
      "detectConfidence": "high" } ],
  "pairs": [ { "id": "U01-p01", "type": "deletion", "category": "final_consonant",
      "a": { "text": "why",   "ipa": ["w","aɪ"],     "cefr": "A1", "variant": 0 },
      "b": { "text": "white", "ipa": ["w","aɪ","t"], "cefr": "A1", "variant": 0 },
      "diffIndex": 2, "contrast": ["∅","t"] } ],
  "sentences": [ {
      "id": "U01-s01", "text": "I like the night market.", "cefr": "A2",
      "words": [ { "w": "I", "ipa": ["aɪ"] }, { "w": "like", "ipa": ["l","aɪ","k"] }, { "w": "the", "ipa": ["ð","ə"] },
                 { "w": "night", "ipa": ["n","aɪ","t"] }, { "w": "market", "ipa": ["m","ɑː","ɹ","k","ə","t"] } ],
      "targets": [ { "word": 1, "index": [2], "category": "final_consonant", "morph": false },
                   { "word": 3, "index": [2], "category": "final_consonant", "morph": false } ],
      "prosody": null, "detectConfidence": "high",
      "source": { "type": "original", "author": "EchoLạc" }, "factFrom": null } ],
  "contrasts": [ { "id": "U01-c01", "wrongIpa": ["n","aɪ"], "rightIpa": ["n","aɪ","s"],
      "note": { "vi": "…", "en": "…" } } ],
  "chain": [ { "text": "ike → bike", "steps": [["aɪ","k"],["b","aɪ","k"]], "note": { "vi": "…", "en": "…" } } ],
  "selfCheck": { "threshold": 80, "itemsToPass": 0.8, "perceptionToPass": 0.8, "gate": "score", "vi": "…", "en": "…" },
  "teacherNotes": { "vi": "Ghi chú phương ngữ / độ tin cậy…", "en": "…" },
  "verified": false, "reviewedBy": null
}
```

**Field rules:**
- **IPA and CEFR are generator-filled:** `ipa` is copied from `lookup(text)[variant]['ipa']`; `ipaSource: "cmudict"`. `syllables` = number of `vowels` tokens; `stress` = lookup `stress_syllable` (null for monosyllables in sentences).
- `ipaAlt` is opt-in. The author lists variant indexes (`altVariants: [1]`) in the authoring file; the generator copies those variants. Each alt must have the same length as `ipa` unless `allowElision: true`. `allowElision` is forbidden when an alt deletes a target phone.
- `ipaSource: "author"` is allowed only for weak forms CMUdict lacks (`of` → `["ə","v"]`) and for `chain` fragments. All its tokens must be in `english`.
- `targets[].index` is 0-based into `ipa` (or into `words[k].ipa`). `morph: true` marks inflectional suffix phones (U02, U09, U15 suffixes).
- `expectedErrors[].variantIpa` tokens must be in `english ∪ variant`, and differ from `ipa`.
- `cefr` = `cefr(lemma)` by generator, never typed by hand. Allowed: `A1 A2 B1 B2 null`. It must be ≤ the band cap.
  - `null` is allowed when the band is `B2-C1`, or when `scenarioVocab` names an existing scenario id (e.g. `dragon`, `noodles` from a curriculum lesson). At most 2 nulls per unit below B2-C1.
  - Sentence `cefr` = max over scored words.
- **Pair types:**
  - `substitution`: same length, exactly one index differs (= `diffIndex`), `contrast` = [a[i], b[i]].
  - `deletion`/`insertion`: b = a + one token at `diffIndex`, `contrast` = ["∅", b[i]].
  - `stress`: same concatenated phones or both from CMUdict, with a different `stress`/`stressWord`.
  - `tune`: same text, `prosody.final` differs.
  - `nucleus`: same text, `prosody.nucleus` differs.
  - `weak`: texts differ only by can/can't (or similar; no phone rule).
  - `juncture`: different texts whose concatenated `ipa` (weak variants of a/an/the) are identical.
  - Both pair words must be in CMUdict, and at least one must have cefr ≤ cap; the other may be null (perception only).

**Prosody objects** (on sentences/phrases; `detectConfidence` from categories.json):
- `intonation`: `{ "final": "fall"|"rise"|"fall-rise", "nucleus": <wordIndex>|null, "type": "statement"|"wh"|"yesno"|"choice"|"list"|"tag"|"echo" }`.
- `word_stress` multiword items (U14): `{ "stressWord": <wordIndex>, "stressSyllable": <1-based> }`. Single words use top-level `stress`.
- `rhythm`: `{ "beats": [wordIndex…], "weak": [wordIndex…] }`, beats = content words.
- `weak_form`: a target with `category: "weak_form"`, `index` = the vowel slot; `expectedErrors.variantIpa` = the strong form.
- `linking`: `{ "links": [ { "after": <wordIndex>, "type": "CV"|"VV_w"|"VV_j"|"elision"|"assimilation", "note": {vi,en} } ] }`.
  - For elision/assimilation, `ipaAlt` on the word carries the reduced form (e.g. next → `n ɛ k s` from CMUdict variant 1) and `allowElision: true`. This is legal here because the target is the junction, not the phone.

### D.6 `credits.json`
```json
{ "data": [
  { "id": "cmudict", "name": "The CMU Pronouncing Dictionary", "url": "https://github.com/cmusphinx/cmudict",
    "license": "BSD-2-Clause", "copyright": "<copy the exact notice from the repo LICENSE>", "use": "IPA for every item (converted to espeak tokens)" },
  { "id": "cefrj", "name": "CEFR-J Wordlist Version 1.5", "compiler": "Yukio Tono, Tokyo University of Foreign Studies",
    "url": "http://www.cefr-j.org/download.html", "license": "Free for research and commercial use with citation",
    "citation": "<exact citation wording from the download page>", "use": "CEFR level of each word" },
  { "id": "tatoeba", "name": "Tatoeba", "url": "https://tatoeba.org", "license": "CC BY 2.0 FR",
    "items": [ { "itemId": "U07-s03", "sentenceId": 0, "author": "" } ] } ],
  "research": "See docs/giao-an-phat-am.md, Tài liệu tham khảo (ids from the research notes).",
  "inspiration": "Unit structure loosely inspired by Cadence (MIT); no Cadence content copied." }
```
- If the builder cannot fetch the CMUdict LICENSE text or the CEFR-J citation, it writes `"TODO-owner: fetch from <url>"` and lists this in its report.
- Remove the `tatoeba` entry if no Tatoeba sentence is used.

---

## E. Doc format: `docs/giao-an-phat-am.md` (Vietnamese, for teachers)

Generated by the same script from the same authored data, so it cannot drift from the JSON. Structure:

```
# Giáo án phát âm tiếng Anh cho học sinh Việt Nam (A1–C1)
> Trạng thái: BẢN NHÁP — chưa được giáo viên duyệt. Ngày tạo … Dữ liệu: content/pronunciation/ (tạo tự động).
## 1. Mục đích và cách dùng   (who, how it connects to Tutor T-02..T-05 and R-13 lessons; 1 lesson ≈ 15–20 min)
## 2. Nguyên tắc sư phạm      (Intelligibility Principle [B15], ưu tiên P1→P3, nghe trước nói sau, HVPT [B9],
                               back-chaining, shadowing [B10], đồ thị cao độ [B11][B12]; mục tiêu là dễ hiểu, không phải giọng bản ngữ)
## 3. Bảng 14 mã lỗi          (mã | tên VI | ví dụ lỗi | nhóm | độ ưu tiên | độ tin cậy phát hiện | bài)  — link PRD §6, không chép quy tắc chấm
## 4. Lộ trình 20 bài         (bảng: bài | cấp | mã lỗi | tên | bài cần học trước)
## 5. Các bài học
### U01 · A1 · Âm cuối /p t k/ và /s/ (Final /p t k/ and /s/)
**Mục tiêu:** … *(EN: …)*  **Mã lỗi:** `final_consonant` · Ưu tiên P1 · Phát hiện: cao  **Học trước:** —
#### Vì sao học sinh Việt hay sai   (bullets + [ref])
#### Cách phát âm                   (numbered steps)
#### Luyện nghe                     (pair table: Từ A | IPA | Từ B | IPA | Khác nhau ở; + HVPT note: 10 lượt, ≥3 giọng, đạt 8/10)
#### Luyện nói — từ                 (table: Từ | IPA | CEFR | Âm trọng tâm (bold the target phones in IPA))
#### Luyện nói — câu                (numbered; IPA not shown; source tag "(EchoLạc)" or "(Tatoeba #id, author)")
#### Lỗi thường gặp → cách sửa      (table: Sai | Đúng | Ghi chú)
#### Chuỗi luyện                    (back-chaining / shadowing steps)
#### Tự kiểm tra và tiêu chí đạt    (thresholds: 60 tạo lỗi, 80 đạt, 2 ngày = thành thạo; gate type)
#### Ghi chú cho giáo viên          (dialect, detection confidence, what the app cannot judge)
#### Duyệt bài   - [ ] IPA đúng  - [ ] Cặp tối thiểu đúng  - [ ] Giải thích đúng, dễ hiểu  - [ ] Câu tự nhiên, không sai sự thật
                 - [ ] Đúng cấp độ  - [ ] Đã duyệt bởi: ____ ngày: ____
## 6. Danh sách kiểm tra khi duyệt (toàn bộ)
## 7. Tài liệu tham khảo
## 8. Nguồn dữ liệu và giấy phép
```

- IPA is displayed joined, e.g. `/kæt/`, with a note that it is American CMUdict and that British variants are accepted.
- The teacher-review checklist (§6 of the doc) has 10 items:
  1. Every IPA matches the target accent; alternatives are noted.
  2. Every minimal pair differs only at the target sound, in the teacher's accent too.
  3. Vietnamese articulation steps are correct and safe; no misleading analogies.
  4. Explanations suit grades 10–12.
  5. Sentences are natural English.
  6. Sentences contain no facts beyond the verified fact sheets.
  7. Level matches the CEFR band.
  8. Evidence claims match the cited source.
  9. Dialect notes are respectful and not stereotyping.
  10. Setting `verified: true` in the unit JSON is done only by the reviewing teacher; the builder never sets it.
- Bibliography format, one line each:
  `[id] Tác giả (năm). *Tên bài*. Nơi đăng, tập(số), trang. DOI/URL — (OA) — Trạng thái: đã kiểm | chưa kiểm [U].`
  - Copy the entries from research.md as they are and keep its `[U]` marks.
  - `[B17]` is cited in research.md but missing from its list. Write `[B17] (thiếu thông tin nguồn — cần bổ sung)`.
  - Never invent details.
- Credits section: CMUdict (BSD-2, notice), CEFR-J 1.5 (citation), Tatoeba ids/authors if used, the model-vocab note (Apache-2.0, not shipped), Cadence as inspiration only (MIT).

---

## F. Build instructions (Sonnet builder) and test spec (Sonnet test-writer)

### F.1 Builder steps
`P` = `C:\Users\HI\AppData\Local\Temp\claude\c93032c591ab76bc\3ac49e3d-7fa4-4a11-9007-423f79dbe5e0\scratchpad\pron`

0. Run `git status` in `d:\Project`. Leave all untracked user files alone. Do not commit.
1. Write authoring data in `P\authored\u01.json … u20.json`, minimal form:
   - Text, `lemma`, `variant`, `altVariants`, `allowElision`, `targets` (indexes may be negative, counted from the end), `expectedErrors`, vi/en strings, `pairs` as `{a:"why", b:"white", type, aVariant, bVariant}`, and sentences as plain text plus `targets` by `{word, index}`.
   - Use the seeds in C.1 and the counts in C.2.
2. Write `P\build_pron.py`. Run it with `python -I build_pron.py`, and start the script with `sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))` before `import lookup`, because `-I` drops the script dir. What it does:
   - **Tokenise text:** split on spaces; strip punctuation `.,?!;:"`; normalise `’` to `'`; lowercase for lookup.
   - **Look up each word:**
     - A Vietnamese or proper noun (an authored `unscored` list) gets `ipa: null`.
     - A function word in `{a, an, the, to, of, and, can, for, from, was, some, them, are, at}` inside a sentence gets its reduced CMUdict variant (the one with `stress_syllable None`). If CMUdict has none, it uses the author IPA (`of`→`ə v`, `at`→`ə t`, `from`→`f ɹ ə m`).
     - Otherwise, the authored `variant` (default 0).
   - **Fill fields:** `cefr` = `lookup.cefr(lemma or text)`; also `syllables`, `stress`, and `ids` (`U01-w01`, `-p01`, `-s01`, `-c01`).
   - **Validate:** apply every rule in D.5 and the F.2 assertions, plus two checks the tests cannot do:
     - Every scored word exists in CMUdict.
     - Every `ipa` equals `lookup()[variant]['ipa']`.
   - Exit with a non-zero code on the first failure.
   - **Emit files:**
     - `d:\Project\content\pronunciation\{index,categories,tokens,credits}.json` and `units\uNN-<slug>.json`.
     - `d:\Project\docs\giao-an-phat-am.md` in the E format.
3. Update `d:\Project\content\practice.js` `ERR_CAT` by adding exactly these entries, keeping the existing ones and the two-per-line style:
   ```js
   final_voicing: { vi: 'Âm cuối hữu thanh', en: 'Voiced endings' }, vowel_quality: { vi: 'Nguyên âm & nguyên âm đôi', en: 'Vowels & diphthongs' },
   weak_form: { vi: 'Dạng yếu', en: 'Weak forms' }, consonant_sub: { vi: 'Phụ âm dễ lẫn', en: 'Confusable consonants' },
   linking: { vi: 'Nối âm', en: 'Linking' }, intonation: { vi: 'Ngữ điệu', en: 'Intonation' },
   ```
   Insert them before `grammar`. Do not rename existing ids or labels.
4. Apply the PRD edits in section B exactly.
5. `package.json`: change `"test"` to `"node --test tests/app.test.cjs tests/pronunciation-content.test.cjs"`.
6. `README.md`:
   - In the structure table, add one row: `` | `content/pronunciation/` | Dữ liệu giáo án phát âm (PRD §6): 20 bài A1–C1, IPA từ CMUdict, chưa được giáo viên duyệt; chưa được app nạp |``.
   - Mention `docs/giao-an-phat-am.md` where the docs are listed.
7. Run `npm.cmd run check` and `npm.cmd test` (PowerShell) or `npm run check` / `npm test` (bash). Both must pass.
8. Report: files changed, counts per unit, any TODO-owner items (licence text, citation), and any seed replaced and why.

**Do NOT:**
- Change `WORDS`, `SEED_ERRORS`, curriculum `pron` fields, scoring code, `lib/tutor.js`, `index.html` script order, `scripts/site.cjs`/build, or AGENTS.md.
- Ship `cmudict.dict`, `cefrj.csv`, `vocab.json`, `lookup.py` or `build_pron.py` into the repo.
- Set `verified: true`.
- Invent references or Tatoeba ids.
- Add facts, dates or numbers about places.
- Commit or push.

### F.2 Test spec: `tests/pronunciation-content.test.cjs` (node:test + node:assert/strict)
- **Loading:**
  - Read the JSON with `fs` from `content/pronunciation/`.
  - For `ERR_CAT`/`SCEN`, use `runtime()` from `tests/helpers/runtime.cjs`, as `app.test.cjs` does (`app.run('JSON.stringify(ERR_CAT)')`).
- **Assertions:**
1. **Index:** `index.units` has ids `U01`…`U20` in order. Each `file` exists, and `unit.id/level/band/category` match the index. Levels are non-decreasing (A1<A2<B1<B2<C1). Band is derived from level (A1/A2→`A1-A2`, B1→`B1`, B2/C1→`B2-C1`).
2. **Enum:**
   - `Object.keys(categories)` (sorted) equals `ERR_CAT` keys minus `grammar` (sorted), and has length 14. The 8 legacy ids are present.
   - The PRD §6 table ids equal the same set. Extract the text between `# **6\.` and `# **7\.`, then collect `` /^\| `([a-z_]+)`/gm ``.
   - Every category is the `category` of ≥1 unit.
   - Every `targets[].category`, `expectedErrors[].category` and `pairs[].category` is in the enum.
   - categories.json `group` is in the 6-value enum, `priority` in P1–P3, `confidence` in high/medium/low.
3. **Bilingual:** every `ERR_CAT` entry has non-empty `vi` and `en`. Every `{vi,en}` object in the unit files (title, cando, why, howTo, notes, selfCheck, teacherNotes, link notes) has non-empty trimmed strings. Walk the object recursively: any object with a `vi` key must also have `en`, and the reverse.
4. **Prereq:** an array whose ids all appear earlier in the index.
5. **Counts:** per `kind` and `category`, exactly the table in C.2 (why 2–3, howTo 3–5, words, pairs, sentences, contrasts 2–4). `chain` is non-empty for cluster units and every prosody unit.
6. **Tokens:**
   - Every token in `ipa`, `ipaAlt[*]`, `words[k].ipa`, `pairs.a/b.ipa` and `rightIpa` is in `tokens.english`.
   - Every token in `variantIpa`, `wrongIpa` and `chain.steps` is in `english ∪ variant`.
   - `tokens.vowels ⊂ tokens.english`.
   - `normalize` values are all in `english`, and every `equivalent` pair is in `english ∪ variant`.
7. **Targets:**
   - Segmental and stress items have ≥1 target. Every index is an integer in `[0, ipa.length)`, and `word` indexes are valid with a non-null `ipa`.
   - Each `variantIpa` differs from the item `ipa`.
   - ≥70% of a unit's targets carry the unit category.
8. **Alternatives:** each `ipaAlt[i].length === ipa.length` unless `allowElision === true`. `allowElision` appears only in linking units or on items with no target index ≥ the alt length.
9. **Stress:**
   - `stress` is present on every word in `stress` units. It is an integer in `1..syllables`, and `syllables` = count of tokens in `tokens.vowels`.
   - U14 multiword items have `prosody.stressWord` as a valid index.
10. **Pairs:** implement each type check in D.5:
    - substitution: one differing index = `diffIndex`, and `contrast` matches;
    - deletion/insertion: removing `b.ipa[diffIndex]` yields `a.ipa`;
    - stress: different stress values;
    - tune/nucleus: same text, different value;
    - juncture: equal concatenated ipa, different text.
    - `perception.pairIds` all exist in the unit.
11. **CEFR:** `cefr ∈ {A1,A2,B1,B2,null}` and ≤ band cap (A1-A2→A2, B1→B1, B2-C1→B2). `null` only if band `B2-C1`, or `scenarioVocab` is in `SCEN` ids; ≤2 nulls per non-B2-C1 unit. For pairs, at least one side has cefr ≤ cap.
12. **Sentences:**
    - Every sentence has a `source`.
    - `original` → `author === "EchoLạc"`.
    - `tatoeba` → integer `id > 0`, non-empty `author`, `license === "CC BY 2.0 FR"`, and a matching entry in `credits.tatoeba.items`.
    - The `words[].w` list joined by spaces equals `text` with punctuation removed.
    - A word with `ipa: null` starts with an uppercase letter or contains a non-ASCII letter.
    - The word count is within the band limit (C.3).
    - The text contains no digits.
    - Prosody enums are valid.
13. **Ids:** unique across all units and match `^U\d{2}-(w|p|s|c)\d{2}$`.
14. **Review state:** every unit has `verified === false` and `reviewedBy === null`.
15. **Credits:** `credits.data` includes `cmudict` (license `BSD-2-Clause`) and `cefrj`.
16. **Format:** each JSON file's text equals `JSON.stringify(JSON.parse(text), null, 2) + '\n'` and has no BOM.
17. **Doc:** `docs/giao-an-phat-am.md` exists, contains the headings `### U01` … `### U20`, `Tài liệu tham khảo` and `chưa được giáo viên duyệt`, and the string `` `<id>` `` for each category id.
18. **Package:** the `package.json` test script includes `tests/pronunciation-content.test.cjs`.

The test must fail with a clear message naming the unit/item id (`assert.ok(cond, id + ' …')`), as `app.test.cjs` does.

---

## G. Risks and open questions

**Risks:**
1. **Detection validity is unmeasured.** Every high/medium/low rating is a hypothesis. CTC phone recognisers trained on native or multilingual speech may "hear" the expected phone (prior bias), and miss omitted finals or inserted schwas. Mitigation: low categories never score, and a per-category precision/recall study is needed before relying on them (PRD §7.4, new §14 Q17).
2. **US reference vs accent choice (R-06).** The data is CMUdict (American). British TTS voices produce non-rhotic /ɒ əʊ/, which the normaliser accepts. The doc must state this, and a teacher may prefer British IPA in the display (§14 Q16).
3. **Roleplay suffix ambiguity.** The ASR language model may restore a dropped -s/-ed, so `s_ed_ending` in free speech is under-detected. It is reliable only in read-aloud (A.3).
4. **CMUdict quirks.** These include spurious variants, missing weak forms and US-only vowels. The generator's opt-in alternatives and author-IPA allowance handle them, but a teacher must still review every IPA.
5. **Evidence quality.** Many research.md items are `[U]` or abstract-only with small n. The doc must keep the `[U]` marks, avoid statistics from teaching sources, and give the bibliography a "chưa kiểm" status.
6. **Licensing.**
   - CMUdict BSD-2 requires reproducing the copyright notice; the builder may not be able to fetch it (TODO-owner).
   - The CEFR-J citation wording must come from the official page.
   - Tatoeba sentences need their id+author, so originals are preferred.
   - Do not ship the model vocab file (Apache-2.0 notice) unless the integration does so properly.
7. **Content facts.** Sentences about Đà Nẵng must not introduce unverified facts (R-04). The rule is no digits and descriptive or opinion sentences only. The test checks for digits, but the teacher checks truth.
8. **Dialect stereotyping.** Notes must say "một số người nói" ("some speakers"), never tie a person to a region, and never label a learner.
9. **Scope creep.** This work adds data and docs only. The scorer, UI changes and Tutor integration remain the separate docs §8 prompt (owner decision §6.5).

**Open questions for the owner:**
1. Should the reference IPA shown to learners be US (CMUdict) or UK (it needs a UK source with a compatible licence)?
2. Who is the reviewing teacher? Is unit-level `verified` enough, or is item-level review needed?
3. Should Tutor practice units be gated by prerequisites, or only recommended?
4. Is 20 units the right size for the pilot, or should only the P1 units (U01, U02, U04, U05, U08, U09, U15) ship first?
5. Is a Tatoeba fetch allowed in the builder session (network), or should all sentences be original?

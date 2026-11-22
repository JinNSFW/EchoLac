"""Static data shared by build_pron.py and doc_gen.py (taxonomy, tokens, roadmap)."""

GENERATED = "2026-11-22"
GROUPS = {  # id -> Vietnamese name (doc, E-03)
    "endings": "Âm cuối", "clusters": "Cụm phụ âm", "consonants": "Phụ âm",
    "vowels": "Nguyên âm", "stress": "Trọng âm từ", "flow": "Nói liền mạch",
}

# id: (group, priority, confidence, signal, Vietnamese realisation example)
_C = [
    ("final_consonant", "endings", "P1", "high", "final consonant deleted or glottal stop", "cat → [kæ] / [kæʔ]; nice → [naɪ]; ball → [bɔː]"),
    ("s_ed_ending", "endings", "P1", "high", "suffix phones missing when target text is known", "books → [bʊk]; played → [pleɪ]; liked → [laɪkɪd]"),
    ("final_voicing", "endings", "P2", "medium", "final voiced obstruent heard as voiceless pair", "bed → [bɛt]; bag → [bæk]; eyes → [aɪs]"),
    ("cluster", "clusters", "P1", "high", "vowel inserted in cluster or member deleted", "street → [sə.tɹiːt] / [tɹiːt]; first → [fɜːs]"),
    ("th", "consonants", "P3", "high", "θ→t s f; ð→d z", "think → [tɪŋk]; this → [zɪs] / [dɪs]"),
    ("sibilant", "consonants", "P1", "high", "substitution among s z ʃ ʒ tʃ dʒ", "ship → [sɪp]; she → [siː]; job → [zɑːp]"),
    ("consonant_sub", "consonants", "P2", "medium", "substitution inside v/w/j, z/j/dʒ, l/n/ɹ, p/b", "very → [jɛɹi]; yes → [zɛs]; light → [naɪt]; pig → [bɪk]"),
    ("vowel_length", "vowels", "P1", "medium", "vowel heard as other member of the tense/lax pair", "ship = sheep [ʃiːp]; full → [fuːl]"),
    ("vowel_quality", "vowels", "P2", "medium", "substitution among æ ɛ ʌ ɑː; diphthong heard as one vowel", "cat → [kɛt]; cut → [kɔt]; day → [de]; go → [ɡo]"),
    ("word_stress", "stress", "P2", "medium", "duration + loudness + pitch per syllable vs expected stress", "hotel → [ˈhoʊtɛl]; photography stressed like photograph"),
    ("rhythm", "flow", "P3", "low", "vowel-duration variability and pauses", "mọi âm tiết dài bằng nhau / every syllable same length"),
    ("weak_form", "flow", "P3", "low", "strong vowel in a weak-form slot", "to → [tuː]; and → [æn]; a cup of tea with full vowels"),
    ("linking", "flow", "P3", "low", "glottal stop, pause or inserted vowel at a link", "pick it up → [pɪk ʔɪt ʔʌp]"),
    ("intonation", "flow", "P2", "medium", "final F0 slope; nucleus position", "câu hỏi yes/no xuống giọng / yes/no question ending in a fall"),
]
CATS = {}
for _id, _g, _p, _c, _s, _e in _C:
    CATS[_id] = {"group": _g, "priority": _p, "confidence": _c, "signal": _s}
    if _id == "intonation":
        CATS[_id]["confidenceNucleus"] = "low"
CAT_EXAMPLE = {c[0]: c[5] for c in _C}
CAT_ORDER = [c[0] for c in _C]
CONF_VI = {"high": "cao", "medium": "trung bình", "low": "thấp"}

TOKENS = {
    "english": ["p", "b", "t", "d", "k", "ɡ", "f", "v", "θ", "ð", "s", "z", "ʃ", "ʒ", "h", "tʃ", "dʒ", "m", "n", "ŋ", "l", "ɹ", "w", "j",
                "iː", "i", "ɪ", "ɛ", "æ", "ɑː", "ɔː", "ʊ", "uː", "ʌ", "ə", "ɚ", "ɜː", "eɪ", "aɪ", "ɔɪ", "oʊ", "aʊ"],
    "vowels": ["iː", "i", "ɪ", "ɛ", "æ", "ɑː", "ɔː", "ʊ", "uː", "ʌ", "ə", "ɚ", "ɜː", "eɪ", "aɪ", "ɔɪ", "oʊ", "aʊ"],
    "variant": ["ʔ", "e", "o", "a", "ɐ", "ɔ", "ɒ", "r", "ɾ", "ᵻ"],
    "normalize": {
        "ɑːɹ": ["ɑː", "ɹ"], "ɔːɹ": ["ɔː", "ɹ"], "oːɹ": ["ɔː", "ɹ"], "ɪɹ": ["ɪ", "ɹ"], "ɛɹ": ["ɛ", "ɹ"], "ʊɹ": ["ʊ", "ɹ"],
        "eə": ["ɛ", "ɹ"], "ʊə": ["ʊ", "ɹ"], "aɪɚ": ["aɪ", "ɚ"], "aɪə": ["aɪ", "ə"], "əl": ["ə", "l"], "iə": ["i", "ə"],
        "r": ["ɹ"], "ɐ": ["ə"], "ɑ": ["ɑː"], "ɒ": ["ɑː"], "əʊ": ["oʊ"], "ɜ": ["ɜː"], "iːː": ["iː"],
    },
    "equivalent": [["t", "ɾ"], ["d", "ɾ"], ["ɪ", "ᵻ"], ["ə", "ᵻ"], ["ə", "ɪ"], ["i", "iː"], ["i", "ɪ"], ["ʌ", "ə"], ["ɚ", "ɜː"], ["ɑː", "ɔː"]],
    "rules": {"postvocalicROptional": True, "stripGeminateLength": True, "glottalStop": "remove-before-scoring-keep-for-categories"},
    "source": "Tokens follow the espeak IPA vocabulary of facebook/wav2vec2-lv-60-espeak-cv-ft (Apache-2.0); vocab file not shipped.",
}

# id, level, category, kind, title vi, title en, prereq, slug
ROADMAP = [
    ("U01", "A1", "final_consonant", "segmental", "Âm cuối /p t k/ và /s/", "Final /p t k/ and /s/", [], "final-stops"),
    ("U02", "A1", "s_ed_ending", "segmental", "Đuôi -s: /s z ɪz/", "Plural and -s endings", ["U01"], "s-endings"),
    ("U03", "A1", "th", "segmental", "Âm /θ/ và /ð/", "The \"th\" sounds", [], "th-sounds"),
    ("U04", "A1", "sibilant", "segmental", "Âm /ʃ tʃ dʒ/ khác /s z/", "Sh, ch and j sounds", [], "sh-ch-j"),
    ("U05", "A2", "vowel_length", "segmental", "Nguyên âm /iː–ɪ/, /uː–ʊ/", "Long and short vowels", [], "long-short-vowels"),
    ("U06", "A2", "word_stress", "stress", "Trọng âm từ 2–3 âm tiết", "Stress in 2–3 syllable words", [], "word-stress"),
    ("U07", "A2", "intonation", "prosody", "Lên giọng, xuống giọng", "Rising and falling tunes", ["U06"], "rise-fall"),
    ("U08", "B1", "cluster", "segmental", "Cụm phụ âm đầu", "Starting clusters", ["U01"], "onset-clusters"),
    ("U09", "B1", "s_ed_ending", "segmental", "Đuôi -ed: /t d ɪd/", "Past -ed endings", ["U02"], "ed-endings"),
    ("U10", "B1", "final_voicing", "segmental", "Âm cuối hữu thanh", "Voiced final sounds", ["U01"], "voiced-finals"),
    ("U11", "B1", "vowel_quality", "segmental", "/æ ɛ ʌ/ và nguyên âm đôi", "Vowels and diphthongs", ["U05"], "vowels-diphthongs"),
    ("U12", "B1", "consonant_sub", "segmental", "Phụ âm dễ lẫn", "Confusable consonants", [], "confusable-consonants"),
    ("U13", "B1", "linking", "prosody", "Nối âm phụ âm–nguyên âm", "Linking words", ["U01"], "linking"),
    ("U14", "B1", "word_stress", "stress", "Trọng âm từ ghép", "Compound vs phrase stress", ["U06"], "compound-stress"),
    ("U15", "B2", "cluster", "segmental", "Cụm phụ âm cuối", "Final clusters", ["U08", "U09"], "final-clusters"),
    ("U16", "B2", "weak_form", "prosody", "Dạng yếu", "Weak forms", ["U14"], "weak-forms"),
    ("U17", "B2", "rhythm", "prosody", "Nhịp tiếng Anh", "Stress-timed rhythm", ["U16"], "rhythm"),
    ("U18", "B2", "word_stress", "stress", "Trọng âm đổi theo hậu tố", "Stress shifts", ["U14"], "stress-shifts"),
    ("U19", "C1", "intonation", "prosody", "Trọng âm câu và ngữ điệu", "Focus and tunes", ["U07", "U17"], "focus-tunes"),
    ("U20", "C1", "linking", "prosody", "Nối, nuốt và đồng hoá âm", "Fluent connected speech", ["U13", "U15"], "connected-speech"),
]
BAND = {"A1": "A1-A2", "A2": "A1-A2", "B1": "B1", "B2": "B2-C1", "C1": "B2-C1"}
CAP = {"A1-A2": "A2", "B1": "B1", "B2-C1": "B2"}
CEFR_ORD = {"A1": 1, "A2": 2, "B1": 3, "B2": 4}
WORD_LIMIT = {"A1-A2": 10, "B1": 15, "B2-C1": 22}

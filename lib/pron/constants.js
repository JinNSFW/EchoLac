'use strict';
// Pronunciation scoring constants (one place). All are pilot starting assumptions, not validated findings (PRD §7.4).
const PRON_THRESHOLD = 60;      // below this a word becomes an error item (PRD R-10, §6)
const TUTOR_WEIGHT = 0.3;       // Tutor contribution weight vs Roleplay (PRD §7.2)
const PRON_STEP = 0.2;          // smoothing of the running Pronunciation score: step = TUTOR_WEIGHT * PRON_STEP
const MASTERY_SCORE = 80;       // T-05: score at least 80 ...
const MASTERY_DAYS = 2;         // ... on two distinct calendar days
const PRON_TZ = 'Asia/Ho_Chi_Minh'; // T-05
const PRON_MAX_MS = 6000;       // T-04: clips up to 6 s, 16 kHz mono
const PRON_RATE = 16000;
const PRON_MIN_SAMPLES = Math.round(PRON_RATE * 0.12);
const PRON_MIN_RMS = 0.003;
const PRON_LOAD_TIMEOUT_MS = 300000;
const PRON_RUN_TIMEOUT_MS = 20000;
const PRON_MIN_CONF = 0.45;     // mean CTC posterior of emitted tokens below this: ask the learner to repeat
const PRON_MIN_MATCH = 0.5;     // refuse to score when fewer than half the target or observed phones match
const PRON_MIN_COST = 0.7;      // substitution cost inside the same class (vowel/vowel, consonant/consonant)
const PRON_MODEL = 'onnx-community/wav2vec2-lv-60-espeak-cv-ft-ONNX';
const PRON_REVISION = 'c69750f5043e5e1f8a71ab95dd3b98338c280c92'; // pinned Hub commit
const PRON_MODEL_BASE = `https://huggingface.co/${PRON_MODEL}/resolve/${PRON_REVISION}/`;
const PRON_WEIGHT_FILE = 'onnx/model_quantized.onnx';
const PRON_MODEL_MB = 318;      // model_quantized.onnx (int8); the WebAssembly runtime can add a first-use download
const PRON_LOW_CONF = ['rhythm', 'weak_form', 'linking', 'nucleus']; // PRD §6: reference score only
const PRON_PROSODY = ['word_stress', 'intonation', ...PRON_LOW_CONF]; // CTC phones alone do not measure prosody

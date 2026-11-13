'use strict';
// Lazy loading and prediction for the on-device Teachable Machine model.

// Real image matcher: the Teachable Machine model in model/, loaded only when a photo needs it
const TM_LIBS = ['https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.3.1/dist/tf.min.js', 'https://cdn.jsdelivr.net/npm/@teachablemachine/image@0.8.5/dist/teachablemachine-image.min.js'];
const loadScript = src => new Promise((ok, fail) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => fail(new Error('Could not load ' + src)); document.head.append(s); });
const loadTmLibs = () => TM_LIBS.reduce((p, src) => p.then(() => window.tmImage || loadScript(src)), Promise.resolve());
let tmModel = null;
function loadModel() {
  tmModel ||= loadTmLibs()
    .then(() => tmImage.load(CAM.modelUrl + 'model.json', CAM.modelUrl + 'metadata.json'))
    .catch(e => { tmModel = null; throw e; }); // let the next photo retry
  return tmModel;
}
const norm = s => String(s).normalize('NFC').trim().toLowerCase();
// Model labels map to locations by id, Vietnamese or English name; other labels (e.g. "Class 3") mean "not a supported place"
const labelLoc = label => LOCS.find(l => [l.id, l.name.vi, l.name.en].some(n => norm(n) === norm(label)));
async function similarityService(url) {
  try {
    const model = await loadModel(), el = new Image();
    el.src = url; await el.decode();
    const scores = {};
    (await model.predict(el)).forEach(p => { const l = labelLoc(p.className); if (l) scores[l.id] = p.probability; });
    return scores;
  } catch (e) { console.warn('[EchoLac] image model unavailable', e); return null; } // null → "no service", never a guess
}

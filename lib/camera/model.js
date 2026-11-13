'use strict';
// Lazy loading and prediction for the on-device Teachable Machine model.

// Real image matcher: the Teachable Machine model in model/, loaded only when a photo needs it
// tfjs 1.3.1 is the exact peer version of @teachablemachine/image 0.8.5. Integrity hashes pin the CDN files (SRI).
const TM_LIBS = [
  ['https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.3.1/dist/tf.min.js', 'sha384-LBtUZzDp17Y7UgB/KFromf1LnY7o5ls8Oxm4vEAoTM0U+JzaadctX2/buQiNHyQU'],
  ['https://cdn.jsdelivr.net/npm/@teachablemachine/image@0.8.5/dist/teachablemachine-image.min.js', 'sha384-4Q4fzaRr/bPyBiOertaWuZ8Zn987vAWqtNLbL6h+tf/Y+flpirtyqFTd7q9ELxjS'],
];
const loadScript = ([src, integrity]) => new Promise((ok, fail) => {
  const s = Object.assign(document.createElement('script'), { src, integrity, crossOrigin: 'anonymous' });
  s.onload = ok; s.onerror = () => fail(new Error('Could not load ' + src)); document.head.append(s);
});
const loadTmLibs = () => TM_LIBS.reduce((p, lib) => p.then(() => window.tmImage || loadScript(lib)), Promise.resolve());
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

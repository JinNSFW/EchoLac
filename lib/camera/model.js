'use strict';
// Lazy loading and prediction for the on-device landmark model (camera model v3, PRD R-11).

// TF.js graph model converted from "model v3/landmarks.keras" (MobileNetV3Large, 4 classes; see model v3/diagnosis/).
// The integrity hash pins the CDN file (SRI). tfjs 4 needs no eval(), so the CSP has no 'unsafe-eval'.
const TF_LIB = ['https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js', 'sha384-vE8hbVJ4lezako5rlvE7bY0BVzWlFhZncPlckrqNwcUQpVtgbENTgZ8TBbnPjZre'];
const loadScript = ([src, integrity]) => new Promise((ok, fail) => {
  const s = Object.assign(document.createElement('script'), { src, integrity, crossOrigin: 'anonymous' });
  s.onload = ok; s.onerror = () => fail(new Error('Could not load ' + src)); document.head.append(s);
});
const loadTf = () => {
  if (window.tf?.loadGraphModel) return Promise.resolve();
  // tf.min.js runs `try { regeneratorRuntime = r } catch { Function(...)(r) }` in strict mode; declaring the global first
  // makes the assignment succeed, so the CSP-blocked Function() fallback never runs and 'unsafe-eval' stays off.
  if (!('regeneratorRuntime' in window)) window.regeneratorRuntime = undefined;
  return loadScript(TF_LIB);
};
// Centre square at 224 px, as the model was evaluated. The canvas downscale is smoothed like PIL's resize;
// tf.image.resizeBilinear aliases on big photos and flipped a borderline Cầu Rồng test photo to Sông Hàn.
let sqCanvas = null;
function square224(el) {
  const w = el.videoWidth || el.naturalWidth || el.width, h = el.videoHeight || el.naturalHeight || el.height, s = Math.min(w, h);
  const c = sqCanvas ||= Object.assign(document.createElement('canvas'), { width: 224, height: 224 }), g = c.getContext('2d');
  g.imageSmoothingQuality = 'high'; g.drawImage(el, (w - s) / 2, (h - s) / 2, s, s, 0, 0, 224, 224);
  return c;
}
// Same surface the scanner used with Teachable Machine: getClassLabels(), predict(el) → [{ className, probability }], model.dispose()
async function openModel() {
  await loadTf();
  const [model, meta] = await Promise.all([tf.loadGraphModel(CAM.modelUrl + 'model.json'), fetch(CAM.modelUrl + 'metadata.json').then(r => r.json())]);
  const labels = meta.labels;
  tf.tidy(() => model.predict(tf.zeros([1, 224, 224, 3]))).dispose(); // compile WebGL shaders during "loading", not on the first frame
  return {
    model,
    getClassLabels: () => labels,
    async predict(el) {
      const out = tf.tidy(() => model.predict(tf.browser.fromPixels(square224(el)).toFloat().expandDims(0))); // 0–255: the model rescales itself
      const p = await out.data(); out.dispose();
      return labels.map((className, i) => ({ className, probability: p[i] }));
    },
  };
}
let landmarkModel = null;
function loadModel() {
  landmarkModel ||= openModel().catch(e => { landmarkModel = null; throw e; }); // let the next photo retry
  return landmarkModel;
}
const norm = s => String(s).normalize('NFC').trim().toLowerCase();
// Model labels map to locations by id, Vietnamese or English name; other labels mean "not a supported place"
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

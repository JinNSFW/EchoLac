'use strict';
// GPS matching, image ranking and cross-validation.

const distM = (a, b) => {
  const r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371e3 * Math.asin(Math.sqrt(h));
};

/* Double matching, spec §2: GPS → candidates, image → visual candidates, cross-validation decides. */
const GPS_MAX_ACC = 500;  // metres; worse than this and GPS can't vouch for a place
const IMG_MATCH = 0.75;   // similarity needed for "matched"
const IMG_UNSURE = 0.5;   // between the two → "uncertain"
const IMG_MARGIN = 0.2;   // PRD C-04: a lead under 20 points over the runner-up is "uncertain", never "matched"

// 1. GPS Location Matching Service: narrows the area only, never says what the camera sees
function gpsMatch(fix) {
  if (!fix) return { gpsStatus: 'unavailable', status: 'none', approx: null, candidates: [] };
  const candidates = LOCS.map(l => ({ id: l.id, d: Math.round(distM(fix, l)), radius: l.radius, refs: l.referenceImages.length }))
    .filter(c => c.d <= c.radius).sort((a, b) => a.d - b.d); // keep every candidate, never just the nearest
  return {
    gpsStatus: fix.acc > GPS_MAX_ACC ? 'inaccurate' : 'available',
    status: candidates.length > 1 ? 'multiple' : candidates.length ? 'matched' : 'none',
    approx: { lat: +fix.lat.toFixed(3), lng: +fix.lng.toFixed(3), acc: Math.round(fix.acc) }, // ~100 m, enough to show the learner
    candidates,
  };
}

// 2. Camera Image Matching Service: ranks EVERY location by similarity, so GPS can't decide the answer
function imageMatch(scores, simulated) {
  if (!scores) return { status: 'no_match', bestId: null, score: null, others: [], service: false, simulated: false };
  const ranked = Object.entries(scores).filter(([id]) => loc(id)).sort((a, b) => b[1] - a[1]);
  const [best, score = 0] = ranked[0] || [];
  const lead = score - (ranked[1]?.[1] ?? 0);
  const status = score >= IMG_MATCH && lead >= IMG_MARGIN ? 'matched' : score >= IMG_UNSURE ? 'uncertain' : 'no_match';
  return { status, bestId: status === 'no_match' ? null : best, score, others: ranked.slice(1).map(r => r[0]), service: true, simulated };
}

// 3. Cross-validation Service: the only stage allowed to pick a lesson (spec §5, cases A–F)
function crossValidate(g, im) {
  const ids = g.candidates.map(c => c.id), ok = im.status === 'matched';
  const out = (kase, status, agreement, finalId, options, reason) => ({ gps: g, image: im, case: kase, agreement, finalId, status, options, reason });
  if (g.gpsStatus !== 'available') return out('D', 'needs_confirmation', 'image_only', ok ? im.bestId : null, ok ? [im.bestId] : ids.length ? ids : LOCS.map(l => l.id),
    { vi: 'Không xác minh được vị trí, chỉ có kết quả từ ảnh. Bạn cần tự xác nhận.', en: 'Location can’t be verified; this is image-only. Please confirm yourself.' });
  if (!ids.length) return out('F', 'rejected', 'none', null, [],
    { vi: 'Không có địa danh EchoLạc hỗ trợ trong bán kính, nên không tạo bài học theo địa điểm chưa xác minh.', en: 'No EchoLạc-supported place is in range, so no unverified place lesson is created.' });
  if (!ok) return out('E', 'needs_confirmation', 'image_failed', null, ids,
    { vi: 'Ảnh không nhận diện được địa danh. GPS chỉ cho biết các nơi gần bạn, chưa xác nhận được bằng hình.', en: 'The photo wasn’t recognised. GPS only lists nearby places; nothing is visually confirmed.' });
  if (ids.includes(im.bestId)) return out(ids.length > 1 ? 'B' : 'A', 'confirmed', 'agree', im.bestId, [im.bestId],
    { vi: 'Ảnh nhận ra một địa danh nằm trong danh sách GPS: hai kết quả khớp nhau.', en: 'The photo matches a place on the GPS list: both results agree.' });
  return out('C', 'needs_confirmation', 'conflict', null, [...ids, im.bestId],
    { vi: 'GPS và ảnh chỉ ra hai nơi khác nhau. Không tự mở bài học nào, hãy chọn nơi đúng hoặc chụp lại.', en: 'GPS and the photo point to different places. No lesson opens on its own: pick the right one or retake.' });
}

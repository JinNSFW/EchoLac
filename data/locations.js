'use strict';
// Validated location records from assets/data/locations.js.

/* ================= Camera learning =================
   Five separate parts, never one "magic AI" step:
   1 location detection (locate, nearby)   2 image matching (matchImage)   3 fact sheets (LOCS, from assets/data/locations.js)
   4 lesson (discoverHtml, wordsHtml)      5 conversation + language feedback (startPractice, checkAnswer, factFor) */
const SAFE_ID = /^[a-z0-9-]+$/;
// Records come from an admin-edited file, so validate them before they reach the UI
const LOCS = (window.ECHOLAC_LOCATIONS || [])
  .filter(l => SAFE_ID.test(l.id) && Number.isFinite(l.lat) && Number.isFinite(l.lng) && l.radius > 0 && l.name?.en && l.name?.vi && l.description && Array.isArray(l.vocab) && Array.isArray(l.topics))
  .map(l => ({ interestingFacts: [], bg: ['#F7F1E7', '#ECE6DB'], ...l, icon: SAFE_ID.test(l.icon) ? l.icon : 'pin', referenceImages: (l.referenceImages || []).filter(r => /^(assets\/[\w./-]+|https:\/\/\S+)$/.test(r.url || '')), sources: (l.sources || []).map(s => ({ label: s.label, url: /^https:\/\//.test(s.url || '') ? s.url : '' })) }));
const loc = id => LOCS.find(l => l.id === id);

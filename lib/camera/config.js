'use strict';
// Camera scan configuration (PRD R-11).

// Camera recognition (PRD R-11): landmark model v3 (TF.js graph model) in model/. map = class NAME from metadata.json → scenario id.
// threshold 0.75 + margin 0.2 (PRD C-04): on the 36 v3 test photos, centre-cropped, 22 accepted and all correct; 0.85 accepted only 13.
// See docs/camera-v3-diagnosis.md. margin keeps a bridge-vs-bridge toss-up from ever being a hit.
const CAM = { modelUrl: 'model/', threshold: 0.75, margin: 0.2, holdMs: 800, map: { 'Cầu Rồng': 'dragon', 'Cầu Sông Hàn': 'b1-landmark-stories', 'Công viên APEC': 'b1-landmark-stories' } };

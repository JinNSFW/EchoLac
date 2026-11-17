'use strict';
// Camera scan configuration (PRD R-11).

// Camera recognition (PRD R-11): landmark model v3 (TF.js graph model) in model/. map = class NAME from metadata.json → scenario id.
// Model v4 (5 classes). threshold 0.85 + margin 0.2 (PRD C-04): on 41 centre-cropped test photos v4 accepted 19, all correct;
// at 0.75 it confidently mistook far shots of Cầu Rồng for Sông Hàn. Chosen by the owner on 16 Nov 2026; see docs/camera-v4-diagnosis.md.
// map: every model class opens its own lesson (content/curriculum/landmarks.js; Cầu Rồng keeps 'dragon').
const CAM = { modelUrl: 'model/', threshold: 0.85, margin: 0.2, holdMs: 800, map: { 'Cá chép rồng': 'dragon-carp', 'Cầu Rồng': 'dragon', 'Cầu Sông Hàn': 'han-bridge', 'Công viên APEC': 'apec', 'Tượng Quan Âm - Chùa linh ứng': 'lady-buddha' } };

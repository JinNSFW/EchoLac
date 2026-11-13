'use strict';
// Camera scan configuration (PRD R-11).

// Camera recognition (PRD R-11): Teachable Machine image model in model/. map = class NAME from metadata.json → scenario id.
const CAM = { modelUrl: 'model/', threshold: 0.85, holdMs: 800, map: { 'Cầu Rồng': 'dragon' } };

'use strict';
// In-memory camera state; coordinates and photos are never persisted.

const km = d => (d < 1000 ? `${Math.round(d / 10) * 10} m` : `${(d / 1000).toFixed(1)} km`);
const refUrl = l => l.referenceImages[0]?.url || `assets/3d/${l.icon}.png`;
const G = { gps: null }; // memory only: precise location is never saved
const CL = { stream: null, tok: null, photo: '', photoFor: '', intro: false, scen: 'live', verify: null };

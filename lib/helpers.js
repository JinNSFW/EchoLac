'use strict';
// Shared formatting and template helpers.

const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const iso = (d = new Date()) => d.toLocaleDateString('sv-SE');
// Tourists are foreign visitors: their screens are always English (owner decision 26/11/2026).
// Uses the server role, or the last known role hint before the profile loads; learners keep S.lang.
const isTouristUI = () => (S.connect?.me ? S.connect.me.role === 'tourist'
  : typeof connectHint !== 'undefined' && connectHint === 'tourist');
const uiLang = () => (isTouristUI() ? 'en' : S.lang);
const hhmm = () => new Date().toLocaleTimeString(uiLang() === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' });
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const V = (vi, en) => (uiLang() === 'vi' ? vi : en);
const L = o => (o && typeof o === 'object' ? o[uiLang()] ?? o.en : o);
const fmt = n => n.toLocaleString(uiLang() === 'vi' ? 'vi-VN' : 'en-US');

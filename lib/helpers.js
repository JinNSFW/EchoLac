'use strict';
// Shared formatting and template helpers.

const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const iso = (d = new Date()) => d.toLocaleDateString('sv-SE');
const hhmm = () => new Date().toLocaleTimeString(S.lang === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' });
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const V = (vi, en) => (S.lang === 'vi' ? vi : en);
const L = o => (o && typeof o === 'object' ? o[S.lang] ?? o.en : o);
const fmt = n => n.toLocaleString(S.lang === 'vi' ? 'vi-VN' : 'en-US');

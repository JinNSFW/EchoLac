'use strict';
// Browser persistence, using the existing lt: keys.

const store = {
  get(k, d) { try { const v = localStorage.getItem('lt:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('lt:' + k, JSON.stringify(v)); } catch { /* private mode: state lives in memory only */ } },
};

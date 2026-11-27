'use strict';
// Local admin console (admin/, never deployed). It signs in with the publishable key like any user; every power
// comes from RLS and the admin RPCs in supabase/migrations/0008_admin.sql, which also require an aal2 (MFA) session.
const CFG = window.ECHOLAC_CONFIG || {};
const app = document.querySelector('#app'), signOut = document.querySelector('#signout'), whoEl = document.querySelector('#who');
let sb = null, tab = 'learners', factorId = null, data = null;

const show = html => { app.innerHTML = html; app.querySelector('input')?.focus(); };
const fail = (e, fallback = 'Có lỗi.') => String(e?.message || fallback).slice(0, 300);
const rows = r => { if (r.error) throw r.error; return r.data || []; };

function boot() {
  if (!/^https:\/\//.test(CFG.supabaseUrl || '') || !CFG.supabaseKey || !window.supabase?.createClient) {
    return show(`<p class="msg">Thiếu cấu hình Supabase (.env.local) hoặc thư viện supabase-js chưa tải.</p>`);
  }
  // Session only in this tab: closing the tab signs the admin out on this device.
  sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey,
    { auth: { storage: window.sessionStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } });
  gate();
}

// Nothing is read from the database until the session is aal2. The database enforces the same rule.
async function gate(msg) {
  data = null;
  const { data: { session } } = await sb.auth.getSession();
  signOut.hidden = !session;
  whoEl.textContent = session?.user?.email || '';
  if (!session) return show(loginView(msg));
  // Display hint only (the database re-checks auth.users): do not enrol MFA for a non-admin account.
  if (session.user.app_metadata?.role !== 'admin') { await sb.auth.signOut(); return gate('Tài khoản này không phải admin.'); }
  const { data: aal, error } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) return show(loginView(fail(error)));
  if (aal.currentLevel === 'aal2') return main(msg);
  const { data: f, error: e2 } = await sb.auth.mfa.listFactors();
  if (e2) return show(loginView(fail(e2)));
  const totp = (f.all || []).filter(x => x.factor_type === 'totp');
  const ok = totp.find(x => x.status === 'verified');
  if (ok) { factorId = ok.id; return show(verifyView(msg)); }
  for (const x of totp) await sb.auth.mfa.unenroll({ factorId: x.id }); // unverified leftovers from an abandoned enrolment
  const { data: en, error: e3 } = await sb.auth.mfa.enroll({ factorType: 'totp', friendlyName: `EchoLac admin ${Date.now()}` });
  if (e3) return show(loginView(fail(e3)));
  if (!/^data:image\/svg\+xml/.test(en.totp.qr_code)) return show(loginView('Mã QR không hợp lệ.'));
  factorId = en.id;
  show(enrollView(en.totp.qr_code, en.totp.secret, msg));
}

async function load() {
  const [profiles, sessions, places, requests, reports, blocks, audit] = await Promise.all([
    sb.from('profiles').select('id,display_name,role,age_group,verification_status,level,created_at').order('created_at', { ascending: false }).limit(1000),
    sb.from('group_sessions').select('id,location_id,starts_at,ends_at,capacity,status').order('starts_at', { ascending: false }).limit(200),
    sb.from('locations').select('id,name_vi').eq('approved', true).order('name_vi'),
    sb.from('connection_requests').select('id,tourist_id,student_id,location_id,mode,status,created_at').order('created_at', { ascending: false }).limit(200),
    sb.from('reports').select('id,reporter_id,reported_id,reason,status,created_at').order('created_at', { ascending: false }).limit(200),
    sb.from('blocks').select('blocker_id,blocked_id,created_at').order('created_at', { ascending: false }).limit(200),
    sb.from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(200),
  ]).then(list => list.map(rows));
  return { profiles, sessions, places, requests, reports, blocks, audit, people: Object.fromEntries(profiles.map(p => [p.id, p])) };
}

async function main(msg) {
  try { data = await load(); } catch (e) { return show(`<p class="msg">${esc(fail(e))}</p>`); }
  show(tabsView(tab) + `<div class="note">${msg ? note(msg) : ''}</div>` + VIEWS[tab](data));
}

// One RPC, then a fresh read; the RPC checks admin + aal2 again and writes the audit row.
async function act(name, args, okMsg) {
  const { error } = await sb.rpc(name, args);
  await main(error ? fail(error) : okMsg);
}

app.addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target, v = n => f.elements[n]?.value.trim();
  f.querySelector('button').disabled = true;
  if (f.id === 'login') {
    const { error } = await sb.auth.signInWithPassword({ email: v('email'), password: f.elements.password.value });
    return gate(error ? fail(error) : '');
  }
  if (f.id === 'mfa') {
    const { error } = await sb.auth.mfa.challengeAndVerify({ factorId, code: v('code') });
    return gate(error ? fail(error) : '');
  }
  if (f.id === 'new-session') {
    const at = n => new Date(v(n)).toISOString();
    return act('admin_create_session', { p_location: v('place'), p_starts: at('start'), p_ends: at('end'), p_capacity: Number(v('cap')) }, 'Đã tạo buổi nhóm.');
  }
});

app.addEventListener('click', e => {
  const t = e.target.closest('[data-tab]');
  if (t) { tab = t.dataset.tab; return data ? show(tabsView(tab) + '<div class="note"></div>' + VIEWS[tab](data)) : gate(); }
  const b = e.target.closest('[data-act]'), id = b?.closest('[data-id]')?.dataset.id;
  if (!b || !id) return;
  b.disabled = true;
  const row = b.closest('tr'), val = n => row.querySelector(`[name="${n}"]`).value || null;
  if (b.dataset.act === 'save-learner') {
    act('admin_set_learner', { p_user: id, p_verification: val('verification'), p_level: val('level'), p_age_group: val('age') }, 'Đã lưu.');
  } else if (b.dataset.act === 'close-session' && confirm('Đóng buổi này và huỷ các yêu cầu đang mở?')) {
    act('admin_close_session', { p_session: id }, 'Đã đóng buổi.');
  } else if (b.dataset.act === 'report') {
    act('admin_resolve_report', { p_report: id, p_status: b.dataset.status }, 'Đã cập nhật báo cáo.');
  } else b.disabled = false;
});

signOut.addEventListener('click', async () => { await sb.auth.signOut(); tab = 'learners'; gate(); });
boot();

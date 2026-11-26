# Phase 0 contract (orchestrator: Opus 5.5 high) — EchoLạc pronunciation app, branch feat/pronunciation-app

Repo: d:\Project (static vanilla JS prototype; Netlify; scripts load as globals via <script defer> in index.html; 300-line max per code file enforced by scripts/check.cjs; tests: `npm test` = node --test tests/app.test.cjs tests/pronunciation-content.test.cjs; `npm run check`). Bash is Git Bash; on PowerShell use npm.cmd.

Decisions (fixed): stay static JS (no Next.js). Supabase ANONYMOUS sign-in only (no email, no Google, no class codes; "teacher" = content reviewer only). Data writes go to localStorage `lt:` first, then sync to Supabase when a session exists. NO audio stored anywhere. Publishable key is public by design; secret/service_role keys never in client, repo, logs or chat. Testing stage: a few testers.

OWNERSHIP — each module owns ONLY its files. NOBODY edits index.html, EchoLac_PRD.md, AGENTS.md (orchestrator integrates). If you need a <script> tag or a change in a file you don't own, put it in your report.

## A. tools/pronunciation (Sonnet medium)
Files: tools/pronunciation/** , .gitignore (add tools/pronunciation/.cache/ and __pycache__), tests/pronunciation-content.test.cjs (review-state test only), content/pronunciation/** and docs/giao-an-phat-am.md (regenerated output only), README.md (one short section "Bộ sinh giáo án phát âm").
Source: C:\Users\HI\AppData\Local\Temp\claude\c93032c591ab76bc\3ac49e3d-7fa4-4a11-9007-423f79dbe5e0\scratchpad\pron (build_pron.py, pron_data.py, doc_gen.py, lookup.py, b2lib.py, mk_*.py, authored/u01–u20.json, research.md, AUTHORING.md, plan.md, cmu_license.txt). Copy the code + authored data + docs (not cmudict.dict, cefrj.csv, vocab.json, __pycache__).
Tasks: (1) fetch_data.py downloads cmudict.dict (https://raw.githubusercontent.com/cmusphinx/cmudict/master/cmudict.dict) and cefrj CSV (https://raw.githubusercontent.com/openlanguageprofiles/olp-en-cefrj/master/cefrj-vocabulary-profile-1.5.csv) into .cache/; lookup.py reads from .cache/. (2) build_pron.py default --repo = repo root computed from its own path (not hard-coded d:\Project). (3) flags --reviewed-by NAME --reviewed-at YYYY-MM-DD set verified:true, reviewedBy, reviewedAt on every unit; without flags keep the values already in the authored files (store reviewedBy/reviewedAt in authored files so rebuilds keep them). Doc status line becomes "Đã duyệt bởi <name>, <dd/mm/yyyy>" when all units reviewed. (4) Run: fetch, then build with --reviewed-by "Giáo viên A" --reviewed-at 2026-11-22. (5) Update the review-state test: verified:true requires non-empty reviewedBy and a valid reviewedAt date; verified:false requires reviewedBy null. Also update the doc test string if it checks "chưa được giáo viên duyệt". (6) npm run check + npm test pass.

## B. Supabase schema + RLS (Opus xhigh)
Files: supabase/migrations/0001_init.sql, supabase/tests/rls_check.sql, docs/supabase-setup.md (Vietnamese).
Tables (all with RLS enabled, policies `user_id = auth.uid()` for select/insert/update/delete to role authenticated; anonymous users ARE role authenticated with is_anonymous claim — allow them; no policies for anon role; primary keys allow idempotent upsert):
- profiles(id uuid pk references auth.users on delete cascade, display_name text check length<=60, birth_year int check between 1920 and current year, guardian_consent bool not null default false, level text check in A1..C1 null, accent text check in ('en-US','en-GB') default 'en-US', voice_upload_consent_at timestamptz null, place_id text null, created_at, updated_at) — policy on id = auth.uid().
- unit_progress(user_id, unit_id text, status text check in ('open','tried','passed'), perception_best real null, items_passed int default 0, updated_at; pk(user_id, unit_id)).
- attempts(id uuid pk (client-generated), user_id, item_id text, unit_id text null, score int null check 0..100, reference_score int null, engine text check in ('local','remote','none'), categories text[] default '{}', created_at) — NO audio column.
- error_items(id text, user_id, item_id text null, category text, word text, best int, attempts int, days date[], status text check in ('open','mastered'), source text check in ('pron','roleplay','seed'), updated_at; pk(user_id,id)).
- srs_cards(user_id, item_id text, fsrs_state jsonb, due timestamptz, updated_at; pk(user_id,item_id)).
- updated_at triggers. Column defaults user_id default auth.uid(). Indexes on (user_id, updated_at).
rls_check.sql: script to run in SQL editor that impersonates two users (set local role authenticated + request.jwt.claims) and asserts cross-user reads/writes return 0 rows / fail.
docs/supabase-setup.md: owner steps — open SQL editor, run migration, run rls_check, enable Anonymous Sign-ins (Authentication → Sign In / Providers), recommend enabling CAPTCHA/rate limits for anonymous sign-ins (note risk if not), copy Project URL + publishable key into .env.local (SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY; NEXT_PUBLIC_* names also accepted) and Netlify env vars; never use the secret key in the app. Note: free projects pause after ~1 week idle.

## C. Cloud client + sync (Sonnet medium)
Files: lib/cloud/config.js, lib/cloud/client.js, lib/cloud/sync.js, tests/cloud.test.cjs (+ add it to package.json test script).
- config.js: `const CLOUD = { url, key, enabled }` read from `window.ECHOLAC_CONFIG` (generated file config.js by build — module F) — `enabled` false if missing. Never throws.
- client.js: `cloudClient()` lazy-loads supabase-js UMD from jsDelivr pinned exact version (latest 2.x stable published ≥14 days ago — verify on the npm registry; compute sha384 SRI by downloading the exact file) via the same loadScript pattern as lib/camera/model.js; creates client with persistSession true, storageKey 'lt:sb-auth'. `ensureSession()` → existing session or `auth.signInAnonymously()`; returns user or null on failure/offline (never throws to UI). `cloudUserId()`.
- sync.js: queue in store key 'sync-queue' (=localStorage 'lt:sync-queue'): items {table, row, op:'upsert'}; `queueUpsert(table,row)`; `flushSync()` pushes in order when online+session, removes on success, keeps on failure, idempotent; listens to 'online'. `pullOnSignIn()` fetches profiles + error_items and merges into S (newer updated_at wins; keep local if remote older); maps S.user → profiles row (display_name=name, birth_year from dob, guardian_consent from consent.guardian, accent from S.settings.accent mapped to en-US/en-GB, place_id) and S.errors → error_items (source 'seed' for SEED_ERRORS ids). Export `syncProfile()` and `syncErrors()` helpers that queue rows. No network if CLOUD.enabled false.
- Tests with a fake supabase client injected (e.g. `window.__supabaseForTest`) in the vm runtime (see tests/helpers/runtime.cjs): queue ordering, retry on failure, merge newer-wins, disabled mode no-ops.
Report the exact <script> tags and their position (after data/state.js, before pages) for index.html.

## D. Onboarding/auth UI (Opus xhigh)
Files: pages/signup.js, pages/signin.js, pages/auth-actions.js, pages/profile.js (account section only), components/auth.js, components/onboarding.js if needed, related tests in tests/app.test.cjs (only assertions that break).
- Remove Gmail field, Google button, class-code tab, email/password sign-in. Step 1 keeps: name, date of birth (store dob locally; send only birth_year), gender (optional), terms checkbox, guardian checkbox when under 18 (required). Submit → save S.user as today, then (if CLOUD.enabled) `ensureSession()` + `syncProfile()` in background; never block on network; show a small status "Đã lưu trên máy / Đã đồng bộ". Step 2 (place, X-06) unchanged.
- signin page becomes "Tiếp tục trên máy này" (if local S.user exists) or redirects to signup; explain in vi/en that progress is tied to this device/browser (anonymous account) — "Đổi máy hoặc xoá dữ liệu trình duyệt sẽ mất liên kết tiến độ".
- Profile: account card shows status (chỉ trên máy / đã đồng bộ, short anonymous id), the device warning, and toggle for "Cho phép gửi giọng nói tới máy chủ chấm điểm" stored as S.user.voiceConsentAt (ISO or null) + synced (voice_upload_consent_at); sign out = clears local state (confirm first) and supabase signOut.
- Keep ?demo behaviour, lt: keys, bilingual V()/L(), 360px layout, existing theme tokens. Keep each file ≤300 lines.

## E. PWA (Sonnet medium)
Files: manifest.webmanifest, sw.js, assets/icons/pwa-*.png (192, 512, maskable 512; generate from existing logo assets — find them with rg; if you must rasterise an SVG, use a script in the scratchpad, not a repo dependency), lib/pwa.js.
- sw.js: versioned cache name; precache app shell (list provided by build? — simplest: cache-first for same-origin GET of static files, network-first for index.html, never cache cross-origin, never cache /config.js or any Supabase/Hugging Face request, never cache POST). Audio under /assets/audio/ cache-first.
- lib/pwa.js: register sw (skip in ?test and when not https/localhost), `navigator.storage.persist()`, iOS Safari "Thêm vào Màn hình chính" hint (dismissible, remembered in store).
Report needed index.html <link rel="manifest">, theme-color meta, apple-touch-icon, script tag.

## F. Build, config and CSP (Sonnet medium)
Files: scripts/site.cjs, scripts/build-site.cjs, scripts/serve.cjs, scripts/env.cjs (new), tests for build if any.
- scripts/env.cjs: read process.env, else parse .env.local / .env at repo root (simple KEY=VALUE parser, ignore comments); accept SUPABASE_URL|NEXT_PUBLIC_SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY|NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY|SUPABASE_ANON_KEY. Refuse (throw) if a value looks secret (starts with 'sb_secret_' or contains 'service_role').
- config.js generated (build writes dist/config.js; serve.cjs serves it dynamically) = `window.ECHOLAC_CONFIG={supabaseUrl:"…",supabaseKey:"…"};` or `{}` when unset. Never write it into the repo tree; add `config.js` to .gitignore? (it is generated only in dist and in memory — ensure not created at root).
- site.cjs: include content/pronunciation/**/*.json, assets/audio/** (mp3,m4a), manifest.webmanifest, sw.js, assets/icons/**. MIME for .webmanifest, .json, .mp3, .m4a.
- CSP (HEADERS): connect-src 'self' <supabase origin from env> https://huggingface.co https://*.huggingface.co https://*.hf.co https://*.hf.space https://cdn.jsdelivr.net; script-src keep + https://cdn.jsdelivr.net; worker-src 'self' blob:; add 'wasm-unsafe-eval' to script-src (needed by onnxruntime-web in phase 1 — comment why); media-src 'self' blob:; keep everything else. Permissions-Policy keeps microphone=(self).
- Tests: a small node test that site files include the new paths and that env refuses secret-looking keys.

## Orchestrator integration (Opus high)
index.html tags, PRD/README/AGENTS docs, run check/test, security audit (Opus xhigh), review.

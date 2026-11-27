# Bàn giao cho Codex — tích hợp giáo án phát âm vào app EchoLạc

Cập nhật: 22/11/2026. Nhánh: `feat/pronunciation-app` (chưa commit, chưa push). Người bàn giao: Claude (Opus 5.5 high, agent điều phối).

**Bản ghi gốc của Claude:** các mốc “xong”, 40/40 và thao tác trên project thật ở mục 1–6
là thông tin tại lúc bàn giao. Kết quả tiếp quản mới nhất của Codex nằm ở **mục 7**;
mục đó thay danh sách việc còn lại của Đợt 0 bên dưới.

Đọc trước: `AGENTS.md` (đặc biệt §2, §3 bảng chọn model 22/11/2026, §5–§8), `EchoLac_PRD.md` §6, §8.2 (bảng "Testing-stage build path"), §9, X-01, `docs/giao-an-phat-am.md`, `docs/handoff-p0-contract.md` (hợp đồng module Đợt 0).

Ánh xạ model cho Codex (AGENTS §3): lập kế hoạch → GPT-6.2 Astra high; xây theo kế hoạch → GPT-6.2 Sol medium; UI → GPT-6.2 Sol medium/xhigh; auth/RLS → GPT-6.2 Sol xhigh; tìm mã → GPT-6 Luna low; test → GPT-6.2 Sol low; kiểm toán bảo mật → GPT-6.2 Astra xhigh; review → GPT-6.2 Sol xhigh (khác model đã viết).

## 1. Quyết định đã chốt với chủ dự án (không bàn lại)

- Giữ prototype **JavaScript tĩnh** (không chuyển Next.js). Thêm PWA. Ưu tiên web trên điện thoại. Giai đoạn **thử nghiệm**, vài người test.
- **Supabase đăng nhập ẩn danh** (không email, không Google, không mã lớp). "Giáo viên" chỉ là người duyệt nội dung. Dữ liệu ghi `lt:` localStorage trước, đồng bộ khi có session. **Không lưu audio** ở bất kỳ đâu.
- Chấm phát âm: `onnx-community/wav2vec2-lv-60-espeak-cv-ft-ONNX`. Chạy **trên máy** nếu thiết bị đủ sức; không thì gửi lên **Space Gradio ZeroGPU miễn phí** `JinSaF/echolac-pron-scorer` **chỉ khi người dùng đồng ý**; không được nữa thì tự kiểm tra, không bịa điểm. Giao diện `scoreAttempt(audio,item)` cắm-rút engine. Chưa chặn người lạ dùng Space (chấp nhận ở giai đoạn thử nghiệm, đã ghi rủi ro PRD §12).
- Repo model HF của dự án: `JinSaF/echolac-wav2vec2-espeak-onnx`, `JinSaF/echolac-whisper-tiny-en-onnx`. Chủ dự án tự đẩy (đã đăng nhập HF). Agent không đăng nhập thay.
- Âm mẫu: **Kokoro-82M tạo sẵn** cho mọi mục giáo án (≥3 giọng en-US, ≥1 en-GB, bản chậm cho A1–A2), file nhỏ host Netlify. Không tải TTS về điện thoại.
- Nhóm tin cậy thấp (rhythm, weak_form, linking, nucleus): **điểm tham khảo** có nhãn, không vào radar/mục lỗi/điều kiện qua bài (PRD §6 đã sửa).
- Mở bài theo cấp tự chọn (bài xếp lớp tuỳ chọn); cấp cao hơn có nút **"Thử sức"**.
- Roleplay đợt 2: `whisper-tiny.en` trên máy; nhân vật vẫn theo kịch bản; LLM để sau.
- Git: mỗi đợt một PR; chỉ merge khi chủ dự án đồng ý; không push bí mật.

## 2. Khoá và môi trường

- `.env.local` (git bỏ qua) đã có `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (khoá publishable — công khai theo thiết kế) và `MAPTILER_KEY` (khoá trình duyệt, chưa dùng; chủ dự án cần giới hạn Allowed HTTP origins trên MapTiler). Không chép giá trị vào tài liệu, commit, log.
- `scripts/env.cjs` đọc env/.env.local/.env, chấp nhận tên `NEXT_PUBLIC_*`, **từ chối** khoá `sb_secret_`/`service_role`. `build-site.cjs` sinh `dist/config.js` (`window.ECHOLAC_CONFIG`); `serve.cjs` trả `/config.js` từ bộ nhớ. Netlify cần đặt 2 biến `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`.
- Trước PR: quét `sk-ant-`, `sb_secret_`, `service_role`, `Bearer `, `AZURE`.

## 3. Trạng thái Đợt 0 (hạ tầng)

| Module | Trạng thái | Tệp |
|---|---|---|
| A. Bộ sinh giáo án | **Xong** (test đạt) | `tools/pronunciation/**` (`fetch_data.py`, `build_pron.py --reviewed-by/--reviewed-at`, `AUTHORING.md`), `.gitignore`, test review-state |
| A4. Ghi nhận duyệt | **Xong** 22/11/2026 theo xác nhận của chủ dự án: 20/20 bài `verified: true`, `reviewedBy: "Giáo viên A"` | content/pronunciation, docs/giao-an-phat-am.md |
| B. Supabase schema + RLS | **Xong và đã chạy trên project thật** 22/11/2026: migration thành công; `rls_check.sql` ra `RLS check passed`; 5 bảng bật RLS, 20 policy, không còn user thử. Đã bật Anonymous Sign-ins. Thử thật từ app local: phiên ẩn danh tạo được, hồ sơ đồng bộ lên, hàng đợi rỗng, chỉ thấy 1 hàng của mình | `supabase/migrations/0001_init.sql`, `supabase/tests/rls_check.sql`, `docs/supabase-setup.md` |
| C. Client + đồng bộ | **Xong** (5 test) | `lib/cloud/{config,client,sync}.js`, `tests/cloud.test.cjs`; supabase-js 2.119.0 UMD + SRI |
| D. Giao diện đăng ký ẩn danh | **Xong** (chưa thử trên trình duyệt thật): bỏ Gmail/Google/mã lớp; `signin` = "Tiếp tục trên máy này"; thẻ Tài khoản trong Hồ sơ (trạng thái đồng bộ, cảnh báo đổi máy, công tắc `S.user.voiceConsentAt`, đăng xuất xoá dữ liệu máy); `cloudSignOut()` trong `lib/cloud/client.js`. Chưa có test riêng cho UI này | `pages/signup.js`, `signin.js`, `auth-actions.js`, `profile.js`, `components/auth.js` |
| E. PWA | **Xong** (chưa thử trên trình duyệt thật) | `manifest.webmanifest`, `sw.js`, `lib/pwa.js`, `assets/icons/pwa-*.png` |
| F. Build/config/CSP | **Xong** (3 test) | `scripts/env.cjs`, `site.cjs`, `build-site.cjs`, `serve.cjs`, `tests/build.test.cjs` |
| Tích hợp | **Xong** | `index.html` (config.js, cloud, pwa, manifest), `scripts/check.cjs` + `scripts/project.cjs` (bỏ qua config.js sinh ra), `package.json` (4 file test) |
| PRD | **Xong** | X-01 ẩn danh, X-05 Won't, §8.2 bảng build giai đoạn thử nghiệm, §9 audio/đồng ý, §6 điểm tham khảo, §12 rủi ro ZeroGPU, §14 câu 19 |

Kiểm tra cuối cùng đã chạy: `npm run check` đạt; `npm test` **40/40** (sau khi B và D xong).

### Việc còn lại để đóng Đợt 0
1. Thêm test cho luồng D (signup không email, đăng xuất xoá `lt:`, công tắc đồng ý) vào `tests/app.test.cjs`.
2. **Kiểm toán bảo mật** (Astra xhigh): RLS (2 user ẩn danh không đọc được nhau), CSP (không mở thừa), không lộ khoá, consent, giới hạn tạo tài khoản ẩn danh (khuyến nghị bật CAPTCHA/rate limit trong Supabase).
3. **Review** (Sol xhigh) bởi model khác người viết.
4. README: thêm mục chạy local với `.env.local`, Supabase setup, PWA, giới hạn.
5. Việc chủ dự án tự làm: đặt 2 env trên Netlify; bật CAPTCHA (cần tạo tài khoản hCaptcha/Turnstile) hoặc giữ rate limit mặc định; giới hạn origin cho khoá MapTiler; thử trên điện thoại. (Migration, rls_check, Anonymous Sign-ins, A4 đã xong.)
6. Tạo PR Đợt 0 (chỉ khi chủ dự án bảo).

## 4. Đợt 1 — lộ trình phát âm (chưa bắt đầu)

Phân công: mỗi module một agent nhỏ (agent lớn từng bị treo).
1. **Audio mẫu** `tools/pronunciation/render_audio`: Kokoro-82M (Python `kokoro` hoặc `kokoro-js`), ≥3 giọng en-US + ≥1 en-GB, bản 0.8× cho A1–A2, mp3/m4a phát được trên iOS + Android, `assets/audio/pron/manifest.json`, credits Kokoro, báo tổng dung lượng.
2. **Model + Space**: `tools/pronunciation/hf/` (script upload bản sao model, giữ LICENSE/NOTICE Apache-2.0, ghim revision); `tools/pronunciation/space/` (Gradio + `@spaces.GPU(duration ngắn)`, PyTorch `facebook/wav2vec2-lv-60-espeak-cv-ft`, nhận ≤6 s 16 kHz, trả token âm vị + posterior, không log audio, báo lỗi hết hạn mức). Tài khoản free ZeroGPU: ~5 phút GPU/ngày, khách 2 phút/ngày.
3. **Lõi chấm (hàm thuần + test)**: `lib/pron/content.js` (fetch JSON), `record.js` (MediaRecorder→16 kHz mono, ≤6 s, rms), `align.js` (chuẩn hoá theo `content/pronunciation/tokens.json` + Levenshtein trọng số), `classify.js` (expectedErrors trước, rồi thứ tự ưu tiên PRD §6), `score.js` (0–100, reference_score, lowConfidence→nói lại), `prosody.js` (cao độ cuối câu, trọng âm), `engines/local.js` (transformers.js ghim+SRI, kiểm khả năng máy, bắt lỗi OOM), `engines/remote.js` (`@gradio/client` ghim, chỉ khi có `voiceConsentAt`), `scoreAttempt.js`. Hằng số: PRON_THRESHOLD 60, TUTOR_WEIGHT 0.3, mastery ≥80 hai ngày (Asia/Ho_Chi_Minh).
4. **Màn hình** (UI): lộ trình 20 bài trong tab Tutor (khoá theo cấp + "Thử sức"), trang bài `#pron/Uxx` (vì sao → cách phát âm → nghe phân biệt HVPT 10 lượt ≥3 giọng → luyện từ/câu → lỗi thường gặp → chuỗi luyện → tự kiểm tra), kết quả tô âm sai (T-02), hộp xin phép gửi giọng nói, Hồ sơ (cấp, giọng, đồng ý). Đủ trạng thái; vi/en; 360 px; aria-live; token theme. Cập nhật số view trong `tests/app.test.cjs`.
5. **Tích hợp học**: mục lỗi (R-10) từ điểm <60 nhóm tin cậy cao/trung bình; radar Pronunciation từ dữ liệu thật theo 6 nhóm (E-03); ts-fsrs (T-06); đồng bộ qua `lib/cloud/sync.js` (bảng `attempts`, `unit_progress`, `error_items`, `srs_cards`).
Nghiệm thu: check/test đạt; chủ dự án thử 1 Android + 1 iPhone + 1 máy tính (ghi engine, thời gian tải/chấm); U01 và U03 đọc đúng/sai kiểu người Việt bắt đúng mã lỗi; không lưu audio.

## 5. Đợt 2 — Roleplay (chưa bắt đầu)

`lib/asr/whisper.js` (whisper-tiny.en q8, máy yếu cho gõ phím) → so câu kịch bản → chấm từng từ qua `scoreAttempt` → R-10. Quy tắc chồng lấn PRD §6 (-s/-ed: thiếu trong bản chép = ngữ pháp; có trong bản chép mà thiếu âm = `s_ed_ending`). ASR kém tin cậy → "Mình chưa nghe rõ", không chấm.

## 6. Rủi ro đã biết

- ZeroGPU free dễ hết hạn mức; endpoint công khai.
- Model chấm 197–318 MB: phần lớn điện thoại không chạy trên máy được.
- iOS có thể xoá dữ liệu web sau 7 ngày không dùng → PWA + đồng bộ Supabase.
- Supabase free tạm dừng sau ~1 tuần không dùng.
- Độ tin cậy phát hiện từng mã lỗi chưa được đo trên học sinh thật (PRD §14 Q17).

## 7. Kết quả tiếp quản Codex — 22/11/2026

**Đã hoàn tất phần mã và kiểm chứng local; Đợt 0 chưa được nghiệm thu trên dịch vụ/thiết bị thật.**

- Auth/cloud: kiểm tra tuổi theo ngày sinh, yêu cầu đồng ý người giám hộ, bảo toàn dữ liệu local
  khi offline, chỉ đồng bộ tài khoản thật đã đồng ý (không đồng bộ `?demo`). Hàng đợi gắn với
  tài khoản; gom các yêu cầu tạo phiên đồng thời; chặn thao tác sau đăng xuất và từ tab mất
  liên kết. Thu hồi đồng ý giọng nói có bản ghi riêng để tab cũ không tự cấp lại. Trạng thái
  đồng bộ cần xác nhận hồ sơ thành công. Thay đổi nơi/giọng đọc được đưa vào đồng bộ;
  cấu hình công khai được tải lại khi kết nối phục hồi sau một lượt mở offline.
- PWA: nạp sẵn HTML/script/CSS/icon/logo qua `pwa-shell.json` do build/server sinh. Không
  cache `config.js` dù có query, API, nguồn khác origin, POST, range hoặc phản hồi chuyển
  hướng. Chỉ đọc cache của EchoLạc và xoá cache cũ có tiền tố của app. Model/ảnh lớn tải
  theo nhu cầu, không bảo đảm offline nếu chưa tải.
- Build/CSP: từ chối sai loại khoá và URL chứa thông tin đăng nhập; lỗi cấu hình không
  in giá trị; thứ tự ưu tiên env vẫn đúng khi dùng alias. Chỉ dọn `dist/` đã đánh dấu sở hữu
  hoặc đầu ra ngoài dự án còn trống. CSP chặn inline script/eval, chỉ cho inline event
  attributes và đúng đường dẫn thư viện CDN. Chưa mở quyền HF/WASM của Đợt 1.
- SQL: thêm `supabase/migrations/0002_table_privileges.sql`, thu hồi quyền thừa rồi chỉ
  cấp CRUD. `rls_check.sql` mở rộng sang cả 5 bảng, kiểm tra quyền thực tế và hai danh tính.
- README, PRD §8.3/Connectivity/C.4 và hướng dẫn Supabase đã được đối chiếu; giữ mã yêu cầu
  và phân biệt dữ liệu demo, mã đã có và dịch vụ đã được kiểm chứng.

### Bằng chứng hiện tại

- `npm.cmd run check`: đạt, 76 script và 25 stylesheet.
- `npm.cmd test`: **76/76 đạt**, gồm build thật vào thư mục tạm và HTTP local; auth/cloud
  dùng Supabase giả lập; service worker dùng môi trường giả lập, không phải trình duyệt.
- Kiểm toán bảo mật độc lập: GPT-6.2 Astra xhigh; phần auth/cloud do GPT-6.2 Sol xhigh sửa.
  Review độc lập build/PWA do GPT-6.2 Sol xhigh thực hiện; các sửa cuối đã có kiểm thử hồi quy.
- PostgreSQL 17.5 nhúng qua PGlite 0.3.14 trong bộ nhớ: kiểm tra mở rộng thất bại đúng vì
  quyền TRUNCATE trong mô phỏng project cũ trước 0002; sau 0002 trả `RLS check passed`.
  Hai danh tính cách ly trên cả 5 bảng, không còn user thử sau rollback. **Đây là kết quả
  local, không phải chạy lại trên project Supabase thật.**
- Kiểm toán quét 348 tệp văn bản thuộc phạm vi source/public: không phát hiện các mẫu bí
  mật đã kiểm tra; hai thư viện CDN khớp SHA-384. Không in giá trị `.env.local`.

### Còn lại trước nghiệm thu

1. Chủ dự án áp dụng **0002** vào project đã chạy 0001 rồi chạy lại `rls_check.sql` mới.
   Không chạy lại 0001. Hướng dẫn: `docs/supabase-setup.md`.
2. Đặt hai biến công khai trên Netlify khi chuẩn bị triển khai; rà giới hạn đăng ký ẩn danh
   và origin MapTiler nếu dùng khoá đó. Frontend **chưa tích hợp CAPTCHA/token**: không
   bật bắt buộc CAPTCHA trước khi tích hợp và thử tương thích.
3. Thử đăng ký/đồng bộ/đăng xuất, consent, cài PWA và offline trên Android + iPhone + máy tính;
   vi/en và 360 px. Công cụ điều khiển trình duyệt trong lượt này đã dừng do không xác định
   được URL hiện tại đủ chắc chắn; không có kết quả kiểm tra trực quan để thay bước này.

Chưa commit, push, tạo PR, deploy hay triển khai Đợt 1/Đợt 2. Không thay đổi dịch vụ thật.

## 8. Bản thật miễn phí: trạng thái 26/11/2026

- Prompt đã duyệt: `docs/real-launch-prompt.md`. Giai đoạn 0 xong: `docs/real-launch-inventory.md` (16 dòng).
- Đã kết nối ở tài khoản Claude: Supabase, Netlify, Cloudflare (connector claude.ai), Playwright MCP. Mở phiên mới để nạp công cụ của chúng.
- Việc tiếp theo: giai đoạn 1 trên project Supabase thử nghiệm. Còn chờ chủ dự án: tài khoản Resend, chọn nhà cung cấp AI (G1), pháp lý và nhà trường (G2, G3).
- Local Guide Connect hiện là mô phỏng trên máy (docs/connect-plan.md); chưa dùng với người thật.
- Chưa commit. Thay đổi trong phiên 22–26/11 nằm ở working tree của nhánh `feat/pronunciation-app`.

### Cập nhật 26/11/2026 (chiều)
- Production Supabase "EchoLac" (mwzkkiavjqdbdfppvmaz): đã áp 0002, 0003 (bản không DROP, xem 0003_connect.sql), 0003b (revoke delete profiles), 0004. Edge Function `converse` v1 đã deploy (verify_jwt). Secret đã có: CLOUDFLARE_AI_TOKEN, CLOUDFLARE_ACCOUNT_ID. Chưa có GROQ_API_KEY.
- Connector Supabase tự từ chối migration có DROP: khi áp lên project đang chạy, bỏ DROP cho đối tượng chưa tồn tại.
- Xong trên máy (119/119 test): Turnstile (chưa đặt site key trên Netlify), AI hội thoại, nhận giọng nói whisper trên máy, Connect thật (không còn mock/?demo), trang #school, Edge Functions connect-request/connect-respond (CHƯA deploy, đang chờ review Sonnet).
- Turnstile widget "EchoLac" đã tạo (site key 0x4AAAAAAGTnWg_jl0OChOuV, công khai); secret phải rotate trước khi dán vào Supabase Auth.
- Còn lại: review + deploy connect functions; giai đoạn 5b/5c (chấm phát âm wav2vec2, âm mẫu Kokoro); giai đoạn 6 (Playwright, kiểm toán); cuối cùng: email/Resend, pháp lý, deploy thí điểm.

### Cập nhật 26/11/2026 (tối)
- Production: đã áp thêm 0005_connect_hardening. Bảng migration trên Supabase: 0002, 0003 (bản không DROP), 0003b, 0004, 0005.
- connect-request / connect-respond: viết xong, test đạt, review đã sửa; CỐ Ý CHƯA DEPLOY vì du khách chưa xác minh được (cần phần email). Deploy cùng đợt email.
- UI: Hồ sơ dùng khung thống kê kiểu C (nền navy, chữ kem); thanh dưới học sinh = Học | Nhập vai | Kết nối | Hồ sơ (Gia sư, Bản đồ lỗi mở từ Trang chủ, có nút quay lại); sw.js = echolac-v9.
- Đang chạy: giai đoạn 5b (chấm phát âm wav2vec2 trên máy). Sau đó: 5c (âm mẫu Kokoro), giai đoạn 6 (Playwright smoke + kiểm toán bảo mật Opus xhigh chỉ đọc), rồi phần email/pháp lý/deploy theo lệnh chủ dự án.

### Bàn giao cho Codex 27/11/2026 (Claude hết giới hạn 5 giờ)
Trạng thái: `npm.cmd run check` sạch, `npm.cmd test` 147/147. `main` đã deploy tới commit 7a93c04 (Netlify KHÔNG tự build từ GitHub: deploy bằng `git archive main | tar -x -C <thư mục tạm>` rồi chạy lệnh từ công cụ Netlify `deploy-site` trong thư mục đó). Netlify env đã có SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, TURNSTILE_SITE_KEY. Supabase production đã áp tới 0007.

Chưa commit (đều nằm trong working tree):
- 5c giọng Kokoro: `lib/line-audio.js`, `assets/audio/lines/` (1.200 mp3, 17 MB), `scripts/list-fixed-lines.cjs`, `scripts/render-lines.py`, `tests/line-audio.test.cjs`. Xong, test đạt.
- Admin thay giáo viên: `supabase/migrations/0008_admin.sql`, `admin/`, `scripts/admin-serve.cjs`, `tests/admin.test.cjs`, bỏ `pages/school.js`, sửa connect/router/profile. Xong, test đạt, CHƯA review và CHƯA áp lên production.
- Email OTP: XONG (27/11, Claude). `lib/cloud/email.js`, `components/email-otp.js`, nối vào Hồ sơ và #signin; `tests/email-otp.test.cjs` (5 test); README có mục "Email và mã một lần". Toàn bộ 152/152. Chưa thử gửi email thật. → Bỏ qua bước 3 bên dưới.

CẬP NHẬT 27/11 (Claude): 0008 ĐÃ ÁP lên production (connector nhận cả dòng drop not null). Đã thử thật: vai học viên và vai giả claim admin+aal2 (không có phiên MFA) đều bị từ chối ở admin_audit_log, group_sessions, admin_set_learner, admin_create_session, insert audit, tự xác minh; publishable key không đăng nhập: 401/42501 ở mọi bảng và RPC admin. Advisors chỉ còn 3 ngoại lệ đã duyệt. Review độc lập bằng model khác vẫn NÊN làm (bước 1, chỉ đọc). Lưu ý: sau 0008 người không phải admin không đọc được group_sessions; khi mở Kết nối cần thêm RPC kiểu safe_sessions cho du khách xem buổi nhóm.
→ Bước 2 và 3 bên dưới đã xong.

Việc còn lại, theo thứ tự:
1. Review 0008 + admin/ (GPT-6.2 Astra xhigh, chỉ đọc; khác model đã viết). Tiêu chí: admin = app_metadata.role='admin' VÀ aal2; is_admin() SECURITY DEFINER search_path ''; mọi bảng/RPC admin từ chối anon, học viên, du khách, admin chưa aal2 kể cả gọi REST trực tiếp; admin_audit_log chỉ ghi thêm; không service_role trong trình duyệt; admin không lọt vào dist/. Sửa lỗi Critical/High.
2. Áp 0008 lên production (project mwzkkiavjqdbdfppvmaz). Connector Supabase từ chối DROP: dòng `alter column school_id drop not null` có thể phải chạy riêng trong SQL Editor. Sau đó chạy `supabase/tests/rls_check.sql`, thử bằng publishable key với tài khoản ẩn danh (phải bị từ chối), chạy Security Advisors; 3 ngoại lệ đã được chủ dự án duyệt (anonymous sign-ins, SECURITY DEFINER cho authenticated, leaked-password chỉ có ở gói Pro), các cảnh báo khác phải sửa.
3. Hoàn tất email OTP (GPT-6.2 Sol xhigh, vì là xác thực). Dashboard đã cấu hình: SMTP Resend (người gửi tạm onboarding@resend.dev, chỉ gửi tới chủ tài khoản Resend cho tới khi xác minh tên miền), mẫu Magic link / Confirm sign up / Change email address gửi `{{ .Token }}`, OTP dài 8 số, hết hạn 3600 s, mật khẩu tối thiểu 12 ký tự gồm chữ thường, hoa, số, ký hiệu. Luồng: gắn email cho tài khoản ẩn danh trong Hồ sơ (`updateUser({email})` → `verifyOtp` type `email_change`); đăng nhập máy khác (`signInWithOtp({email, options:{shouldCreateUser:false, captchaToken}})` → `verifyOtp` type `email`, rồi kéo hồ sơ). Ô mã nhận 6–10 số, gửi lại sau 60 s, báo lỗi rõ (sai/hết hạn mã, 429, mất mạng). Không log email/mã. Có test.
4. Tăng `VERSION` trong sw.js, quét secret (sbp_, gsk_, sk-ant-, JWT, sb_secret_) trên diff đã stage, commit, merge vào main, push, deploy như trên. LUẬT của chủ dự án: không token/key nào được nằm trong file commit.
5. Giai đoạn 6: Playwright smoke test ở 360 px cho học viên, du khách và trang admin (đã có skill `playwright-cli`; được phép thêm devDependency `@playwright/test`).
6. Hướng dẫn chủ dự án: tạo tài khoản admin trong Supabase (Add user, auto-confirm), nâng quyền bằng SQL trong README, chạy `npm.cmd run admin`, đăng ký TOTP.
Sau đó: bỏ `'unsafe-inline'` khỏi CSP; deploy connect-request/connect-respond và mở `ECHOLAC_CONNECT_PILOT_OPEN` khi chủ dự án đồng ý; xác minh tên miền cho Resend.

### Cập nhật 26/11/2026 (khuya)
- Xong 5b (chấm phát âm trên máy). Giao diện du khách luôn tiếng Anh (`uiLang()` trong lib/helpers.js). sw.js = echolac-v11.
- Production: đã áp 0006_ai_privacy (trần 100 lượt AI/ngày toàn dự án, `ai_project_quota_take`, hàm cũ `ai_quota_take` trả null) và 0006_audit_fixes (khoá display_name sau xác minh, CHECK chặn số điện thoại/@/link, đã VALIDATE; `own_delete` = false). converse = v2.
- converse chỉ trả lời tài khoản có `app_metadata.echolac_verified_adult = true` (do server đặt). Chủ dự án xác nhận người dùng thật đều từ 18 tuổi; ô phụ huynh đồng ý vẫn giữ để test, không có cờ dưới 18 nào trên server; migration 0007_adults_only (đã áp) có trigger trên auth.users đặt cờ cho mọi tài khoản mới và đã đánh dấu 4 tài khoản cũ. PRD §9 đã ghi.
- Netlify: đã có TURNSTILE_SITE_KEY. Chủ dự án còn phải đổi secret Turnstile rồi bật captcha trong Supabase Auth; chỉ bật sau khi bản có lib/cloud/captcha.js lên main.
- Connect: công tắc `ECHOLAC_CONNECT_PILOT_OPEN` (mặc định đóng → 403 pilot-closed; vẫn cho từ chối/huỷ). Test 140/140.

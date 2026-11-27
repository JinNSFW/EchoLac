# EchoLạc

Prototype web mobile-first luyện nói tiếng Anh theo tình huống văn hoá địa phương.
Bản ứng dụng hiện là HTML/CSS/JavaScript thuần. Máy local chạy trực tiếp;
Netlify dùng bước build để chọn tệp công khai và sinh cấu hình.
`EchoLac_PRD.md` xác định tính năng; `AGENTS.md` quy định cách tổ chức và triển khai.

## Chạy và kiểm tra

Cài Node.js 20 trở lên, rồi chạy tại thư mục dự án:

```sh
npm start
```

Mở `http://127.0.0.1:4173`. Không còn chế độ `?demo`: tạo tài khoản ở màn đăng ký. Thêm `?test`
để chạy chẩn đoán độ tương phản và nhận diện trong console. Không cần `npm install`.
Máy chủ phát triển chỉ phục vụ tệp ứng dụng, tài nguyên và model.
Trong **Trang chủ → Luyện tập: Đà Nẵng**, bộ câu hỏi tải khi mở mục này và lưu lượt
đang làm trong trình duyệt. Khi đổi nội dung ngân hàng, tăng `pack.version` trong JSON
để tiến trình cũ không bị áp vào đáp án mới.

**Trang chủ → Luyện nói: Chỉ đường ở Đà Nẵng** (`#practice/directions`) mở bài thử trong
PRD §5.8. Dùng bản đồ mô phỏng để nói bằng tiếng Anh. Có thể nói trực tiếp với người nghe
hoặc bật micro để thu tối đa 30 giây và nghe lại trên thiết bị. Người nghe đánh dấu hướng rẽ,
mốc và đích, còn chế độ tự luyện bỏ qua điểm. Sau phần luyện ngắn và bản đồ mới, bài kiểm tra
mở sau 7 ngày. Tiến độ được lưu trên trình duyệt, không đồng bộ.
Ứng dụng loại bỏ bản ghi khi rời bài, ẩn tab hoặc kết thúc phần đánh giá.
Nếu PowerShell chặn `npm.ps1`, thay `npm` bằng `npm.cmd` trong các lệnh dưới đây và lệnh khởi động.

```sh
npm run check
npm test
npm run test:e2e   # Playwright, Chromium 360 px: học viên, du khách, trang admin (lần đầu: npx playwright install chromium)
```

`check` kiểm tra cú pháp JavaScript, đường dẫn tài nguyên và giới hạn 300 dòng của
các tệp ứng dụng.

## Đồng bộ đám mây (Supabase) và PWA

App chạy được không cần Supabase; khi đó dữ liệu chỉ nằm trong `localStorage` (khoá `lt:`).
Để bật đồng bộ ở máy local, tạo `.env.local` (git bỏ qua), thay các placeholder sau
bằng URL project và khoá publishable trong Dashboard:

```dotenv
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_REPLACE_WITH_PUBLIC_KEY
```

Khởi động lại `npm start` sau khi đổi cấu hình. Bỏ cả hai biến để chạy chỉ trên máy;
đặt thiếu một biến sẽ báo lỗi. Có thể dùng các tên `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, hoặc `SUPABASE_ANON_KEY` cho JWT anon cũ.
`npm start` trả `/config.js` từ bộ nhớ; `build-site.cjs` ghi `dist/config.js`.
Chỉ URL và khoá công khai được xuất ra. `scripts/env.cjs` từ chối khoá bí mật,
JWT service role, chuỗi khoá không đúng loại và URL chứa thông tin đăng nhập.

**Chống bot (Cloudflare Turnstile), tuỳ chọn.** Đặt thêm `TURNSTILE_SITE_KEY` (khoá *site*,
công khai) trong `.env.local` hoặc biến Netlify. Khi có khoá, app hiện widget Turnstile
(chỉ hiện khi Cloudflare cần người dùng bấm) trước khi tạo tài khoản ẩn danh và gửi
`captchaToken` cho Supabase; CSP chỉ mở `https://challenges.cloudflare.com` khi đó. Không
đặt thì mọi thứ chạy như cũ. `scripts/env.cjs` từ chối giá trị giống khoá *secret*.
Kiểm tra thử bằng khoá mẫu của Cloudflare (`1x00000000000000000000AA`).
Việc chủ dự án làm (không ghi giá trị bí mật vào repo, chat hay log):

- [ ] Cloudflare Dashboard → Turnstile → Add widget: chế độ Managed, thêm hostname
      `*.netlify.app` của site (và `localhost` nếu thử ở máy); chép site key và secret key.
- [ ] Đặt `TURNSTILE_SITE_KEY` trên Netlify (và `.env.local` nếu thử ở máy), deploy lại.
- [ ] Supabase Dashboard → Settings → Authentication → Bot and Abuse Protection →
      Enable CAPTCHA protection: chọn Turnstile, dán **secret key** ở đó (chỉ ở đó), Save.
- [ ] Thứ tự: deploy bản có site key trước, rồi mới bật CAPTCHA trong Supabase; bật trước
      thì đăng nhập ẩn danh của bản cũ sẽ bị từ chối.
- [ ] Thử trên điện thoại: tạo tài khoản mới, Hồ sơ hiện "Đã đồng bộ".

Tài khoản là **ẩn danh** (PRD X-01): không email, không mật khẩu; đổi máy hoặc xoá dữ liệu
trình duyệt thì mất liên kết. Cài bảng và RLS xem [docs/supabase-setup.md](docs/supabase-setup.md).
Mã đồng bộ ở `lib/cloud/`: hàng đợi cùng không gian lưu trữ `lt:learning:<owner>:`
với tiến độ, ghi trên máy trước rồi đẩy lên khi có phiên.
Chưa đồng ý điều khoản thì không tạo phiên hay gửi dữ liệu lên Supabase. Hồ sơ, nơi đã chọn,
giọng đọc và đồng ý gửi giọng nói được đồng bộ; chỉ báo thành công sau xác nhận của cloud.
Ngày sinh đầy đủ và giới tính ở trên máy. Cloud nhận năm sinh.
Tài khoản mới bắt đầu với 0 XP, streak 0 ngày và danh sách lỗi trống.
Tiến độ cục bộ thuộc tài khoản đang dùng. Đăng xuất tài khoản đã gắn email giữ tiến độ
riêng trên trình duyệt để có thể mở lại sau khi xác thực. Đăng xuất tài khoản ẩn danh
xoá tiến độ cục bộ và liên kết với tài khoản đó.

**Kết nối (PRD §5.9)** chỉ dùng dữ liệu server (`data/connect-state.js`, cần migration 0003–0008 và
Edge Function `connect-respond`): vai trò, xác minh, trình độ và nhóm tuổi đọc từ `profiles`;
học viên chọn Học sinh/Du khách một lần khi chưa xác minh; lịch rảnh ghi `availability`, yêu cầu đọc
`connection_requests`; chặn/báo cáo ghi `blocks`/`reports`. Không còn trường, mã mời hay giáo viên
(0008): **admin** toàn cục xác minh học viên và giám sát buổi nhóm, chỉ từ trang quản trị cục bộ
(mục dưới). **Chưa mở:** du khách kết nối (cần xác minh danh tính du khách), gặp 1-1, học sinh dưới 18
(đợt thí điểm chỉ cho người từ 18 tuổi, 0007). Ngoại tuyến hoặc chưa đăng ký thì màn Kết nối chỉ giải thích,
không có dữ liệu mẫu.

### Email và mã một lần (OTP)

Tài khoản bắt đầu ẩn danh. **Hồ sơ → Gắn email** gửi mã (`updateUser({ email })`, xác nhận bằng
`verifyOtp` loại `email_change`), nên tài khoản và tiến độ giữ nguyên. Trên máy khác, **Đăng nhập → Đăng
nhập bằng email** (`signInWithOtp` với `shouldCreateUser: false`, rồi `verifyOtp` loại `email`) và kéo hồ sơ
từ đám mây cùng các lỗi phát âm đã đồng bộ. XP, streak và tiến độ bài học hiện lưu riêng
trên từng trình duyệt. Mã: `lib/cloud/email.js`, giao diện: `components/email-otp.js`, test: `tests/email-otp.test.cjs`.
Cấu hình trên dashboard: SMTP qua Resend; mẫu Magic link, Confirm sign up, Change email address gửi
`{{ .Token }}`; mã 8 số, hết hạn 1 giờ. **Giới hạn:** người gửi `onboarding@resend.dev` chỉ gửi được tới
chủ tài khoản Resend cho tới khi xác minh một tên miền riêng trong Resend.

### Trang quản trị cục bộ (`admin/`, không bao giờ deploy)

`npm run admin` (PowerShell: `npm.cmd run admin`) mở `http://127.0.0.1:4174/` (đổi cổng bằng `ADMIN_PORT`).
`scripts/admin-serve.cjs` chỉ nghe trên 127.0.0.1, chỉ trả 4 tệp trong `admin/` và `config.js` sinh từ
`SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY` trong `.env.local` (qua `scripts/env.cjs`, từ chối khoá bí mật),
với CSP chặt (`default-src 'none'`, không inline). supabase-js tải từ jsDelivr, ghim phiên bản và SRI.
`scripts/site.cjs` không liệt kê `admin/`, nên Netlify và `npm start` không bao giờ phục vụ nó
(`tests/admin.test.cjs` build thử vào thư mục tạm để kiểm tra). Không có khoá `service_role` nào ở trang này:
quyền đến từ RLS và các RPC `admin_*` (migration 0008), cần vai trò admin **và** phiên MFA (aal2).

Chủ dự án tạo admin (không có luồng đăng ký admin ở đâu cả):
1. Supabase Dashboard → Authentication → Sign In / Providers → **Email** bật (để đăng nhập bằng mật khẩu).
   Authentication → Policies/Passwords: độ dài tối thiểu **12**, bắt buộc chữ hoa, chữ thường, số và ký hiệu.
2. Authentication → Users → **Add user** → Create new user: email + mật khẩu mạnh, chọn **Auto Confirm User**.
3. SQL Editor (vai `postgres`), thay email:
   `update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}' where email = 'admin@example.com';`
   Thu hồi: `update auth.users set raw_app_meta_data = raw_app_meta_data - 'role' where email = '...';` (có hiệu lực ngay).
4. `npm run admin`, đăng nhập. Lần đầu trang hiện mã QR TOTP: quét bằng ứng dụng xác thực, nhập mã 6 số.
   Những lần sau chỉ hỏi mã. Trang không đọc dữ liệu nào trước khi phiên đạt aal2; database cũng từ chối như vậy.
5. Các tab: **Học viên** (xác minh, trình độ, nhóm tuổi), **Buổi nhóm** (tạo tại địa điểm đã duyệt, đóng buổi),
   **Yêu cầu & báo cáo** (xem yêu cầu và danh sách chặn; đánh dấu báo cáo đã xem/đóng), **Nhật ký** (chỉ đọc `admin_audit_log`).
   Phiên chỉ nằm trong tab (`sessionStorage`); đóng tab là đăng xuất trên máy này.

Nếu bật CAPTCHA của Supabase Auth, đăng nhập mật khẩu cũng cần `captchaToken`; trang quản trị chưa nạp Turnstile
(script của Cloudflare không ghim SRI được), nên khi đó chưa đăng nhập admin được (xem Giới hạn).
Thu hồi đồng ý gửi giọng nói có hiệu lực trên máy ngay; bản cloud được cập nhật khi có mạng.
PWA: `manifest.webmanifest`, `sw.js` (không cache tài nguyên khác domain, `config.js`,
API, POST hay request âm thanh dạng range), `lib/pwa.js`. Cache chỉ chứa tệp ứng dụng
công khai; cập nhật service worker chỉ xoá cache cũ có tiền tố `echolac-`.
Khi service worker cài thành công, nó tải sẵn HTML, script, CSS và icon theo
`pwa-shell.json` được sinh bởi build/máy chủ local. Ảnh cảnh, model và tài nguyên bài học
lớn vẫn tải theo nhu cầu; chưa tải trước thì không bảo đảm dùng offline. Cài PWA cần
HTTPS hoặc localhost; gợi ý thêm vào Màn hình chính
có trên iOS. `?test` bỏ qua đăng ký service worker. Khi đổi tệp app, tăng `VERSION` trong `sw.js`.

## AI hội thoại (Roleplay và Gia sư)

Khi online, màn Talk và nút "Hỏi Gia sư AI" dùng Edge Function `supabase/functions/converse`
cho tài khoản có cờ `echolac_verified_adult: true` trong `app_metadata` do máy chủ quản lý.
Luồng đăng ký hiện tại chưa xác minh tuổi nên mặc định mở hội thoại theo kịch bản, không thu âm
hoặc tạo điểm ở chế độ này. Edge Function kiểm tra lại quyền trước khi đọc nội dung và giới hạn 40 lượt
mỗi tài khoản, 100 lượt toàn dự án mỗi ngày UTC. Phản hồi của Groq hoặc Cloudflare Workers AI được kiểm tra
xong rồi mới hiển thị. Lời học viên có số điện thoại, email, liên kết, `@` hoặc câu hỏi/khai thông tin cá nhân thì bị từ chối (400) trước khi trừ lượt; lịch sử lời nhân vật do trình duyệt gửi không bao giờ chuyển cho nhà cung cấp; cả câu trả lời bị giữ lại nếu hỏi tên, trường, liên lạc hoặc chỗ ở (`converse-safety.ts`). Trần toàn dự án hết thì báo "bận" (503), không phải "hết lượt". Hết lượt hoặc dịch vụ lỗi thì chuyển sang luyện theo kịch bản. Logic ở `supabase/functions/_shared/`,
test ở `tests/ai-converse.test.cjs` (fetch giả, không gọi mạng). Đổi kịch bản thì chạy
`node scripts/ai-scenarios.cjs` để sinh lại `_shared/scenarios.json`.

### Nói trong AI Talk (nhận giọng nói trên máy, 5a)

Chạm micro lần đầu: hộp xác nhận nêu dung lượng (khoảng 65 MB một lần: trọng số
`onnx-community/whisper-tiny.en` q8 ≈ 41 MB, revision ghim trong `lib/asr-worker.js`, và runtime WebAssembly ≈ 22 MB),
rồi tải với thanh tiến độ MB. Thư viện `@huggingface/transformers@3.7.6` nạp từ jsDelivr bên trong Web Worker
`lib/asr-worker.js` (không có ở trang chính, chỉ khi chạm micro; `import()` động nên không gắn SRI, CSP chỉ mở
đúng đường dẫn đã ghim và `'wasm-unsafe-eval'`). Mô hình nằm trong Cache API của trình duyệt (`transformers-cache`),
lần sau không tải lại. Thu âm tối đa 15 giây (`lib/asr-device.js`, 16 kHz đơn kênh), bản chép hiện trong ô gõ để
học viên kiểm tra rồi bấm Gửi. Quyền riêng tư: âm thanh không bao giờ rời thiết bị, không lưu, bộ đệm bị xoá ngay
sau khi chép; micro được nhả khi dừng, khi ẩn tab và khi rời màn. Thiết bị không có Worker/WebAssembly/micro,
hết bộ nhớ hoặc tải lỗi thì chỉ còn ô gõ kèm thông báo; không bao giờ tự bịa bản chép.
Máy trạng thái ở `lib/asr-input.js`, test `tests/asr.test.cjs` (bộ chép giả, không tải mô hình).

Việc của chủ dự án (chưa làm; không ghi giá trị khoá vào repo, chat hay log):
- [ ] Groq: tạo API key tại console.groq.com; bật **Zero Data Retention** trong Settings → Data Controls.
- [ ] Cloudflare: lấy Account ID; tạo API token chỉ có quyền **Workers AI** (Read và Edit). Giữ gói Workers Free.
- [ ] Sau các migration 0001–0005, xác minh `supabase/migrations/0006_ai_privacy.sql`, rồi `0006_audit_fixes.sql` (khoá `display_name` sau xác minh, cấm số/`@`/liên kết trong tên, vô hiệu policy `own_delete` cũ) và `rls_check.sql` trên môi trường thử nghiệm trước khi triển khai bản Edge Function này.
- [ ] Đặt secret cho Edge Function: Dashboard → Edge Functions → Secrets, hoặc
  `supabase secrets set GROQ_API_KEY=… CLOUDFLARE_ACCOUNT_ID=… CLOUDFLARE_AI_TOKEN=…`.
  `SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY` được Supabase cấp sẵn cho function.
- [ ] Deploy: `supabase functions deploy converse` (giữ xác minh JWT mặc định), rồi thử một vòng Talk khi đã đăng nhập.

### Chấm phát âm trên máy (5b)

- **Cách chấm:** `lib/pron-worker.js` chạy `onnx-community/wav2vec2-lv-60-espeak-cv-ft-ONNX` (revision ghim `c69750f`, trọng số int8) bằng transformers.js 3.7.6 như Whisper, ghi âm ≤6 s, 16 kHz mono. Worker chỉ trả id âm vị và xác suất; `lib/pron/` giải mã CTC, chuẩn hoá theo `content/pronunciation/tokens.json`, căn chỉnh Levenshtein có trọng số, phân loại lỗi (expectedErrors trước, rồi thứ tự PRD §6) và cho điểm 0–100. Mọi ngưỡng ở `lib/pron/constants.js`. Nhóm tin cậy thấp chỉ là điểm tham khảo; clip không nghe rõ thì yêu cầu nói lại, không bao giờ bịa điểm.
- **Dung lượng:** khoảng **318 MB** tải một lần sau khi người dùng bấm đồng ý, lưu trong Cache API của trình duyệt. Máy không chạy được hiện "Thiết bị chưa hỗ trợ chấm tự động" và giữ tự kiểm tra. Đường HF Space từ xa vẫn **Chưa mở** (chưa có luồng đồng ý).
- **Quyền riêng tư:** âm thanh chỉ nằm trong bộ nhớ, bị xoá sau khi chấm, không lưu, không tải lên; micro được nhả khi xong, ẩn tab hoặc rời trang.
- **Độ chính xác:** chưa được kiểm chứng với điểm giáo viên (PRD §7.4); trọng số và ngưỡng là giả định thí điểm.
- **Chưa thử trên máy thật:** tải mô hình, độ trễ và bộ nhớ trên Android, iPhone, máy tính; chỉ có test thuần (`tests/pron.test.cjs`).

## Triển khai

Netlify chạy `node scripts/build-site.cjs`, chép đúng các tệp công khai của ứng dụng
(trang, script, CSS, ngân hàng câu hỏi Đà Nẵng, giáo án `content/pronunciation/`, `assets/`, `model/`) vào `dist/`, ghi `config.js` từ biến môi trường và tệp `_headers`.
Trên Netlify đặt hai biến `SUPABASE_URL` và `SUPABASE_PUBLISHABLE_KEY`; không đặt cả hai
thì bản build chạy chế độ chỉ lưu trên máy. Chỉ đặt một biến sẽ khiến build thất bại.
Build mặc định vào `dist/`, đánh dấu thư mục được sinh bởi EchoLạc; chỉ dọn lại `dist/`
có dấu này. Không dùng thư mục chứa dữ liệu khác làm đầu ra. Đầu ra tuỳ chọn phải là
thư mục trống ngoài dự án; build từ chối xoá thư mục không thuộc quyền quản lý của nó.
Tài liệu (PRD, AGENTS, README, giáo án), `tests/`, `scripts/` và `outputs/` không được
publish. Danh sách tệp và header bảo mật nằm ở một nơi, `scripts/site.cjs`, được dùng chung
cho máy chủ phát triển và bản build. Vì vậy chạy `npm start` cũng áp dụng cùng CSP như site thật.
Khi đổi phiên bản thư viện CDN trong `lib/camera/model.js` hoặc `lib/cloud/client.js`, cập nhật lại hash `integrity` (kể cả trong `admin/index.html` và CSP của `scripts/admin-serve.cjs`). Khi train lại model, xuất sang `model/` bằng `model v3/diagnosis/export_tfjs.py model` (cách cài ghi ở đầu tệp) và chạy lại `eval.py` cạnh đó. Các kiểm thử kiểm tra render của 16 màn hình bằng hai ngôn ngữ,
biến thể thư viện/bài học, lưu trạng thái, chọn giao diện và các chẩn đoán sẵn có.
Kiểm thử dùng DOM giả lập tối thiểu; không thay thế kiểm tra giao diện trên trình duyệt
hoặc kiểm tra quyền camera trên thiết bị thật.

## Tìm mã ở đâu

| Đường dẫn | Nội dung |
| --- | --- |
| `index.html` | Khung trang và thứ tự tải script bằng `defer` |
| `app.js` | Một nguồn cấu hình `THEMES` và khởi động ứng dụng |
| `pages/` | Mỗi màn hình một tệp; `registry.js` khai báo danh sách màn hình |
| `components/` | Markup và hành vi dùng chung: biểu đồ, lịch, Tutor, theme, bottom sheet |
| `data/` | localStorage, trạng thái và tiến độ bài học; giữ nguyên khóa `lt:` |
| `content/` | Tình huống, đoạn hội thoại mẫu và dữ liệu tiến độ mẫu |
| `content/directions-practice.js`, `data/directions-progress.js` | Ba bản đồ mô phỏng cho bài chỉ đường, đáp án, kết quả người nghe và thời điểm mở lại |
| `lib/directions-practice.js`, `lib/directions-recording.js` | Điều phối bài chỉ đường, microphone và nghe lại bằng bộ nhớ tạm |
| `content/curriculum/` | Chương trình học Đà Nẵng A1–C1 (PRD R-13): kịch bản lấy từ giáo án, và `landmarks.js` gồm bài riêng cho từng lớp của model camera; có nguồn, chưa được xác minh |
| `content/pronunciation/` | Dữ liệu giáo án phát âm (PRD §6): 20 bài A1–C1, IPA từ CMUdict; dữ liệu ghi đã được Giáo viên A duyệt ngày 22/11/2026 theo bàn giao. Chưa có giao diện lộ trình phát âm. Tài liệu: `docs/giao-an-phat-am.md` (tạo tự động từ cùng dữ liệu) |
| `lib/` | Điều hướng, giọng nói, luyện tập và xử lý nhận diện camera |
| `lib/camera/` | Model, GPS, so khớp, chụp ảnh và quét liên tục |
| `styles/` | CSS theo nhóm chức năng, được nhập theo đúng thứ tự trong `styles.css` |
| `assets/` | Logo, minh hoạ, dữ liệu địa danh gốc. `assets/icons/{ui,lesson,place}/` và `assets/landmarks/` là icon nét do nhóm vẽ, tô màu theo theme bằng CSS mask (`components/icons.js`); `assets/scenes/<theme>/` là 26 ảnh cảnh 2.5D làm nền khi chọn địa điểm |
| `model/` | Model nhận diện v4 (TF.js, 5 địa danh) chạy trên thiết bị; script đánh giá và xuất model ở `model v3/diagnosis/` |
| `scripts/`, `tests/` | Máy chủ phát triển và các bước kiểm tra |
| `admin/` | Trang quản trị cục bộ (đăng nhập, MFA, xác minh học viên, buổi nhóm, báo cáo, nhật ký); chạy bằng `npm run admin`, không bao giờ build hay deploy |

Các script dùng chung phạm vi toàn cục để giữ tương thích với sự kiện inline của
prototype và cách triển khai tĩnh hiện tại. Khi thêm tệp, khai báo nó trong
`index.html` trước `app.js`; tái sử dụng helper có sẵn trước khi tạo helper mới.
Giữ thứ tự import CSS để tránh thay đổi cascade. Mỗi tệp ứng dụng tối đa 300 dòng.

## Giới hạn hiện tại

Migration 0008 đã được áp dụng lên Supabase production theo [bàn giao ngày 27/11](docs/handoff-codex.md). Bàn giao ghi nhận các lần kiểm tra từ chối truy cập khi thiếu quyền hoặc phiên MFA. Kiểm thử Node xác nhận trang quản trị bị loại khỏi bản build công khai. Trạng thái đăng nhập và TOTP trên trình duyệt được theo dõi trong bước smoke test của bàn giao. Trang quản trị chưa hỗ trợ CAPTCHA. Để huỷ các yêu cầu đang mở của một buổi nhóm, admin có thể đóng buổi đó. Trang chưa có thao tác huỷ riêng từng yêu cầu.

Nhập vai theo kịch bản cấp XP hoàn thành bài. Tutor ghi nhận điểm từ bài chấm phát âm
trên thiết bị khi kết quả đủ tin cậy. Radar chỉ hiển thị điểm đã có. Bài chỉ đường ghi
giọng thật trên thiết bị và dùng phản hồi của người nghe. Chưa có kết quả pilot.
Đăng nhập là tài khoản ẩn danh Supabase thật khi có cấu hình. Phát giọng nói dùng trình duyệt;
nhận diện ảnh dùng model v4 thật (TensorFlow.js), tải thư viện từ CDN khi cần.
Thông tin địa danh vẫn cần giáo viên xác minh. Không xem số liệu mẫu là kết quả
nghiên cứu hoặc điểm đo thực tế.

Next.js, TypeScript, Claude và Azure Speech là kiến trúc đích theo
PRD (Supabase ẩn danh và PWA đã có ở bản tĩnh). Đợt sắp xếp này giữ nguyên prototype; chưa chuyển sang kiến trúc đó.
Thư mục `app/` là bản Next.js riêng đang bị Git bỏ qua; không thuộc bản triển khai tĩnh.
Khóa dịch vụ chỉ được đặt phía server theo `.env.example` và `AGENTS.md`.

Đợt 0 chưa được nghiệm thu trên Android/iPhone hoặc kiểm tra trực quan trong lượt này:
công cụ điều khiển trình duyệt dừng vì không xác định được URL đủ chắc chắn.
Migration `0002_table_privileges.sql` và bản kiểm tra RLS mở rộng đã được kiểm tra trên
PostgreSQL nhúng chạy trong bộ nhớ; chưa áp dụng/chạy lại trên project Supabase thật.
Chủ dự án cần áp dụng migration đó, chạy lại kiểm tra RLS, đặt biến Netlify và kiểm tra
trên điện thoại trước nghiệm thu. Turnstile mới được kiểm bằng widget giả lập trong
`tests/captcha.test.cjs`; chưa chạy với Cloudflare và Supabase thật (xem danh sách việc ở trên).

## Bộ sinh giáo án phát âm

`content/pronunciation/` và `docs/giao-an-phat-am.md` được tạo bằng `tools/pronunciation/` (Python 3, không cần thư viện ngoài); không sửa tay hai nơi này.

```
python -I tools/pronunciation/fetch_data.py   # tải CMUdict + CEFR-J vào .cache/ (không commit)
python -I tools/pronunciation/build_pron.py   # kiểm tra và ghi lại JSON + giáo án
python -I tools/pronunciation/build_pron.py --reviewed-by "Tên" --reviewed-at 2026-11-22
```

Dữ liệu viết tay nằm ở `tools/pronunciation/authored/`; `reviewedBy`/`reviewedAt` lưu ở đó để lần build sau giữ nguyên. Chỉ dùng hai cờ `--reviewed-*` khi giáo viên thật đã duyệt (AGENTS.md §6).

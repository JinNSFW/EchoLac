# Kiểm kê tính năng mô phỏng, demo, mock: đường đi thật bằng dịch vụ miễn phí

Ngày kiểm kê: 26/11/2026. Chỉ đọc mã nguồn, không chạy ứng dụng. Mọi dòng dẫn theo `file:line` trong kho `d:\Project`.

Nguồn giai đoạn (1–7): 1 tài khoản/vai trò/RLS, 2 quy tắc kết nối phía server, 3 xác minh và đồng ý, 4 hội thoại AI, 5 giọng nói, 6 kiểm thử/kiểm toán, 7 triển khai.

Cột "Giới hạn gói free" ghi "cần tra" vì chưa kiểm tra số liệu hiện hành. Không suy đoán con số.

| # | Tính năng | Hiện trạng (file:line) | Dịch vụ thật miễn phí đề xuất | Giới hạn gói free | Giai đoạn |
| --- | --- | --- | --- | --- | --- |
| 1 | Nhận diện ảnh camera: ảnh mẫu và điểm "mô phỏng" khi không có camera hoặc ở Demo | `lib/camera/capture.js:42` (ảnh mẫu, `recognise()`); `lib/camera/matching.js:30-36` (cờ `simulated`); `components/camera-results.js:19` (tag "mô phỏng"); `components/camera-demo.js:4,14-16` | Đã có model v4 TF.js chạy trên trình duyệt (PRD §8.5); bỏ nhánh ảnh mẫu khi có camera thật. Không cần dịch vụ mới | Không áp dụng (on-device). Tải thư viện từ CDN: cần tra | 3 |
| 2 | Vị trí GPS mẫu trong Demo | `lib/camera/location.js:6` (GPS giả, trễ 700 ms); `components/location-status.js:17` ("Vị trí mẫu, mô phỏng"); `pages/locate.js:8` (tag Demo/Thật); `lib/camera/capture.js:10,32` | Geolocation của trình duyệt (miễn phí, không cần tài khoản dịch vụ). GPS là tùy chọn, có đồng ý riêng (PRD §9) | Cần tra (không có gói trả phí liên quan) | 3 |
| 3 | Xác minh danh tính, nhóm tuổi, trường, phụ huynh (Guide Connect) | `components/connect-ui.js:5` (SIM_NOTE "không phải xác minh thật"); `components/connect-ui.js:30` (huy hiệu mô phỏng); `components/connect-ui.js:123` (công tắc "Xác minh (mô phỏng)") | Supabase Auth, Postgres, Edge Function; Resend (email phụ huynh); Cloudflare Turnstile (chống bot). Xác minh danh tính thật: trong danh sách cho phép chưa có dịch vụ miễn phí phù hợp; chủ dự án cần quyết định | Supabase Free, Resend Free, Turnstile: cần tra | 3 |
| 4 | Kiểm tra kết nối R-16 và đóng vai (chỉ trên thiết bị) | `components/connect-ui.js:64` ("Profile simulators, demo only, never a real check"); `data/connect-state.js:47` (tra người theo id mock) | Supabase Edge Function đánh giá lại quy tắc R-16 trên server, kèm RLS (PRD §9:619) | Supabase Free (Edge Functions): cần tra | 2 |
| 5 | Danh sách người mẫu Guide Connect (học sinh và khách du lịch) | `data/connect-mock.js:2` ("Simulated people only"); `data/connect-mock.js:44` (`MOCK_STUDENTS`); `data/connect-mock.js:65` (`MOCK_TOURISTS`); `pages/spot.js:27` (dùng `MOCK_STUDENTS` để ghép cặp) | Bảng Postgres trên Supabase với RLS; không lưu số điện thoại, email, toạ độ (PRD §9:619) | Supabase Free (Postgres): cần tra | 1 |
| 6 | Báo cáo và chặn chỉ lưu trên máy | `components/connect-ui.js:96` ("Báo cáo được lưu trên máy này (mô phỏng)") | Bảng báo cáo trên Postgres + hàng đợi kiểm duyệt; thông báo qua Resend | Supabase Free, Resend Free: cần tra | 2 |
| 7 | Đổi vai Demo và link `?role=tourist` | `components/connect-ui.js:111,115` ("Vai trò (Demo)"); `data/connect-state.js:56` (đọc `?role=tourist`) | Vai trò gắn với tài khoản qua Supabase Auth và RLS; mỗi tài khoản một vai | Supabase Free: cần tra | 1 |
| 8 | Đăng nhập demo `?demo` bỏ qua xác thực, tài khoản "Nguyễn Thị Lan" | `data/state.js:22` (`S.user` mẫu); `scripts/serve.cjs:41` (in link `?demo`); `lib/cloud/client.js:26` (không đồng bộ khi `?demo`); `README.md:16,59` | Supabase anonymous sign-in (đã có cấu hình trong README:122); bỏ hoặc giữ `?demo` chỉ cho buổi trình diễn | Supabase Free Auth: cần tra | 1 |
| 9 | Tiến độ "demo" chỉ lưu trên trình duyệt, không đồng bộ | `content/progress.js:2` ("Demo progress"); `data/directions-progress.js:7-8` (khóa `directions-practice-demo`); `README.md:27` | Đồng bộ `lt:` lên Supabase Postgres (PRD §8.2:478, local-first) | Supabase Free (Postgres): cần tra | 1 |
| 10 | Migration RLS và CAPTCHA chưa áp dụng trên project thật | `README.md:134-136` (migration `0002_table_privileges.sql` chỉ kiểm trên PostgreSQL nhúng); `README.md:137-138` (chưa tích hợp CAPTCHA) | Áp dụng migration lên Supabase Free; Cloudflare Turnstile | Supabase Free, Turnstile: cần tra | 1 |
| 11 | Gia sư Practice: câu hỏi soạn sẵn, quy tắc demo, không có AI | `lib/language-feedback.js:4` ("shortcut: scripted questions... replace checkAnswer/factFor with a server call"); `components/practice-feedback.js:4,11` ("Gia sư demo, chưa kết nối AI"); `content/practice.js:2,33` (câu hỏi và lỗi mẫu) | Groq hoặc OpenRouter (model miễn phí) gọi qua Supabase Edge Function, khóa chỉ ở server; prompt kèm fact sheet | Groq / OpenRouter free: cần tra (giới hạn requests và token theo ngày) | 4 |
| 12 | Hội thoại Talk/Roleplay: nhân vật trả lời theo kịch bản | `lib/roleplay.js:2,4` ("Scripted roleplay engine", "Talk engine (scripted demo)") | Nhận diện lượt học sinh bằng `whisper-tiny.en` trên trình duyệt; phản hồi nhân vật qua Groq/OpenRouter | Groq / OpenRouter free: cần tra | 4 |
| 13 | Điểm Talk là số mẫu, không phải số đo | `content/curriculum/a1-a2.js:2`; `content/curriculum/b1.js:2`; `content/curriculum/b2.js:2`; `content/curriculum/c1.js:2`; `content/curriculum/landmarks.js:4` ("Talk scores are demo values, not measurements") | Chấm phát âm trên trình duyệt bằng `wav2vec2-lv-60-espeak-cv-ft` (ONNX); khi máy yếu, HF ZeroGPU Space có đồng ý của học sinh (PRD §8.2:479) | HF ZeroGPU Space free: cần tra | 5 |
| 14 | Tutor ghi âm và chấm điểm mô phỏng; chưa có chấm phát âm tự động | `lib/tutor.js:2,4` ("Prototype Tutor recording and simulated scoring"); `README.md:120-121` (chưa có nhận diện âm vị tự động) | Như dòng 13 (cùng một giao diện chấm điểm, đổi công cụ được); Kokoro-82M pre-render mẫu giọng (PRD §8.2:480) | HF ZeroGPU / on-device: cần tra | 5 |
| 15 | Bài chỉ đường: bản đồ hư cấu và hội thoại mô phỏng | `components/directions-practice.js:21` ("Bản đồ mô phỏng khu vực Cầu Rồng"); `pages/scenario.js:49,59` ("Xem hội thoại mô phỏng") | Ghi âm trên thiết bị (`lib/directions-recording.js`) và chấm bằng dòng 13–14; bản đồ thật cần chọn nguồn (nguồn bản đồ chưa có trong danh sách cho phép) | Cần tra; nguồn bản đồ: chủ dự án chọn | 5 |
| 16 | Nội dung địa danh là "mẫu", chờ giáo viên duyệt | `content/scenarios.js:2,4` ("mock; fact sheets need teacher verification, PRD R-04"); `pages/learn.js:20` ("Dữ liệu mẫu"); `components/practice-feedback.js:4` ("chờ kiểm duyệt") | Không có dịch vụ; cần giáo viên duyệt fact sheet (không tự đánh dấu đã duyệt, AGENTS §6) | Không áp dụng | 6 (không khớp giai đoạn nào trong 7; nội dung, không phải kỹ thuật) |

## Đã thật sẵn

Chỉ liệt kê những gì tài liệu và mã cho thấy đã kết nối dịch vụ thật. Một số phụ thuộc cấu hình (`README.md:122`), cần kiểm tra trên môi trường triển khai:

- Đăng nhập ẩn danh Supabase khi có cấu hình: `README.md:122`, PRD §8.2:478.
- Nhận diện ảnh bằng model v4 TensorFlow.js chạy trong trình duyệt: `README.md:123`.
- Phát giọng nói bằng API trình duyệt: `README.md:122-123`.
- PWA với manifest và service worker: PRD §8.2:477; `sw.js` (đã sửa trong git).
- Dữ liệu giáo án phát âm 20 bài, IPA từ CMUdict: `README.md:105`.
- Đồng bộ `lt:` local-first lên Supabase khi không ở `?demo`: `lib/cloud/client.js:26`.

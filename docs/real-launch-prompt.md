# Prompt: đưa EchoLạc lên bản thật, chỉ dùng gói miễn phí

Chủ dự án duyệt ngày 26/11/2026. Chạy một giai đoạn mỗi phiên; trạng thái mới nhất ở mục 8 của docs/handoff-codex.md.

SẢN PHẨM CHÍNH THỨC (chủ dự án chốt 26/11/2026): không còn demo, mô phỏng hay dữ liệu thử trong app. Mỗi tính năng hoặc chạy thật, hoặc tắt và ghi "Chưa mở" kèm lý do; không bao giờ hiển thị một kiểm tra giả như thể là thật. Bỏ dữ liệu mẫu (MOCK_*), công tắc xác minh mô phỏng, nút đổi vai Demo và chế độ ?demo; vai trò và xác minh do server quyết định. Project Supabase "EchoLac" (mwzkkiavjqdbdfppvmaz) là project chính thức: chạy migration trên máy (PGlite) trước rồi mới áp lên. Học sinh dưới 18 tuổi gặp mặt và du khách kết nối tạm tắt cho tới khi làm phần email/pháp lý.

THỨ TỰ THỰC HIỆN (chủ dự án chốt 26/11/2026): pháp lý (G2, G3), Resend và mọi luồng email (OTP, đồng ý phụ huynh) để CUỐI CÙNG, chủ dự án sẽ ra lệnh khi làm. Làm trước: 1 (không có email OTP) → 2 → 4 → 5 → 6. Sau đó mới đến 3 và phần email của 1, rồi 7.

VAI TRÒ
Agent điều phối (Claude Code, Opus 5.5 high) đưa EchoLạc từ prototype mô phỏng sang sản phẩm thật cho một đợt thí điểm nhỏ. Đọc AGENTS.md, EchoLac_PRD.md (§5.8, §5.9, §8, §9, §12), README.md, docs/connect-plan.md và docs/real-launch-inventory.md trước khi làm.

RÀNG BUỘC CHI PHÍ: CHỈ GÓI MIỄN PHÍ
- Không dùng dịch vụ trả phí, kể cả trả theo lượng dùng. Ghi giới hạn gói free của từng dịch vụ vào docs/free-tier-limits.md, lấy từ trang giá chính thức hiện hành.
- Chạm giới hạn thì app báo rõ và giảm chức năng; không âm thầm hỏng, không sinh phí.
- Dịch vụ: Supabase Free (Auth, Postgres, Edge Functions), Netlify Free (deploy tự động từ GitHub), Cloudflare Turnstile, Resend Free, HF Space ZeroGPU free, model chạy trên máy (wav2vec2, whisper-tiny.en, Kokoro tạo sẵn), GitHub Free.
- AI hội thoại: adapter ở Edge Function. Ứng viên free: Groq, Cloudflare Workers AI, OpenRouter. Đọc điều khoản dữ liệu hiện hành; loại bên dùng dữ liệu gói free để huấn luyện (có học sinh dưới 18 tuổi). Đề xuất kèm link, chờ chủ dự án duyệt. Không có bên đạt thì giữ roleplay theo kịch bản.
- Cập nhật PRD §8 và §8.4 theo lựa chọn.

NGUYÊN TẮC CỨNG
- Bí mật chỉ ở .env.local và biến môi trường Netlify/Supabase; không vào client, commit, log, chat.
- Quy tắc an toàn thực thi ở server (RLS + Edge Function). lib/connect/policy.js chỉ để hiển thị gợi ý, trùng logic với server, có test đối chiếu.
- Chỉ bỏ nhãn "Mô phỏng" khi bản thật đã chạy và có test.
- Không dùng Fable 5.2 (cần credit). Thay bằng Opus 5.5. Xác thực, phân quyền, an toàn dưới 18 tuổi: Opus 5.5 xhigh. Review bằng model khác model đã viết.
- Tối đa 2 subagent cùng lúc. Khoảng 45% hạn mức tuần thì dừng, ghi bàn giao.
- Không commit, push, deploy khi chủ dự án chưa đồng ý.
- Dùng các connector đã nối (Supabase, Netlify, Cloudflare) thay cho CLI khi được. Làm trên project Supabase thử nghiệm, không đụng production khi chưa qua G4.
- Kiểm tra trình duyệt: đọc DOM (Playwright MCP hoặc Claude in Chrome read_page) trước; chỉ chụp màn hình khi cần xem bố cục.

CỔNG DO CHỦ DỰ ÁN MỞ
G1. Đã có: GitHub, Netlify, Supabase, Cloudflare (connector). Còn cần (miễn phí): Resend, khoá nhà cung cấp AI đã duyệt. Chủ dự án duyệt nhà cung cấp AI.
G2. Pháp lý: quy định dữ liệu cá nhân và trẻ em của Việt Nam cho học sinh dưới 18 tuổi và gặp mặt offline; văn bản đồng ý của nhà trường đối tác.
G3. Mẫu đồng ý phụ huynh và nội quy buổi gặp do nhà trường duyệt.
G4. Đồng ý deploy production.

GIAI ĐOẠN 0: KIỂM KÊ (xong 26/11/2026 → docs/real-launch-inventory.md)

GIAI ĐOẠN 1: TÀI KHOẢN VÀ VAI TRÒ THẬT (Opus 5.5 xhigh)
- Auth: học viên giữ đăng nhập ẩn danh cho phần học; dùng Kết nối phải nâng cấp email OTP (SMTP qua Resend khi có G1; trước đó dùng SMTP mặc định cho thử nghiệm).
- profiles thêm role ('student'|'tourist'|'teacher'|'school_admin'), age_group, verification_status, school_id; cột xác minh/phê duyệt chỉ server hoặc school_admin ghi được; RLS + test chứng minh không tự sửa được.
- Migration 0003_connect.sql: locations (seed từ assets/data/locations*.js), availability, group_sessions (chỉ teacher tạo), connection_requests, blocks, reports, audit_log; RLS từng bảng; rls_check.sql mở rộng 3 danh tính.
- Turnstile cho đăng ký/đăng nhập; giới hạn yêu cầu theo người dùng.
Xong khi: rls_check đạt trên project thử nghiệm và test chứng minh không ai tự cấp verification_status.

GIAI ĐOẠN 2: QUY TẮC KẾT NỐI Ở SERVER (Opus 5.5 xhigh)
- Edge Function connect-request, connect-respond: canConnect bằng TypeScript dùng chung, zod, dữ liệu từ DB, ghi audit_log. RLS chặn ghi trực tiếp connection_requests.
- Thí điểm v1: CHỈ buổi nhóm có giáo viên giám sát do trường tạo; tắt gặp một-một cho mọi người (không có xác minh giấy tờ miễn phí); ghi vào PRD.
- Học sinh dưới 18 tuổi cần phê duyệt của trường và đồng ý của phụ huynh (giai đoạn 3).
- Test đối chiếu policy.js với Edge Function.
Xong khi: không API nào tạo được kết nối trái quy tắc (test từng mã lý do); review Sonnet 5.5 high không còn phát hiện nghiêm trọng.

GIAI ĐOẠN 3: XÁC MINH VÀ ĐỒNG Ý THẬT (Opus 5.5 xhigh; cần G2, G3)
- Trang school_admin: xác minh học sinh, tạo giáo viên, duyệt buổi nhóm, xử lý báo cáo.
- Đồng ý phụ huynh qua email Resend: link một lần có hạn, lưu bằng chứng (thời điểm, phiên bản mẫu), cho thu hồi.
- Du khách v1: xác minh email, vào buổi nhóm bằng mã mời của trường.
Xong khi: học sinh dưới 18 tuổi chỉ vào buổi nhóm sau đủ phê duyệt và đồng ý; thu hồi đồng ý thì bị rút khỏi buổi (có test).

GIAI ĐOẠN 4: AI HỘI THOẠI MIỄN PHÍ (Opus 5.5 medium; cần G1)
Chủ dự án chốt 26/11/2026: Groq làm chính (bật Zero Data Retention trong Data Controls), Cloudflare Workers AI làm dự phòng khi Groq hết hạn mức hoặc trả 429; chọn model có trong gói Workers Free. Không dùng OpenRouter. Khoá đặt làm secret của Edge Function (GROQ_API_KEY, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_AI_TOKEN), chủ dự án tự đặt.
Adapter ở Edge Function, stream văn bản, zod cho JSON; hạn mức thấp hơn giới hạn gói free; 429 hoặc hết hạn mức thì quay về roleplay theo kịch bản; không gửi dữ liệu cá nhân thừa.
Xong khi: một vòng hội thoại thật chạy được; có test cho JSON, hạn mức và đường dự phòng 429.

GIAI ĐOẠN 5: GIỌNG NÓI (Sonnet 5.5 medium)
wav2vec2 trên máy hoặc HF Space ZeroGPU khi người dùng đồng ý; Kokoro tạo sẵn; whisper-tiny.en trên máy; không lưu audio; không Azure.

GIAI ĐOẠN 6: KIỂM THỬ VÀ KIỂM TOÁN
Playwright smoke test (xin trước khi thêm dependency) cho học viên, du khách, giáo viên ở 360 px; kiểm toán bảo mật Opus 5.5 xhigh chỉ đọc; review cuối Sonnet 5.5 high.
Xong khi: check, test, Playwright, rls_check đều đạt; không còn phát hiện nghiêm trọng.

GIAI ĐOẠN 7: TRIỂN KHAI THÍ ĐIỂM (cần G4)
Supabase Free project riêng cho production (ghi cách đánh thức khi bị tạm dừng); biến môi trường trên Netlify; subdomain netlify.app; trang chính sách quyền riêng tư và điều khoản tiếng Việt; quy trình xử lý báo cáo trong 24 giờ; thí điểm một trường.

BÁO CÁO CUỐI MỖI GIAI ĐOẠN (tiếng Việt, ≤300 từ)
Đã làm gì; bằng chứng đã chạy; phần còn mô phỏng; hạn mức free đã dùng; cổng đang chờ; model đã dùng.

# Cài Supabase cho EchoLạc (giai đoạn thử nghiệm)

Áp dụng cho PRD X-01 (tài khoản ẩn danh), §8.2 và §9. App vẫn chạy được không cần Supabase; khi đó mọi dữ liệu chỉ nằm trên máy.

## 1. Tạo bảng và RLS
1. Supabase Dashboard → **SQL Editor** → dán toàn bộ `supabase/migrations/0001_init.sql` → Run. Chỉ chạy một lần trên project mới.
2. Dán toàn bộ `supabase/migrations/0002_table_privileges.sql` → Run. Migration này thu hồi quyền bảng thừa ở project cũ (như TRUNCATE, không chịu RLS), rồi chỉ cấp SELECT/INSERT/UPDATE/DELETE cho `authenticated`; không sửa dữ liệu.
3. Dán `supabase/tests/rls_check.sql` → Run. Phải thấy thông báo `RLS check passed`. Tệp kiểm tra quyền và cách ly hai tài khoản trên cả 5 bảng, tự rollback nên không để lại dữ liệu.

**Project đã chạy 0001:** chỉ áp dụng 0002 rồi chạy lại kiểm tra; không chạy lại 0001.
Trong lượt Codex 22/11/2026, 0002 và bản kiểm tra mở rộng chỉ được chạy trên PostgreSQL
nhúng trong bộ nhớ, chưa áp dụng trên project thật. Kết quả thật của 0001 trong bàn giao
Claude không thay thế việc kiểm tra lại sau 0002.

## 2. Bật đăng nhập ẩn danh
- **Authentication → Sign In / Providers → Anonymous Sign-Ins**: bật.
- Giữ giới hạn tạo tài khoản trong Dashboard và theo dõi thử nghiệm nhỏ. Frontend hiện **chưa có widget CAPTCHA và `captchaToken`**; bật bắt buộc CAPTCHA lúc này sẽ khiến đăng nhập ẩn danh thất bại. Muốn bật, cần tích hợp widget/token và thử lại luồng đăng ký trước. Xem [đăng nhập ẩn danh](https://supabase.com/docs/guides/auth/auth-anonymous) và [CAPTCHA](https://supabase.com/docs/guides/auth/auth-captcha).
- Không cần bật Email hay Google.

## 3. Khoá cho trình duyệt
- **Project Settings → API Keys**: chỉ dùng khoá **publishable** (`sb_publishable_…`). Khoá này công khai theo thiết kế, được RLS bảo vệ.
- **Không bao giờ** dùng khoá `sb_secret_…` hay `service_role` ở client; `scripts/env.cjs` sẽ từ chối chúng.
- Máy local: ghi `SUPABASE_URL` và `SUPABASE_PUBLISHABLE_KEY` vào `.env.local` (git bỏ qua).
- Netlify: Site configuration → Environment variables → đặt hai biến cùng tên. `scripts/build-site.cjs` sinh `config.js` khi build.

## 4. Giới hạn đã biết
- Đổi máy hoặc xoá dữ liệu trình duyệt thì mất liên kết với tài khoản ẩn danh; không khôi phục được.
- Project free bị tạm dừng sau khoảng 1 tuần không dùng; vào Dashboard bấm Restore.
- Không lưu audio: schema không có cột audio và không có storage bucket.
- Đăng xuất xoá liên kết trên máy, không xoá hàng trên server. Khi offline, không bảo đảm thu hồi phiên phía server ngay; JWT đã cấp có thể còn hiệu lực đến khi hết hạn. Không chia sẻ token hay dữ liệu trình duyệt.

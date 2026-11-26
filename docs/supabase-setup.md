# Cài Supabase cho EchoLạc (giai đoạn thử nghiệm)

Áp dụng cho PRD X-01 (tài khoản ẩn danh), §8.2 và §9. App vẫn chạy được không cần Supabase; khi đó mọi dữ liệu chỉ nằm trên máy.

## 1. Tạo bảng và RLS
1. Supabase Dashboard → **SQL Editor** → dán toàn bộ `supabase/migrations/0001_init.sql` → Run. Chỉ chạy một lần trên project mới.
2. Dán toàn bộ `supabase/migrations/0002_table_privileges.sql` → Run. Migration này thu hồi quyền bảng thừa ở project cũ (như TRUNCATE, không chịu RLS), rồi chỉ cấp SELECT/INSERT/UPDATE/DELETE cho `authenticated`; không sửa dữ liệu.
3. Dán `supabase/tests/rls_check.sql` → Run. Phải thấy thông báo `RLS check passed`. Tệp kiểm tra quyền và cách ly hai tài khoản trên cả 5 bảng, tự rollback nên không để lại dữ liệu.

**Project đã chạy 0001:** chỉ áp dụng 0002 rồi chạy lại kiểm tra; không chạy lại 0001.

### Kết nối (0003, PRD R-14 đến R-18)
1. Sau 0001 và 0002: dán toàn bộ `supabase/migrations/0003_connect.sql` → Run. Tệp chạy trong một transaction và chạy lại được; lần sau chỉ cập nhật tên địa điểm, giữ cột `approved`.
2. Nếu dùng hạn mức AI: dán `supabase/migrations/0004_ai_quota.sql` → Run (sau 0003).
   Sau đó dán `supabase/migrations/0005_connect_hardening.sql` → Run (không có DROP, chạy lại được): mỗi cặp du khách–buổi–học sinh chỉ một yêu cầu đang mở, chấp nhận phải còn chỗ (`capacity`), cặp đã chặn bị từ chối và chặn thì huỷ yêu cầu đang mở, `level` do server giữ sau khi xác minh (client đổi thì bị bỏ qua, các cột khác vẫn lưu).
3. Trên môi trường thử nghiệm, chạy `supabase/migrations/0006_ai_privacy.sql` sau 0004 và 0005 để áp trần AI 100 lượt/ngày UTC toàn dự án, ẩn tên tự nhập của du khách trong `safe_profiles` và thu hồi quyền xoá hồ sơ. Ngay sau đó chạy `supabase/migrations/0006_audit_fixes.sql` (không có DROP, chạy lại được): `display_name` bị khoá khi đã xác minh (client đổi thì bị bỏ qua), CHECK `profiles_display_name_safe` cấm tên có từ 6 chữ số, `@` hoặc liên kết (chỉ VALIDATE khi mọi hàng hiện có đạt; nếu `rls_check` báo "display_name CHECK validated" thì sửa các tên vi phạm rồi chạy lại 0006_audit_fixes), và `alter policy own_delete ... using (false)` nếu policy cũ còn sót. Edge Function `converse` mới cần 0006 và kiểm tra cờ `echolac_verified_adult` do máy chủ xác thực quản lý.
   Chạy lại `supabase/tests/rls_check.sql` và xác nhận có `RLS check passed`. Bản kiểm tra gồm du khách, học sinh dưới 18 tuổi, học sinh người lớn, school_admin, giáo viên và trường thứ hai. Khi có 0006, test kiểm tra cả quota dùng chung và quyền trên bộ đếm. Dữ liệu kiểm tra được rollback.
4. 0003 chỉ seed 9 địa điểm (`approved = true`, theo docs/connect-plan.md §1). Không tạo người dùng, trường hay buổi nhóm.
5. Tạo trường rồi sinh mã mời (SQL Editor, vai `postgres`). Mã do server sinh (32 ký tự hex), chỉ hiện một lần; DB chỉ lưu hash. Không tự đặt mã hay ghi hash bằng tay:
   `insert into public.schools (name) values ('<tên trường>') returning id;`
   `select private.new_invite_code('<id trường>');`
6. Người dùng đầu tiên của trường gọi `join_school('<mã mời>')` từ app, rồi chủ dự án nâng thành admin:
   `update public.profiles set role = 'school_admin', verification_status = 'verified', age_group = 'adult' where id = '<uuid>';`
   Từ đó school_admin dùng `school_members`, `school_set_member`, `school_set_minor_approval` và `school_rotate_invite_code`; client không tự sửa được vai trò, xác minh, nhóm tuổi (sau xác minh) hay trường.
7. `join_school` trả `null` khi sai mã và ghi `join_school_failed` vào `audit_log`; sai 5 lần trong 1 giờ thì bị khoá tạm.
8. Từ 0003 client không xoá được hàng `profiles` (xoá rồi tạo lại sẽ mở khoá các cột đã khoá). Xoá tài khoản = service role xoá `auth.users`; cascade xoá dữ liệu kết nối, giữ báo cáo và `audit_log`.
9. `connection_requests` và cột đồng ý phụ huynh trong `minor_approvals` chỉ ghi được bằng service role (Edge Function giai đoạn 2–3). Bảng `schools` chỉ cho client đọc `id, name, created_at`: chọn cột cụ thể, không `select *`.

Lượt 26/11/2026: 0003, 0004 và `rls_check.sql` mở rộng chỉ được chạy trên PostgreSQL nhúng (PGlite 0.3.14) với auth giả lập, **chưa chạy trên project Supabase thật**.
### Edge Function kết nối (giai đoạn 2, connect-plan §2)
`connect-request` và `connect-respond` là đường ghi duy nhất vào `connection_requests`. Logic ở `supabase/functions/_shared/connect.ts` và `connect-policy.ts` (client chỉ giữ gợi ý trạng thái tài khoản trong `lib/connect/policy.js`; test `tests/connect-server.test.cjs`).
1. Cần 0003 và 0005 đã chạy. Không cần secret nào ngoài `SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY` mà Supabase tự cấp cho Edge Function.
2. Deploy (từ thư mục gốc, đã `supabase link`): `supabase functions deploy connect-request` rồi `supabase functions deploy connect-respond`. CLI tự đóng gói `_shared/`. Giữ mặc định **Verify JWT** bật. Nếu deploy bằng connector/Dashboard, gửi kèm `../_shared/connect.ts` và `../_shared/connect-policy.ts`.
3. Kiểm tra sau deploy: gọi không có token → 401 `["auth"]`; gọi bằng token của du khách → 403 `["tourist-not-eligible"]` (v1 chưa xác minh được du khách); mỗi lần gọi có thêm một hàng `connect_request`/`connect_respond` trong `audit_log`.
4. Hợp đồng: POST JSON, header `Authorization: Bearer <JWT người dùng>`, luôn trả `{ ok, reasons, request }`.
   - `connect-request` nhận `{ location_id, session_id, student_id? }`; người gọi là du khách; tạo hàng `pending`, `mode = 'supervised-group'`. Du khách chỉ nhận `tourist-not-eligible`, `location-not-approved`, `session-invalid`, `session-full` hoặc `duplicate-request`: lý do phía học sinh (chưa đủ điều kiện, chờ phê duyệt, chặn, trình độ) gộp thành `session-invalid`; `audit_log` giữ lý do đầy đủ.
   - `connect-respond` nhận `{ request_id, decision }`: `accepted`/`declined` chỉ học sinh của yêu cầu, chỉ khi `pending`; `cancelled`: du khách khi `pending` hoặc `accepted`, học sinh khi `accepted`. `accepted` chạy lại `canConnect` trên dữ liệu mới, gồm cả kiểm tra còn chỗ.
   - Mã lỗi: 400 `request`, 401 `auth`, 403 mã lý do hoặc `wrong-party`, 404 `not-found`, 409 `duplicate-request`/`not-pending`, 429 `rate-limited` (20 lần/giờ/người, đếm từ `audit_log`), 503 `unverifiable` (lỗi DB, luôn từ chối).
5. Giới hạn v1: tắt gặp 1-1 (`one-to-one-disabled`); du khách chưa xác minh được nên mọi yêu cầu bị từ chối tới giai đoạn 3; yêu cầu không có `student_id` chưa ai chấp nhận được (chờ luồng giáo viên); trình độ học sinh giữ nguyên từ lúc xác minh, chỉ service role đổi được (chưa có RPC cho school_admin).

Trong lượt Codex 22/11/2026, 0002 và bản kiểm tra mở rộng chỉ được chạy trên PostgreSQL
nhúng trong bộ nhớ, chưa áp dụng trên project thật. Kết quả thật của 0001 trong bàn giao
Claude không thay thế việc kiểm tra lại sau 0002.

## 2. Bật đăng nhập ẩn danh
- **Authentication → Sign In / Providers → Anonymous Sign-Ins**: bật.
- Giữ giới hạn tạo tài khoản trong Dashboard và theo dõi thử nghiệm nhỏ. Frontend gửi `captchaToken` Turnstile khi đặt `TURNSTILE_SITE_KEY`; chỉ bật bắt buộc CAPTCHA sau khi bản có site key đã deploy, theo danh sách việc trong README (mục Đồng bộ đám mây). Xem [đăng nhập ẩn danh](https://supabase.com/docs/guides/auth/auth-anonymous) và [CAPTCHA](https://supabase.com/docs/guides/auth/auth-captcha).
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

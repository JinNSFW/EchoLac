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
   Chạy lại `supabase/tests/rls_check.sql` (sau 0008) và xác nhận có `RLS check passed`. Bản kiểm tra gồm anon, du khách, học sinh dưới 18 tuổi, học sinh người lớn, admin có MFA (aal2), admin chỉ có mật khẩu (aal1), phiên đã đăng xuất, claim admin cũ/giả và admin bị hạ quyền. Khi có 0006, test kiểm tra cả quota dùng chung và quyền trên bộ đếm. Dữ liệu kiểm tra được rollback (tệp chèn hàng thử vào `auth.users` và `auth.sessions`, nên chỉ chạy trên database dùng thử).
4. 0003 chỉ seed 9 địa điểm (`approved = true`, theo docs/connect-plan.md §1). Không tạo người dùng hay buổi nhóm.
5. Trường, mã mời, giáo viên và school_admin đã bỏ ở 0008 (xem mục Admin bên dưới). Các bảng `schools`, `minor_approvals` vẫn còn (không DROP) nhưng không vai trò API nào chạm tới được.
6. Từ 0003 client không xoá được hàng `profiles` (xoá rồi tạo lại sẽ mở khoá các cột đã khoá). Xoá tài khoản = service role xoá `auth.users`; cascade xoá dữ liệu kết nối, giữ báo cáo và `audit_log`.
7. `connection_requests` chỉ ghi được bằng service role (Edge Function giai đoạn 2–3) và các RPC admin.

Lượt 26/11/2026: 0003, 0004 và `rls_check.sql` mở rộng chỉ được chạy trên PostgreSQL nhúng (PGlite 0.3.14) với auth giả lập, **chưa chạy trên project Supabase thật**.
### Admin toàn cục (0008, PRD R-14 đến R-18)
Chạy `supabase/migrations/0008_admin.sql` sau 0001–0007 (không có câu lệnh DROP, chạy lại được; mệnh đề duy nhất có chữ DROP là `alter column school_id drop not null`, chỉ bỏ ràng buộc NOT NULL). Sau đó chạy lại `rls_check.sql`. Tạo và nâng quyền admin, bật MFA, chạy trang `admin/`: xem README (mục Trang quản trị cục bộ). Lượt 27/11/2026: 0008 và `rls_check.sql` mới chỉ chạy trên PGlite với `auth.jwt()`, `auth.users`, `auth.sessions` giả lập, **chưa chạy trên project thật**.

**Danh tính admin** = `auth.jwt()->'app_metadata'->>'role' = 'admin'` **và** `aal = 'aal2'`, kiểm tra trong `private.is_admin()` (SECURITY DEFINER, `search_path = ''`). Hàm còn đọc lại `auth.users.raw_app_meta_data` và `auth.sessions` (đúng `session_id`, `aal2`, chưa hết hạn), nên hạ quyền, đăng xuất hay gỡ MFA có hiệu lực ngay, không chờ JWT hết hạn. Không bao giờ dùng `user_metadata` (người dùng tự sửa được); `rls_check.sql` thất bại nếu policy hay hàm nào nhắc tới nó.

| Đối tượng | Ai làm được gì |
| --- | --- |
| `profiles` policy `admin_select` | admin aal2 đọc mọi hồ sơ; học viên vẫn chỉ đọc/sửa hàng của mình (`own_*`), `profiles_guard` khoá xác minh, vai trò (chỉ `student`/`tourist`, CHECK `profiles_role_learner`), cột trường, nhóm tuổi/trình độ/tên sau xác minh |
| `group_sessions` policy `admin_select` | admin aal2 đọc; `member_select`, `teacher_insert`, `teacher_update` thành `false`; client không còn quyền INSERT/UPDATE/DELETE |
| `connection_requests`, `reports`, `blocks` policy `admin_select` | admin aal2 đọc tất cả; các bên vẫn chỉ đọc hàng của mình (`party_select`, `own_*`) |
| `admin_audit_log` (bảng mới) | RLS bật; `authenticated` chỉ có SELECT và policy `admin_select`; không vai trò nào có INSERT/UPDATE/DELETE (kể cả service role); trigger `admin_audit_log_immutable` / `_no_truncate` từ chối UPDATE, DELETE, TRUNCATE kể cả vai owner; chỉ các RPC admin ghi |
| `audit_log`, `private.ai_project_usage` policy `admin_select` | không cấp quyền client nào; policy chỉ quyết định ai đọc nếu sau này có cấp, và xoá cảnh báo "RLS Enabled No Policy" |
| `schools`, `minor_approvals` | thu hồi mọi quyền của anon, authenticated, service role; policy thành `using (false)` |
| `join_school`, `school_rotate_invite_code`, `school_members`, `school_set_member`, `school_set_minor_approval`, `private.has_school_role`, `private.new_invite_code` | không vai trò API nào được EXECUTE |
| `private.is_admin()` | EXECUTE chỉ cho `authenticated` (để policy gọi); trả `true` chỉ với admin aal2 |
| `public.is_admin_account(uuid)` | chỉ service role (Edge Function kiểm tra người giám sát) |
| `public.admin_set_learner(user, verification, level, age_group)` | admin aal2: xác minh học viên `student`/`tourist`, đặt trình độ, nhóm tuổi (đã xác minh phải có nhóm tuổi); ghi nhật ký kèm giá trị cũ |
| `public.admin_create_session(location, starts, ends, capacity)` | admin aal2: tạo buổi tại địa điểm đã duyệt, thời gian trong tương lai, sức chứa 1–50; người tạo là người giám sát |
| `public.admin_close_session(session)` | admin aal2: đóng buổi đang lên lịch, huỷ các yêu cầu đang mở của buổi |
| `public.admin_resolve_report(report, status)` | admin aal2: đặt báo cáo `reviewed` hoặc `closed` |
| `private.connection_requests_guard` | không còn kiểm tra trường; buổi nhóm cần người tạo là admin; học sinh dưới 18 luôn bị từ chối (`student-awaiting-approval`) vì chưa có luồng phê duyệt |

Mỗi RPC admin là SECURITY DEFINER, `search_path = ''`, gọi `private.is_admin()` trước tiên (sai thì lỗi 42501) và ghi một hàng `admin_audit_log` trong cùng transaction. anon không EXECUTE được hàm nào trong số này.

**Ngoại lệ Security Advisor (chủ dự án đã duyệt):**
- *Anonymous Access Policies* (0012) trên các bảng có policy `to authenticated`: học viên dùng đăng nhập ẩn danh (PRD X-01), mọi policy giới hạn theo `auth.uid()` hoặc `private.is_admin()`, nên tài khoản ẩn danh chỉ thấy hàng của mình. Policy `admin_select` mới cũng có thể bị liệt kê vì cùng lý do.
- *Signed-In Users Can Execute SECURITY DEFINER Function* (0029) cho `safe_profiles` và bốn RPC `admin_*` (có thể cả `private.is_admin`): phải gọi được qua API; mỗi hàm tự kiểm tra bên trong (`private.is_admin()` hoặc `auth.uid()`). Các RPC trường cũ không còn bị liệt kê sau 0008.
- *Leaked Password Protection Disabled*: chỉ có ở gói Pro. Giảm thiểu: mật khẩu tối thiểu 12 ký tự có chữ hoa, chữ thường, số và ký hiệu (Authentication → Passwords), chỉ chủ dự án tạo tài khoản email, và MFA TOTP bắt buộc cho mọi thao tác admin (aal2 kiểm tra ở database).
- Mọi cảnh báo khác phải sạch; chạy lại Advisors sau khi áp dụng 0008.

**Tài khoản email:** bật provider Email chỉ để admin đăng nhập. Vì đăng nhập ẩn danh vẫn cần cho học viên, Supabase có thể vẫn cho tự đăng ký email qua API; tài khoản như vậy không có quyền gì thêm (quyền admin chỉ đến từ `app_metadata` do chủ dự án đặt bằng SQL). Không có màn đăng ký admin trong app nào.

### Edge Function kết nối (giai đoạn 2, connect-plan §2)
`connect-request` và `connect-respond` là đường ghi duy nhất vào `connection_requests`. Logic ở `supabase/functions/_shared/connect.ts` và `connect-policy.ts` (client chỉ giữ gợi ý trạng thái tài khoản trong `lib/connect/policy.js`; test `tests/connect-server.test.cjs`).
1. Cần 0003 và 0005 đã chạy. Không cần secret nào ngoài `SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY` mà Supabase tự cấp cho Edge Function.
2. Deploy (từ thư mục gốc, đã `supabase link`): `supabase functions deploy connect-request` rồi `supabase functions deploy connect-respond`. CLI tự đóng gói `_shared/`. Giữ mặc định **Verify JWT** bật. Nếu deploy bằng connector/Dashboard, gửi kèm `../_shared/connect.ts` và `../_shared/connect-policy.ts`.
3. Kiểm tra sau deploy: gọi không có token → 401 `["auth"]`; gọi bằng token của du khách → 403 `["tourist-not-eligible"]` (v1 chưa xác minh được du khách); mỗi lần gọi có thêm một hàng `connect_request`/`connect_respond` trong `audit_log`.
4. Hợp đồng: POST JSON, header `Authorization: Bearer <JWT người dùng>`, luôn trả `{ ok, reasons, request }`.
   - `connect-request` nhận `{ location_id, session_id, student_id? }`; người gọi là du khách; tạo hàng `pending`, `mode = 'supervised-group'`. Du khách chỉ nhận `tourist-not-eligible`, `location-not-approved`, `session-invalid`, `session-full` hoặc `duplicate-request`: lý do phía học sinh (chưa đủ điều kiện, chờ phê duyệt, chặn, trình độ) gộp thành `session-invalid`; `audit_log` giữ lý do đầy đủ.
   - `connect-respond` nhận `{ request_id, decision }`: `accepted`/`declined` chỉ học sinh của yêu cầu, chỉ khi `pending`; `cancelled`: du khách khi `pending` hoặc `accepted`, học sinh khi `accepted`. `accepted` chạy lại `canConnect` trên dữ liệu mới, gồm cả kiểm tra còn chỗ.
   - Mã lỗi: 400 `request`, 401 `auth`, 403 mã lý do hoặc `wrong-party`, 404 `not-found`, 409 `duplicate-request`/`not-pending`, 429 `rate-limited` (20 lần/giờ/người, đếm từ `audit_log`), 503 `unverifiable` (lỗi DB, luôn từ chối).
5. Giới hạn v1: tắt gặp 1-1 (`one-to-one-disabled`); du khách chưa được admin xác minh thì mọi yêu cầu bị từ chối; yêu cầu không có `student_id` chưa ai chấp nhận được; trình độ học sinh giữ nguyên từ lúc xác minh, chỉ admin (`admin_set_learner`) hoặc service role đổi được. Người giám sát buổi là admin đã tạo buổi: hàm kiểm tra gọi `rpc/is_admin_account` (chỉ service role) và trigger kiểm tra lại; admin bị hạ quyền thì buổi của họ không nhận chấp nhận mới (`session-invalid`).

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

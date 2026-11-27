# Local Guide Connect: kế hoạch triển khai và brief cho agent

> **27/11/2026:** trường, mã mời, giáo viên, school_admin và trạng thái `supervised-only` đã bỏ. Admin toàn cục làm từ trang cục bộ `admin/` (migration 0008, PRD §5.9 R-14). Các đoạn nói về trường/giáo viên bên dưới là lịch sử; nguồn chuẩn là PRD và `docs/supabase-setup.md`.

Nguồn yêu cầu: spec "EchoLạc – Local Guide Connect & Learning Experience" do chủ dự án đưa ngày 26/11/2026.
Tệp này là hợp đồng chung. Mỗi agent chỉ làm phần của mình và dùng đúng tên hàm, khoá dữ liệu bên dưới.
Prototype tĩnh, không có backend kết nối: mọi kiểm tra an toàn là **mô phỏng trên thiết bị** và phải được ghi nhãn như vậy.

## 1. Quyết định đã chốt (không đổi)

- Giữ app hiện có. Không đổi stack, không dựng lại.
- Địa điểm được duyệt = danh sách `LOCS` hiện có (data/locations.js, lấy từ assets/data/locations*.js). Dùng nguyên tên, mô tả, ảnh `referenceImages[0].url` (thiếu thì nền `bg`). Không thêm địa điểm.
- Vai trò lưu ở `S.connect.role` (`'student'` | `'tourist'`), mặc định `'student'`. `?role=tourist` trong URL đặt vai lúc tải (demo). Đổi vai trong Hồ sơ, có nhãn "Demo".
- Thanh điều hướng theo vai:
  - Học sinh: Học `#home` | Nhập vai (menu trượt lên, giữ nguyên) | Kết nối `#connect` | Hồ sơ `#profile`. Gia sư và Bản đồ lỗi vẫn mở từ lối tắt ở Trang chủ.
  - Du khách: Khám phá `#discover` | Kết nối `#connections` | Hồ sơ `#profile`.
- Du khách không bao giờ thấy bài học, Gia sư, tiến độ học. Router chuyển mọi view không thuộc du khách về `#discover`. Học sinh mở view của du khách thì chuyển về `#connect`.
- Bảng màu: dùng token sẵn có (`--navy`, `--primary`, `--accent`, `--card-blue`, `color-mix`). Không thêm bảng màu mới.
- Khẩu hiệu: "Learn Locally. Connect Globally." hiện ở màn chọn vai trong Hồ sơ và đầu trang Khám phá.

## 2. Quy tắc an toàn (nguồn thật nằm ở lib/connect/policy.js)

`Cho phép kết nối = Địa điểm được duyệt AND Du khách đủ điều kiện AND Học sinh đủ điều kiện AND Có giám sát/phê duyệt khi cần`.
Thiếu dữ liệu hoặc không xác minh được thì coi là **không**. Ẩn nút không phải là bảo vệ: mọi hành động đều gọi lại `canConnect` ngay lúc thực hiện.

Trạng thái tài khoản (`accountEligibility(user).status`):
- `eligible`: `ageGroup === 'adult'` và `verified === true`.
- `supervised-only`: học sinh `minor`, `verified === true`, `approvals.school === true` và `approvals.guardian === true`. Chỉ được tham gia buổi nhóm có giám sát.
- `awaiting-approval`: học sinh `minor`, `verified === true`, thiếu một trong hai phê duyệt.
- `not-eligible`: mọi trường hợp còn lại (chưa xác minh, thiếu tuổi, du khách dưới 18).

`canConnect({ tourist, student, locationId, mode, sessionId, blocks })` trả `{ ok, reasons }`. Mã lý do (dùng đúng chuỗi):
`location-not-approved`, `tourist-not-eligible`, `student-not-eligible`, `student-awaiting-approval`, `minor-one-to-one-blocked`, `session-invalid`, `not-available`, `blocked`, `level-below-minimum`, `unverifiable`.
- `mode` là `'one-to-one'` hoặc `'supervised-group'`.
- Học sinh `minor` chỉ được `supervised-group` với `sessionId` thuộc `student.groupSessions`, đúng `locationId`, có `supervisor`.
- `one-to-one` cần học sinh `eligible` và có lịch rảnh tại `locationId` (`student.availability[locationId]` không rỗng).
- `blocks` là mảng id; nếu một bên nằm trong đó thì `blocked`.
- Trình độ tối thiểu A2 (`level-below-minimum`).
- Ném lỗi bất kỳ thì trả `{ ok: false, reasons: ['unverifiable'] }`.

Ghép cặp `matchStudents(tourist, locationId, students, blocks)` trả mảng `{ student, mode, sessionId, score, distance }` chỉ gồm ca `canConnect` đạt. Điểm = 3 × số sở thích trùng + 2 × (có lịch rảnh tại địa điểm) + 1 × (khu vực gần địa điểm). Xếp theo điểm giảm dần rồi theo `id`. Không xếp theo trình độ cao nhất. `distance` là nhãn gần đúng (`'< 2 km'`, `'2–5 km'`, `'> 5 km'`) tính từ tâm quận, không bao giờ là toạ độ.

## 3. Hợp đồng dữ liệu và hàm

`data/connect-mock.js` (dữ liệu mô phỏng):
- `CONNECT_INTERESTS = ['history', 'food', 'architecture', 'crafts', 'nature', 'festivals']` kèm nhãn vi/en trong `CONNECT_INTEREST_NAMES`.
- `LOCATION_TAGS = { '<location id>': [interest, …] }` cho mọi id trong `LOCS`.
- `CONNECT_AREAS = { 'hai-chau': { vi, en, lat, lng }, 'son-tra': …, 'ngu-hanh-son': …, 'hoi-an': … }` (tâm quận, chỉ để tính nhãn khoảng cách).
- `CONNECT_SLOTS = ['sat-am', 'sat-pm', 'sun-am', 'sun-pm', 'weekday-pm']` kèm nhãn.
- `MOCK_STUDENTS`: 6 học sinh, đủ các ca: người lớn đã xác minh, người lớn chưa xác minh, `minor` đủ hai phê duyệt có `groupSessions`, `minor` mới có một phê duyệt, trình độ A1, một người có lịch rảnh ở nhiều địa điểm. Trường: `id, name, ageGroup, verified, level, interests, area, availability, approvals, groupSessions: [{ id, locationId, slot, supervisor }]`. Không có số điện thoại, email hay toạ độ.
- `MOCK_TOURISTS`: 3 du khách (người lớn đã xác minh, người lớn chưa xác minh, du khách `minor`). Trường: `id, name, country, ageGroup, verified, interests`.

`data/connect-state.js` (trạng thái và hành động):
- `S.connect` lưu ở khoá `lt:connect`, mặc định `{ role: 'student', tourist: {…}, student: {…}, requests: [<2 yêu cầu mẫu tới học sinh>], blocks: [], reports: [] }`. `tourist` và `student` là tài khoản của chính người dùng ở mỗi vai, id `'me-tourist'` và `'me-student'`, tên lấy từ `S.user.name`, `verified: false` ban đầu (bật được bằng công tắc "Xác minh (mô phỏng)").
- `saveConnect()`, `connectPerson(id)` tìm trong `me-*`, `MOCK_STUDENTS`, `MOCK_TOURISTS`.
- `sendRequest({ studentId, locationId, mode, sessionId })`: chỉ khi `S.connect.role === 'tourist'`; người gửi là `S.connect.tourist`. Gọi `canConnect`. Trả `{ ok, reasons, request }`.
- `respondRequest(requestId, decision)`: chỉ khi `role === 'student'` và yêu cầu gửi tới `'me-student'`. `'accepted'` phải gọi lại `canConnect`; `'declined'` luôn được.
- `cancelRequest(requestId)`, `blockUser(id)`, `reportUser(id, reason)`.
- Yêu cầu: `{ id, touristId, studentId, locationId, mode, sessionId, status: 'pending'|'accepted'|'declined'|'cancelled'|'blocked', createdAt }`.

`lib/connect/policy.js`: `approvedLocation(id)`, `accountEligibility(user)`, `canConnect(args)`, `matchStudents(…)`, `distanceLabel(areaId, locationId)`. Hàm thuần, không đụng DOM.

## 4. Brief cho từng agent

### A. PRD (Sonnet 5.5, medium)
Sửa `EchoLac_PRD.md`: thêm mục 5.9 "Local Guide Connect" (hai vai, hành trình, quy tắc §2 nguyên văn logic, bảo vệ dưới 18, ghép cặp, riêng tư, tiêu chí nghiệm thu dạng bảng như §5.8), bảng C.6 thêm thanh điều hướng theo vai, mục an toàn §9 ghi rõ bản prototype chỉ mô phỏng và yêu cầu thực thi phía server (Supabase RLS/Edge Function) trước khi dùng với người thật, rủi ro mới ở §12, nâng phiên bản 1.6. Giữ mã yêu cầu cũ; đặt mã mới `R-14`, `R-15`… không trùng.

### B. Logic an toàn + dữ liệu + test (Opus 5.5, high)
Viết `data/connect-mock.js`, `lib/connect/policy.js`, `data/connect-state.js` theo §2–§3, và `tests/connect.test.cjs` (dùng `tests/helpers/runtime.cjs`) phủ bảng chân trị: mỗi mã lý do có ít nhất một ca; minor 1-1 luôn bị chặn kể cả đủ phê duyệt; đổi địa điểm không vượt được chặn; đổi vai không cho học sinh gửi yêu cầu; accept gọi lại kiểm tra (đổi `verified` sau khi gửi thì accept bị chặn); `matchStudents` không trả người bị chặn/không đủ điều kiện và ổn định thứ tự. Thêm test vào `package.json` script `test`. Thêm ba script vào `index.html` ngay sau `data/locations.js` theo thứ tự mock → policy → state (kiểm tra thứ tự phụ thuộc thực tế). Không sửa UI.

### C. Giao diện (Opus 5.5, medium)
Dùng hợp đồng §3, không tự viết lại logic an toàn. Việc:
- `lib/router.js`: `TABS` theo vai; chặn view theo vai như §1; giữ menu Nhập vai cho học sinh.
- `pages/discover.js` (`#discover`): khẩu hiệu, lưới địa điểm ảnh lớn (tối đa 3–5 thông tin mỗi thẻ).
- `pages/spot.js` (`#spot/<locationId>`): chi tiết địa điểm; nếu `approvedLocation` sai thì báo và quay về. Danh sách từ `matchStudents`; thẻ học sinh: tên, trình độ, sở thích trùng, khoảng cách gần đúng, nhãn trạng thái; nút gửi yêu cầu gọi `sendRequest` và hiển thị lý do bị chặn bằng câu dễ hiểu. Học sinh dưới 18 chỉ hiện dưới dạng "Buổi nhóm có giám sát".
- `pages/connections.js` (`#connections`, du khách): danh sách yêu cầu và trạng thái, huỷ, chặn, báo cáo.
- `pages/connect.js` (`#connect`, học sinh): ba phần: trạng thái an toàn (nhãn `eligible` = "Đủ điều kiện", `supervised-only` = "Đủ điều kiện cho hoạt động có giám sát", `awaiting-approval` = "Đang chờ phê duyệt", `not-eligible` = "Chưa đủ điều kiện kết nối offline"); lịch rảnh theo địa điểm được duyệt và `CONNECT_SLOTS`; yêu cầu đến với chấp nhận/từ chối qua `respondRequest`.
- `pages/profile.js`: thẻ "Vai trò (Demo)" đổi vai; thẻ "An toàn & quyền riêng tư": nhóm tuổi, công tắc xác minh mô phỏng, phê duyệt trường/phụ huynh mô phỏng (chỉ hiện khi minor), danh sách đã chặn, câu "Không chia sẻ vị trí chính xác, số điện thoại hay email". Mọi công tắc mô phỏng ghi rõ "Mô phỏng – không phải xác minh thật".
- Bốn khái niệm tách bạch trên giao diện: xem địa điểm công khai / tìm người dùng / gửi yêu cầu / đủ điều kiện gặp offline.
- CSS trong `styles/connect.css` (import trong `styles.css`), mỗi tệp ≤ 300 dòng, song ngữ qua `V()`, bàn phím dùng được, khổ 360 px.
- Thêm script mới vào `index.html` đúng thứ tự (pages sau components). Cập nhật test cũ nếu nav đổi.

### D. Review (Sonnet 5.5, high; khác model đã viết)
Đọc diff. Tìm đường vượt quy tắc §2 (đổi vai, đổi địa điểm, gọi hàm trực tiếp, dữ liệu thiếu), nhãn mô phỏng bị thiếu, du khách thấy nội dung học, lộ toạ độ/liên hệ. Báo tối đa 10 phát hiện, xếp theo mức nặng, kèm tệp:dòng.

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

Mở `http://127.0.0.1:4173`. Thêm `?demo` để vào tài khoản mẫu, hoặc `?demo&test`
để chạy chẩn đoán độ tương phản và nhận diện trong console. Không cần `npm install`.
Máy chủ phát triển chỉ phục vụ tệp ứng dụng, tài nguyên và model.
Trong **Trang chủ → Luyện tập: Đà Nẵng**, bộ câu hỏi tải khi mở mục này và lưu lượt
đang làm trong trình duyệt. Khi đổi nội dung ngân hàng, tăng `pack.version` trong JSON
để tiến trình cũ không bị áp vào đáp án mới.
Nếu PowerShell chặn `npm.ps1`, thay `npm` bằng `npm.cmd` trong các lệnh dưới đây và lệnh khởi động.

```sh
npm run check
npm test
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
Tài khoản là **ẩn danh** (PRD X-01): không email, không mật khẩu; đổi máy hoặc xoá dữ liệu
trình duyệt thì mất liên kết. Cài bảng và RLS xem [docs/supabase-setup.md](docs/supabase-setup.md).
Mã đồng bộ ở `lib/cloud/`: hàng đợi `lt:sync-queue`, ghi máy trước rồi đẩy lên khi có phiên.
Chế độ `?demo` không tạo phiên hay gửi dữ liệu lên Supabase. Hồ sơ, nơi đã chọn,
giọng đọc và đồng ý gửi giọng nói được đồng bộ; chỉ báo thành công sau xác nhận của cloud.
Ngày sinh đầy đủ và giới tính ở trên máy; cloud chỉ nhận năm sinh. Các hàm đồng bộ
mục lỗi đã có, nhưng điểm và tiến độ luyện nói hiện vẫn là dữ liệu demo, chưa phải
vòng học phát âm Đợt 1. Đăng xuất yêu cầu xác nhận, xoá dữ liệu `lt:` trừ ngôn ngữ;
không xoá hồ sơ trên server hay bảo đảm huỷ ngay một request server đã nhận.
Thu hồi đồng ý gửi giọng nói có hiệu lực trên máy ngay; bản cloud được cập nhật khi có mạng.
PWA: `manifest.webmanifest`, `sw.js` (không cache tài nguyên khác domain, `config.js`,
API, POST hay request âm thanh dạng range), `lib/pwa.js`. Cache chỉ chứa tệp ứng dụng
công khai; cập nhật service worker chỉ xoá cache cũ có tiền tố `echolac-`.
Khi service worker cài thành công, nó tải sẵn HTML, script, CSS và icon theo
`pwa-shell.json` được sinh bởi build/máy chủ local. Ảnh cảnh, model và tài nguyên bài học
lớn vẫn tải theo nhu cầu; chưa tải trước thì không bảo đảm dùng offline. Cài PWA cần
HTTPS hoặc localhost; gợi ý thêm vào Màn hình chính
có trên iOS. `?test` bỏ qua đăng ký service worker. Khi đổi tệp app, tăng `VERSION` trong `sw.js`.

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
Khi đổi phiên bản thư viện CDN trong `lib/camera/model.js`, cập nhật lại hash `integrity`. Khi train lại model, xuất sang `model/` bằng `model v3/diagnosis/export_tfjs.py model` (cách cài ghi ở đầu tệp) và chạy lại `eval.py` cạnh đó. Các kiểm thử kiểm tra render của 16 màn hình bằng hai ngôn ngữ,
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
| `content/curriculum/` | Chương trình học Đà Nẵng A1–C1 (PRD R-13): kịch bản lấy từ giáo án, và `landmarks.js` gồm bài riêng cho từng lớp của model camera; có nguồn, chưa được xác minh |
| `content/pronunciation/` | Dữ liệu giáo án phát âm (PRD §6): 20 bài A1–C1, IPA từ CMUdict; dữ liệu ghi đã được Giáo viên A duyệt ngày 22/11/2026 theo bàn giao. Chưa có giao diện lộ trình phát âm. Tài liệu: `docs/giao-an-phat-am.md` (tạo tự động từ cùng dữ liệu) |
| `lib/` | Điều hướng, giọng nói, luyện tập và xử lý nhận diện camera |
| `lib/camera/` | Model, GPS, so khớp, chụp ảnh và quét liên tục |
| `styles/` | CSS theo nhóm chức năng, được nhập theo đúng thứ tự trong `styles.css` |
| `assets/` | Logo, minh hoạ, dữ liệu địa danh gốc. `assets/icons/{ui,lesson,place}/` và `assets/landmarks/` là icon nét do nhóm vẽ, tô màu theo theme bằng CSS mask (`components/icons.js`); `assets/scenes/<theme>/` là 26 ảnh cảnh 2.5D làm nền khi chọn địa điểm |
| `model/` | Model nhận diện v4 (TF.js, 5 địa danh) chạy trên thiết bị; script đánh giá và xuất model ở `model v3/diagnosis/` |
| `scripts/`, `tests/` | Máy chủ phát triển và các bước kiểm tra |

Các script dùng chung phạm vi toàn cục để giữ tương thích với sự kiện inline của
prototype và cách triển khai tĩnh hiện tại. Khi thêm tệp, khai báo nó trong
`index.html` trước `app.js`; tái sử dụng helper có sẵn trước khi tạo helper mới.
Giữ thứ tự import CSS để tránh thay đổi cascade. Mỗi tệp ứng dụng tối đa 300 dòng.

## Giới hạn hiện tại

Hội thoại và điểm luyện nói vẫn là demo; đăng nhập là tài khoản ẩn danh Supabase thật khi có cấu hình. Phát giọng nói dùng trình duyệt;
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
trên điện thoại trước nghiệm thu. Frontend chưa tích hợp CAPTCHA; không bật yêu cầu
CAPTCHA khi chưa thêm widget/token (xem hướng dẫn Supabase).

## Bộ sinh giáo án phát âm

`content/pronunciation/` và `docs/giao-an-phat-am.md` được tạo bằng `tools/pronunciation/` (Python 3, không cần thư viện ngoài); không sửa tay hai nơi này.

```
python -I tools/pronunciation/fetch_data.py   # tải CMUdict + CEFR-J vào .cache/ (không commit)
python -I tools/pronunciation/build_pron.py   # kiểm tra và ghi lại JSON + giáo án
python -I tools/pronunciation/build_pron.py --reviewed-by "Tên" --reviewed-at 2026-11-22
```

Dữ liệu viết tay nằm ở `tools/pronunciation/authored/`; `reviewedBy`/`reviewedAt` lưu ở đó để lần build sau giữ nguyên. Chỉ dùng hai cờ `--reviewed-*` khi giáo viên thật đã duyệt (AGENTS.md §6).

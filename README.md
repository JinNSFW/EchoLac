# EchoLạc

Prototype web mobile-first luyện nói tiếng Anh theo tình huống văn hoá địa phương.
Bản được Netlify phục vụ hiện là HTML/CSS/JavaScript thuần, không cần build.
`EchoLac_PRD.md` xác định tính năng; `AGENTS.md` quy định cách tổ chức và triển khai.

## Chạy và kiểm tra

Cài Node.js 20 trở lên, rồi chạy tại thư mục dự án:

```sh
npm start
```

Mở `http://127.0.0.1:4173`. Thêm `?demo` để vào tài khoản mẫu, hoặc `?demo&test`
để chạy chẩn đoán độ tương phản và nhận diện trong console. Không cần `npm install`.
Máy chủ phát triển chỉ phục vụ tệp ứng dụng, tài nguyên và model.
Nếu PowerShell chặn `npm.ps1`, thay `npm` bằng `npm.cmd` trong các lệnh dưới đây và lệnh khởi động.

```sh
npm run check
npm test
```

`check` kiểm tra cú pháp JavaScript, đường dẫn tài nguyên và giới hạn 300 dòng của
các tệp ứng dụng.

## Triển khai

Netlify chạy `node scripts/build-site.cjs`, chép đúng các tệp công khai của ứng dụng
(trang, script, CSS, `assets/`, `model/`) vào `dist/` và ghi tệp `_headers`.
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
| `content/curriculum/` | Chương trình học Đà Nẵng A1–C1 (PRD R-13): kịch bản lấy từ giáo án, có nguồn, chưa được xác minh |
| `lib/` | Điều hướng, giọng nói, luyện tập và xử lý nhận diện camera |
| `lib/camera/` | Model, GPS, so khớp, chụp ảnh và quét liên tục |
| `styles/` | CSS theo nhóm chức năng, được nhập theo đúng thứ tự trong `styles.css` |
| `assets/` | Logo, minh hoạ và dữ liệu địa danh gốc |
| `model/` | Model nhận diện v3 (TF.js, 4 địa danh) chạy trên thiết bị; mã nguồn và chẩn đoán ở `model v3/` |
| `scripts/`, `tests/` | Máy chủ phát triển và các bước kiểm tra |

Các script dùng chung phạm vi toàn cục để giữ tương thích với sự kiện inline của
prototype và cách triển khai tĩnh hiện tại. Khi thêm tệp, khai báo nó trong
`index.html` trước `app.js`; tái sử dụng helper có sẵn trước khi tạo helper mới.
Giữ thứ tự import CSS để tránh thay đổi cascade. Mỗi tệp ứng dụng tối đa 300 dòng.

## Giới hạn hiện tại

Hội thoại, đăng nhập và điểm luyện nói vẫn là demo. Phát giọng nói dùng trình duyệt;
nhận diện ảnh dùng model v3 thật (TensorFlow.js), tải thư viện từ CDN khi cần.
Thông tin địa danh vẫn cần giáo viên xác minh. Không xem số liệu mẫu là kết quả
nghiên cứu hoặc điểm đo thực tế.

Next.js, TypeScript, Supabase, Claude, Azure Speech và PWA là kiến trúc đích theo
PRD. Đợt sắp xếp này giữ nguyên prototype; chưa chuyển sang kiến trúc đó.
Thư mục `app/` là bản Next.js riêng đang bị Git bỏ qua; không thuộc bản triển khai tĩnh.
Khóa dịch vụ chỉ được đặt phía server theo `.env.example` và `AGENTS.md`.

# AGENTS.md — Quy tắc làm việc của agent

Tệp này quy định cách agent làm việc trong kho EchoLạc: tiếp nhận yêu cầu, chọn model, dùng công cụ, sửa mã, kiểm tra và báo cáo. Đặc tả sản phẩm nằm trong [EchoLac_PRD.md](EchoLac_PRD.md).

## 1. Phân định tài liệu

| Tài liệu | Nguồn chuẩn cho nội dung nào |
| --- | --- |
| `AGENTS.md` | Quy tắc cho agent, phân công model, quy trình, công cụ, tiêu chuẩn sửa mã và xác minh |
| `EchoLac_PRD.md` | Vấn đề, người dùng, mục tiêu, tính năng, phạm vi, hành vi sản phẩm, thiết kế, công nghệ đích và lộ trình |
| `README.md` | Cách chạy, cấu trúc mã hiện tại, lệnh kiểm tra và giới hạn triển khai |

- Trước khi làm việc, đọc hướng dẫn áp dụng, phần PRD liên quan và mã hiện có.
- Khi đổi yêu cầu sản phẩm, cập nhật PRD và tiêu chí nghiệm thu; không tạo một bản đặc tả khác trong AGENTS.
- Khi đổi cách agent làm việc, cập nhật AGENTS; không đưa quy tắc phân công agent vào PRD.
- Giữ nguyên mã yêu cầu như `R-01`, `T-04`, `E-05`, `X-03`; dẫn mã trong commit và chú thích khi cần giải thích một quy tắc.
- Nếu tài liệu mâu thuẫn, đối chiếu chỉ thị trực tiếp mới nhất của người dùng và nguồn chuẩn theo bảng trên; nêu mâu thuẫn chưa giải quyết thay vì tự đổi phạm vi.

## 2. Tiếp nhận yêu cầu và thực thi

- **Quy tắc soạn prompt trước (theo quy ước của chủ dự án):** khi người dùng đưa một ý tưởng hoặc yêu cầu ngắn gọn, **không làm yêu cầu đó ngay**. Thay vào đó:
  1. Đóng vai chuyên gia của lĩnh vực liên quan và viết một **câu lệnh (prompt) thật chi tiết**, đủ hướng dẫn, góc độ tiếp cận và định dạng đầu ra.
  2. Đặt toàn bộ prompt trong **một hộp mã** để người dùng bấm "Copy code".
  3. Nếu cần thêm thông tin để prompt tốt hơn, hỏi **tối đa 3 câu ngắn gọn** sau hộp mã.
- Chỉ khi người dùng gõ **HÃY THỰC THI PROMPT NÀY** mới thực hiện và viết bài hoàn chỉnh. Ngoại lệ: người dùng đã chỉ thị rõ làm trực tiếp và bỏ qua bước soạn prompt; khi đó thực thi trong phạm vi được giao, không yêu cầu họ lặp lại chỉ thị.
- Phân biệt yêu cầu lập kế hoạch với yêu cầu triển khai. Một kế hoạch không có nghĩa tính năng hoặc thí nghiệm đã được thực hiện.
- Kiểm tra `git status` trước khi sửa; giữ các thay đổi sẵn có của người dùng. Không tự commit, push, triển khai hoặc ghi đè tài liệu gốc khi chưa được giao.
- Ưu tiên thay đổi vừa đủ để hoàn thành yêu cầu. Không tự chuyển stack, thêm tính năng hoặc nâng ưu tiên sản phẩm từ việc chỉnh tài liệu hay refactor.

## 3. Phân công model

Quy tắc do chủ dự án lập ngày **11/11/2026**. Đây là chính sách phân công nội bộ, không phải bảng đánh giá năng lực, giá dịch vụ hoặc xác nhận model đang khả dụng.

| Công việc | Model | Mức suy luận |
| --- | --- | --- |
| Lập kế hoạch tính năng, kế hoạch dự án, PRD | GPT-6 Astra | high |
| Xây dựng tính năng đã có kế hoạch | GPT-6.1 Sol | medium |
| Frontend UI thông thường | GPT-6.1 Sol | medium |
| UI phức tạp, cần rà soát kỹ | GPT-6.1 Sol | xhigh |
| Xác thực và thanh toán | GPT-6.1 Sol | xhigh |
| Tìm kiếm mã nguồn, tra cứu và kiểm kê tài liệu | GPT-6 Luna | low |
| Đổi tên và mã khung lặp lại | GPT-6 Luna | low |
| Viết kiểm thử theo kế hoạch | GPT-6.1 Sol | low |
| Lỗi khó | GPT-6.1 Sol | xhigh; max cho lỗi đặc biệt khó |
| Kiểm toán bảo mật | GPT-6 Astra | xhigh |
| Review mã nguồn | GPT-6.1 Sol | high; xhigh khi rủi ro hoặc độ phức tạp cao |

- Chọn đúng loại việc; chỉ tăng mức suy luận khi có lý do cụ thể. Không tự đổi model vì tiện dụng.
- Markdown không tự chuyển model của phiên. Chỉ báo đã dùng model/mức suy luận khi môi trường thực sự xác nhận.
- Nếu cấu hình yêu cầu không có trong môi trường, nêu giới hạn và cách tiếp tục; không tuyên bố đã chạy cấu hình đó.
- Bảng này dành cho **agent phát triển**. Model của nhân vật và Tutor bên trong ứng dụng thuộc [PRD §8](EchoLac_PRD.md#technology).
- Hàng về thanh toán không mở rộng phạm vi sản phẩm; phạm vi vẫn theo [PRD §3](EchoLac_PRD.md#product-scope).

### Agent chuyên trách

- Chỉ giao việc cho sub-agent khi tác vụ và chỉ thị áp dụng thực sự cần; bảng model không yêu cầu tự tạo sub-agent cho mọi việc.
- Vai trò tìm kiếm: `.codex/agents/code-searcher.toml`, ưu tiên `gpt-6-luna`, `low`, chỉ đọc.
- Vai trò review: `.codex/agents/reviewer.toml`, ưu tiên `gpt-6.1-sol`, `xhigh`, chỉ đọc.
- Kiểm tra tệp có tồn tại, schema cấu hình của phiên bản Codex đang dùng và khả năng model trước khi kích hoạt. Tên đường dẫn ở đây không có nghĩa vai trò đã được tạo hoặc đăng ký.

## 4. Công cụ và skill

- Tìm kiếm mã và tên tệp bằng `rg`/`rg --files` trước; loại trừ thư mục phụ thuộc và đầu ra build khi phù hợp.
- Dùng công cụ chuyên dụng hoặc connector có sẵn khi đáp ứng tác vụ; dùng trình duyệt/điều khiển máy tính khi cần xác minh giao diện.
- Khi tác vụ cần skill có sẵn, đọc `SKILL.md` tương ứng và các hướng dẫn bắt buộc, rồi áp dụng đúng phạm vi. Không coi mọi skill là bắt buộc cho mọi việc.
- Kiểm tra model, SDK, cấu hình hay dịch vụ bằng tài liệu chính thức khi cần thông tin hiện hành. Không suy diễn khả năng công cụ từ tên của nó.
- Không ghi thông tin nhạy cảm vào lệnh, log, ảnh chụp hay đầu ra chat. Tuân thủ sandbox và quyền truy cập hiện có.
- Nêu rõ khi công cụ không kết nối hoặc một bước chưa thể kiểm chứng; không báo hoàn thành chỉ vì đã gọi công cụ.

## 5. Tổ chức và sửa mã

- **Tìm trước khi viết:** tái sử dụng màn hình, component và helper đã có.
- Màn hình ở `pages/`; thành phần dùng chung ở `components/`; lưu/đọc dữ liệu ở `data/`; nội dung ở `content/`; xử lý dùng chung ở `lib/`; CSS theo nhóm ở `styles/`.
- Mỗi tệp mã một trách nhiệm và không quá **300 dòng**; tách trước khi vượt giới hạn. PRD và tài liệu dài không chịu giới hạn số dòng của mã nguồn.
- Cách chạy và cấu trúc đang triển khai xem `README.md`. Công nghệ đích xem [PRD §8](EchoLac_PRD.md#technology). Không coi kiến trúc đích là mô tả dịch vụ đã kết nối.
- Với prototype tĩnh, giữ thứ tự script `defer` trong `index.html`, phạm vi dùng chung cho sự kiện inline và thứ tự import trong `styles.css`.
- Không tự sửa thư mục sandbox bị Git bỏ qua hoặc chuyển sang Next.js chỉ để đạt hình thức cấu trúc. Khi được giao chuyển stack, dùng App Router theo PRD và tách trách nhiệm tương đương.

## 6. Quy tắc triển khai kỹ thuật

- Tuân thủ tiêu chí chức năng trong [PRD §5](EchoLac_PRD.md#functional-requirements), taxonomy §6 và chấm điểm [§7](EchoLac_PRD.md#assessment); không giữ bản sao ngưỡng, trọng số hoặc hành vi sản phẩm trong tệp này.
- Ở kiến trúc TypeScript đích, tập trung ngưỡng và trọng số trong `lib/scoring/constants.ts`, có mã yêu cầu/đoạn PRD bên cạnh. Giữ chấm điểm, mastery, CEFR và lịch SRS thành hàm thuần có kiểm thử.
- Dùng enum đóng cho taxonomy đã quy định trong PRD; tránh chuỗi phân loại tùy ý rải rác.
- Với kiến trúc đích, dùng `zod` ở ranh giới tin cậy: request, JSON từ LLM và phản hồi speech service. Phản hồi có cấu trúc dùng tool use, xác thực xong mới lưu.
- Fact sheet đích đặt trong `content/scenarios/`; giữ trạng thái xác minh và nguồn nội dung. Không tự đánh dấu đã được giáo viên duyệt.
- Tái sử dụng một component/context cho AI Tutor companion theo PRD; không tạo các Tutor độc lập mất ngữ cảnh.
- Với i18n đích, chuỗi giao diện đặt trong `messages/vi.json` và `messages/en.json`; dùng `next-intl` theo stack đích. Khi chưa chuyển stack, bảo toàn cách chuyển ngôn ngữ hiện có và ghi rõ giới hạn.
- Điều chỉnh tốc độ/giọng đọc bằng thiết lập TTS; không đổi prompt nhân vật để mô phỏng các thiết lập đó.
- Để đạt mục tiêu độ trễ của PRD, stream văn bản, hiện phụ đề ngay khi nhận và phát TTS theo từng câu.

### Theme và tài nguyên giao diện

- Màu sắc, theme, onboarding và splash là yêu cầu sản phẩm trong [PRD Phụ lục C](EchoLac_PRD.md#product-ui). Không chép bảng màu sang AGENTS.
- Trong prototype, `THEMES` tại `app.js` là nguồn cấu hình theme duy nhất: `icon`, `name`, `scene`, `c`, `frame`, `pattern` tùy chọn, `land()`, `fx()`.
- `installThemes()` sinh các khối `:root[data-theme]`; `applyTheme()` đặt `data-theme` trên `<html>`. Không tạo bảng màu riêng cho từng theme trong CSS.
- Dùng token `var(--navy)`, `var(--primary)`, `var(--accent)` và `color-mix()`; chỉ cố định màu semantic và logo theo ngoại lệ của PRD.
- Chữ/icon trắng dùng nền `--navy` hoặc `--navy-2`; không dùng `--primary` làm nền chữ trắng.
- `.bg` phủ toàn chiều cao trang; `.fx-layer` cố định theo màn hình; cả hai nằm dưới nội dung với `z-index: -1`. Hiệu ứng chỉ animate `transform` và `opacity` và tôn trọng reduced motion.
- Thêm theme bằng một mục trong `THEMES`, rồi chạy chẩn đoán `?test` và kiểm tra tương phản theo PRD.
- Bảo toàn khóa lưu `lt:` khi refactor; chỉ lưu lựa chọn preview theo thời điểm PRD quy định.
- Sau khi sửa logo, xuất lại SVG bằng `logoSVG('x', C.bronze, C.gold)` trong `echolac-logo.html` và cập nhật các ảnh xuất liên quan.
- Vị trí splash hiện tại: markup trong `index.html`, CSS trong `styles/splash.css`, logic trong `components/splash.js`. Nếu sửa hoặc bỏ splash theo yêu cầu, cập nhật đủ ba phần.

## 7. Bí mật và an toàn khi phát triển

- Khóa Claude, Azure và Supabase service role chỉ nằm trong biến môi trường phía server; `.env.example` chỉ liệt kê tên, không chứa giá trị thật.
- Không đưa khóa thật vào mã client, tài liệu, commit, ảnh chụp, log hoặc chat. Dịch vụ có khóa bí mật phải được gọi qua server function; trình duyệt chỉ nhận Azure token ngắn hạn và khóa Supabase `anon` theo thiết kế RLS.
- Trước khi chia sẻ hoặc push, quét các mẫu `sk-ant-`, `AZURE`, `service_role`, `Bearer `; phân biệt tên biến/placeholder hợp lệ với bí mật thật và không in giá trị nhạy cảm.
- Nếu phát hiện lộ khóa, ưu tiên thu hồi ở nhà cung cấp rồi thay khóa; xóa tệp không đủ. Nếu không có quyền thu hồi, báo người dùng và không tuyên bố đã xử lý xong.
- Các yêu cầu sản phẩm về consent, RLS, phạm vi lớp học, âm thanh, vị trí, quảng cáo và giới hạn chi phí nằm trong [PRD §9](EchoLac_PRD.md#privacy) và §8.4; phải kiểm tra khi triển khai phần liên quan.

## 8. Xác minh và báo cáo

- Đối chiếu acceptance criteria của PRD trước khi kết luận tính năng hoàn thành; kiểm tra các trạng thái loading, empty, error, hai ngôn ngữ và các kích thước thiết bị liên quan.
- Prototype hiện có: `npm run check` và `npm test`; trên PowerShell bị chặn `npm.ps1`, dùng `npm.cmd` tương ứng. Cách chạy chi tiết nằm trong `README.md`.
- Khi stack đích được triển khai, chạy lint, typecheck, Vitest cho logic và Playwright smoke test của vòng học. Không báo các bước chưa được cấu hình hoặc chưa chạy là đã đạt.
- Chọn kiểm thử theo rủi ro và thay đổi. Với refactor, xác minh hành vi cũ, dữ liệu lưu và đường dẫn tài nguyên được bảo toàn; với thay đổi tài liệu, kiểm tra liên kết, mã yêu cầu và thông tin không bị mất.
- Đánh giá UI theo tiêu chí trong PRD; không coi DOM giả lập là kiểm tra trực quan hoặc quyền camera/micro trên thiết bị thật.
- Báo kết quả cụ thể: tệp/phần đã đổi, bằng chứng xác minh và giới hạn còn lại. Phân biệt rõ demo, mock, kết nối thật và số đo thực tế.


## 9. Duy trì hai nguồn chuẩn

- Yêu cầu mới về **sản phẩm làm gì** → sửa PRD.
- Quy tắc mới về **agent phải làm việc thế nào** → sửa AGENTS.
- Hướng dẫn vận hành phản ánh **mã đang chạy ra sao** → sửa README.
- Dùng liên kết chéo thay cho sao chép toàn bộ đặc tả giữa các tệp.


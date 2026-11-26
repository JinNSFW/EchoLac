# Phân tích openkoto cho EchoLạc

Ngày phân tích: 14/11/2026. Nguồn: [github.com/hikariming/openkoto](https://github.com/hikariming/openkoto). Tài liệu dựa trên README, cây thư mục, đặc tả SRS và mã của các màn hình chính; chưa chạy thử ứng dụng.

Mục đích: giúp nhóm quyết định nên học gì từ openkoto để làm **bản đồ lỗi**, **bài bổ trợ theo điểm yếu** và **lộ trình cá nhân hoá** cho EchoLạc.

## Kết luận nhanh

- openkoto (tên cũ TextLingo) là ứng dụng **đọc và học từ vựng từ nội dung người học tự chọn**, không phải ứng dụng luyện nói.
- openkoto **không có bản đồ lỗi nói** và **chưa có hệ thống bài tập cá nhân hoá**. README tự ghi mục này là *"Coming Soon: Personalized vocabulary and grammar exercise system"*.
- Phần đáng học nhất là **ôn tập ngắt quãng theo FSRS** và **màn hình thống kê**. Cả hai áp được cho mục ôn lỗi trong Tutor (PRD T-06) và mở rộng Radar (PRD E-06).
- Giấy phép có điều kiện riêng, và thiết kế tương tác được tuyên bố bảo hộ kiểu dáng. Nên **học ý tưởng, tự viết lại**, không chép giao diện hay mã.

## 1. Cấu trúc sản phẩm

| Phần | Thư mục | Công nghệ | Vai trò |
| --- | --- | --- | --- |
| Desktop | `textlingo-desktop/` | Tauri, React, Rust | Bản chính: đọc tài liệu, dịch, video, sổ từ |
| iOS | `openkoto-ios/` | Swift, SwiftUI | Đọc, video có phụ đề, ôn từ, thống kê |
| Web | `apps/web/` | React, TypeScript | Đang làm lại: ôn từ, tiểu thuyết, lời bài hát |
| CLI, MCP, agent skill | `apps/cli/`, `apps/mcp/`, `skills/openkoto/` | Node | Cho AI agent đọc và ghi thư viện của người học |
| Core | `packages/core/` | TypeScript | Thuật toán FSRS dùng chung |

## 2. Chức năng

1. **Nhập nội dung:** URL, PDF, EPUB, TXT, Word, Markdown, lời bài hát (LRC), YouTube, video và audio kèm phụ đề SRT/VTT. Sách được tự chia chương.
2. **Đọc nhập vai:** trình đọc sách và PDF, dịch tức thì, tra từ, phân tích ngữ pháp. Furigana và pinyin được tạo ngay trên máy.
3. **Trợ lý AI:** giải thích từ theo ngữ cảnh, giải thích ngữ pháp, hỏi đáp về đoạn văn đã chọn. Người dùng dùng khóa API của riêng mình (BYOK). Có thêm chế độ agent vẽ sơ đồ tư duy.
4. **Video và luyện nghe:** theo dõi phụ đề từng câu, lặp một câu, đổi tốc độ mà giữ cao độ, **shadowing nghe mù** (nghe rồi nói theo), tự tạo phụ đề trên máy.
5. **Sổ từ và ôn tập:**
   - Thẻ từ được gom thành gói từ.
   - Lịch ôn dùng **FSRS-6**; mỗi thẻ lưu độ ổn định, độ khó và ngày đến hạn.
   - Ôn kiểu lật thẻ: người học **tự chấm 3 mức** (không nhớ / mơ hồ / nhớ), quy sang Again / Hard / Good của FSRS.
   - Thẻ trả lời sai được ôn lại ngay trong ngày. Ôn hết thì có thể "ôn trước" các thẻ sắp đến hạn.
   - Có giới hạn số thẻ mới và số lượt ôn mỗi ngày.
6. **Thống kê** (`StatisticsView.swift`, `StudyStatistics.swift`):
   - ô tổng quan và huy hiệu (chuỗi ngày học, số từ đã thu thập);
   - hoạt động mỗi ngày (thẻ mới và thẻ ôn);
   - phân bố trạng thái thẻ và phân bố mức tự chấm;
   - dự báo số thẻ đến hạn những ngày tới;
   - tỉ lệ nhớ và thời gian đọc mỗi ngày.
   Mọi số liệu đi qua hàm thuần, ngày không có dữ liệu được điền 0 để biểu đồ đều nhau.
7. **Cách làm kỹ thuật đáng học:** một đặc tả chung cho mọi nền tảng (`docs/specs/vocabulary-srs-spec.md`), cùng golden test (`docs/specs/fixtures/fsrs_golden_v1.json`) để bản Rust, Swift và TypeScript cho cùng kết quả.
8. **Khác:** đồng bộ đám mây, đăng nhập, gói trả phí (bản miễn phí giới hạn 50 lượt CLI/MCP mỗi ngày), giao diện tiếng Anh, Trung, Nhật.

## 3. Đối chiếu với nhu cầu của EchoLạc

| Nhu cầu | openkoto | Ghi chú |
| --- | --- | --- |
| Biểu đồ lỗi phát âm và ngữ pháp | Không có | Chỉ có thống kê ôn từ. Radar 4 tiêu chí của EchoLạc đã đi xa hơn |
| Bài tập theo điểm yếu | Chưa có | README ghi "Coming Soon"; EchoLạc phải tự thiết kế |
| Đánh giá trình độ, bỏ qua bài thấp | Không có | Không có bài xếp lớp hay CEFR |
| Ôn tập ngắt quãng | Có (FSRS-6) | Áp cho mục lỗi trong Tutor, đúng PRD T-06 |
| Thống kê và dự báo đến hạn | Có | Mẫu tốt để mở rộng Radar (PRD E-06) |
| Shadowing, lặp câu | Có (iOS) | Gợi ý cho bài bổ trợ phát âm |
| Chấm phát âm bằng máy | Không có | openkoto chỉ đọc mẫu bằng TTS; EchoLạc cần Azure Speech |

## 4. Giấy phép

Giấy phép là Apache 2.0, kèm các điều kiện riêng:

- không gỡ hay sửa logo và thông tin bản quyền ở giao diện;
- không vận hành dịch vụ nhiều người thuê (multi-tenant) khi chưa có giấy phép thương mại;
- tác giả tuyên bố thiết kế tương tác được bảo hộ kiểu dáng.

Khuyến nghị:

- Học ý tưởng rồi tự viết lại. Không sao chép giao diện hay mã nguyên văn.
- FSRS là thuật toán công khai. Có thể dùng thư viện `ts-fsrs` (giấy phép MIT), hoặc tự triển khai theo đặc tả.
- Nếu có dùng mã gốc nào, ghi nguồn và giấy phép trong tệp `THIRD_PARTY_NOTICES`.

## 5. Những gì nên học và áp dụng

1. **Nhật ký lượt luyện lỗi.** Mỗi lần người học luyện một lỗi, lưu thời điểm, mã lỗi, điểm 0–100, mức quy đổi 1–4 và kịch bản nguồn.
2. **Lịch ôn lỗi bằng FSRS** thay cho hàng đợi cố định. Giữ luật thành thạo T-05 (đạt từ 80 điểm ở hai ngày khác nhau).
3. **Thống kê kiểu openkoto cho Radar:**
   - số lỗi mới và lượt ôn mỗi ngày;
   - phân bố lỗi theo 8 nhóm phát âm (PRD §6) và nhóm ngữ pháp;
   - trạng thái lỗi (mới / đang luyện / thành thạo);
   - số lỗi đến hạn trong 7 ngày tới;
   - xu hướng điểm theo từng nhóm.
4. **Bài bổ trợ theo điểm yếu,** lấy cảm hứng từ shadowing và lặp câu: từ có âm khó, cặp từ tối thiểu, câu ngắn lặp lại, rồi một lượt nhập vai ngắn dùng các từ đó.
5. **Đặc tả và golden test dùng chung,** để sau này bản web và server chấm giống nhau.

## 6. Ba quyết định nhóm cần chốt

| # | Câu hỏi | Gợi ý |
| --- | --- | --- |
| 1 | Học ý tưởng rồi xây trong EchoLạc, hay fork openkoto làm nền? | **Học ý tưởng, xây trong EchoLạc.** Fork phải gánh cả một app đọc sách viết bằng Swift/Tauri cùng ràng buộc giấy phép, trong khi phần cần lại là phần openkoto chưa có |
| 2 | Đánh giá trình độ dựa trên gì, và bài thấp hơn trình độ thì xử lý ra sao? | **Bài xếp lớp 2–3 phút, hiệu chỉnh qua 2–3 phiên đầu.** Bài thấp hơn trình độ chỉ gắn nhãn "có thể bỏ qua", kèm bài kiểm tra nhanh để bỏ qua; không ẩn hẳn, vì điểm chưa được hiệu chuẩn |
| 3 | Bài bổ trợ do AI sinh ngay, hay tạm sinh bằng quy tắc? | **Tạm sinh bằng quy tắc** từ bản đồ lỗi và từ vựng của chương trình học, ghi rõ là demo. Nối Claude khi có server, dùng tool use và kiểm tra dữ liệu bằng zod |

## 7. Giới hạn của bản phân tích

- Chỉ đọc mã nguồn và tài liệu, chưa cài hay chạy thử openkoto.
- Mô tả giao diện dựa trên mã, chưa xem ảnh chụp màn hình.
- Thông tin giấy phép lấy từ tệp `LICENSE` tại thời điểm phân tích; cần đọc lại trước khi dùng bất kỳ mã nào.

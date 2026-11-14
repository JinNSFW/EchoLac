# Rà soát phần camera: lỗ hổng và cách cải thiện

Ngày: 14/11/2026. Đối tượng đọc: nhóm EchoLạc (dev, người train model, người viết PRD, người duyệt nội dung).
Bổ sung cho [camera-v3-diagnosis.md](camera-v3-diagnosis.md). Trong tài liệu này, "Đã xác minh" nghĩa là đã chạy thật và có kết quả; "Giả thuyết" nghĩa là suy ra từ mã hoặc tài liệu, chưa đo.

## Tóm tắt: 6 rủi ro lớn nhất

1. **Model gán bừa ảnh lạ vào 4 lớp.** 5/10 ảnh tượng **Cá chép hoá Rồng**, đặt ngay cạnh Cầu Rồng, bị nhận là **Tượng Quan Âm** với độ tự tin 0.79–0.97, vượt qua cả luật ngưỡng lẫn luật chênh lệch. Model đã học lớp Quan Âm thành "tượng trắng". Ngưỡng không chặn được lỗi này; chỉ có lớp `khac` mới chặn được. *(Đã xác minh)*
2. **Chế độ quét trực tiếp không đối chiếu GPS.** Chế độ chụp ảnh có GPS chặn lại: ảnh cá chép kèm GPS ở Cầu Rồng ra trường hợp C (mâu thuẫn), app không mở bài. Chế độ quét chỉ dựa vào ảnh, nên người học là chốt chặn cuối cùng. *(Đã xác minh)*
3. **Con số 88,9% và ngưỡng 0.75 đều đo trên cùng 36 ảnh.** Kết quả "0 ảnh nhận sai" vì vậy là lạc quan. Chưa có bộ validation riêng, chưa kiểm tra rò rỉ train/test. *(Đã xác minh về quy trình)*
4. **Demo 6 ("Model thật") đã hỏng với v3.** GPS mẫu đặt ở Hội An và gợi ý chụp Chùa Cầu, hai nơi v3 không biết. **Đã sửa.**
5. **Nguồn ảnh train/test lệch khỏi PRD.** Ảnh tải từ web còn watermark (GiaHuy.org, VCV, Vietsense…), trong khi PRD §12 và dòng 616 yêu cầu nguồn có giấy phép. Model lại được phát công khai trên Netlify. *(Đã xác minh có watermark trong bộ test; chưa thấy bộ train)*
6. **Chưa thử trên điện thoại thật**: tốc độ, bộ nhớ, Safari iOS, mạng yếu. Mọi kiểm tra mới chỉ làm trên Chrome máy tính. *(Chưa kiểm tra)*

## 1. Hai đường đi của camera

```
QUÉT TRỰC TIẾP (#camera, lib/camera/scan.js)
 video ─► cắt vuông giữa khung hình ─► model (5 hình/giây) ─► ngưỡng 0.75 + chênh lệch 0.2
       ─► giữ ổn định 800 ms ─► CAM.map (nhãn → bài) ─► bảng "Có thể là …" ─► người học bấm "Bắt đầu nói"
       (KHÔNG có GPS)

CHỤP ẢNH (#locate → #cam, lib/camera/capture.js)
 GPS ─► gpsMatch (địa danh trong bán kính) ───────────────┐
 ảnh chụp/chọn ─► cắt vuông ─► model ─► imageMatch (0.75 + 0.2) ─► crossValidate (A–F) ─► chỉ trường hợp A/B tự mở bài
```

| Điểm khác | Quét trực tiếp | Chụp ảnh |
| --- | --- | --- |
| Đối chiếu GPS | Không | Có (trường hợp A–F) |
| Ánh xạ nhãn | `CAM.map`: nhãn → **bài học** | `labelLoc`: nhãn → **địa danh** |
| Nhãn không có bài (Quan Âm) | Báo "Chưa có bài" | Mở trang địa danh |
| Khung hướng dẫn | Ô vuông 72vw, đặt ở 44% chiều cao | Khung chữ nhật dọc |
| Vùng model thực sự nhận | Ô vuông lớn nhất, ở giữa khung hình | Ô vuông lớn nhất, ở giữa ảnh |

## 2. Danh sách phát hiện

Mức độ:
- **NT** (nghiêm trọng): mở sai bài hoặc thông tin sai, vi phạm pháp lý.
- **Cao**: hỏng tính năng hoặc demo.
- **TB**: trung bình.
- **Thấp**.

Chi phí: S ≤ 2 giờ, M ≤ 2 ngày, L > 2 ngày.

### Đã sửa hôm nay

| Mã | Góc nhìn | Mức | Phát hiện | Bằng chứng | Đã làm |
| --- | --- | --- | --- | --- | --- |
| CAM-01 | ML, người học | NT | Ảnh lạ, đặc biệt là tượng khác, bị nhận là Quan Âm | 5/10 ảnh Cá chép hoá Rồng (Commons, CC BY-SA) bị nhận ≥ 0.79. Chrome: ảnh `d03` + GPS ở Cầu Rồng ra trường hợp C, không mở bài | **Mới giảm nhẹ**: nhãn quét đổi thành "Có thể là …", thêm nút "Không phải nơi này", ghi chú demo nói thật về giới hạn. **Muốn sửa tận gốc phải train lớp `khac`** (CAM-10) |
| CAM-03 | Demo | Cao | Demo 6 đặt GPS ở Hội An và gợi ý ảnh Chùa Cầu, model v3 không bao giờ khớp | `components/camera-demo.js` | Chuyển GPS mẫu sang Cầu Rồng, sửa gợi ý. Chrome: ảnh Sông Hàn ra trường hợp C, như mong đợi |
| CAM-04 | Người học | Cao | Quét Sông Hàn hoặc APEC hiện tên bài "Những công trình có câu chuyện" thay vì tên nơi; APEC lại hiện fact của Sông Hàn | `lib/camera/scan.js`, nhãn và `recognised()` | Hiện tên địa danh và mô tả của chính nơi đó, kèm dòng "Bài học: …". Chrome: bảng kết quả hiện đúng "Công viên APEC" |
| CAM-05 | Sản phẩm | Cao | Ghi chú nói "nơi khác sẽ ra không nhận diện được", điều này sai | So với CAM-01 | Viết lại cho đúng sự thật |
| CAM-06 | Tiếp cận (a11y) | Cao | Vùng `aria-live` của nhãn quét bị ghi lại 5 lần/giây, trình đọc màn hình đọc liên tục | `scan.js` | Chỉ cập nhật khi nội dung đổi; phần trăm đặt `aria-hidden`. *Chưa thử với VoiceOver/TalkBack* |
| CAM-07 | Debug, hiệu năng | TB | Lần dự đoán đầu tiên phải biên dịch shader WebGL, nên khung hình đầu bị đứng | Trên Chrome máy tính: 3 ảnh đầu mất 19 giây, gồm cả thời gian tải | Chạy "khởi động" model bằng một ảnh rỗng ngay trong lúc màn hình đang báo tải. *Chưa đo trên điện thoại* |
| CAM-08 | Debug | TB | Không có kiểm thử nào bắt lỗi lệch giữa nhãn model, địa danh và bài học | — | Thêm kiểm thử: mọi nhãn có địa danh, mọi lớp trong `CAM.map` trỏ tới bài có thật (8/8 đạt) |

Đã sửa ở phiên trước (xem camera-v3-diagnosis.md):
- lỗi C2: lớp không tìm thấy bị gán mặc định vào index 2;
- thêm `khac` vào danh sách lớp nền;
- áp luật chênh lệch 20% cho cả hai luồng;
- xuất model sang TF.js, khớp với Keras 36/36;
- bỏ `unsafe-eval` khỏi CSP;
- sửa răng cưa khi thu nhỏ ảnh.

### Chưa sửa: việc của nhóm

| Mã | Góc nhìn | Mức | Phát hiện | Bằng chứng | Trạng thái | Đề xuất | Chi phí |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CAM-02 | Sản phẩm | NT | Quét trực tiếp mở bài chỉ dựa vào ảnh | `scan.js`, không gọi GPS | Đã xác minh | Ngắn hạn: giữ nút "Không phải nơi này" (đã thêm). Dài hạn: nếu người học cho phép GPS thì dùng GPS để hạ điểm các nơi ở xa, như luồng chụp ảnh | M |
| CAM-09 | ML | Cao | Ngưỡng được chọn trên chính bộ ảnh báo cáo | camera-v3-diagnosis §3 | Đã xác minh | Chia 3 phần: train / validation (chọn ngưỡng) / test (chỉ báo cáo). Không chỉnh ngưỡng theo bộ test | S |
| CAM-10 | ML | Cao | Chưa có lớp `khac` (PRD C-01, C-04 yêu cầu) | `labels.txt` có 4 lớp | Đã xác minh | Thu ảnh "khác" ở **ngay gần** các địa danh: tượng Cá chép hoá Rồng, cầu Trần Thị Lý, cầu Thuận Phước, đường Bạch Đằng, người, xe, quán ăn. Đo tỉ lệ nhận nhầm ảnh lạ | M |
| CAM-11 | ML | Cao | Cầu Rồng chụp xa chỉ đúng 5/8 | camera-v3-diagnosis | Đã xác minh | Thêm 40–60 ảnh chụp xa, từ trên cao, ban ngày và ban đêm | M |
| CAM-14 | Pháp lý, ML | Cao | Ảnh tải từ web còn watermark. Model lại được phát công khai | Bộ test có logo GiaHuy.org, VCV, Vietsense, TD, chữ "CẦU QUAY SÔNG HÀN" | Đã xác minh (test) / Giả thuyết (train) | (a) Ghi nguồn từng ảnh trong `sources.csv`; ưu tiên ảnh nhóm tự chụp và ảnh CC (Commons). (b) Có thể model đã "học watermark": cắt hoặc che watermark rồi chạy lại `eval.py` để kiểm tra | M |
| CAM-12 | Người học | TB | Khung hướng dẫn trên màn hình không khớp vùng model nhận. Tượng cao (Quan Âm) đặt trong khung dọc có thể bị cắt đầu và chân | `styles/camera.css:55`, `styles/scanner.css:5`, cách cắt trong `model.js` | Đã xác minh hình học / Giả thuyết về ảnh hưởng | Cắt ảnh theo đúng vùng khung trên màn hình, hoặc đổi khung thành ô vuông nằm giữa | M |
| CAM-13 | ML | TB | `keras.utils.load_img`, `image_dataset_from_directory` và `PIL.Image.open` bỏ qua thông tin xoay EXIF; trình duyệt thì áp dụng. Ảnh điện thoại trong bộ train có thể đang bị nằm ngang | Ảnh Commons `ca_chep_train_003` hiện nằm ngang khi mở bằng PIL | Đã xác minh cơ chế; bộ test không bị | Gọi `ImageOps.exif_transpose(img)` khi dựng dataset | S |
| CAM-15 | Sản phẩm | TB | Quét Sông Hàn hoặc APEC luôn mở bài B1 kể cả với người học A1; Quan Âm chưa có bài | `CAM.map` | Đã xác minh | Mỗi địa danh cần ít nhất một bài A1–A2; viết bài Quan Âm khi có fact đã được xác minh | M |
| CAM-16 | Giáo viên | TB | 3 địa danh mới chưa được xác minh; Quan Âm chưa có fact; tọa độ là ước lượng | `assets/data/locations-danang.js` | Đã xác minh | Giáo viên duyệt; đo tọa độ thật trên bản đồ | S |
| CAM-17 | Người học | TB | Chưa thử trên điện thoại | — | Chưa kiểm tra | Thử trên ít nhất 1 Android tầm thấp và 1 iPhone (Safari): thời gian tải 6 MB trên 4G, độ trễ mỗi khung hình, nóng máy, quyền camera | S |
| CAM-22 | ML | TB | Bộ test lệch lớp (15 APEC / 4 Quan Âm). Độ chính xác tổng bị APEC kéo lên | `labels.csv` | Đã xác minh | Báo **recall theo từng lớp**; mỗi lớp ít nhất 30 ảnh test | S |
| CAM-23 | Debug | Thấp | Predict.py dùng ngưỡng 0.2, không có luật chênh lệch, không đọc `.avif`. Công cụ của nhóm và app chấm theo hai luật khác nhau | `model v3/Predict.py` | Đã xác minh | Dùng `diagnosis/eval.py`, cùng luật với app | S |
| CAM-18 | Debug | Thấp | Model của luồng chụp ảnh nằm trong bộ nhớ suốt phiên | `model.js` | Giả thuyết | Giải phóng khi rời màn hình camera | S |
| CAM-19 | Debug | Thấp | Self-test vẫn dùng nhãn Teachable Machine cũ, in cảnh báo vào console | `lib/self-test.js` | Đã xác minh | Đổi sang nhãn v3 | S |
| CAM-24 | Product owner | TB | PRD §10.2 chưa có chỉ số nào cho tính năng camera | PRD §10.2 | Đã xác minh | Thêm: tỉ lệ nhận đúng trên ảnh thực địa, tỉ lệ nhận nhầm ảnh lạ, tỉ lệ người học bấm "Không phải nơi này", thời gian từ mở camera tới bắt đầu bài | S |

## 3. Lỗ hổng kiến thức

| Khái niệm | Vì sao quan trọng với EchoLạc | Đọc thêm |
| --- | --- | --- |
| Softmax không phải độ chính xác (calibration) | Model nói 0.97 với tượng cá chép. Softmax chỉ cho biết "giống lớp nào nhất trong 4 lớp", không cho biết "có đúng không" | Guo et al., *On Calibration of Modern Neural Networks* (2017), arxiv.org/abs/1706.04599 |
| Tập đóng và tập mở (open-set / OOD) | Model chỉ biết 4 lớp nên mọi ảnh đều bị gán vào 1 trong 4. Cần lớp `khac` hoặc phát hiện ảnh lạ | Hendrycks & Gimpel, *A Baseline for Detecting Misclassified and Out-of-Distribution Examples* (2017), arxiv.org/abs/1610.02136 |
| Shortcut learning | Model có thể học "tượng trắng" thay vì "Quan Âm", "sông và thành phố" thay vì "trụ tháp Sông Hàn", hoặc học luôn watermark | Geirhos et al., *Shortcut Learning in Deep Neural Networks* (2020), arxiv.org/abs/2004.07780 |
| Chia train / validation / test và rò rỉ dữ liệu | Chọn ngưỡng trên bộ test sẽ làm kết quả đẹp hơn thực tế. Ảnh web trùng nhau giữa các bộ cũng vậy | Google ML Crash Course, *Dividing the original dataset*: developers.google.com/machine-learning/crash-course/overfitting/dividing-datasets |
| Precision, recall và ngưỡng | Với 36 ảnh, cần nhìn recall từng lớp, không chỉ độ chính xác tổng | Google ML Crash Course, *Classification*: developers.google.com/machine-learning/crash-course/classification |
| Khoảng tin cậy cho mẫu nhỏ | 32/36 có khoảng tin cậy 75–96%. Đổi 1–2 ảnh là con số đã thay đổi đáng kể | "Binomial proportion confidence interval", mục Wilson score interval |
| Grad-CAM | Công cụ xem model nhìn vào đâu; dùng sau mỗi lần train lại | Selvaraju et al., *Grad-CAM* (2017), arxiv.org/abs/1610.02391 |
| Tiền xử lý phải khớp giữa train và app | Cắt hay kéo giãn, thuật toán thu nhỏ, xoay EXIF, dải giá trị 0–255: sai một bước là kết quả lệch mà không báo lỗi | Tài liệu Keras `image_dataset_from_directory`; Pillow `ImageOps.exif_transpose`; TensorFlow.js *Model conversion* (tensorflow.org/js/guide/conversion) |
| Lệch phân phối dữ liệu (dataset shift) | Ảnh web đẹp, đã chỉnh màu, chụp góc rộng. Khung hình camera điện thoại thì rung, ngược sáng, chụp gần | Mục 4 bên dưới: đánh giá thực địa |
| Bản quyền ảnh và giấy phép CC | Model được phát công khai. Ảnh CC BY-SA yêu cầu ghi nguồn | Wikimedia Commons, *Reusing content outside Wikimedia* |
| `aria-live` | Vùng `aria-live` đổi nội dung liên tục làm phiền người dùng trình đọc màn hình | MDN, `aria-live` |

## 4. Đề xuất sửa PRD

| Mã | Hiện tại | Đề xuất |
| --- | --- | --- |
| C-04 / §5.5.3 | Ngưỡng đề xuất 0.7 | **Đã thêm** đoạn "Prototype status": app đang dùng 0.75 + 0.2, chọn trên bộ test nên lạc quan; luồng quét không có GPS |
| §12, rủi ro "Closed-set softmax" | Mô tả lý thuyết | **Đã thêm** số đo: 5/10 ảnh tượng Cá chép bị nhận nhầm. Khuyến nghị lớp `khac` có tượng giống và các cầu khác trên sông Hàn |
| C-03 / C-04 (đề xuất mới) | Luồng quét không nói gì về GPS | Thêm: "Live scan shows a guess (“Looks like…”) with a ‘Not this place’ action; when GPS is granted, places outside their radius are down-ranked" |
| §10.2 (đề xuất mới) | Chưa có chỉ số camera | Thêm 4 chỉ số ở CAM-24, đo ở pilot |
| R-11 / C-05 (đề xuất mới) | — | Mỗi bản model kèm: bảng recall theo lớp trên bộ test độc lập, tỉ lệ nhận nhầm ảnh lạ, nguồn và giấy phép ảnh train |

## 5. Kế hoạch

**Trước khi nộp (hôm nay):** đã xong phần mã. Còn lại:
1. `npm start`, mở `?demo`, thử demo 6 bằng ảnh Cầu Rồng và Sông Hàn.
2. Thử nhanh trên điện thoại sau khi deploy.
3. Khi trình bày, nói rõ giới hạn: model có 4 lớp, chưa có lớp "khác", con số 88,9% đo trên 36 ảnh.

**Tuần sau, trước pilot:**
- CAM-10: lớp `khac`;
- CAM-11: thêm ảnh Cầu Rồng chụp xa;
- CAM-09 và CAM-22: chia validation riêng, báo recall theo lớp;
- CAM-13: xử lý EXIF;
- CAM-17: thử trên điện thoại;
- CAM-16: giáo viên duyệt fact.

**Trước khi phát hành:**
- CAM-14: nguồn ảnh có giấy phép;
- CAM-02: GPS trong luồng quét;
- CAM-12: khung hướng dẫn khớp vùng model nhận;
- CAM-15: mỗi địa danh có bài A1–A2;
- CAM-24: chỉ số camera trong PRD.

## 6. Chưa kiểm tra được

- Điện thoại thật (iPhone Safari, Android), trình đọc màn hình, mạng yếu: cần người trong nhóm thử.
- Rò rỉ giữa ảnh train và ảnh test: cần bộ ảnh train.
- Model có "học watermark" hay không: cần thử nghiệm che watermark (CAM-14b).
- Nhãn đúng của 36 ảnh test do Claude gán bằng mắt: nhóm cần xác nhận.

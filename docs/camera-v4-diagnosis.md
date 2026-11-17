# Đánh giá và tích hợp model nhận diện ảnh v4

Ngày: 16/11/2026. Đối tượng đọc: nhóm EchoLạc và người train model.
Dữ liệu: `model v4/landmarks.keras` và `labels.txt` (5 lớp), so với v3. Script: `model v3/diagnosis/eval.py`, `export_tfjs.py` (đã thêm tham số để dùng cho mọi model).
Xem thêm [camera-v3-diagnosis.md](camera-v3-diagnosis.md) và [camera-review.md](camera-review.md).

## Kết luận nhanh

- v4 có cùng kiến trúc với v3 (MobileNetV3Large) và thêm lớp **"Cá chép rồng"**. Nhóm đã train xong, không train lại.
- **v4 sửa được lỗi CAM-01**: 5/5 ảnh tượng Cá chép hoá Rồng được nhận đúng. Trong khi đó, v3 nhận nhầm 3/5 ảnh thành Quan Âm với độ tự tin tới 0.97.
- **Nhưng v4 nhận Cầu Rồng kém hơn khi ảnh được cắt vuông như app**: đúng 2/8 (v3 đúng 5/8). Ảnh Cầu Rồng chụp xa bị nhận thành Sông Hàn với độ tự tin 0.78–0.83, vượt qua ngưỡng 0.75.
- Chủ dự án chọn **v4 với ngưỡng 0.85** kèm luật chênh lệch 0.2. Trên 41 ảnh, cấu hình này nhận đúng 19 ảnh và **không nhận sai ảnh nào**. Đổi lại, nhiều ảnh bị trả về "không chắc chắn", và người học sẽ dựa vào GPS hoặc tự chọn nơi.
- Mỗi nơi giờ có bài học riêng (`content/curriculum/landmarks.js`). Nhận ra nơi nào thì mở đúng bài của nơi đó.

## 1. Kết quả

Bộ ảnh gồm 36 ảnh cũ (nhãn do Claude gán, nhóm cần xác nhận) và 5 ảnh tượng Cá chép từ Wikimedia Commons (CC BY-SA 4.0). Ảnh được xoay theo EXIF trước khi đưa vào model (CAM-13).

| Model | Cách tiền xử lý | Đúng hạng nhất (41 ảnh) | Cầu Rồng (8) | Cá chép (5) | Ngưỡng 0.75: đúng/sai | Ngưỡng 0.85: đúng/sai |
| --- | --- | --- | --- | --- | --- | --- |
| v3 | cắt vuông (app cũ) | 30 | 5 | 0 | 22 / 3 | 13 / 2 |
| **v4** | **cắt vuông (app)** | 33 | **2** | 5 | 21 / 3 | **19 / 0** |
| v4 | kéo giãn (giống Predict.py) | 33 | 6 | 2 | 22 / 2 | 19 / 1 |

Ảnh bị nhận sai ở ngưỡng 0.75 (v4, cắt vuông):
- `images (4).jpg`: Cầu Rồng bị nhận thành Sông Hàn, 0.78;
- `images (5).jpg`: Cầu Rồng bị nhận thành Sông Hàn, 0.83;
- `baodanang…170095.jpg`: tượng đồng ở APEC bị nhận thành Quan Âm, 0.84.

Model TF.js (float16, khoảng 6 MB) khớp Keras ở hạng nhất trên **41/41 ảnh**, chênh lệch xác suất tối đa 0.0058.

## 2. Diễn giải

- **Cách tiền xử lý ảnh hưởng tới v4 nhiều hơn v3.** Khi ảnh bị kéo giãn, v4 nhận Cầu Rồng tốt (6/8) nhưng Cá chép kém (2/5). Khi ảnh được cắt vuông thì ngược lại. Có thể v4 được train bằng ảnh kéo giãn (mặc định của `image_dataset_from_directory`), trong khi app cắt vuông. Đây là giả thuyết, chưa kiểm chứng vì chưa có mã train.
- **Mẫu rất nhỏ**: Cầu Rồng chỉ có 8 ảnh, Cá chép 5 ảnh. Lệch 1–2 ảnh là đủ đổi kết luận.
- **Con số 5/5 cho Cá chép là kết quả thật**: kiểm tra rò rỉ (§5) cho thấy 5 ảnh Commons không có trong train hay val.
- **Ngưỡng 0.85 được chọn trên chính bộ ảnh báo cáo**, nên con số "0 ảnh nhận sai" là lạc quan.

## 3. Kiểm tra trên Chrome (16/11/2026)

GPS mẫu đặt ở giữa Cầu Rồng; mỗi lớp thử một ảnh:

| Ảnh | Hạng nhất (xác suất) | Kết quả ảnh | Đối chiếu GPS |
| --- | --- | --- | --- |
| Công viên APEC | APEC (0.91) | khớp | C: lệch GPS, hỏi người học |
| Cầu Sông Hàn | Sông Hàn (0.93) | khớp | C: lệch GPS, hỏi người học |
| Tượng Cá chép | Cá chép (0.70) | chưa chắc chắn | E: hỏi người học |
| Tượng Quan Âm | Quan Âm (0.67) | chưa chắc chắn | E: hỏi người học |
| Cầu Rồng chụp cận | Cầu Rồng (0.35) | không khớp | E: hỏi người học |

Cả 5 ảnh đều được đoán đúng nơi ở hạng nhất. Model tải được, không có lỗi CSP. Bảng kết quả quét hiện đúng tên nơi và mở đúng bài của nơi đó. Chưa thử trên điện thoại.

## 4. Đã thay đổi trong app

- `model/`: thay bằng v4 (5 nhãn trong `metadata.json`).
- `lib/camera/config.js`, `matching.js`: ngưỡng 0.85 cho cả quét trực tiếp và chụp ảnh; `CAM.map` cho mỗi lớp một bài.
- `content/curriculum/landmarks.js` (mới): 4 bài A1–A2 cho Cầu Sông Hàn, Công viên APEC, Tượng Quan Âm, Tượng Cá chép hoá Rồng. Cầu Rồng giữ bài `dragon`. Fact lấy từ bài B1-05 và [research-quan-am-ca-chep.md](research-quan-am-ca-chep.md); tất cả `verified: false`.
- `assets/data/locations-danang.js`: thêm địa danh `dragon-carp` (có `modelLabel` vì tên hiển thị khác nhãn model; tọa độ ước lượng, bán kính 200 m); thêm fact có nguồn cho Quan Âm.
- `lib/camera/model.js`: `labelLoc` đọc thêm `modelLabel`.
- `tests/app.test.cjs`: kiểm tra mỗi nhãn có đúng một nơi và một bài riêng; 4 bài mới đủ trường và hiển thị được ở hai ngôn ngữ. Kết quả 9/9 đạt.

## 5. Kiểm tra rò rỉ dữ liệu (bộ train từ Drive, 16/11/2026)

Bộ dữ liệu có 218 ảnh: 126 train, 92 val. Script `model v3/diagnosis/leak_check.py` so ảnh gần trùng bằng dHash và aHash, có xoay theo EXIF trước khi so. Ảnh ghép đối chiếu nằm trong `model v3/diagnosis/leak/`.

| Lớp | Train | Val |
| --- | --- | --- |
| Cá chép rồng | 16 | 11 |
| Cầu Rồng | 16 | 13 |
| Cầu Sông Hàn | 23 | 17 |
| Công viên APEC | 31 | 18 |
| Tượng Quan Âm | 40 | 33 |

Kết quả:
- **3/36 ảnh test cũ có trong bộ train**: `574a21a6…jpg` và `images (6).jpg` (Sông Hàn), `congvien_3_EGVI.webp` (APEC). Ảnh ghép xác nhận đây là cùng một tấm ảnh.
- **5 ảnh Cá chép từ Commons không có trong train hay val.** Ảnh Cá chép của nhóm là ảnh tự chụp. Như vậy kết quả 5/5 của v4 là kết quả thật trên ảnh model chưa thấy.
- **4 cặp ảnh Cá chép chụp liên tiếp bị chia cho cả train và val**, nên độ chính xác val của lớp này đang cao hơn thực tế.
- **Cầu Rồng chỉ có 16 ảnh train**, ít nhất trong 5 lớp và chưa bằng nửa Quan Âm (40). Phần lớn là ảnh cận đầu rồng hoặc ảnh phun lửa, phun nước; ảnh chụp xa ngang sông ít. Điều này khớp với việc model nhận Cầu Rồng chụp xa kém.
- **Có một ảnh train của Cầu Rồng chụp cả tượng Cá chép ở tiền cảnh** (`cau_rong_noi_lien_hai_bo_song_han_…`). Ảnh này dạy model gắn tượng Cá chép với nhãn Cầu Rồng, mâu thuẫn với lớp Cá chép rồng.

Sau khi bỏ 3 ảnh trùng (38 ảnh còn lại):

| | Đúng hạng nhất | Cầu Rồng | Sông Hàn | APEC | Quan Âm | Cá chép | Ngưỡng 0.75 (đúng/sai) | Ngưỡng 0.85 (đúng/sai) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| v3, cắt vuông | 27/38 | 5/8 | 6/7 | 12/14 | 4/4 | 0/5 | 21 / 3 | 12 / 2 |
| **v4, cắt vuông (app)** | 30/38 | 2/8 | 7/7 | 12/14 | 4/4 | 5/5 | 18 / 3 | **17 / 0** |
| v4, kéo giãn | 30/38 | 6/8 | 7/7 | 11/14 | 4/4 | 2/5 | 19 / 2 | 17 / 1 |

Kết luận không đổi: v4 cùng ngưỡng 0.85 vẫn là cấu hình không nhận sai ảnh nào.

## 6. Việc nhóm cần làm

1. **Thêm ảnh train Cầu Rồng**, ít nhất bằng các lớp khác (30–40 ảnh), ưu tiên ảnh chụp xa ngang sông và ảnh từ trên cao. Bỏ hoặc gán lại nhãn cho ảnh Cầu Rồng có tượng Cá chép ở tiền cảnh.
2. **Chia train và val theo buổi chụp**: các ảnh chụp liên tiếp cùng lúc phải nằm cùng một phía.
3. **Bỏ 3 ảnh trùng khỏi bộ test**, hoặc thay bằng ảnh mới.
4. **Kiểm tra cách tiền xử lý khi train** (kéo giãn hay cắt vuông). Nếu train bằng ảnh kéo giãn, lần train sau nên đổi sang cắt vuông giống app, hoặc thử đổi app sang kéo giãn và đo lại.
5. **Giáo viên duyệt 4 bài mới.** Cần đặc biệt xem: số 67 m của tượng Quan Âm (một nguồn ghi 72 m nếu tính bệ sen), và tọa độ tượng Cá chép.
6. Thử trên điện thoại thật và thử quét trực tiếp ở hiện trường.

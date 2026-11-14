# Chẩn đoán model nhận diện ảnh v3

Ngày: 14/11/2026. Đối tượng đọc: nhóm EchoLạc và người train model.
Dữ liệu: `model v3/landmarks.keras`, `labels.txt`, `test.zip` (36 ảnh). Script: `model v3/diagnosis/`.

## Kết luận nhanh

- Kết quả của nhóm được **tái hiện đúng**: 32/36 ảnh đúng (88,9%; khoảng tin cậy Wilson 95% là 75–96%). Hai lỗi là Cầu Rồng bị nhận thành Cầu Sông Hàn.
- Model **không nhầm hai chiều**. 9/9 ảnh Sông Hàn đều đúng; lỗi tập trung ở **Cầu Rồng**, chỉ đúng 5/8 ảnh.
- Nguyên nhân chính: cả 3 ảnh Cầu Rồng bị sai đều **chụp từ xa hoặc từ trên cao**, cầu chỉ là một dải mảnh ngang khung hình. Grad-CAM cho thấy với các ảnh này, model nhìn vào **mặt sông, mặt cầu và đường chân trời thành phố**, tức là bối cảnh "cầu dài qua sông Hàn" mà hai cầu đều có. Model không nhìn vào vòm vàng hay đầu rồng.
- Với ảnh Cầu Rồng đoán đúng, model nhìn đúng **đầu rồng, lửa và vòm chụp cận**. Có thể đoán ảnh train của lớp Cầu Rồng chủ yếu là ảnh cận, còn lớp Sông Hàn có nhiều ảnh toàn cảnh qua sông. Chưa kiểm chứng được vì nhóm chưa gửi bộ ảnh train.
- Ảnh không bị nhiễu không có nghĩa là ảnh dễ. Với model, đặc điểm phân biệt hai cầu quá nhỏ trong những ảnh này.
- Model đã chạy trong app. Luật chênh lệch 20% cùng ngưỡng 0.75 cho **0 ảnh bị nhận sai** trên bộ test; các ảnh khó bị trả về "không chắc chắn".

## 1. Cách đo

- **Nhãn đúng** do Claude gán bằng mắt (`diagnosis/labels.csv`, có cột ghi chú cho ảnh mơ hồ). **Nhóm cần xác nhận lại**, nhất là các ảnh 1, 7, 9, 14, 26 (tượng hoặc cầu chụp từ mặt đường) và ảnh 30 (cổng chùa, không thấy tượng).
- Bộ test gồm 8 ảnh Cầu Rồng, 9 ảnh Sông Hàn, 15 ảnh APEC và 4 ảnh Quan Âm.
- Thử ba cách tiền xử lý:
  - `stretch`: kéo giãn về 224, giống Predict.py;
  - `crop`: cắt vuông ở giữa, giống app;
  - `crop_flip`: cắt vuông rồi lật ngang.
- Luật quyết định giống app: top-1 phải hơn top-2 ít nhất 20 điểm phần trăm (PRD C-04).

Chạy lại:

```sh
pip install tensorflow pillow
cd "model v3/diagnosis"
python eval.py --gradcam
```

## 2. Kết quả

| Tiền xử lý | Top-1 đúng | Wilson 95% | Luật 20%: nhận đúng / nhận sai / không chắc chắn |
| --- | --- | --- | --- |
| stretch (Predict.py) | 32/36 (88,9%) | 75–96% | 29 / 3 / 4 |
| crop (app) | 30/36 (83,3%) | 68–92% | 28 / 2 / 6 |
| crop + lật ngang | 31/36 (86,1%) | 71–94% | 28 / 3 / 5 |

Ma trận nhầm lẫn của `stretch`, cách nhóm đã đo (hàng là nhãn đúng, cột là dự đoán):

| | Cầu Rồng | Sông Hàn | APEC | Quan Âm |
| --- | --- | --- | --- | --- |
| **Cầu Rồng** | 5 | **2** | 1 | 0 |
| **Sông Hàn** | 0 | 9 | 0 | 0 |
| **APEC** | 0 | 0 | 14 | 1 |
| **Quan Âm** | 0 | 0 | 0 | 4 |

### Bốn ảnh sai (stretch)

| Ảnh | Đúng | Model đoán | Xác suất | Nguyên nhân khả dĩ |
| --- | --- | --- | --- | --- |
| `images (4).jpg` | Cầu Rồng | Sông Hàn | 0.62 | Chụp ngang sông ban ngày; cầu là dải mỏng ở 1/3 dưới khung hình, bầu trời chiếm phần lớn |
| `images (5).jpg` | Cầu Rồng | Sông Hàn | 0.46 | Chụp từ trên cao ban đêm; đèn màu trên mặt cầu và sông giống ảnh Sông Hàn ban đêm |
| `cau-rong-da-nang-3-….webp` | Cầu Rồng | APEC | 0.56 | Ảnh toàn cảnh từ trên cao, cầu nhỏ, có cả khu vực công viên APEC |
| `baodanang.vn-…170095.jpg` | APEC | Quan Âm | 0.79 | Nhóm tượng đồng chụp ban đêm trong công viên. Model chỉ học "APEC" là mái vòm, nên tượng trông giống Quan Âm hơn |

Ảnh sai thứ tư không phải lỗi giữa hai cầu, mà là vấn đề **định nghĩa lớp**: ảnh tượng hoặc không gian trong nhà ở APEC có nên tính là "APEC" không? Nhóm cần chốt quy tắc này trước khi thêm ảnh.

### Grad-CAM

Ảnh Grad-CAM nằm trong `model v3/diagnosis/gradcam/`. Vùng sáng là nơi model nhìn vào.

- Sông Hàn đoán đúng: model nhìn vào trụ tháp và dải cáp hình quạt. Đây là đặc điểm tốt.
- Cầu Rồng đoán đúng: model nhìn vào đầu rồng, lửa hoặc vòm cầu chụp cận.
- Cầu Rồng đoán sai: vùng chú ý trải rộng trên mặt sông, mặt cầu và bầu trời, không rơi vào các vòm.

## 3. Ngưỡng và luật chênh lệch

Cách tiền xử lý `crop` (giống app), 36 ảnh:

| Ngưỡng top-1 (kèm chênh lệch ≥ 20%) | Nhận đúng | Nhận sai | Bỏ qua |
| --- | --- | --- | --- |
| 0.50 | 28 | 2 | 6 |
| **0.75 (app hiện dùng)** | **22** | **0** | 14 |
| 0.85 (ngưỡng cũ của chế độ quét) | 13 | 0 | 23 |

Ở ngưỡng 0.85, chế độ quét trực tiếp bỏ qua gần 2/3 số ảnh, nên ngưỡng quét đã được hạ xuống 0.75. Trung vị độ tự tin của ảnh đúng chỉ là 0.83. Model v3 nhìn chung "không quá chắc", nên việc thêm dữ liệu sẽ giúp ở cả hai phía: nhận được nhiều ảnh hơn và tự tin hơn.

Lưu ý: 36 ảnh là quá ít để chốt ngưỡng. Ngưỡng 0.75 cũng được chọn **trên chính bộ ảnh dùng để báo cáo**, nên kết quả "0 ảnh nhận sai" là lạc quan. Cần kiểm tra lại trên một bộ validation riêng.

Ảnh ngoài 4 lớp làm luật ngưỡng thất bại: 5/10 ảnh tượng Cá chép hoá Rồng bị nhận là Quan Âm với độ tự tin 0.79–0.97. Xem [camera-review.md](camera-review.md).

## 4. Những gì chưa kiểm tra được

- **Rò rỉ dữ liệu train/test:** ảnh test lấy từ web, có thể trùng hoặc gần trùng với ảnh train. Chưa có bộ ảnh train nên chưa kiểm tra được. Nếu có trùng, độ chính xác thật thấp hơn 88,9%.
- **Lớp "khác":** model chỉ có 4 lớp. Ảnh không thuộc địa danh nào vẫn bị gán vào một trong 4 lớp, và chỉ luật ngưỡng ngăn được việc nhận sai.
- Chưa thử trên điện thoại thật: độ trễ, bộ nhớ, ánh sáng thực tế.
- `Predict.py` không đọc tệp `.avif` (bộ test có 2 ảnh `.avif`). Nếu đã chạy bằng script này thì có thể chỉ 34 ảnh được chấm.

## 5. Đã sửa trong app

- Model v3 được xuất sang TF.js graph model, lượng tử hoá float16 (khoảng 6 MB), đặt trong `model/`.
  - So với Keras trên cả 36 ảnh: top-1 khớp 36/36, chênh lệch xác suất tối đa 0.006.
  - Script xuất: `model v3/diagnosis/export_tfjs.py`.
- App bỏ thư viện Teachable Machine, chuyển sang TensorFlow.js 4.22 có SRI. CSP không còn `'unsafe-eval'`.
- Thu nhỏ ảnh bằng canvas có làm mượt. `tf.image.resizeBilinear` từng làm một ảnh Cầu Rồng sát ngưỡng bị lật thành Sông Hàn.
- Luật chênh lệch 20% (C-04) áp cho cả chế độ quét trực tiếp và chế độ chụp ảnh. Ngưỡng quét hạ từ 0.85 xuống 0.75.
- Sửa lỗi C2: lớp không tìm thấy trong model không còn bị gán mặc định vào index 2. Thêm `khac` vào danh sách lớp nền.
- Thêm 3 địa danh vào `assets/data/locations-danang.js`: Cầu Sông Hàn, Công viên APEC, Tượng Quan Âm Linh Ứng. Fact lấy từ bài B1-05 và đều chưa được giáo viên xác minh.
  - Quét trực tiếp: Cầu Rồng mở bài `dragon`; Sông Hàn và APEC mở bài B1-05.
  - Quan Âm chưa có bài, app sẽ báo "Chưa có bài cho địa danh này".
- Đã kiểm tra trên Chrome: model tải và dự đoán được, không có lỗi CSP. `npm run check` và `npm test` đều đạt.

## 6. Việc nhóm cần làm

1. **Xác nhận nhãn** trong `diagnosis/labels.csv`.
2. **Thêm ảnh train cho Cầu Rồng**, ưu tiên đúng các kiểu đang sai, khoảng 40–60 ảnh:
   - chụp ngang sông và từ xa, ban ngày và ban đêm;
   - chụp từ trên cao (flycam);
   - ảnh trong đó vòm vàng chỉ chiếm phần nhỏ khung hình.
3. **Thêm ảnh Sông Hàn kiểu tương tự** (chụp xa, từ trên cao) để model phải học trụ tháp và dây cáp, không học "sông và thành phố".
4. **Chốt định nghĩa lớp APEC:** có tính tượng và không gian trong nhà không. Nếu có, thêm ảnh các loại đó vào lớp; nếu không, loại các ảnh đó khỏi test.
5. **Thêm lớp `khac`** gồm đường phố, sông không có cầu, cầu khác (Trần Thị Lý, Thuận Phước), người và đồ vật.
6. **Tách bộ test độc lập:**
   - mỗi lớp ít nhất 30 ảnh;
   - không lấy từ cùng nguồn hay cùng buổi chụp với ảnh train;
   - tốt nhất là ảnh nhóm tự chụp bằng điện thoại.
7. Sau khi train lại, chạy `eval.py` và `export_tfjs.py`, rồi so bảng ở mục 2 và 3.

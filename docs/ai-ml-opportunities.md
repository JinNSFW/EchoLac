# Cơ hội áp dụng AI/ML cho EchoLạc

Ngày khảo sát: 21/11/2026. Tài liệu nghiên cứu, **không** thay đổi PRD hay mã. Tổng hợp từ 4 subagent: 1 khảo sát mã + PRD (chỉ đọc), 3 nghiên cứu web (speech; LLM + cá nhân hoá; vision + ML ops).

Ký hiệu: **[V]** đã đối chiếu nguồn chính thức trong phiên khảo sát; **[U]** chưa xác minh, phải kiểm tra trước khi dựa vào. Mọi giá, phiên bản, độ trễ đều cần kiểm lại khi triển khai.

## 1. Tóm tắt

Hiện trạng: ML thật duy nhất là bộ phân loại camera (model v4, TF.js). ASR, chấm phát âm, LLM, sửa ngữ pháp, SRS đều là kịch bản hoặc mô phỏng (`lib/roleplay.js`, `lib/tutor.js:13`, `lib/language-feedback.js:5-22`). PRD §3 yêu cầu chứng minh vòng học với **dịch vụ speech và LLM thật** trước, camera là Could.

Năm việc đáng làm nhất bây giờ:

1. **Azure Pronunciation Assessment** (scripted, IPA, NBestPhonemes, miscue) + lớp ánh xạ sang taxonomy §6 — thay điểm ngẫu nhiên ở T-03/T-04.
2. **Claude cho roleplay**: đưa nguyên fact sheet vào system prompt có prompt caching, không cần RAG; kiểm câu trả lời bằng Citations; sửa ngữ pháp bằng tool use + zod với enum đóng §6.
3. **ts-fsrs + mastery kiểu Elo** dạng hàm thuần trong `lib/` cho T-05/T-06 và radar E-01..E-04.
4. **Bộ eval từ ngày đầu** (promptfoo + ~50 ca giáo viên gán nhãn) và nghiên cứu hiệu lực §7.4.
5. **Camera: làm lại tập đánh giá trước** (tách theo phiên chụp, khử trùng lặp, bộ ảnh âm tính), rồi thử **embedding + prototype** thay cho classifier đóng.

## 2. Bảng tổng

| # | Đề xuất | Nhóm | Mã PRD | Chạy ở | Chi phí / độ trễ | Nỗ lực | Ưu tiên |
|---|---|---|---|---|---|---|---|
| 1 | Azure Pronunciation Assessment | Speech | T-02, T-03, T-04, R-10 | Trình duyệt (Speech SDK) + token ngắn hạn từ server | Tính như STT; free 5 h/tháng [V]; ~$1/giờ [U]; < 3 s | S | Must |
| 2 | Ánh xạ lỗi người Việt (NBestPhonemes → taxonomy §6) | Speech | T-02, R-10, §6 | Server/`lib/` | Không tốn thêm | M | Must |
| 3 | Azure STT + neural TTS (SSML rate) | Speech | R-03, R-05, R-07 | Trình duyệt + token | Gói chung Azure | S | Must |
| 4 | Fact sheet trong prompt có cache + Citations | LLM | R-04, C-08 | Server function | Cache read ~0,1× giá input [V] | S | Must |
| 5 | Sửa ngữ pháp bằng tool use + zod, sửa tối thiểu | LLM | R-08, §6 grammar | Server function | 1 lời gọi/lượt | M | Must |
| 6 | Haiku cho lượt nhân vật, Sonnet cho feedback | LLM | R-03, T-03, §8.2 | Server | Haiku 5.5 $0.10/$0.50 per 1M [V*] | S | Must |
| 7 | ts-fsrs cho SRS | Cá nhân hoá | T-06 | Client/server, hàm thuần | Miễn phí, MIT [V] | S | Should |
| 8 | Mastery Elo theo kỹ năng (error_type × CEFR) | Cá nhân hoá | T-05, E-01..E-04 | `lib/` | Miễn phí | S | Should |
| 9 | Ước lượng CEFR: LLM + danh sách từ CEFR-J | NLP | E-04, X-02 | Server + `lib/` | Thấp | M | Should |
| 10 | Placement 3–5 phút + gợi ý bài theo luật | Cá nhân hoá | X-02, R-13 | Client | Thấp | S | Should |
| 11 | Sinh câu hỏi/distractor từ fact sheet (Batch API) | LLM | R-13 | Offline | Batch rẻ hơn 50% [V*] | S–M | Should |
| 12 | Eval promptfoo + LLM-as-judge | ML ops | §7.4, §12 | CI / máy local | Thấp | S | Must (hỗ trợ) |
| 13 | Làm lại tập đánh giá camera | Vision | C-01..C-09, §8.5.4 | Offline | 0 | S | Could (đi trước mọi việc camera) |
| 14 | Embedding + prototype (MediaPipe Embedder / DINOv2-S) | Vision | R-11, C-xx | Trên máy | ~4–10 ms Pixel 6 [V]; máy yếu chậm hơn nhiều [U] | S–M | Could |
| 15 | Loại ảnh ngoài tập (ngưỡng cosine + biên + nhiều khung) | Vision | C-xx, §12 | Trên máy | 0 | S | Could |
| 16 | Chuyển runtime sang LiteRT.js / MediaPipe | Vision | §8.5.5 | Trên máy | Nhanh hơn TF.js theo Google [V] | M | Could |
| 17 | Fallback Claude vision khi khung mơ hồ | Vision | — | Server | Ảnh rời thiết bị | M | Ngoài phạm vi hiện tại |
| 18 | wav2vec2 phoneme + GOP chạy trên máy | Speech | T-02 | Trình duyệt (ONNX) | Tải ~1,2 GB [U] | L | Ngoài phạm vi hiện tại |

[V*] = nguồn là tài liệu Claude API trong skill (cache ngày 03/11/2026), cần đối chiếu trang giá chính thức.

## 3. Chi tiết

### A. Speech

**1. Azure Pronunciation Assessment.**
- Cho điểm theo âm vị, âm tiết, từ và cả câu, kèm nhãn IPA.
- NBestPhonemes trả về âm thực sự nghe được (phân biệt /θ/ với /t/ hay /s/). Miscue gắn nhãn omission, insertion, mispronunciation; omission bắt được lỗi bỏ âm cuối. [V]
- Prosody (trọng âm, ngữ điệu, nhịp) chỉ có cho en-US. [V]
- Audio trên 30 s phải dùng continuous mode, và mode này mất miscue. Vì vậy chấm từng câu ngắn. [V]
- Tích hợp:
  - Server function cấp token qua `sts/v1.0/issueToken`, sống 10 phút, làm mới quanh phút thứ 9.
  - Trình duyệt dùng Speech SDK.
  - Thay công thức ngẫu nhiên ở `lib/tutor.js:13`.
- Áp `PRON_THRESHOLD = 60` (§7.2). Khi ASR kém tin cậy thì yêu cầu nói lại và không chấm (§5.6, §12).
- Thử nhỏ nhất: 10 từ trong `content/practice.js`, ghi âm 5 học sinh có consent, so điểm Azure với nhận xét giáo viên.
- Lưu ý: có báo cáo trên diễn đàn rằng Azure chấm /θ/ thấp dù đọc đúng [U]. Phải tự kiểm trên giọng học sinh của mình.

**2. Lớp ánh xạ lỗi người Việt.**
- Hàm thuần `lib/` chuyển kết quả Azure thành mã đóng của §6:
  - omission ở âm cuối → `final_consonant`
  - θ/ð → t/d/s/z → `th`
  - ʃ → s → `sibilant`
  - cụm phụ âm bị rút gọn → `cluster`
  - thiếu đuôi -s/-ed → `s_ed_ending`
- Đây là phần đóng góp khoa học §1.5 (taxonomy và vòng khắc phục khép kín).
- Kiểm tra trên 4 người nói tiếng Việt của L2-ARCTIC (HQTV, PNV, THV, TLV). Giấy phép CC BY-NC 4.0, chỉ dùng cho nghiên cứu [V].
- Nghiệm thu: precision/recall theo từng mã lỗi so với nhãn giáo viên.

**3. STT + TTS.**
- Azure STT và neural voices cho roleplay R-03, R-05, R-07, cùng mô hình token với mục 1.
- Tốc độ chỉnh bằng SSML `<prosody rate>` theo AGENTS §6, không đổi prompt. Phát TTS theo từng câu khi đang stream.
- Thay `speechSynthesis` ở `lib/speech.js`. Giữ ba mức 0.75 / 0.95 / 1.15 trong `content/progress.js:19`.
- Phương án thay thế để so sánh:
  - STT: Deepgram Nova-3 $0.0048/phút [V], AssemblyAI $0.21/giờ [V], OpenAI gpt-transcribe $0.0045/phút [V].
  - TTS: ElevenLabs Flash $0.04/1k ký tự [V], Kokoro-82M (Apache-2.0) [V].
- Chưa có benchmark công khai nào trên giọng Anh của người Việt. Cần tự thử khoảng 50 clip.

### B. LLM / NLP

**4. Fact sheet + cache + Citations.**
- Fact sheet chỉ vài KB nên RAG không cần. Đưa toàn bộ persona, facts và luật theo cấp độ vào system prompt cố định rồi cache. Prefix tối thiểu 512 token [V*].
- Những gì thay đổi (cấp độ học viên, lượt hiện tại) đặt sau điểm cache.
- Bật Citations trên document block. Sau mỗi câu trả lời, kiểm `cited_text` có thật trong fact sheet. Citations không dùng chung được với `output_config.format` [V*].
- Hỏi ngoài fact sheet thì nhân vật lái về lại kịch bản. Điều này giữ hành vi hiện tại của `factFor` (`lib/language-feedback.js:27-35`).
- Nguồn fact sheet: `content/scenarios.js` và `content/curriculum/*.js`, hiện đều `verified:false`.

**5. Sửa ngữ pháp.**
- Mô hình chuyên dụng (GECToR) có precision cao hơn LLM nhưng không giải thích được lỗi và cần dịch vụ Python. LLM có xu hướng viết lại quá tay.
- Dùng LLM với tool output `{span, correction, error_type, explanation_vi, explanation_en}`. `error_type` thuộc enum đóng `tense | agreement | article | word_order | other` (§6). Xác thực bằng zod.
- Prompt yêu cầu sửa tối thiểu. Code tự kiểm `span` có trong câu gốc, không có thì loại.
- Thay 5 regex `FIXES` trong `lib/language-feedback.js`; comment ở đó đã ghi chỗ này cần thay.

**6. Chia model.**
- Haiku 5.5 cho lượt nhân vật, giám khảo và kiểm cấp độ. Sonnet 5.5 cho feedback Tutor và tóm tắt (đúng §8.2).
- Theo tài liệu skill: ép `tool_choice` trả lỗi 400 trên Opus/Sonnet 5.5, nên dùng tool `strict:true` hoặc `output_config.format` [V*].
- Kiểm `stop_reason: "refusal"`.

**9. CEFR.**
- LLM ước lượng CEFR từng lượt kèm lý do, làm mượt qua nhiều lượt, và chỉ hiển thị là "ước lượng".
- Thêm kiểm tra tất định bằng danh sách từ CEFR-J (giấy phép [U]) để giữ lời nhân vật ở mức ≤ cấp học viên + 1.
- Hiệu chỉnh bằng CEFR-SP (17k câu, giấy phép [U]).
- Không thay ngưỡng CEFR của §7.3; đó vẫn là nguồn chuẩn.

**11. Sinh câu hỏi.**
- Sinh offline bằng Batch API, structured output `{stem, answer, distractors[3], source_fact_id, cefr, error_type}`.
- Distractor lấy từ Error Map của học viên.
- Bắt buộc giáo viên duyệt (R-13, câu hỏi mở Q7/Q14).

### C. Cá nhân hoá

**7. ts-fsrs.**
- Bản 6.0.0, MIT [V]. Hàm thuần, chạy được với tham số mặc định.
- Benchmark công khai cho thấy FSRS thắng SM-2 ở đa số bộ dữ liệu (nguồn thứ cấp [U]).
- Log ôn tập lưu Supabase có RLS.
- Hiện chưa có SRS nào trong mã.

**8. Mastery Elo.**
- Khoảng 30 dòng, cập nhật ngay từ câu trả lời đầu tiên. Độ khó ban đầu lấy theo CEFR.
- Đưa thẳng vào radar.
- BKT/DKT cần dữ liệu lớn nên chưa phù hợp.
- Lưu ý: mã hiện dùng `(old*4+new)/5` (`lib/roleplay.js:133`) và mức đẩy 0.06 (`lib/tutor.js:16`), lệch với §7.2: trung bình trượt 5 phiên và `TUTOR_WEIGHT = 0.3`. Khi triển khai phải theo PRD và đặt hằng số trong `lib/scoring/constants.ts`.

**10. Placement + gợi ý.**
- Placement (X-02) đặt Elo ban đầu.
- Sau đó gợi ý theo luật, theo thứ tự: mục SRS đến hạn → kỹ năng yếu nhất trong cấp ±1 → bài danh lam đã mở.
- Chưa dùng ML cho phần này cho đến khi có dữ liệu thật.

### D. ML ops

**12. Eval.**
- promptfoo 0.126.0, MIT [V], với grader `llm-rubric` chạy trong CI.
- Rubric gồm: sửa đúng và tối thiểu, giải thích đúng cấp độ, bám fact sheet, an toàn với trẻ vị thành niên.
- Hiệu chỉnh giám khảo trên khoảng 50 ca giáo viên gán nhãn. Chỉ dùng dữ liệu tổng hợp hoặc ẩn danh.
- Kết hợp với nghiên cứu hiệu lực §7.4: 30–50 bản ghi, 2 giáo viên, tính Pearson.

## 4. Camera: so với model v4 và có nên đổi hướng?

**Hiện trạng v4:**
- Kiến trúc MobileNetV3Large → GAP → Dropout 0.3 → Dense(5), float16 khoảng 6 MB, chạy TF.js.
- Dữ liệu 218 ảnh (126 train / 92 val).
- Kết quả 33/41 top-1, nhưng Cầu Rồng chỉ đúng 2/8. Ảnh xa hoặc chụp từ trên cao bị nhầm thành Sông Hàn với độ tin 0.78–0.83, và Grad-CAM cho thấy model nhìn sông và đường chân trời.
- Rò rỉ dữ liệu: 3 ảnh test v3 nằm trong train v4, và có ảnh chụp liên tiếp bị chia sang cả train lẫn val.
- Ngưỡng 0.85 được chọn trên chính tập dùng để báo cáo, nên kết quả lạc quan.
- Chưa có lớp `khac`, chưa thử trên điện thoại.

**Kết luận: nên đổi hướng sang embedding + prototype, giữ CNN làm baseline.** Lý do:
- Classifier đóng phải train lại mỗi khi thêm danh lam, trong khi mục tiêu là 25 + `khac`.
- Theo thiết kế, classifier đóng không biết nói "không phải danh lam đã biết".
- Chú ý vào nền là cách hỏng điển hình của model ít dữ liệu.
- Nghiên cứu nhận diện danh lam (GLDv2, CVPR 2020) đã hội tụ về hướng truy hồi (retrieval).

**Thứ tự làm:**
1. **Làm lại tập đánh giá.**
   - Tách theo phiên chụp, ngày và máy.
   - Khử trùng lặp bằng perceptual hash.
   - Thêm bộ ảnh âm tính khó: đường phố, cầu và chùa khác ở Đà Nẵng, selfie, màn hình.
2. **So sánh trên tập mới.**
   - MediaPipe Image Embedder (MobileNetV3, nhanh) với DINOv2 ViT-S/14 qua transformers.js v4 (mạnh hơn; ghim phiên bản, giấy phép Apache-2.0 [U]).
   - Mỗi danh lam lưu centroid hoặc kNN từ 20–50 ảnh vào JSON. Thêm danh lam chỉ là thêm dữ liệu.
   - Tránh DINOv3 và MobileCLIP vì giấy phép.
3. **Luật quyết định.**
   - Chấp nhận khi cosine top-1 ≥ τ, biên top-1/top-2 ≥ δ, và kết quả khớp qua 3–5 khung liên tiếp.
   - Hiện đã có luật 0.85 / 0.2 và 800 ms (`lib/camera/config.js:8`, `scan.js`). Tinh chỉnh τ, δ trên bộ ảnh âm tính, không phải trên tập test.
4. **Cổng phát hành** (đề xuất, chưa phải tiêu chuẩn):
   - recall từng lớp ≥ 0.9
   - không ô nhầm lẫn nào > 5%
   - tỉ lệ nhận nhầm ảnh âm tính ≤ 2%
   - p95 độ trễ trên điện thoại yếu nhất đạt ngân sách (giả định Wasm, vì WebGPU chưa phổ biến trên Android yếu [V])
5. **Vận hành.**
   - Đặt tên file model theo hash nội dung, kèm `manifest.json`, cache immutable trên Netlify.
   - Theo dõi drift chỉ bằng số liệu tổng hợp có consent (similarity, chấp nhận/từ chối, backend, độ trễ), không lưu ảnh (§9).

Nếu hai danh lam trông giống nhau, có thể thêm một linear probe nhẹ trên embedding.

## 5. Mâu thuẫn và câu hỏi mở cho chủ dự án

1. **Ngân sách AI/speech (Q6).** Chưa có số giới hạn hằng ngày hoặc hằng tháng (§8.4), mà con số này quyết định chọn Azure hay phương án chạy trên máy.
2. **Prosody chỉ có en-US.** PRD liệt kê giọng en-GB/US/IN/AU. Cần quyết định: chấm trọng âm và ngữ điệu theo en-US, hay bỏ prosody với các giọng khác.
3. **Lệch giữa mã và §7.2.** Mã làm mượt bằng `(old*4+new)/5` thay cho trung bình 5 phiên, đẩy 0.06 thay cho `TUTOR_WEIGHT = 0.3`, và chưa có `PRON_THRESHOLD`. Khi chuyển sang dịch vụ thật phải theo PRD.
4. **Giữ dữ liệu.** Claude API mặc định giữ dữ liệu 30 ngày; zero retention cần Anthropic duyệt [V]. Azure real-time không giữ audio [V]. Cần đối chiếu với §9 cho người dùng dưới 18 tuổi.
5. **Giấy phép dữ liệu.** L2-ARCTIC (NC), W&I+LOCNESS, CEFR-SP và CEFR-J phải kiểm giấy phép trước khi dùng ngoài mục đích nghiên cứu.
6. **Ai duyệt fact sheet và câu hỏi sinh ra (Q7/Q14).** Chưa có người, nên mọi nội dung vẫn `verified:false`.
7. **Camera.** Đổi hướng sang embedding là quyết định kiến trúc, trái với mô tả "MobileNetV3Large classifier" trong §8.5. Nếu đồng ý, cần cập nhật PRD §8.5 trước khi làm.

## 6. Phương án miễn phí (không cần thẻ, không cần email sinh viên)

Viết lại ngày 21/11/2026. Kết quả đến từ 6 subagent tìm kiếm (Haiku, mức suy luận high, chỉ đọc). Agent chính đã kiểm chéo các lựa chọn hàng đầu qua Hugging Face API và tìm kiếm web. Bối cảnh giả định:
- Học viên dùng **máy tính** (Chrome/Edge, khoảng 8 GB RAM, GPU tích hợp).
- Dịch vụ đám mây được nhận **văn bản đã ẩn danh**.
- Không giới hạn dung lượng tải, nhưng mỗi lựa chọn đều ghi số MB.

Ký hiệu: **[V]** đã kiểm trên trang gốc hoặc API trong phiên này; **[U]** chưa xác minh. **Cũ** nghĩa là repo không cập nhật trong 18 tháng gần đây (trước 21/05/2025). Trọng số vẫn tải được, nhưng vi phạm ràng buộc 2, nên chủ dự án cần chấp nhận ngoại lệ nếu muốn dùng. Chưa có số đo độ trễ hay RAM nào được đo trên máy thật.

**Sửa so với bản trước của mục này:**
- Gemini free bị loại hẳn: điều khoản yêu cầu 18+ và cấm dùng cho dịch vụ mà người dưới 18 tuổi có khả năng truy cập.
- Model âm vị chính đổi sang `onnx-community/wav2vec2-lv-60-espeak-cv-ft-ONNX`.
- Chrome Prompt API bị loại: cần GPU trên 4 GB VRAM hoặc 16 GB RAM.

### 6.1 Tóm tắt

1. **Chấm phát âm trên máy:** wav2vec2 espeak (bản q8, 318 MB) so âm vị nghe được với IPA có sẵn trong `WORDS`. Phần trọng âm thử nghiệm bằng `pitchy`.
2. **ASR trên máy:** Whisper base.en q8 (77 MB, repo cũ); dự phòng Moonshine tiny (28 MB).
3. **TTS trên máy:** Kokoro qua `kokoro-js` (q8, 92 MB, repo cũ). Dự phòng là `speechSynthesis` với giọng cài sẵn trên máy.
4. **LLM:** Cloudflare Workers AI free (10.000 Neurons/ngày, không train trên dữ liệu khách) gọi qua Netlify Function. Dự phòng chạy trên máy là WebLLM Llama-3.2-1B (705 MB, khoảng 879 MB VRAM).
5. **Camera và học tập:** CLIP ViT-B/32 (q4, 63,6 MB) hoặc MediaPipe MobileNetV3 embedder (10,9 MB) theo hướng prototype; ts-fsrs, Elo tự viết, CEFR-J wordlist, promptfoo.

**Vấn đề chưa giải quyết lớn nhất:** Groq, OpenRouter và Gemini đều có điều khoản 18+. Điều khoản về tuổi của Cloudflare chưa tìm thấy. Vì vậy với người dưới 18 tuổi, chỉ LLM chạy trên máy là chắc chắn không vướng điều khoản.

### 6.2 Bảng theo từng việc

**Chấm phát âm (T-02, T-03, T-04, R-10)**

| Model | Phiên bản/ngày | License | Chạy ở | MB tải | RAM | WebGPU bắt buộc? | Dữ liệu | |
|---|---|---|---|---|---|---|---|---|
| [onnx-community/wav2vec2-lv-60-espeak-cv-ft-ONNX](https://huggingface.co/onnx-community/wav2vec2-lv-60-espeak-cv-ft-ONNX) | 21/05/2026 | Apache-2.0, không gated | transformers.js, nhãn IPA espeak | fp32 1.264 · fp16 632 · q8 318 · q4 242 · q4f16 197 · bnb4 223 | ~0,6–1,5 GB [U] | Không (WASM) | Trên máy | [V] |
| [robg/speako-phoneme-recognizer](https://huggingface.co/robg/speako-phoneme-recognizer) | 09/07/2026 | Apache-2.0 | transformers.js q8, WASM | 355 (chỉ có q8) | ~0,5–1 GB [U] | Không | Trên máy | [V] subagent; bộ âm TIMIT 39 ký hiệu, khác espeak |
| [sadda-speech/wav2vec2-espeak-ctc](https://huggingface.co/sadda-speech/wav2vec2-espeak-ctc) | 06/07/2026 | Apache-2.0 | ONNX fp16, viết cho Python | 635 | [U] | [U] | Trên máy | [V] subagent; cần runner tự viết |
| [pitchy](https://www.npmjs.com/package/pitchy) 4.1.0 | [U] | MIT | Web Audio, JS thuần | < 1 | ~0 | Không | Trên máy | [V] subagent; dùng đo cao độ cho `word_stress` |

**ASR (R-03, R-05)**

| Model | Phiên bản/ngày | License | MB tải | WebGPU? | Ghi chú | |
|---|---|---|---|---|---|---|
| [onnx-community/whisper-base.en](https://huggingface.co/onnx-community/whisper-base.en) | 08/10/2024 (**cũ**) | MIT ở upstream; repo ONNX không gắn tag license [V] | fp32 292 · fp16 146 · q8 77 · q4 143 | Không | Whisper có MER 0,054 trên L2-ARCTIC đọc (McGuire 2025) [V subagent] | [V] |
| [onnx-community/whisper-tiny.en](https://huggingface.co/onnx-community/whisper-tiny.en) | 2024 (**cũ**) | MIT upstream | fp32 152 · fp16 76 · q8 41 | Không | Nhẹ hơn, kém chính xác hơn | [V] subagent |
| [UsefulSensors/moonshine](https://huggingface.co/UsefulSensors/moonshine) tiny | 10/2024 (**cũ**) | MIT | quantized 28,2 | Không | WER trung bình 12,65 trên open-ASR | [V] subagent |
| Web Speech API, `processLocally: true` | Chrome 139+ | Có sẵn trong trình duyệt | Gói ngôn ngữ ~60 [U] | Không | Mặc định gửi audio lên Google; chỉ xử lý trên máy khi bật cờ. Không có trên Android. | [V] subagent |

**TTS (R-05, R-07)**

| Model | Phiên bản/ngày | License | MB tải | Ghi chú | |
|---|---|---|---|---|---|
| [kokoro-js](https://www.npmjs.com/package/kokoro-js) 1.2.x + [Kokoro-82M-v1.0-ONNX](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX) | repo ONNX 08/02/2025 (**cũ**) | Apache-2.0 [V] | q8 92 · q8f16 86 · fp16 163 · fp32 326 (q4 = 305, lớn hơn q8) | 20 giọng en-US + 8 giọng en-GB; stream bằng `TextSplitterStream`. Chỉnh tốc độ qua `generate(text, {voice, speed})`, README chưa ghi [U]. | [V] license, [U] speed |
| `speechSynthesis` (giọng cài trên Windows) | có sẵn | — | 0 | Tốc độ qua `rate`. Giọng "Google…" của Chrome và "Natural" của Edge có thể gửi văn bản lên đám mây [U]: chỉ dùng giọng local. | [U] |

**LLM (R-03, R-04, R-08, T-03)**

| Lựa chọn | Free tới đâu | Dữ liệu | Tuổi | MB / VRAM | |
|---|---|---|---|---|---|
| [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/platform/pricing/) | 10.000 Neurons/ngày; vượt hạn mức thì lỗi, không tính tiền. Một số model nặng chỉ có ở gói Paid [V]. Chưa rõ có cần thẻ không [U]. | Không train trên Customer Content (trang data-usage 16/10/2026) [V subagent] | Chưa tìm thấy điều khoản [U] | Đám mây | Chính |
| [WebLLM](https://github.com/mlc-ai/web-llm) 0.2.89 + Llama-3.2-1B q4f16 | Miễn phí, chạy trên máy | Không rời máy | Không vướng | 705 MB tải; 879 MB VRAM. SmolLM2-1.7B: 1.774 MB VRAM; Phi-4-mini: 3.438 MB VRAM [V subagent] | Dự phòng; cần WebGPU |
| transformers.js + Qwen2.5-0.5B / Gemma-3-1B (q4f16) | Miễn phí | Không rời máy | Gemma có điều khoản riêng [U] | 483 / 763 MB [V subagent] | Thử nghiệm |
| [Groq](https://console.groq.com/docs/rate-limits) free | Giới hạn theo model, lỗi 429 khi vượt; chưa đọc được bảng giới hạn Free [U] | Điều khoản cũ ghi không giữ prompt lâu dài [U] | Có nguồn nói 18+ [U] | Đám mây | Chỉ dùng cho eval/giám khảo |

**Camera (R-11, C-xx)**

| Model | Ngày | License | MB tải | |
|---|---|---|---|---|
| [Xenova/clip-vit-base-patch32](https://huggingface.co/Xenova/clip-vit-base-patch32) | 28/10/2026 | MIT, không gated [V] | vision: fp32 351,7 · fp16 176,1 · int8 88,6 · q4 63,6 · q4f16 53,3 | Chính |
| [MediaPipe ImageEmbedder MobileNet-V3-Large](https://huggingface.co/litert-community/MediaPipe-ImageEmbedder-MobileNet-V3-Large) | 19/11/2026 | Apache-2.0 [V] (dữ liệu ImageNet có điều khoản phi thương mại [U]) | 10,9 (Small: 4,1); Pixel 6 CPU 3,94 ms [V subagent] | Nhẹ nhất, chạy cả điện thoại |
| [onnx-community/dinov2-small](https://huggingface.co/onnx-community/dinov2-small) | 08/10/2024 (**cũ**) | Apache-2.0 upstream; repo ONNX không gắn tag [V] | fp32 88,5 · int8 24,4 · q4 16,9 | Có thể mạnh nhất cho danh lam [U] |
| Runtime | — | transformers.js 4.3.2 (Apache-2.0), @mediapipe/tasks-vision 1.2.3, @litertjs/core 2.6.0, onnxruntime-web 1.31.1 (MIT) [V subagent] | — | |

**NLP và học tập (R-08, T-05, T-06, E-04, §7.4)**

| Công cụ | Ngày | License | MB | |
|---|---|---|---|---|
| [rabden/t5-tiny-gec-hone](https://huggingface.co/rabden/t5-tiny-gec-hone) | 01/06/2026 | MIT [V] | int8 31 · fp32 122 | Sửa ngữ pháp trên máy; chưa có số liệu chất lượng, không trả loại lỗi |
| [CEFR-J Wordlist v1.6](https://cefr-j.org/download.html) / [OLP](https://github.com/openlanguageprofiles/olp-en-cefrj) | 24/03/2020 | Dùng nghiên cứu và thương mại, ghi nguồn; phần C1/C2 của Octanove là CC-BY-SA-4.0 [V subagent] | CSV nhỏ | Kiểm cấp độ từ vựng |
| [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) 6.0.0 | 28/10/2026 | MIT | ~0 | SRS (T-06) |
| Elo/BKT tự viết | — | — | 0 | Khoảng 30 dòng; thư viện JS hiện có còn non |
| [promptfoo](https://github.com/promptfoo/promptfoo) 0.126.0 | 18/11/2026 | MIT | chạy trên máy dev | Eval; chỉ dùng dữ liệu tổng hợp |

### 6.3 Bộ đề xuất cuối

| Việc | Chính | Dự phòng | Bước thử nhỏ nhất |
|---|---|---|---|
| Chấm phát âm | wav2vec2 espeak q8 (318 MB) | speako q8 (355 MB) | Chấm 6 từ trong `WORDS` (nice, think, street, hotel, ship, beach) trên 1 máy tính ở trường. Mỗi từ đọc 1 lần đúng, 1 lần sai kiểu người Việt. Đo thời gian tải và thời gian chấm. |
| ASR | Whisper base.en q8 (77 MB) | Moonshine tiny (28 MB) / Web Speech `processLocally` | 20 câu do học sinh A1–B1 nói; tính WER riêng nhóm A1–A2. |
| TTS | kokoro-js q8 (92 MB) | `speechSynthesis` giọng local | Đọc một lượt roleplay ở 3 tốc độ 0.75 / 0.95 / 1.15; đo thời gian đến khi có âm thanh. |
| LLM | Cloudflare Workers AI qua Netlify Function | WebLLM Llama-3.2-1B (705 MB) | 10 lượt hội thoại trong 1 fact sheet, kèm feedback JSON xác thực bằng zod. Đếm Neurons tiêu thụ cho mỗi lượt. |
| Camera | CLIP ViT-B/32 q4 (63,6 MB) | MediaPipe MobileNetV3-L (10,9 MB) | Embed 218 ảnh hiện có, chạy kNN theo cách tách theo phiên chụp, cộng 30 ảnh âm tính. |
| Ngữ pháp | LLM (theo dòng LLM ở trên) | t5-tiny-gec-hone int8 (31 MB) | 30 câu học viên do giáo viên chấm; so precision. |
| Học tập | ts-fsrs + Elo + CEFR-J | — | Unit test hàm thuần. |

**Tổng dung lượng tải nếu dùng cả bộ chính trên máy:** 318 + 77 + 92 + 63,6 ≈ **551 MB**. Thêm khoảng 705 MB nếu bật WebLLM. Mỗi model chỉ tải khi mở tính năng tương ứng (lazy-load), rồi trình duyệt cache lại.

### 6.4 Đã loại và lý do

- **Azure:** tài khoản free bắt buộc thẻ.
- **Cerebras:** cần phương thức thanh toán.
- **Hugging Face Inference Providers:** không có credit miễn phí.
- **GitHub Models:** đã ngừng ngày 30/07/2026.
- **Gemini API free:** 18+, cấm dịch vụ mà người dưới 18 tuổi có khả năng truy cập, và dùng dữ liệu free để cải thiện sản phẩm.
- **OpenRouter :free:** 18+, chỉ 50 request/ngày, và tuỳ provider có thể train trên dữ liệu.
- **Mistral Experiment:** chưa xác minh được; có thể train trên dữ liệu.
- **Chrome Prompt API:** cần GPU trên 4 GB VRAM hoặc 16 GB RAM, và 22 GB ổ trống.
- **Edge Prompt API:** mới là bản preview.
- **Supertonic:** repo đã archive, trọng số OpenRAIL-M có giới hạn sử dụng.
- **MeloTTS, KittenTTS:** không có đường chạy trong trình duyệt.
- **Piper engine:** GPL-3.0.
- **Giọng Edge "Natural":** văn bản bị gửi lên Microsoft.
- **GECToR:** ngừng từ 2022.
- **vennify T5-base, coedit-large:** giấy phép CC-BY-NC.
- **flan-t5-large-grammar-synthesis:** 3,1 GB và giấy phép mâu thuẫn.
- **CEFR-SP:** không có file LICENSE.
- **polyglot-tutor-cefr-onnx:** giấy phép NC.
- **SigLIP2 ONNX:** cũ, không gắn tag license.
- **Parakeet ONNX:** bản port không chính thức, chưa rõ license.
- **Moonshine accent fine-tune:** kế thừa NC từ L2-ARCTIC.
- **facebook/wav2vec2 upstream:** chỉ có bản PyTorch.

### 6.5 Thay đổi so với PRD §8.2 cần chủ dự án quyết định

1. **Speech:** Azure → chạy trên máy. Mất điểm prosody và các con số chấm sẵn của Azure. Điểm sẽ là ước lượng tự xây, nên càng cần nghiên cứu hiệu lực §7.4.
2. **LLM:** Claude → Cloudflare Workers AI hoặc WebLLM. Cần chấp nhận chất lượng feedback thấp hơn và kiểm lại cơ chế tool use/JSON của provider mới.
3. **Tuổi người dùng:** cần quyết định chỉ dùng LLM trên máy cho học sinh dưới 18 tuổi, hay xin xác nhận điều khoản tuổi của Cloudflare trước khi dùng đám mây.
4. **Repo "cũ":** Whisper, Moonshine, Kokoro và DINOv2 bản ONNX không cập nhật trong 18 tháng. Cần quyết định có chấp nhận ngoại lệ này không.
5. **Camera:** classifier → embedding + prototype (xem mục 4). Cần cập nhật §8.5.
6. **Model tải về lớn** (khoảng 0,55–1,3 GB): cần đặt ngân sách tải ở §8.4 và đo trên máy tính ở trường.

**Chưa kiểm được:**
- RAM, độ trễ và chất lượng thật của mọi model (chưa chạy model nào).
- Cloudflare có cần thẻ không, và điều khoản tuổi của Cloudflare.
- Bảng giới hạn Free và chính sách dữ liệu đầy đủ của Groq.
- Tham số `speed` của kokoro-js.
- License chính xác của các repo ONNX không gắn tag.

**Nguồn bổ sung:**
- https://developers.cloudflare.com/workers-ai/platform/pricing/ · https://developers.cloudflare.com/changelog/post/2026-07-28-models-require-workers-paid/
- https://console.groq.com/docs/legal/services-agreement
- https://ai.google.dev/gemini-api/terms
- https://groups.google.com/a/chromium.org/g/blink-dev/c/P8P-x7AnC6I (Web Speech `processLocally`)
- https://arxiv.org/abs/2503.06924 (ASR trên L2-ARCTIC)
- https://cdn.jsdelivr.net/npm/kokoro-js@1.2.0/README.md
- https://www.npmjs.com/package/@huggingface/transformers · https://www.npmjs.com/package/@mediapipe/tasks-vision · https://www.npmjs.com/package/@litertjs/core
- https://developer.chrome.com/docs/ai/prompt-api

## 7. Nguồn

**Speech**
- https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-pronunciation-assessment
- https://learn.microsoft.com/en-us/azure/ai-services/speech-service/pronunciation-assessment-tool
- https://learn.microsoft.com/en-us/azure/foundry/responsible-ai/speech-service/speech-to-text/data-privacy-security
- https://api-docs.speechace.com/features/scripted-activities/pronunciation-scoring
- https://github.com/speechsuper/SpeechSuper-API-Samples
- https://elsaspeak.com/en/elsa-api
- https://huggingface.co/facebook/wav2vec2-lv-60-espeak-cv-ft
- GOP: https://arxiv.org/abs/2507.16838 · https://arxiv.org/abs/2506.02080 · https://arxiv.org/abs/2506.12067 · https://arxiv.org/abs/2511.20107
- https://psi.engr.tamu.edu/l2-arctic-corpus/ · https://www.openslr.org/101/
- https://deepgram.com/pricing · https://www.assemblyai.com/pricing · https://developers.openai.com/api/docs/pricing
- https://elevenlabs.io/pricing/api · https://huggingface.co/hexgrad/Kokoro-82M

**LLM / NLP / cá nhân hoá**
- GEC: https://arxiv.org/pdf/2303.13648 · https://arxiv.org/abs/2303.14342v2 · https://arxiv.org/html/2401.07702v2 · https://github.com/grammarly/gector
- https://huggingface.co/datasets/bea2019st/wi_locness
- CEFR: https://github.com/yukiar/CEFR-SP · https://arxiv.org/abs/2210.11766 · https://github.com/openlanguageprofiles/olp-en-cefrj
- Sinh câu hỏi: https://aclanthology.org/2025.findings-acl.174 · https://arxiv.org/pdf/2404.02124
- https://www.promptfoo.dev/docs/guides/llm-as-a-judge/
- https://github.com/open-spaced-repetition/ts-fsrs · https://expertium.github.io/Benchmark.html
- Elo: https://www.fi.muni.cz/~xpelanek/publications/CAE-elo.pdf · https://arxiv.org/html/2403.07908v1

**Vision / ML ops**
- https://ai.google.dev/edge/mediapipe/solutions/vision/image_embedder
- LiteRT.js: https://developers.googleblog.com/litertjs-googles-high-performance-web-ai-inference/ · https://developers.google.com/edge/litert/web
- https://www.npmjs.com/package/onnxruntime-web
- transformers.js: https://github.com/huggingface/transformers.js/releases · https://huggingface.co/blog/transformersjs-v4
- https://github.com/gpuweb/gpuweb/wiki/Implementation-Status
- https://huggingface.co/google/siglip2-base-patch16-224 · https://arxiv.org/abs/2502.14786
- https://ai.meta.com/resources/models-and-libraries/dinov3-license · https://github.com/apple/ml-mobileclip
- OOD: https://arxiv.org/abs/1610.02136 · https://arxiv.org/abs/2010.03759 · https://arxiv.org/abs/1807.03888 · https://arxiv.org/abs/2204.06507 · https://arxiv.org/abs/2306.09301 · https://arxiv.org/abs/1706.04599
- GLDv2: https://arxiv.org/abs/2004.01804 · https://github.com/cvdfoundation/google-landmark
- https://platform.claude.com/docs/en/build-with-claude/api-and-data-retention

**Phương án miễn phí:** xem liên kết trong các bảng ở mục 6.2 và phần "Nguồn bổ sung" cuối mục 6.

## 8. Prompt triển khai: chấm phát âm trên máy (T-02, T-03, T-04, R-10)

Prompt soạn theo quy tắc ở AGENTS §2. Gõ **HÃY THỰC THI PROMPT NÀY** để chạy. Prompt dựa trên mục 6 và mã hiện có:
- `practiceRec()` trong `lib/tutor.js` hiện dùng `setTimeout` để cộng điểm ngẫu nhiên.
- `WORDS` trong `content/practice.js` đã có sẵn `ipa`, `hl`, `cat`.
- Camera đã có mẫu lazy-load model trong `lib/camera/model.js`.

```text
VAI TRÒ
Bạn là kỹ sư speech/frontend, có kinh nghiệm với CTC phoneme recognition, GOP (goodness of pronunciation) và transformers.js trong trình duyệt. Bạn làm việc trong kho D:\Project (EchoLạc, prototype tĩnh trên Netlify). Tuân thủ AGENTS.md: tối đa 300 dòng/tệp, giữ thứ tự script defer, giữ khoá lưu `lt:`, sửa tối thiểu. Theo bảng phân công, đây là việc "xây dựng tính năng đã có kế hoạch"; phần UI ghi âm cần rà soát kỹ.

MỤC TIÊU
Thay điểm phát âm ngẫu nhiên trong Tutor bằng chấm điểm thật, chạy hoàn toàn trên máy học viên. Audio không rời thiết bị (PRD §9).
Phạm vi là một lát dọc:
bấm mic → ghi âm 1 từ trong WORDS → nhận dạng âm vị → so với IPA mong đợi → điểm 0–100 + lỗi theo taxonomy §6 → cập nhật attempts/best/mastery như luồng hiện tại.
CHƯA làm: roleplay ASR, TTS mới, LLM, chuyển Next.js.

ĐỌC TRƯỚC (bắt buộc)
1. EchoLac_PRD.md:
   - §5.2 (T-01..T-06)
   - §5.6 (ASR kém tin cậy → yêu cầu nói lại, không chấm)
   - §6 (8 mã lỗi phát âm)
   - §7.1–7.2 (PRON_THRESHOLD = 60, TUTOR_WEIGHT = 0.3, mastery)
   - §8.4, §9, §12
2. docs/ai-ml-opportunities.md mục 6: bảng chấm phát âm và bước thử nhỏ nhất.
3. Mã:
   - lib/tutor.js: practiceRec, dòng 13 điểm ngẫu nhiên, dòng 16 nudge 0.06
   - pages/tutor.js
   - content/practice.js: ERR_CAT, WORDS, SEED_ERRORS
   - lib/camera/model.js: mẫu lazy-load + SRI
   - index.html: thứ tự defer
   - scripts/build-site.cjs: CSP/_headers
   - data/state.js, tests/app.test.cjs, scripts/check.cjs
Chạy `git status` trước khi sửa. Không động vào các tệp chưa track của người dùng.

KIỂM TRA TRƯỚC KHI CODE (ghi link + ngày vào báo cáo)
- Model chính onnx-community/wav2vec2-lv-60-espeak-cv-ft-ONNX:
  - license Apache-2.0;
  - bản q8 `onnx/model_quantized.onnx` khoảng 318 MB;
  - vocab.json/tokenizer;
  - định dạng đầu ra: âm vị có cách nhau bằng dấu cách không, có ký hiệu trọng âm/độ dài không.
- Model dự phòng robg/speako-phoneme-recognizer: bộ âm TIMIT 39 ký hiệu, cần bảng quy đổi sang IPA.
- transformers.js:
  - phiên bản ổn định hiện tại (khảo sát ghi 4.3.2);
  - cách nạp từ CDN có ghim phiên bản + SRI;
  - cách lấy logits/CTC theo khung thời gian (không chỉ văn bản đã giải mã) để tính GOP.
- Nơi lưu model:
  - hai lựa chọn: tải từ huggingface.co (cần mở CSP connect-src) hoặc tự host trên Netlify (vướng giới hạn kích thước file);
  - đề xuất một cách và nêu đánh đổi;
  - KHÔNG tự đẩy file 318 MB vào repo.
Nếu thực tế khác giả định trong prompt này, theo thực tế và báo lại.

THIẾT KẾ
1. lib/pron-model.js (≤300 dòng, chỉ nạp và chạy model):
   - Lazy-load khi bấm mic lần đầu. Hiện tiến trình tải (MB đã tải / tổng), cho phép huỷ, dùng cache trình duyệt cho lần sau.
   - Ưu tiên WebGPU nếu có, không thì WASM.
   - Ghi âm bằng `getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}})`, rồi resample về 16 kHz mono Float32.
   - Giới hạn 3 s mỗi từ; tự dừng khi im lặng.
   - Trả về `{phones:[{ipa, start, end, post, top:[{ipa,p}]}], durationMs, rms}`.
2. lib/pron-score.js (hàm thuần, không đụng DOM, có unit test):
   a. Chuẩn hoá IPA mong đợi từ WORDS: bỏ "/", tách âm vị, giữ dấu dài ː và trọng âm ˈ riêng.
   b. Bảng quy đổi ký hiệu espeak ↔ IPA của WORDS (ví dụ əʊ/oʊ, r/ɹ, tʃ, aɪ), ghi rõ nguồn.
   c. Căn chỉnh chuỗi nghe được với chuỗi mong đợi:
      - Levenshtein theo âm vị, có backtrace;
      - nếu lấy được posterior theo khung thì thêm GOP.
   d. Tính điểm:
      - điểm = 100 × (1 − khoảng cách có trọng số / số âm mong đợi), kẹp trong 0–100;
      - ghi rõ đây là ước lượng, cần hiệu chỉnh theo §7.4.
   e. Ánh xạ lỗi sang ERR_CAT (enum đóng, không dùng chuỗi tuỳ ý); mỗi luật kèm mã PRD:
      - bỏ phụ âm cuối → final_consonant
      - θ/ð nghe thành t/d/s/z → th
      - ʃ↔s → sibilant
      - bỏ một âm trong cụm phụ âm đầu/cuối, hoặc chèn nguyên âm (ə) vào cụm → cluster
      - thiếu -s/-z/-t/-d ở hình thái → s_ed_ending
      - iː thành ɪ, uː thành ʊ → vowel_length
      - word_stress, rhythm: trả về `unsupported`, không bịa điểm; tuỳ chọn thử nghiệm sau bằng pitchy
   f. Đặt lowConfidence = true khi:
      - âm thanh quá ngắn hoặc quá nhỏ tiếng (rms);
      - không nhận ra âm nào;
      - posterior trung bình dưới ngưỡng.
      Khi đó KHÔNG lưu điểm (§5.6). Các ngưỡng đặt thành hằng số có ghi chú.
   g. Trả về `{score, errors:[{category, expected, heard, index}], lowConfidence, unsupported:[...]}`.
3. Tích hợp vào lib/tutor.js:
   - Thay khối setTimeout/Math.random.
   - Giữ chữ ký `practiceRec(id)`, giữ dữ liệu `e.attempts/best/days/status` và khoá lưu `lt:`.
   - Áp §7.2: PRON_THRESHOLD = 60 và TUTOR_WEIGHT = 0.3 thay cho nudge 0.06.
   - Gom hằng số vào một chỗ, có trích mã PRD. Prototype JS chưa có lib/scoring/constants.ts, nên ghi rõ vị trí tương đương.
   - Hiện âm sai trên IPA (dựa vào `hl` hiện có hoặc index lỗi) kèm tip của category tương ứng.
   - Đủ các trạng thái:
     - chưa tải model / đang tải (có %)
     - xin quyền micro / micro bị từ chối
     - đang nghe / đang chấm
     - lowConfidence ("Mình chưa nghe rõ, nói lại nhé")
     - lỗi model
     - có kết quả
   - Có cả vi/en qua `V()`/`L()`, aria-live cho kết quả, dùng được ở 360 px.
   - Fallback: khi không có micro hoặc WebAssembly, hoặc khi chạy `?test`, giữ chế độ mô phỏng và gắn nhãn "Demo" rõ ràng.
4. Quyền riêng tư (§9):
   - Thông báo một lần trước lần ghi đầu: "Giọng nói chỉ được xử lý trên máy này, không gửi đi đâu".
   - Không lưu audio, không lưu vector xác suất. Chỉ lưu điểm và mã lỗi như dữ liệu hiện có.
5. CSP và build:
   - Trong scripts/build-site.cjs, chỉ thêm đúng domain cần: CDN script, nơi lấy model, và `wasm-unsafe-eval` nếu bắt buộc.
   - Cập nhật README: cách chạy, dung lượng tải, giới hạn.

KIỂM THỬ
- Unit test (node --test, thêm vào tests/) cho lib/pron-score.js, ít nhất 10 ca với chuỗi âm vị giả lập:
  - đúng hoàn toàn
  - "nice" thiếu /s/ → final_consonant
  - "think" /t/ thay /θ/ → th
  - "street" chèn ə → cluster
  - "ship" /s/ thay /ʃ/ → sibilant
  - "beach" /ɪ/ thay /iː/ → vowel_length
  - "worked" thiếu /t/ → s_ed_ending
  - chuỗi rỗng → lowConfidence
  - quy đổi espeak↔IPA
  - kẹp điểm trong 0–100
- Test áp ngưỡng 60 và trọng số 0.3.
- `npm.cmd run check` và `npm.cmd test` đều phải đạt.
- Chạy thử trong trình duyệt (preview local): luồng demo vẫn chạy, không lỗi console, giao diện ổn ở 360 px.
- Nếu môi trường cho phép tải model và có micro: đo thời gian tải lần đầu, thời gian chấm mỗi từ (mục tiêu §8.4 khoảng 3 s) và RAM. Nếu không, ghi rõ "chưa đo trên máy thật". KHÔNG báo các con số chưa đo.
- Viết checklist thủ công cho bước thử nhỏ nhất ở mục 6.3: 6 từ trong WORDS, mỗi từ 1 lần đọc đúng + 1 lần sai kiểu người Việt, trên 1 máy tính ở trường.

KHÔNG LÀM
- Không commit, push, deploy.
- Không thêm dependency npm cho client.
- Không đưa file model vào git.
- Không đổi PRD. Ghi các thay đổi cần thiết (Azure → trên máy, mất prosody) vào "Câu hỏi mở".
- Không tuyên bố độ chính xác khi chưa có dữ liệu giáo viên chấm.

BÁO CÁO CUỐI
1. Tệp đã thêm/sửa, mỗi tệp một dòng.
2. Bằng chứng: output check/test; số đo thời gian tải, thời gian chấm, RAM, hoặc lý do chưa đo.
3. Bảng luật ánh xạ lỗi kèm mã PRD; bảng quy đổi espeak↔IPA.
4. Giới hạn: chưa chấm word_stress/rhythm, độ chính xác chưa hiệu chỉnh, dung lượng tải, máy yếu.
5. Câu hỏi mở cho chủ dự án và các bước người dùng cần tự làm.
```

Câu hỏi để hoàn thiện prompt:
1. Model 318 MB tải trực tiếp từ huggingface.co hay tự host trên Netlify?
2. Khi chưa chấm được trọng âm (ví dụ từ `hotel`): ẩn từ đó khỏi Tutor, hay vẫn chấm phần âm vị và ghi "chưa chấm trọng âm"?
3. Ngưỡng yêu cầu nói lại (lowConfidence) nên chặt (hỏi lại nhiều, ít chấm sai) hay lỏng?

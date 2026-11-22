import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
b = lambda vi, en, refs=None: ({"vi": vi, "en": en, "refs": refs} if refs else {"vi": vi, "en": en})
def S(text, nuc, final, typ, tgt=None, culture=False, **kw):
    t = nuc if tgt is None else tgt
    d = {"text": text, "targets": [{"word": t, "index": [-1]}], "culture": culture,
         "prosody": {"final": final, "nucleus": nuc, "type": typ}}
    d["cefrNull"] = {w: "x" for w in ("lantern", "noodles", "isn't", "don't")}
    d["lemmas"] = {"bought": "buy", "ate": "eat", "said": "say", "lives": "live", "walked": "walk"}
    d.update(kw); return d
def N(text, a, bb): return {"type": "nucleus", "text": text, "a": {"nucleus": a}, "b": {"nucleus": bb}}
def T(text, a="fall", bb="rise"): return {"type": "tune", "text": text, "a": {"final": a}, "b": {"final": bb}}
d = {
 "cando": b("Em đặt trọng âm chính vào thông tin mới hoặc đối lập, và dùng đúng giọng cho câu hỏi lựa chọn, danh sách và câu hỏi đuôi.",
            "I can put the main stress on new or contrastive information and use the right tune for choice questions, lists and question tags."),
 "why": [
  b("Trọng âm chính của câu (nucleus) rơi vào từ mang thông tin mới hoặc đối lập: \"I want the RED lantern, not the BLUE one.\" Đổi từ được nhấn là đổi điều người nghe hiểu. Người học Việt thường được báo cáo nhấn đều từng từ hoặc luôn nhấn từ cuối.",
    "The main stress of a sentence (the nucleus) falls on the word carrying new or contrastive information: \"I want the RED lantern, not the BLUE one.\" Moving the stress changes what the listener understands. Vietnamese learners are often reported to stress every word equally or always stress the last word.",
    ["[B1]", "[B8]"]),
  b("Một nghiên cứu (27 người) báo cáo rằng luyện tập có hướng dẫn cải thiện việc chọn từ mang trọng âm câu và giọng lên/xuống. Người học cấp cao hơn được ghi nhận tiến gần người bản ngữ hơn.",
    "One study (27 learners) reported that guided practice improved the choice of the stressed word and the rise or fall. More advanced learners are reported to come closer to native speakers.",
    ["[B8]", "[B1]"]),
  b("Tiếng Việt dùng thanh điệu trên từng âm tiết nên người học thường để giọng tiếng Anh đi theo thanh điệu. Nhìn đường cao độ và bắt chước hình dạng được báo cáo là giúp nhận ra giọng lên/xuống.",
    "Vietnamese uses tones on each syllable, so learners often let English pitch follow tones. Watching a pitch line and copying its shape is reported to help learners notice rises and falls.",
    ["[B4]", "[B11]", "[B12]"]),
 ],
 "howTo": [
  b("Chọn từ quan trọng nhất trong câu rồi nói nó to hơn, dài hơn và có giọng chuyển động: \"My FRIEND lives in Hội An.\" Các từ còn lại nói nhẹ và nhanh.",
    "Pick the key word and make it louder and longer, with moving pitch: \"My FRIEND lives in Hội An.\" Say the other words lightly."),
  b("Khi đối lập, nhấn từ khác nhau: \"I want the RED lantern.\" (không phải màu khác) và \"I want the red LANTERN.\" (không phải đồ vật khác).",
    "For contrast, stress different words: \"I want the RED lantern.\" (not another colour) and \"I want the red LANTERN.\" (not another object)."),
  b("Câu hỏi lựa chọn: lên giọng ở lựa chọn đầu, xuống giọng ở lựa chọn cuối: \"Tea ↗ or coffee ↘?\" Câu hỏi Yes/No \"Tea or coffee?\" kết thúc lên giọng.",
    "Choice questions: rise on the first option, fall on the last: \"Tea ↗ or coffee ↘?\" A yes/no question \"Tea or coffee?\" ends rising."),
  b("Danh sách: lên giọng nhẹ ở mỗi mục, xuống giọng ở mục cuối: \"rice ↗, noodles ↗, and fruit ↘.\"",
    "Lists: a small rise on each item, a fall on the last one: \"rice ↗, noodles ↗, and fruit ↘.\""),
  b("Câu hỏi đuôi: xuống giọng khi em chắc chắn, lên giọng khi em thật sự hỏi: \"It's lovely, isn't it ↘?\" và \"You like it, don't you ↗?\"",
    "Question tags: fall when you are sure, rise when you really ask: \"It's lovely, isn't it ↘?\" and \"You like it, don't you ↗?\""),
 ],
 "pairs": [
  N("My friend lives in Hội An.", 1, 4),
  N("I want the red lantern.", 3, 4),
  N("She bought the small cup.", 3, 4),
  N("We walked to the market.", 1, 4),
  T("Tea or coffee?", "fall", "rise"),
  T("Rice or noodles?", "fall", "rise"),
 ],
 "sentences": [
  S("I want the red lantern, not the blue one.", 3, "fall", "statement", culture=True),
  S("We bought a red lantern at the market.", 4, "fall", "statement", culture=True),
  S("My friend lives in Hội An.", 1, "fall", "statement", culture=True, unscored=["Hội", "An"]),
  S("Tea or coffee?", 2, "fall", "choice"),
  S("Tea or coffee?", 2, "rise", "yesno"),
  S("We ate rice, noodles, and fresh fruit.", 6, "fall", "list", culture=True),
  S("Is the weather nice, or is it too hot?", 8, "fall", "choice", culture=True),
  S("The beach is lovely, isn't it?", 3, "fall", "tag", culture=True),
  S("You like the bridge, don't you?", 3, "rise", "tag", culture=True),
  S("Which lantern do you want?", 1, "fall", "wh"),
  S("I said the bridge, not the beach.", 3, "fall", "statement", culture=True),
 ],
 "contrasts": [
  {"wrongText": "I want the RED LANTERN, not the BLUE one. (every word equally strong)",
   "rightText": "I want the RED lantern, not the BLUE one. (only the contrast words are strong)",
   "note": b("Nhấn đều mọi từ làm người nghe không biết điều gì là mới. Chỉ nhấn từ đối lập (red/blue); \"lantern\" và \"one\" là thông tin cũ nên nói nhẹ.", "Stressing every word hides what is new. Stress only the contrast words (red/blue); \"lantern\" and \"one\" are old information, so say them lightly.")},
  {"wrongText": "Tea or coffee? ↗ ↗ (rises at the end, sounds like yes/no)",
   "rightText": "Tea ↗ or coffee ↘? (rise on the first option, fall on the last)",
   "note": b("Câu hỏi lựa chọn cần xuống giọng ở lựa chọn cuối để người nghe biết danh sách đã hết và phải chọn một.", "A choice question needs a fall on the last option so the listener knows the list is closed and they must pick one.")},
  {"wrongText": "We ate rice, noodles, and fruit. ↘ ↘ ↘ (falls on every item)",
   "rightText": "We ate rice ↗, noodles ↗, and fruit ↘. (rise on each item, fall on the last)",
   "note": b("Xuống giọng ở mọi mục nghe như câu đã kết thúc. Lên nhẹ ở các mục đầu để báo hiệu danh sách còn tiếp.", "Falling on every item sounds as if the sentence has ended. A small rise on the early items signals that the list continues.")},
  {"wrongText": "The beach is lovely, isn't it? ↗ (sure, but rising)",
   "rightText": "The beach is lovely, isn't it? ↘ (sure: falls)",
   "note": b("Câu hỏi đuôi xuống giọng là xin đồng ý; lên giọng là hỏi thật. Chọn giọng đúng với ý em.", "A falling tag asks for agreement; a rising tag is a real question. Choose the tune that matches what you mean.")},
 ],
 "chain": [
  {"text": "I want the RED lantern. / I want the red LANTERN.", "shadow": [
    b("Nghe câu mẫu hai lần, chỉ chú ý từ nào mạnh nhất và giọng đi lên hay xuống ở cuối.", "Listen to the model twice and notice only which word is strongest and whether the voice goes up or down at the end."),
    b("Ngân nga (hum) hình dạng đường giọng, không nói chữ.", "Hum the shape of the tune without words."),
    b("Thì thầm cùng lúc với âm thanh mẫu, bắt chước hình dạng, không bắt chước giọng.", "Whisper along with the audio, copying the shape, not the voice."),
    b("Nói thành tiếng cùng với âm thanh mẫu; nhìn đường cao độ và khớp chỗ đỉnh.", "Speak aloud with the audio; watch the pitch line and match the peak."),
    b("Nói một mình, không có âm thanh; so sánh với đường cao độ của mẫu.", "Speak alone with no audio; compare with the model pitch line."),
   ],
   "note": b("Bắt chước hình dạng đường cao độ, không bắt chước giọng của người nói mẫu.", "Copy the shape of the pitch line, not the model speaker's voice.")},
 ],
 "selfCheck": b("Ghi âm \"I want the RED lantern.\" và \"Tea or coffee?\" (xuống giọng ở cuối), rồi nghe lại: từ được nhấn có nổi lên không? Câu lựa chọn có xuống giọng ở cuối không?",
                "Record \"I want the RED lantern.\" and \"Tea or coffee?\" (falling at the end) and listen back: does the stressed word stand out? Does the choice question fall at the end?"),
 "teacherNotes": b("Một số người nói phương ngữ có thanh điệu khác nhau nên đường cao độ có thể khác; đừng cho đó là lỗi nếu người nghe vẫn hiểu ý. Người bản ngữ cũng đặt trọng âm khác nhau tuỳ ngữ cảnh. Phần mềm chỉ ước lượng hướng lên/xuống ở cuối câu (độ tin cậy trung bình, chưa đo trên học sinh thật) và vị trí từ chính (độ tin cậy thấp), nên không dùng điểm này để chặn tiến độ. Tên riêng tiếng Việt (Hội An) không được chấm; ứng dụng không đánh giá ý định, cảm xúc hay nghĩa. Các mục đối chiếu viết bằng chữ vì trọng âm và giọng lên/xuống không biểu diễn được bằng IPA.",
                   "Speakers of some dialects have different tones, so pitch can differ; do not count it as an error if the listener still understands. Native speakers also place the stress differently by context. The app only estimates the final rise or fall (medium confidence, not yet measured on real students) and the nucleus word (low confidence), so the score should not block progress. Vietnamese names (Hội An) are not scored; the app cannot judge intention, attitude or meaning. Contrast items are written as text because stress and tunes cannot be written in IPA."),
}
d["id"] = "U19"
with open(os.path.join(HERE, "authored", "u19.json"), "w", encoding="utf-8", newline=chr(10)) as f:
    f.write(json.dumps(d, indent=2, ensure_ascii=False) + chr(10))

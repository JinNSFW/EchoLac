import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
b = lambda vi, en, refs=None: ({"vi": vi, "en": en, "refs": refs} if refs else {"vi": vi, "en": en})
def S(text, nuc, final, typ, culture=False, **kw):
    # target = nucleus word, last phone (shortcut: marks the tune-carrying word only)
    d = {"text": text, "targets": [{"word": nuc, "index": [-1]}], "culture": culture,
         "prosody": {"final": final, "nucleus": nuc, "type": typ}}
    d.update(kw); return d
def P(t, ):
    return {"type": "tune", "text": t, "a": {"final": "fall"}, "b": {"final": "rise"}}
d = {
 "cando": b("Em kết thúc câu kể và câu hỏi Wh bằng giọng xuống, câu hỏi Yes/No bằng giọng lên.",
            "I can end statements and wh-questions falling, and yes/no questions rising."),
 "why": [
  b("Tiếng Việt là ngôn ngữ có thanh điệu: cao độ của mỗi âm tiết đổi nghĩa từ. Các nghiên cứu nhỏ ghi nhận người mới học thường để ngữ điệu tiếng Anh đi theo thanh điệu tiếng Việt, và người học giỏi hơn thì tiến gần người bản ngữ hơn.",
    "Vietnamese is a tone language: pitch on each syllable changes the word. Small studies report that beginners often let English tunes follow Vietnamese tones, while more advanced learners come closer to native speakers.",
    ["[B1]", "[B4]"]),
  b("Một nghiên cứu (27 người) báo cáo rằng luyện tập có hướng dẫn cải thiện cả từ mang trọng âm câu lẫn giọng lên/xuống. Câu kể và câu hỏi Wh thường kết thúc bằng giọng xuống; câu hỏi Yes/No thường kết thúc bằng giọng lên.",
    "One study (27 learners) reported that guided practice improved both which word carries the main stress and the rise or fall. Statements and wh-questions usually end falling; yes/no questions usually end rising.",
    ["[B8]"]),
  b("Nhìn đường cao độ trên màn hình và bắt chước hình dạng của nó giúp người học nhận ra giọng lên/xuống nhanh hơn, được báo cáo trong các nghiên cứu về phản hồi trực quan.",
    "Looking at a pitch line on screen and copying its shape is reported to help learners notice rises and falls faster in studies of visual feedback.",
    ["[B11]", "[B12]"]),
 ],
 "howTo": [
  b("Nói \"It's hot.\" như đang báo một tin chắc chắn: giọng đi xuống ở cuối, như bậc thang đi xuống.",
    "Say \"It's hot.\" as if announcing a sure fact: let your voice step down at the end."),
  b("Nói \"It's hot?\" như đang hỏi thật: giọng đi lên ở cuối, như dấu hỏi kéo lên. Chỉ từ cuối cùng đổi, đừng đổi cả câu.",
    "Say \"It's hot?\" as a real question: let your voice go up at the end. Only the last word changes, not the whole sentence."),
  b("Câu hỏi Wh (Where, What, How) đi xuống như câu kể: \"Where is the market?\" kết thúc giọng xuống.",
    "Wh-questions (Where, What, How) fall like statements: \"Where is the market?\" ends falling."),
  b("Giữ giọng êm: chỉ dùng một đường cong lên hoặc xuống ở từ cuối, đừng nhấn từng từ như một thanh sắc.",
    "Keep the voice smooth: use one rise or fall on the last stressed word. Do not jab every word like a rising tone."),
 ],
 "pairs": [P("It's hot."), P("You like it."), P("It's far."), P("Here."), P("It's cold.")],
 "sentences": [
  S("It's hot.", 1, "fall", "statement"),
  S("It's hot?", 1, "rise", "yesno"),
  S("You like it.", 1, "fall", "statement"),
  S("You like it?", 1, "rise", "yesno"),
  S("Where is the market?", 3, "fall", "wh"),
  S("What do you like?", 3, "fall", "wh"),
  S("Is the beach clean?", 3, "rise", "yesno", True),
  S("The bridge is nice at night.", 5, "fall", "statement", True),
  S("Do you like the river?", 4, "rise", "yesno", True),
  S("How is the weather in Hội An?", 3, "fall", "wh", True, unscored=["Hội", "An"]),
  S("The food is cheap.", 3, "fall", "statement", True),
 ],
 "contrasts": [
  {"wrong": "h ɑː", "right": "h ɑː t", "note": b("Hot mất /t/ cuối nên chỗ lên/xuống giọng chỉ còn một nguyên âm rất ngắn. Giữ /t/ và kéo giọng xuống (hoặc lên) trên nguyên âm trước nó.", "Hot lost its final /t/, so the rise or fall has only a very short vowel to sit on. Keep the /t/ and run the fall (or rise) through the vowel before it.")},
  {"wrong": "f ɑː", "right": "f ɑː ɹ", "note": b("Far mất âm cuối: câu hỏi \"It's far?\" nghe cụt. Kéo dài nguyên âm một chút rồi cuộn lưỡi nhẹ ở cuối để giọng lên có chỗ đi.", "Far lost its final sound, so \"It's far?\" sounds clipped. Lengthen the vowel a little and curl the tongue lightly at the end so the rise has room.")},
  {"wrong": "n aɪ", "right": "n aɪ t", "note": b("Night nghe như \"nai\": từ cuối quá ngắn để nghe giọng xuống. Đưa đầu lưỡi chạm nướu để kết thúc từ.", "Night sounds like \"nai\": the last word is too short to hear the fall. Touch the tongue tip to the ridge to finish the word.")},
 ],
 "chain": [
  {"text": "It's hot. / It's hot?", "shadow": [
    b("Nghe câu mẫu hai lần, chỉ chú ý giọng đi lên hay đi xuống ở cuối.", "Listen to the model twice and notice only whether the voice goes up or down at the end."),
    b("Ngân nga (hum) đúng hình dạng đường giọng, không nói chữ.", "Hum the shape of the tune without words."),
    b("Thì thầm cùng lúc với âm thanh mẫu, bắt chước hình dạng, không bắt chước giọng.", "Whisper along with the audio, copying the shape, not the voice."),
    b("Nói thành tiếng cùng với âm thanh mẫu; nhìn đường cao độ và khớp hình dạng.", "Speak aloud with the audio; watch the pitch line and match its shape."),
    b("Nói một mình, không có âm thanh; so sánh với đường cao độ của mẫu.", "Speak alone with no audio; compare with the model pitch line."),
   ],
   "note": b("Bắt chước hình dạng đường cao độ, không bắt chước giọng của người nói mẫu.", "Copy the shape of the pitch line, not the model speaker's voice.")},
 ],
 "selfCheck": b("Ghi âm \"It's hot.\" và \"It's hot?\", rồi nghe lại: câu kể đi xuống và câu hỏi đi lên chưa? Với câu hỏi Wh (Where is the market?) giọng có đi xuống không?",
                "Record \"It's hot.\" and \"It's hot?\" and listen back: does the statement fall and the question rise? Does a wh-question (Where is the market?) fall?"),
 "teacherNotes": b("Một số người nói phương ngữ có thanh điệu khác nhau nên đường cao độ ở cuối câu có thể khác; đừng cho đó là lỗi nếu người nghe vẫn nhận ra câu kể hay câu hỏi. Người bản ngữ cũng lên giọng ở câu Wh trong một số ngữ cảnh. Phần mềm chỉ ước lượng hướng lên/xuống ở cuối câu (độ tin cậy trung bình, chưa đo trên học sinh thật) và vị trí từ chính (độ tin cậy thấp); không đánh giá cảm xúc hay ý nghĩa. Các mục \"đối chiếu\" chỉ minh hoạ âm cuối, vì giọng lên/xuống không biểu diễn được bằng IPA.",
                   "Speakers of some dialects have different tones, so the end-of-sentence pitch can differ; do not count it as an error if the listener still hears a statement or a question. Native speakers also rise on wh-questions in some contexts. The app only estimates final rise or fall (medium confidence, not yet measured on real students) and the nucleus word (low confidence); it cannot judge attitude or meaning. The contrast items only illustrate final sounds, because rises and falls cannot be written in IPA."),
}
d["id"] = "U07"
with open(os.path.join(HERE, "authored", "u07.json"), "w", encoding="utf-8", newline=chr(10)) as f:
    f.write(json.dumps(d, indent=2, ensure_ascii=False) + chr(10))

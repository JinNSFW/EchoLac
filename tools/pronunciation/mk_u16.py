import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
b = lambda vi, en, refs=None: ({"vi": vi, "en": en, "refs": refs} if refs else {"vi": vi, "en": en})
SLOT = {"to": 1, "of": 0, "and": 0, "can": 1, "for": 1, "a": 0, "the": 1, "from": 2, "was": 1, "some": 1, "them": 1, "at": 0}
def S(text, culture=False, **kw):
    ws = [w.strip(".,?!") for w in text.split()]
    unsc = kw.get("unscored", [])
    tg = [{"word": i, "index": [SLOT[w.lower()]]} for i, w in enumerate(ws) if w.lower() in SLOT and w not in unsc]
    d = {"text": text, "targets": tg, "culture": culture}
    d.update(kw); return d
def P(a, bb): return {"type": "weak", "a": a, "b": bb}
d = {
 "cando": b("Em đọc to, of, and, can, for... thành âm yếu /ə/ khi nói nhanh, và vẫn nhấn rõ từ chính.",
            "I can reduce to, of, and, can, for in fluent sentences while keeping the content words clear."),
 "why": [
  b("Tiếng Việt không có hiện tượng rút gọn nguyên âm: mỗi âm tiết thường giữ nguyên chất giọng. Vì vậy người học thường đọc to thành [tuː] và and thành [æn] ở giữa câu, nghe nặng và đều từng chữ. Điều này được báo cáo trong các nghiên cứu nhỏ.",
    "Vietnamese has no vowel reduction: each syllable usually keeps its full vowel. Learners often say to as [tuː] and and as [æn] mid-sentence, so speech sounds heavy and even. This is reported in small studies.",
    ["[B7]", "[B17]"]),
  b("Trong tiếng Anh nói nhanh, các từ chức năng (to, of, and, can, for, a, the) thường được đọc yếu /ə/ hoặc ngắn. Được báo cáo rằng dạy dạng yếu giúp người học vừa nghe hiểu vừa nói tự nhiên hơn.",
    "In fluent English, function words (to, of, and, can, for, a, the) are usually weak: a short /ə/ or reduced sound. Teaching weak forms is reported to help learners both understand and sound natural.",
    ["[B17]", "[B10]"]),
  b("Dạng yếu không bắt buộc để hiểu nhau trong mọi tình huống, nên bài này là mức ưu tiên thấp hơn các âm cuối (P3). Nhưng nghe được dạng yếu giúp em hiểu người bản ngữ nói nhanh.",
    "Weak forms are not always required for mutual understanding, so this unit is lower priority than final sounds (P3). But hearing them helps you understand fast native speech.",
    ["[B16]"]),
 ],
 "howTo": [
  b("Nghe câu mẫu \"I want to go.\" Chữ to rất nhẹ và ngắn, gần như \"tờ\". Nói chữ to với miệng thả lỏng, không tròn môi như \"tu\".",
    "In \"I want to go\", to is light and short, like \"tuh\". Keep your mouth relaxed; do not round the lips as in \"too\"."),
  b("Từ chính (động từ, danh từ, tính từ) nói to, rõ, hơi dài. Từ chức năng (to, of, and, a, the) nói nhỏ và ngắn.",
    "Content words (verbs, nouns, adjectives) are louder, clearer and a bit longer. Function words (to, of, and, a, the) are quieter and shorter."),
  b("Đọc \"cup of tea\" như \"cup-uv-tea\": of thành \"ờv\" rất nhẹ, nối liền với cup. Đọc \"fish and rice\" như \"fish-'n'-rice\".",
    "Say \"cup of tea\" as \"cup-uv-tea\": of becomes a light \"uv\" joined to cup. Say \"fish and rice\" as \"fish-n-rice\"."),
  b("Khi can đứng trước động từ, đọc yếu \"kờn\". Trong can't, vẫn giữ nguyên âm đầy đủ và nhấn rõ: \"I can swim\" và \"I can't swim\" khác nhau ở độ mạnh của can.",
    "Before a verb, can is weak \"kn\". In can't, keep the full vowel and stress it; that is the difference between the two."),
 ],
 "pairs": [P("I can swim.", "I can't swim."), P("We can go.", "We can't go."), P("She can come.", "She can't come.")],
 "sentences": [
  S("I like to walk to the beach.", True),
  S("The bridge is lovely at night.", True),
  S("A cup of tea and some fruit.", False),
  S("We can eat fish and rice from the market.", True),
  S("She was happy to see them.", False),
  S("The lights in Hội An are lovely at night.", True, unscored=["Hội", "An"]),
  S("Some friends can swim to the island.", False),
  S("Let's go to the river and look at the boats.", True),
  S("Can you wait for a minute?", False),
  S("The weather was hot and sunny at the beach.", True),
  S("I bought a gift for them from the market.", True, lemmas={"bought": "buy"}),
 ],
 "contrasts": [
  {"wrongText": "I WANT TOO GO TOO THE BEACH. (every word strong, to = [tuː])",
   "rightText": "I WANT tuh GO tuh the BEACH. (to = weak [tə])",
   "note": b("Chữ to đọc đầy đủ \"tu\" làm câu nặng và đều. Thả lỏng môi, nói ngắn \"tờ\".", "Saying to as a full \"too\" makes the sentence heavy and even. Relax the lips and say a short \"tuh\".")},
  {"wrongText": "A cup OFF tea AND some fish. (of = [ɔf], and = [æn])",
   "rightText": "A CUP-uv-TEA-n-some FISH. (of = [əv], and = [ən] joined)",
   "note": b("Of nói như \"off\" và and nói như \"ản\" tách rời. Nối of vào từ trước (\"cup-uv\") và rút and thành \"-n\".", "Of said like \"off\" and and said as a separate \"an\". Join of to the word before (\"cup-uv\") and shrink and to \"-n\".")},
  {"wrongText": "I can swim. = I CAN swim. (can strong, sounds like can't)",
   "rightText": "I kn SWIM. (can weak) / I CAN'T swim. (can't strong)",
   "note": b("Nếu can nhấn mạnh, người nghe dễ hiểu thành can't. Câu khẳng định: can yếu, từ chính swim mạnh.", "If can is stressed, listeners may hear can't. In a positive sentence keep can weak and make the content word swim strong.")},
 ],
 "chain": [
  {"text": "I want to go to the beach.", "shadow": [
    b("Nghe câu mẫu hai lần, chỉ chú ý từ nào to rõ (want, go, beach) và từ nào rất nhẹ (to, the).", "Listen to the model twice and notice only which words are loud (want, go, beach) and which are very light (to, the)."),
    b("Ngân nga (hum) nhịp mạnh-nhẹ của câu, không nói chữ.", "Hum the strong-light beat of the sentence without words."),
    b("Thì thầm cùng lúc với âm thanh mẫu, bắt chước hình dạng, không bắt chước giọng.", "Whisper along with the audio, copying the shape, not the voice."),
    b("Nói thành tiếng cùng với âm thanh mẫu; nhìn đường cao độ và khớp hình dạng.", "Speak aloud with the audio; watch the pitch line and match its shape."),
    b("Nói một mình, không có âm thanh; so sánh với đường cao độ của mẫu.", "Speak alone with no audio; compare with the model pitch line."),
   ],
   "note": b("Bắt chước hình dạng đường cao độ, không bắt chước giọng của người nói mẫu.", "Copy the shape of the pitch line, not the model speaker's voice.")},
 ],
 "selfCheck": b("Ghi âm 3 câu, nghe lại: các từ to, of, and, a, the có nhẹ và ngắn hơn từ chính không? Có nghe \"tu\" hay \"off\" nặng không? Thử cặp \"I can swim / I can't swim\" xem người nghe có phân biệt được không.",
                "Record three sentences and listen back: are to, of, and, a, the lighter and shorter than the content words? Do you hear a heavy \"too\" or \"off\"? Try the pair \"I can swim / I can't swim\" to see whether a listener can tell them apart."),
 "teacherNotes": b("Một số người nói chưa quen rút gọn nguyên âm nên đọc đủ từng chữ; đừng xem đó là sai nếu người nghe vẫn hiểu, vì dạng đầy đủ cũng được dùng khi nhấn mạnh hoặc đứng cuối câu (\"Yes, I can.\"). Phần mềm chỉ ước lượng nguyên âm mạnh ở vị trí yếu (độ tin cậy thấp, chưa đo trên học sinh thật), không đo độ dài hay độ lớn; nên chỉ dùng điểm để tham khảo, cùng với phần tự kiểm tra. Cặp can/can't chỉ kiểm tra qua nghe, không chấm bằng quy tắc âm vị.",
                   "Some speakers are not used to vowel reduction and give every word its full vowel; do not count that as wrong if the listener understands, since full forms are also used for emphasis or at the end of a sentence (\"Yes, I can.\"). The app only estimates a strong vowel in a weak slot (low confidence, not yet measured on real students); it does not measure duration or loudness, so treat the score as a guide alongside the self-check. The can/can't pair is a listening check only, not scored by a phone rule."),
}
d["id"] = "U16"
with open(os.path.join(HERE, "authored", "u16.json"), "w", encoding="utf-8", newline=chr(10)) as f:
    f.write(json.dumps(d, indent=2, ensure_ascii=False) + chr(10))

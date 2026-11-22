import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
def b(vi, en): return {"vi": vi, "en": en}
DROP1 = ("Bỏ mất phụ âm cuối cùng của cụm.", "The last consonant of the cluster is dropped.")
DROP2 = ("Bỏ mất hai phụ âm cuối; chỉ còn nguyên âm và một phụ âm.", "Two final consonants dropped; only the vowel and one consonant remain.")
INS = ("Chèn nguyên âm \"ờ\" vào giữa cụm.", "A vowel \"uh\" is inserted inside the cluster.")
def w(text, lemma, errs, cl, mo=None):
    t = [{"index": cl}]
    if mo is not None: t.append({"index": [mo], "morph": True})
    d = {"text": text, "targets": t, "errors": [{"variantIpa": e, "note": b(*n)} for e, n in errs]}
    if lemma: d["lemma"] = lemma
    return d
words = [
 w("texts", "text", [("t ɛ k s", DROP1), ("t ɛ k", DROP2)], [-4, -3, -2], -1),
 w("months", "month", [("m ʌ n s", DROP1), ("m ʌ n", DROP2)], [-3, -2], -1),
 w("landmarks", "landmark", [("l æ n m ɑː ɹ k s", ("Bỏ mất /d/ ở giữa cụm.", "The /d/ in the middle cluster is dropped.")), ("l æ n d m ɑː ɹ k", DROP1)], [2, 3]),
 w("crafts", "craft", [("k ɹ æ f s", DROP1), ("k ɹ æ f", DROP2)], [-3, -2], -1),
 w("helped", "help", [("h ɛ l p", DROP1), ("h ɛ l ə p t", INS)], [-3, -2], -1),
 w("jumped", "jump", [("dʒ ʌ m p", DROP1), ("dʒ ʌ m", DROP2)], [-3, -2], -1),
 w("guests", "guest", [("ɡ ɛ s t", DROP1), ("ɡ ɛ s", DROP2)], [-3, -2], -1),
 w("tasks", "task", [("t æ s k", DROP1), ("t æ s", DROP2)], [-3, -2], -1),
 w("desks", "desk", [("d ɛ s k", DROP1), ("d ɛ s", DROP2)], [-3, -2], -1),
 w("lamps", "lamp", [("l æ m p", DROP1), ("l æ m ə p s", INS)], [-3, -2], -1),
 w("hands", "hand", [("h æ n d", DROP1), ("h æ n", DROP2)], [-3, -2], -1),
 w("next", None, [("n ɛ k s", DROP1), ("n ɛ k", DROP2)], [-3, -2, -1]),
]
def s(text, tg, culture=False, **kw):
    out = []
    for item in tg:
        d = {"word": item[0], "index": item[1]}
        if len(item) > 2: d["morph"] = True
        out.append(d)
    return {"text": text, "targets": out, "culture": culture, **kw}
sentences = [
 s("Hội An is full of lamps and crafts by the river.", [(5, [-3, -2]), (5, [-1], 1), (7, [-3, -2]), (7, [-1], 1)], True, unscored=["Hội", "An"]),
 s("The guests helped carry the boats down to the river.", [(1, [-3, -2]), (1, [-1], 1), (2, [-3, -2]), (2, [-1], 1)], True),
 s("Next month the weather in Huế may be wet and cold.", [(0, [-3, -2, -1]), (1, [-2, -1])], True, unscored=["Huế"]),
 s("Please put the desks next to the lamps.", [(3, [-3, -2]), (3, [-1], 1), (4, [-3, -2, -1]), (7, [-3, -2]), (7, [-1], 1)]),
 s("She jumped off the step and I helped her stand.", [(1, [-3, -2]), (1, [-1], 1), (7, [-3, -2]), (7, [-1], 1)]),
]
pairs = [{"a": a, "b": c, "type": "deletion"} for a, c in
         [("pass", "past"), ("bell", "belt"), ("ten", "tent"), ("fell", "felt"), ("miss", "mist")]]
contrasts = [
 {"wrong": "t ɛ k s", "right": "t ɛ k s t s", "note": b("Texts nghe như text. Sau /k/, giữ lưỡi ở nướu cho /s/, chạm /t/ rồi lại /s/ liền nhau.", "Texts sounds like text. After /k/, keep the tongue at the ridge for /s/, touch /t/, then /s/ again, all joined.")},
 {"wrong": "h ɛ l p", "right": "h ɛ l p t", "note": b("Helped nghe như help. Sau /p/ chỉ cần chạm lưỡi thêm /t/ ngắn, không rung cổ.", "Helped sounds like help. After /p/ just touch the tongue for a short /t/ with no voice.")},
 {"wrong": "l æ m ə p s", "right": "l æ m p s", "note": b("Đừng chèn \"ờ\" giữa các phụ âm. Mím môi cho /p/ rồi thổi /s/ ngay.", "Do not put \"uh\" between consonants. Close the lips for /p/ and blow /s/ right away.")},
 {"wrong": "p æ s", "right": "p æ s t", "note": b("Pass và past khác nhau ở /t/ cuối. Giữ /s/, rồi chạm đầu lưỡi lên nướu thêm /t/.", "Pass and past differ in the final /t/. Hold /s/, then touch the tongue tip to the ridge for /t/.")},
]
def ch(text, steps, vi, en): return {"text": text, "steps": steps, "note": b(vi, en)}
chain = [
 ch("s → ts → sts → ksts → ɛksts → texts", ["s", "t s", "s t s", "k s t s", "ɛ k s t s", "t ɛ k s t s"], "Nói từ cuối ra đầu, mỗi bước thêm một âm, không chèn nguyên âm. Giữ /s/ và /t/ sát nhau.", "Say it from the end, adding one sound per step with no vowel in between. Keep /s/ and /t/ close together."),
 ch("t → pt → lpt → ɛlpt → helped", ["t", "p t", "l p t", "ɛ l p t", "h ɛ l p t"], "Mím môi cho /p/, rồi chạm lưỡi cho /t/ ngay, không thả thành nguyên âm.", "Close the lips for /p/, then touch the tongue for /t/ at once, with no vowel release."),
 ch("s → θs → nθs → ʌnθs → months", ["s", "θ s", "n θ s", "ʌ n θ s", "m ʌ n θ s"], "Đặt đầu lưỡi giữa răng cho /θ/ rồi lùi về /s/; mỗi bước nối liền với bước trước.", "Put the tongue tip between the teeth for /θ/, then pull back to /s/; join each step to the one before."),
 ch("ks → ɹks → ɑːɹks → mɑːɹks → dmɑːɹks → landmarks", ["k s", "ɹ k s", "ɑː ɹ k s", "m ɑː ɹ k s", "d m ɑː ɹ k s", "n d m ɑː ɹ k s", "l æ n d m ɑː ɹ k s"], "Chia landmarks làm hai cụm: nd và rks. Luyện từng cụm trước rồi ghép lại.", "Split landmarks into two clusters: nd and rks. Practise each first, then join them."),
]
d = {
 "cando": b("Em giữ đủ mọi phụ âm ở cuối từ như texts, months, landmarks.", "I can keep every consonant at the end of words like texts, months, landmarks."),
 "why": [
  b("Âm tiết tiếng Việt chuẩn chỉ kết thúc bằng một phụ âm, nên cụm cuối như /ksts/ trong texts thường bị rút gọn thành text hoặc tek. Việc bỏ một phần của cụm được báo cáo là lỗi thường gặp ở học sinh Việt.",
    "Standard Vietnamese syllables end in only one consonant, so final clusters like /ksts/ in texts are often shortened to text or tek. Dropping part of a cluster is reported as a common error among Vietnamese learners.") | {"refs": ["[4]", "[14]"]},
  b("Đuôi -s và -ed thường nằm ngay sau cụm (lamps, helped, months), nên khi bỏ chúng người nghe mất thông tin về số nhiều hoặc thì quá khứ. Các nghiên cứu được báo cáo thấy việc bỏ đuôi nhiều hơn sau phụ âm.",
    "The -s and -ed endings often sit right after a cluster (lamps, helped, months), so dropping them loses plural or past-tense information. Studies report more ending omission after consonants.") | {"refs": ["[13]", "[2]"]},
  b("Cặp như pass–past, bell–belt, ten–tent chỉ khác nhau ở một phụ âm cuối; thiếu âm đó làm hai từ trùng nhau. Phụ âm là nhóm âm cốt lõi để hiểu nhau trong tiếng Anh quốc tế, nên bài có ưu tiên cao (P1).",
    "Pairs like pass–past, bell–belt, ten–tent differ only in one final consonant; leaving it out makes the two words collide. Consonants are core sounds for mutual intelligibility in international English, so this unit is high priority (P1).") | {"refs": ["[B16]", "[B15]"]},
 ],
 "howTo": [
  b("Luyện từ cuối ra đầu: nói âm cuối, thêm một âm mỗi lần, như s, ts, kts, ɛkts, tɛkts. Dùng dãy luyện bên dưới.", "Practise from the end: say the last sound, then add one sound each time, like s, ts, kts, ɛkts, tɛkts. Use the chain below."),
  b("Giữ đầu lưỡi gần nướu sau răng trên: /s/ thổi mảnh, rồi chạm lưỡi thành /t/ ngắn mà không buông thành nguyên âm.", "Keep the tongue tip near the ridge behind the top teeth: blow a thin /s/, then touch a short /t/. No vowel after it."),
  b("Đừng chèn \"ờ\" giữa các phụ âm: lamps không phải \"lam-pờ-sờ\". Đặt tay trước miệng, /p/ và /s/ phải đến liền nhau.", "Do not insert \"uh\" between consonants: lamps is not \"lam-puh-suh\". Join /p/ and /s/ with no gap."),
  b("Với pass–past: nói pass, giữ lưỡi gần nướu, rồi chạm lên nướu thêm /t/ ngắn, không rung cổ.", "For pass–past: say pass, keep the tongue near the ridge, then touch up for a short /t/ with no voice."),
 ],
 "words": words, "pairs": pairs, "sentences": sentences, "contrasts": contrasts, "chain": chain,
 "selfCheck": b("Ghi âm: nói texts, helped, lamps và cặp pass–past. Em có nghe đủ mọi phụ âm cuối, không có \"ờ\" chen giữa không?",
                "Record texts, helped, lamps and the pair pass–past. Can you hear every final consonant, with no \"uh\" between them?"),
 "teacherNotes": b("Một số người nói tiếng Việt có thể rút gọn cụm cuối nhiều hơn, nhất là cụm ba phụ âm; không coi đó là khuyết điểm của người học. Trong lời nói tự nhiên, người bản ngữ cũng có thể nuốt /t/ giữa cụm (next day, texts); bài này luyện đọc rõ từng âm, và phần mềm chỉ đếm các phụ âm đã được nói ra khi văn bản mục tiêu đã biết. Phần mềm không đo độ ngắn của /t/ hay độ bật hơi. Độ tin cậy phát hiện: cao, chưa được đo trên học sinh thật.",
                   "Some Vietnamese speakers may reduce final clusters more, especially three-consonant clusters; do not treat this as a learner flaw. In natural speech native speakers can also drop the middle /t/ (next day, texts); this unit trains clear, full sounds, and the app only counts the consonants spoken when the target text is known. It does not judge the shortness of /t/ or aspiration. Detection confidence: high, not yet measured on real students."),
 "id": "U15",
}
with open(os.path.join(HERE, "authored", "u15.json"), "w", encoding="utf-8", newline="\n") as f:
    f.write(json.dumps(d, indent=2, ensure_ascii=False) + "\n")

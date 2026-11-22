import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
def b(vi, en): return {"vi": vi, "en": en}
DROP = ("Bỏ mất đuôi -ed.", "The -ed ending is dropped.")
EXTRA = ("Thêm âm tiết thừa /ɪd/; chỉ cần /t/ ngắn.", "An extra syllable /ɪd/; only a short /t/ is needed.")
VT = ("Dùng /t/ vô thanh thay cho /d/.", "Voiceless /t/ used instead of /d/.")
def w(text, errs, idx, **kw):
    return {"text": text, "lemma": text[:-2] if text in ("walked","cooked","watched","played","visited","wanted","painted") else (text[:-2] if text in ("cleaned","rained") else "stop"), "targets": [{"index": idx, "morph": True}],
            "errors": [{"variantIpa": e, "note": b(*n)} for e, n in errs], **kw}
T = [-1]
ID = [-2, -1]
LOSTD = ("Thiếu /d/ ở cuối.", "Missing final /d/.")
LOSTS = ("Bỏ mất âm tiết -ed /ɪd/.", "The whole -ed syllable /ɪd/ is dropped.")
words = [
 w("walked", [("w ɔː k", DROP), ("w ɔː k ɪ d", EXTRA)], T),
 w("cooked", [("k ʊ k", DROP), ("k ʊ k ɪ d", EXTRA)], T),
 w("stopped", [("s t ɑː p", DROP), ("s t ɑː p ɪ d", EXTRA)], T),
 w("watched", [("w ɑː tʃ", DROP), ("w ɑː tʃ ɪ d", EXTRA)], T),
 w("played", [("p l eɪ", DROP), ("p l eɪ t", VT)], T),
 w("cleaned", [("k l iː n", DROP), ("k l iː n t", VT)], T),
 w("rained", [("ɹ eɪ n", DROP), ("ɹ eɪ n t", VT)], T),
 w("visited", [("v ɪ z ɪ t", LOSTS), ("v ɪ z ɪ t ɪ", LOSTD)], ID),
 w("wanted", [("w ɔː n t", LOSTS), ("w ɔː n t ɪ", LOSTD)], ID),
 w("painted", [("p eɪ n t", LOSTS), ("p eɪ n t ɪ", LOSTD)], ID),
]
def s(text, tg, culture=False, **kw):
    return {"text": text, "targets": [{"word": i, "index": ix, "morph": True} for i, ix in tg], "culture": culture, **kw}
sentences = [
 s("We walked along the beach and watched the boats.", [(1, T), (6, T)], True),
 s("It rained in Huế, but we played games and watched the river.", [(1, T), (6, T), (9, T)], True, unscored=["Huế"]),
 s("We walked across the bridge and visited a market in Hội An.", [(1, T), (6, ID)], True, unscored=["Hội", "An"]),
 s("My mother cooked fish and cleaned the table.", [(2, T), (5, T)]),
 s("He started the lesson and wanted to listen.", [(1, ID), (5, ID)]),
]
pairs = [{"a": a, "b": c, "type": "deletion"} for a, c in
         [("play", "played"), ("rain", "rained"), ("clean", "cleaned"), ("walk", "walked"), ("cook", "cooked"), ("stop", "stopped")]]
contrasts = [
 {"wrong": "w ɔː k", "right": "w ɔː k t", "note": b("Walked nghe như walk. Sau /k/, chạm đầu lưỡi lên nướu và thả /t/ nhẹ, không thêm nguyên âm.", "Walked sounds like walk. After /k/ touch the tongue tip to the ridge and release a light /t/, with no vowel.")},
 {"wrong": "w ɔː k ɪ d", "right": "w ɔː k t", "note": b("Đừng đọc walked thành hai âm tiết. Sau âm vô thanh (/k p tʃ/) chỉ có /t/ ngắn.", "Do not say walked as two syllables. After a voiceless sound (/k p tʃ/) there is only a short /t/.")},
 {"wrong": "p l eɪ", "right": "p l eɪ d", "note": b("Played nghe như play. Sau nguyên âm, thêm /d/ có rung cổ ở cuối.", "Played sounds like play. After a vowel, add a voiced /d/ at the end.")},
 {"wrong": "w ɔː n t", "right": "w ɔː n t ɪ d", "note": b("Sau /t/ hoặc /d/, -ed là một âm tiết riêng /ɪd/: wanted có hai âm tiết.", "After /t/ or /d/, -ed is its own syllable /ɪd/: wanted has two syllables.")},
]
def ch(text, steps, vi, en): return {"text": text, "steps": steps, "note": b(vi, en)}
chain = [
 ch("kt → ɔːkt → walked", ["k t", "ɔː k t", "w ɔː k t"], "Nói phần cuối trước. Giữ /k/ rồi /t/ liền nhau, không chen nguyên âm.", "Say the end first. Keep /k/ then /t/ together with no vowel between."),
 ch("pt → ɑːpt → stopped", ["p t", "ɑː p t", "s t ɑː p t"], "Mím môi cho /p/, rồi chạm lưỡi cho /t/.", "Close the lips for /p/, then touch the tongue for /t/."),
]
d = {
 "cando": b("Em chọn và nói đúng đuôi -ed: /t/, /d/ hoặc /ɪd/.", "I can choose and say the right -ed ending: /t/, /d/ or /ɪd/."),
 "why": [
  b("Tiếng Việt không chia động từ theo thì, nên đuôi -ed thường bị bỏ khi nói tiếng Anh: walked nghe như walk. Các nghiên cứu về đuôi -ed của học sinh Việt được báo cáo là thường gặp lỗi bỏ đuôi, nhất là sau phụ âm.",
    "Vietnamese does not mark tense on verbs, so -ed is often dropped in English: walked sounds like walk. Studies of Vietnamese learners' -ed are reported to commonly find ending omission, especially after consonants.") | {"refs": ["[13]", "[14]"]},
  b("Đuôi -ed có ba cách đọc và cách chọn theo quy tắc đơn giản: /ɪd/ sau t, d; /t/ sau các âm vô thanh khác; /d/ sau nguyên âm và âm hữu thanh.",
    "The -ed ending has three sounds and the choice follows a simple rule: /ɪd/ after t, d; /t/ after other voiceless sounds; /d/ after vowels and voiced sounds.") | {"refs": ["[B16]"]},
  b("Thiếu đuôi -ed làm người nghe không biết việc xảy ra khi nào; đây là điểm ưu tiên cao (P1) để người nghe hiểu mình.",
    "A missing -ed leaves the listener unsure when something happened; this is a high-priority (P1) point for being understood.") | {"refs": ["[B15]"]},
 ],
 "howTo": [
  b("Quy tắc 1: sau t hoặc d, -ed là một âm tiết mới /ɪd/ (wanted, needed). Đếm nhịp: want-ed có hai nhịp.", "Rule 1: after t or d, -ed is a new syllable /ɪd/ (wanted, needed). Count beats: want-ed has two."),
  b("Quy tắc 2: sau âm vô thanh (k, p, ch, s, f) chỉ thêm /t/ ngắn, không rung cổ (walked, stopped, watched).", "Rule 2: after a voiceless sound (k, p, ch, s, f) add only a short /t/ with no voice (walked, stopped, watched)."),
  b("Quy tắc 3: sau nguyên âm hoặc âm hữu thanh thêm /d/; đặt tay lên cổ phải thấy rung (played, cleaned, rained).", "Rule 3: after a vowel or voiced sound add /d/; a hand on your throat should feel a buzz (played, cleaned, rained)."),
  b("Chạm đầu lưỡi lên nướu sau răng trên để đóng /t/ hoặc /d/ rồi thả nhẹ. Đừng dừng ở cổ họng.", "Touch the tongue tip to the ridge behind the top teeth for /t/ or /d/, then release lightly. Do not stop in the throat."),
 ],
 "words": words, "pairs": pairs, "sentences": sentences, "contrasts": contrasts, "chain": chain,
 "selfCheck": b("Ghi âm: nói walked, played, wanted. Em có nghe rõ /t/, /d/ và một âm tiết /ɪd/ không? Thử cặp play–played để chắc người nghe nhận ra đuôi.",
                "Record walked, played and wanted. Can you hear a /t/, a /d/ and a clear extra syllable /ɪd/? Try play–played to be sure a listener hears the ending."),
 "teacherNotes": b("Một số người nói tiếng Việt vùng miền Trung hoặc vùng khác có thể nuốt âm cuối nhiều hơn; không coi đó là khuyết điểm của người học. Phần mềm chỉ chấm khi văn bản mục tiêu đã biết (đọc theo mẫu) và chỉ phát hiện mất đuôi hay sai dạng; không đo độ ngắn của /t/ hay độ rung của /d/. Một số giọng Anh nuốt /t/ cuối khi nói nhanh: chấp nhận nếu vẫn hiểu. Độ tin cậy phát hiện: cao, chưa được đo trên học sinh thật.",
                   "Some speakers from Central Vietnam and other regions may reduce final sounds more; do not treat it as a learner flaw. The app scores only when the target text is known (read-aloud) and only detects a missing or wrong ending; it does not judge the shortness of /t/ or the voicing of /d/. Some English accents drop a final /t/ in fast speech: accept it if the listener understands. Detection confidence: high, not yet measured on real students."),
 "id": "U09",
}
with open(os.path.join(HERE, "authored", "u09.json"), "w", encoding="utf-8", newline="\n") as f:
    f.write(json.dumps(d, indent=2, ensure_ascii=False) + "\n")

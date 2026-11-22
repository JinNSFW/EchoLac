import sys,os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from b2lib import *
d = {}
d["cando"] = B("Em nối các từ qua phụ âm (next day, ten people) không thêm nguyên âm, không ngắt và không đóng họng; được phép nuốt hoặc đồng hoá âm tự nhiên.",
               "I can join words across consonants (next day, ten people) with no added vowel, pause or glottal stop; natural elision and assimilation are fine.")
d["why"] = [
 {**B("Tiếng Việt ít có cụm phụ âm cuối, nên khi hai phụ âm gặp nhau (next day, last time) người học Việt thường được báo cáo là chèn thêm một nguyên âm (\"nếch-xờ đây\") hoặc ngắt giữa hai từ.",
 "Vietnamese has few final consonant clusters, so when two consonants meet (next day, last time) Vietnamese learners are often reported to insert a vowel (\"next-uh day\") or pause between the words."), "refs": ["[1]", "[8]"]},
 {**B("Người bản ngữ không đọc từng âm: trong lời nói tự nhiên /t/ hoặc /d/ giữa hai phụ âm hay bị nuốt (nex(t) day, ol(d) town) và /n/ có thể đổi theo âm sau (ten people nghe gần như tem people). Đây là dạng đúng, không phải lỗi.",
 "Native speakers do not say every sound: in natural speech a /t/ or /d/ between two consonants is often dropped (nex(t) day, ol(d) town) and /n/ may shift to match the next sound (ten people sounds close to tem people). These are correct forms, not mistakes."), "refs": ["[B17]"]},
 {**B("Bài này có độ tin cậy phát hiện thấp: phần mềm không phân biệt chắc chắn nuốt âm với bỏ sót âm. Em tự kiểm tra bằng cách nghe lại, bắt chước theo mẫu (shadowing) và so với cả hai dạng nối.",
 "Detection confidence is low: the app cannot reliably tell a natural dropped sound from a missed one. Check yourself by listening back, shadowing the model and comparing with both linked forms."), "refs": ["[B17]", "[B10]"]},
]
d["howTo"] = [
 B("Khi hai phụ âm gặp nhau, không thêm nguyên âm: next day nói \"nếks-đây\", không phải \"nếks-ờ đây\". Môi và lưỡi chuyển thẳng sang âm sau.",
   "When two consonants meet, add no vowel: next day is \"nexs-day\", not \"next-uh day\". Lips and tongue move straight to the next sound."),
 B("Cho phép /t/ hoặc /d/ giữa bị nuốt: nex(t) day, las(t) time, ol(d) town. Lưỡi vẫn chạm vị trí nhưng không bật hơi.",
   "Let the middle /t/ or /d/ drop: nex(t) day, las(t) time, ol(d) town. The tongue still moves to the spot but gives no burst."),
 B("Cho phép đồng hoá: ten people ≈ tem people, good boy ≈ goob boy, green park ≈ greem park (môi khép sớm để chuẩn bị /p/, /b/).",
   "Allow assimilation: ten people sounds like tem people, good boy like goob boy. Lips close early for /p/ and /b/."),
 B("Giữ hơi liền, không ngắt hay đóng họng: hot dog, fish sauce nói một hơi như một từ dài.",
   "Keep the air flowing with no pause or throat closing: say hot dog and fish sauce in one breath, like one long word."),
]
d["pairs"] = [{"type": "juncture", "a": "gray tape", "b": "great ape"}, {"type": "juncture", "a": "a notion", "b": "an ocean"}]
def lk(after, ty, vi, en): return {"after": after, "type": ty, "note": B(vi, en)}
CV = lambda a: lk(a, "CV", "Phụ âm cuối nối sang nguyên âm sau.", "Final consonant joins the next vowel.")
EL = lambda a, w: lk(a, "elision", "Âm cuối giữa hai phụ âm có thể bị nuốt (%s)." % w, "A final sound between two consonants may drop (%s)." % w)
AS = lambda a, w: lk(a, "assimilation", "Âm cuối đổi theo phụ âm sau (%s). Dạng này đúng." % w, "The final sound shifts to match the next consonant (%s). This is correct." % w)
def s(text, links, culture=False, **kw):
    tg = [{"word": l["after"], "index": [-1], "category": "linking"} for l in links]
    x = {"text": text, "targets": tg, "culture": culture, "prosody": {"links": links}}; x.update(kw); return x
d["sentences"] = [
 s("I will see you next day.", [EL(4, "nex(t) day")], alts={"4": [1]}),
 s("It was the last time.", [EL(3, "las(t) time")], alts={"3": [1]}),
 s("We walked through the old town in Hội An.", [EL(4, "ol(d) town"), CV(5)], True, unscored=["Hội", "An"], alts={"4": [["oʊ", "l"]]}),
 s("This lantern is handmade in Hội An.", [CV(1), CV(3)], True, unscored=["Hội", "An"], cefrNull={"lantern": "x", "handmade": "x"}),
 s("He is a good boy.", [CV(1), AS(3, "goob boy")], alts={"3": [["ɡ", "ʊ", "b"]]}),
 s("Ten people waited by the river.", [AS(0, "tem people")], True, alts={"0": [["t", "ɛ", "m"]]}),
 s("We walked in the green park.", [CV(1), AS(4, "greem park")], alts={"4": [["ɡ", "ɹ", "iː", "m"]]}),
 s("I want a hot dog.", [CV(1), EL(3, "ho(t) dog")], alts={"3": [["h", "ɑː"]]}),
 s("Fish sauce is great with noodles in Đà Nẵng.", [AS(0, "fi-ssauce"), CV(1), CV(5)], True, unscored=["Đà", "Nẵng"], cefrNull={"noodles": "x"}, alts={"0": [["f", "ɪ", "s"]]}),
 s("Next day, the beach near Đà Nẵng was quiet.", [EL(0, "nex(t) day")], True, unscored=["Đà", "Nẵng"], alts={"0": [1]}),
]
def T(w, r, vi, en): return {"wrongText": w, "rightText": r, "note": B(vi, en)}
d["contrasts"] = [
 T("next-ơ day (thêm nguyên âm)", "nex(t)‿day", "Em chèn thêm \"ơ\" sau next. Bỏ nguyên âm, cho /t/ nhẹ hoặc bị nuốt rồi nối sang day.", "You add an \"uh\" after next. Drop the vowel and let the /t/ be light or dropped, then join to day."),
 T("last (pause) time", "las(t)‿time", "Em ngắt giữa last và time. Nói liền một hơi, /t/ giữa bị nuốt cũng được.", "You pause between last and time. Say it in one breath; a dropped middle /t/ is fine."),
 T("good [ʔ] boy", "goo(b)‿boy", "Có cú đóng họng giữa good và boy. Khép môi sớm cho /b/: nghe gần như goob boy là đúng.", "There is a glottal stop between good and boy. Close the lips early for /b/: it may sound like goob boy and that is correct."),
 T("ten (pause) people", "te(m)‿people", "Em ngắt sau ten. Cho /n/ chuyển thành /m/ khi môi chuẩn bị /p/, không dừng lại.", "You pause after ten. Let /n/ shift to /m/ as the lips get ready for /p/, with no stop."),
]
SH = lambda: [
 B("Nghe câu mẫu hai lần, chú ý chỗ các từ dính vào nhau và âm nào bị nuốt.", "Listen to the model twice and notice where words stick together and which sound drops."),
 B("Ngân nga (hum) hình dạng nhịp và giọng của cả câu, không nói chữ.", "Hum the rhythm and tune of the whole sentence without words."),
 B("Thì thầm cùng lúc với âm thanh mẫu, giữ hơi liền mạch.", "Whisper along with the audio, keeping the air flowing."),
 B("Nói thành tiếng cùng với âm thanh mẫu; xem đường cao độ và bắt chước hình dạng, không bắt chước giọng.", "Speak aloud with the audio; watch the pitch line and copy its shape, not the voice."),
 B("Nói một mình, không có âm thanh, rồi ghi âm và nghe lại xem có nguyên âm thừa hoặc chỗ ngắt nào không.", "Speak alone with no audio, then record and check for any extra vowel or break."),
]
d["chain"] = [
 {"text": "I will see you next day. / It was the last time.", "shadow": SH(), "note": B("Bắt chước hình dạng đường cao độ, không bắt chước giọng của người mẫu.", "Copy the shape of the pitch line, not the model's voice.")},
 {"text": "Ten people waited by the river. / I want a hot dog.", "shadow": SH(), "note": B("Nghe /m/ thay /n/ trong ten people và chỗ nối trong hot dog.", "Listen for /m/ replacing /n/ in ten people and the join in hot dog.")},
]
d["selfCheck"] = B("Ghi âm next day, last time, ten people, hot dog, fish sauce. Nghe lại: có nguyên âm thừa (\"ơ\"), khoảng lặng hoặc cú đóng họng giữa các từ không? Nếu không, em đạt; nuốt hay đồng hoá âm đều chấp nhận được.",
                   "Record next day, last time, ten people, hot dog and fish sauce. Listen back: is there an extra vowel (\"uh\"), a gap or a glottal stop between the words? If not, you pass; dropped or assimilated sounds are both fine.")
d["teacherNotes"] = B("Một số người nói tiếng Anh, kể cả người Việt ở nhiều vùng, nuốt hoặc đồng hoá âm tự nhiên khi nói nhanh; không quy cho một vùng nào, và cả dạng đầy đủ lẫn dạng rút gọn đều được chấp nhận. Phần mềm không phân biệt chắc chắn âm bị nuốt với âm bị bỏ sót, cũng không đo khoảng lặng hay cú đóng họng; kết quả chỉ là gợi ý, bài được qua nhờ nghe cặp đối lập, tự kiểm tra và (tùy chọn) giáo viên nghe. Tên Hội An, Đà Nẵng không chấm điểm. Độ tin cậy phát hiện: thấp, chưa được đo trên học sinh thật. Handmade chỉ luyện như một từ ghép, không có dạng rút gọn riêng.",
 "Many English speakers, including Vietnamese speakers from many regions, drop or assimilate sounds naturally in fast speech; do not attribute it to one region, and both full and reduced forms are accepted. The app cannot reliably tell a dropped sound from a missed one, and cannot measure pauses or glottal stops; results are hints, and the unit passes by the contrast listening, the self-check and (optionally) a teacher listening. The names Hội An and Đà Nẵng are not scored. Detection confidence: low, not yet measured on real students. Handmade is practised as a compound with no separate reduced form.")
save("U20", d)

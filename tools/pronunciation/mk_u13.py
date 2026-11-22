import sys,os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from b2lib import *
d = {}
d["cando"] = B("Em nối âm cuối phụ âm với nguyên âm của từ sau (pick it up, an apple), không ngắt giọng hay đóng họng.",
               "I can link a final consonant to the next vowel (pick it up, an apple) with no pause or glottal stop.")
d["why"] = [
 {**B("Trong tiếng Việt, mỗi âm tiết thường tách rời rõ ràng, nên khi nói tiếng Anh học sinh hay ngắt hoặc đóng họng (ʔ) giữa hai từ: pick it up nghe như \"pick | it | up\". Điều này được báo cáo là thường gặp ở người học Việt.",
 "In Vietnamese each syllable is usually kept separate, so learners often pause or insert a glottal stop (ʔ) between words: pick it up sounds like \"pick | it | up\". This is reported as common for Vietnamese learners."), "refs": ["[1]", "[8]"]},
 {**B("Người bản ngữ nối phụ âm cuối với nguyên âm đầu của từ sau thành một chuỗi liền mạch (pick it up ≈ pi-ki-tup). Các tổng quan về dạy lời nói liền mạch cho rằng việc này giúp nghe và nói trôi chảy hơn.",
 "Native speakers join a final consonant to the next word's vowel into one smooth chain (pick it up is like pi-ki-tup). Reviews of teaching connected speech suggest this helps both listening and fluent speaking."), "refs": ["[B17]"]},
 {**B("Bài này có độ tin cậy phát hiện thấp: nối âm là chuyện của cả cụm từ, không phải một âm riêng, nên phần mềm chỉ gợi ý. Em tự kiểm tra bằng cách nghe lại và so với mẫu.",
 "Detection confidence is low for this unit: linking belongs to the whole phrase rather than one sound, so the app only gives hints. Check yourself by listening back and comparing with the model."), "refs": ["[B17]", "[B10]"]},
]
d["howTo"] = [
 B("Nối phụ âm với nguyên âm: pick it up nói như \"pi-ki-tắp\". Âm /k/ cuối pick trượt sang đầu it, không dừng lại.",
   "Join consonant to vowel: say pick it up like \"pi-ki-tup\". The final /k/ of pick slides onto the start of it with no stop."),
 B("Giữ hơi thở chảy liên tục qua cả cụm, không có khoảng lặng hay cú đóng ở cổ họng giữa các từ.",
   "Keep air flowing through the whole phrase, with no gap and no throat closing between words."),
 B("Nguyên âm gặp nguyên âm: go out thêm /w/ nhẹ (môi tròn), the end thêm /j/ nhẹ (lưỡi lên như \"i\").",
   "Vowel meets vowel: go out gets a light /w/ (rounded lips), the end a light /j/ (tongue up like \"ee\")."),
 B("Nói chậm từng từ trước, rồi gộp lại thành một nhịp. Với an apple, nói liền một hơi, đừng nói \"an\" rồi nghỉ.",
   "Say each word slowly first, then squeeze them into one beat. With an apple, say it in one run, not \"an\" then a rest."),
]
J = lambda a, b: {"type": "juncture", "a": a, "b": b}
d["pairs"] = [J("an aim","a name"), J("an ice","a nice"), J("ice cream","I scream"), J("that's tough","that stuff")]
def lk(after, ty, vi, en): return {"after": after, "type": ty, "note": B(vi, en)}
CV = lambda a: lk(a, "CV", "Phụ âm cuối nối sang nguyên âm sau.", "Final consonant joins the next vowel.")
def JJ(a, what): return lk(a, "VV_j", "Nguyên âm gặp nguyên âm: thêm /j/ nhẹ (%s)." % what, "Vowel meets vowel: add a light /j/ (%s)." % what)
def s(text, links, culture=False, **kw):
    tg = [{"word": l["after"], "index": [-1], "category": "linking"} for l in links]
    x = {"text": text, "targets": tg, "culture": culture, "prosody": {"links": links}}; x.update(kw); return x
d["sentences"] = [
 s("Pick it up.", [CV(0), CV(1)]),
 s("I want an apple.", [CV(1), CV(2)]),
 s("Look at the old bridge over the river.", [CV(0), JJ(2, "the old"), CV(4)], True, variants={"2": 2}),
 s("Turn off the light.", [CV(0)]),
 s("Come in, please.", [CV(0)]),
 s("Hold on a moment.", [CV(0), CV(1)]),
 s("Let's go out tonight.", [lk(1, "VV_w", "Nguyên âm gặp nguyên âm: thêm /w/ nhẹ.", "Vowel meets vowel: add a light /w/.")]),
 s("This is the end of the day.", [CV(0), JJ(2, "the end"), CV(3)], variants={"2": 2}),
 s("Hội An is old and quiet.", [CV(2), CV(3)], True, unscored=["Hội","An"]),
 s("We eat an ice cream on the beach in Đà Nẵng.", [CV(1), CV(2), CV(7)], True, unscored=["Đà","Nẵng"]),
 s("Try a bowl of mì Quảng at the market.", [JJ(0, "try a"), CV(2)], True, unscored=["mì","Quảng"]),
]
d["contrasts"] = [
 C("p ɪ k ʔ ɪ t ʌ p","p ɪ k ɪ t ʌ p","Em đóng họng hoặc ngắt giữa pick và it. Để /k/ trượt thẳng sang \"it\": pi-ki-tắp.","You close the throat or pause between pick and it. Let the /k/ slide straight into \"it\": pi-ki-tup."),
 C("ɡ oʊ ʔ aʊ t","ɡ oʊ w aʊ t","Giữa go và out có cú đóng họng. Tròn môi nhẹ thành /w/ rồi mở sang \"out\".","There is a throat stop between go and out. Round the lips into a light /w/ and open into \"out\"."),
 C("ð ə ʔ ɛ n d","ð i j ɛ n d","The end bị ngắt và vẫn đọc \"thờ\". Đổi thành \"thi\" rồi trượt /j/ sang \"end\".","The end is broken up and said \"thuh\". Change it to \"thee\" and glide /j/ into \"end\"."),
 C("ə n ʔ æ p ə l","ə n æ p ə l","An và apple bị tách. Nói thành một chuỗi, /n/ làm âm đầu của \"apple\".","An and apple are split. Say one chain, with the /n/ starting \"apple\"."),
]
SH = lambda: [
 B("Nghe câu mẫu hai lần, chú ý chỗ các từ dính vào nhau, không có khoảng lặng.", "Listen to the model twice and notice where words stick together with no gap."),
 B("Ngân nga (hum) hình dạng nhịp và giọng của cả cụm, không nói chữ.", "Hum the rhythm and tune of the whole phrase without words."),
 B("Thì thầm cùng lúc với âm thanh mẫu, giữ hơi liền mạch.", "Whisper along with the audio, keeping the air flowing."),
 B("Nói thành tiếng cùng với âm thanh mẫu; xem đường cao độ và bắt chước hình dạng, không bắt chước giọng.", "Speak aloud with the audio; watch the pitch line and copy its shape, not the voice."),
 B("Nói một mình, không có âm thanh, rồi ghi âm và nghe lại xem có chỗ nào bị ngắt không.", "Speak alone with no audio, then record and check for any break."),
]
d["chain"] = [
 {"text": "Pick it up. / Turn off the light.", "shadow": SH(), "note": B("Bắt chước hình dạng đường cao độ, không bắt chước giọng của người mẫu.", "Copy the shape of the pitch line, not the model's voice.")},
 {"text": "Let's go out tonight. / This is the end of the day.", "shadow": SH(), "note": B("Chú ý /w/ trong go out và /j/ trong the end.", "Listen for the /w/ in go out and the /j/ in the end.")},
]
d["selfCheck"] = B("Ghi âm các cụm pick it up, an apple, go out, the end. Nghe lại: có khoảng lặng hoặc cú đóng họng nào giữa các từ không? Nếu không, em đạt.",
                   "Record pick it up, an apple, go out and the end. Listen back: is there any gap or throat stop between the words? If not, you pass.")
d["teacherNotes"] = B("Một số người nói tiếng Anh, kể cả người Việt ở nhiều vùng, nối âm tự nhiên trong lời nói nhanh; không quy cho một vùng nào. Phần mềm không đo khoảng lặng hay cú đóng họng một cách chắc chắn: nó chỉ so âm nhận được với dạng nối, nên kết quả chỉ là gợi ý; bài được qua nhờ nghe cặp đối lập, tự kiểm tra và (tùy chọn) giáo viên nghe. Tên Hội An, Đà Nẵng, mì Quảng không chấm điểm. Độ tin cậy phát hiện: thấp, chưa được đo trên học sinh thật. Các cặp juncture (an ice / a nice) có cùng chuỗi âm nên chỉ phân biệt được nhờ ngữ cảnh và nhịp.",
 "Many English speakers, including Vietnamese speakers from many regions, link naturally in fast speech; do not attribute it to one region. The app cannot measure pauses or glottal stops reliably: it only compares recognised sounds with the linked form, so results are hints, and the unit passes by the contrast listening, the self-check and (optionally) a teacher listening. The names Hội An, Đà Nẵng and mì Quảng are not scored. Detection confidence: low, not yet measured on real students. Juncture pairs (an ice / a nice) have identical sounds, so only context and rhythm tell them apart.")
save("U13", d)

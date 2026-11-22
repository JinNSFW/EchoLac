import sys,os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from b2lib import *
d = {}
d["cando"] = B("Em nhấn đúng âm tiết trong các từ 2–3 âm tiết như hotel, banana, coffee, market.",
               "I can stress the right syllable in place and food words like hotel, banana, coffee and market.")
d["why"] = [
 {**B("Tiếng Việt có thanh điệu chứ không có trọng âm từ: mỗi âm tiết thường nặng như nhau. Vì vậy học sinh hay nói hotel hoặc computer với các âm tiết đều nhau, hay đặt nhấn sai chỗ (hoTEL → HOtel). Một nghiên cứu nhỏ (45 người) ghi nhận đặt sai trọng âm là lỗi thường gặp ở người học Việt.",
 "Vietnamese uses tones, not word stress, so syllables usually carry equal weight. Learners often say hotel or computer with even syllables or stress the wrong one (hoTEL becomes HOtel). One small study (45 speakers) reports misplaced stress as a common error for Vietnamese learners."), "refs": ["[B3]", "[B4]"]},
 {**B("Trọng âm đúng giúp người nghe hiểu và nhớ từ: một nghiên cứu cho thấy giáo viên và người nghe đánh giá cao hơn khi trọng âm chính đặt đúng. Âm tiết không nhấn thường được đọc ngắn và yếu hơn, hay thành /ə/ (banana: bə-NA-nə).",
 "Correct stress helps listeners understand and remember a word: a study reports that listeners rate speech higher when the main stress is in the right place. Unstressed syllables are usually shorter and weaker, often /ə/ (banana: bə-NA-nə)."), "refs": ["[B13]", "[9]"]},
 {**B("Học sinh Việt thường giữ nguyên nguyên âm đầy đủ ở âm tiết không nhấn (được báo cáo ở cả người học nâng cao), nên mức ưu tiên của bài này là P2.",
 "Vietnamese learners are often reported to keep full vowels in unstressed syllables, even at advanced level, so this unit has priority P2."), "refs": ["[9]", "[B7]"]},
]
d["howTo"] = [
 B("Âm tiết được nhấn dài hơn và to hơn. Đặt tay dưới cằm: ở âm tiết đó miệng mở rộng hơn một chút.",
   "The stressed syllable is longer and louder. Rest a hand under your chin: your mouth opens a bit wider on that syllable."),
 B("Gõ nhịp lên bàn: vỗ mạnh ở âm tiết nhấn, nhẹ ở các âm tiết còn lại. Với hotel: ho-TEL, vỗ nhẹ rồi mạnh.",
   "Tap on the desk: hit hard on the stressed syllable and lightly on the others. For hotel: ho-TEL, light then hard."),
 B("Giữ âm tiết không nhấn thật ngắn và yếu, thường nói thành /ə/ (\"ờ\" ngắn): banana là bờ-NA-nờ, không phải ba-na-na đều nhau.",
   "Keep unstressed syllables short and weak, often a quick \"uh\" /ə/: banana is buh-NA-nuh, not ba-na-na with equal beats."),
 B("Đừng đổi cao độ như dấu sắc hay dấu huyền của tiếng Việt. Nhấn bằng độ dài và độ to, giọng vẫn tự nhiên.",
   "Do not use pitch like a Vietnamese tone mark. Stress with length and loudness, and keep your voice natural."),
 B("Nghe từ mẫu, nói lại, rồi so sánh. Với mỗi từ mới, tra xem nhấn âm tiết số mấy trước khi nói.",
   "Listen to the model, say it back, then compare. For every new word, check which syllable is stressed before you speak."),
]
STR = {"hotel":None}
words = ["hotel","banana","museum","delicious","computer","tomato","tonight","coffee","mountain","festival","market","beautiful"]
d["words"] = [{"text": w, "targets": "stress", "errors": []} for w in words]
d["pairs"] = []
def s(text, tg, culture=False, **kw): return S(text, tg, culture, **kw)
d["sentences"] = [
 s("I love the coffee at the market.", [(3,1),(6,1)], True),
 s("Tonight we eat a delicious dinner.", [(0,2),(4,2)]),
 s("The festival by the river is beautiful.", [(1,1),(6,1)], True),
 s("My hotel is near the beach and the mountain.", [(1,2),(8,1)], True),
 s("The banana and tomato are fresh.", [(1,2),(3,2)]),
]
d["contrasts"] = [
 C("h oʊ t ə l","h oʊ t ɛ l","Hotel nghe như HO-tel: âm tiết cuối bị yếu đi. Nhấn âm tiết thứ hai: ho-TEL, mở miệng rõ ở \"tel\".","Hotel sounds like HO-tel with a weak end. Stress the second syllable: ho-TEL, with a clear open \"tel\"."),
 C("b æ n æ n æ","b ə n æ n ə","Banana đọc ba-na-na đều nhau. Làm âm đầu và cuối thật ngắn (\"ờ\"), chỉ kéo dài và nhấn \"NA\" ở giữa.","Banana said ba-na-na with equal beats. Make the first and last sounds a short \"uh\" and stress only the middle \"NA\"."),
 C("k ɑː m p j uː t ɚ","k ə m p j uː t ɚ","Computer nhấn nhầm âm đầu. Nói \"kờm\" thật nhanh, rồi nhấn \"PU\": kəm-PU-tər.","Computer with a full first vowel. Say a quick \"kuhm\", then stress \"PU\": kəm-PU-tər."),
 C("k ə f iː","k ɑː f i","Coffee bị nhấn sai ở âm tiết thứ hai. Nhấn âm đầu: CAW-fee, âm cuối ngắn và nhẹ.","Coffee stressed on the second syllable. Stress the first: CAW-fee, with a short light ending."),
]
d["selfCheck"] = B("Ghi âm từng từ rồi nghe lại: âm tiết được nhấn có dài và rõ hơn các âm tiết còn lại không? Vỗ tay theo nhịp để kiểm tra bạn nhấn đúng âm tiết số mấy.",
                   "Record each word and listen back: is the stressed syllable longer and clearer than the others? Clap along to check you stress the right syllable.")
d["teacherNotes"] = B("Phần mềm so sánh độ dài, độ to và cao độ của từng âm tiết với âm tiết được nhấn mong đợi; nó không phân biệt được người nói nhấn bằng cách nào. Giọng Anh-Anh đôi khi nhấn khác giọng Mỹ ở một số từ (ví dụ tomato có hai cách đọc nguyên âm nhưng cùng nhấn âm hai); một số người nói tiếng Anh cũng nhấn khác nhau ở từ như coffee hay museum, hãy chấp nhận khi người nghe vẫn hiểu. Học sinh một số vùng có thể quen hơn với thanh điệu nên dễ dùng cao độ thay cho độ dài; không quy cho cả một vùng. Độ tin cậy phát hiện: trung bình, chưa được đo trên học sinh thật; điểm số chỉ là gợi ý và không đánh giá độ tự nhiên của giọng.",
 "The app compares each syllable's length, loudness and pitch with the expected stressed syllable; it cannot tell how a speaker produces the stress. British accents sometimes stress words differently from the General American model used here (tomato has two vowel variants but the same stress on syllable two), and some English speakers also stress words like coffee or museum differently; accept it if listeners understand. Students who are used to tones may use pitch instead of length; do not attribute this to a whole region. Detection confidence: medium, not yet measured on real students; the score is only a hint and does not judge how natural the voice is.")
save("U06", d)

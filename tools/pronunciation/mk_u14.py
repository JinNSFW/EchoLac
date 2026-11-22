import sys,os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from b2lib import *
d = {}
d["cando"] = B("Em nhấn đúng từ ghép như SEAfood, NIGHT market, BUS stop và phân biệt với cụm từ như old TOWN, green HOUSE.",
               "I can say compounds like SEAfood, NIGHT market and BUS stop, and tell them from phrases like old TOWN and green HOUSE.")
d["why"] = [
 {**B("Trong tiếng Anh, từ ghép thường nhấn từ đầu (GREENhouse = nhà kính), còn cụm tính từ + danh từ thường nhấn từ sau (green HOUSE = ngôi nhà màu xanh). Chỉ khác chỗ nhấn là nghĩa đã khác.",
 "In English, compounds usually stress the first part (GREENhouse = a place for plants), while adjective + noun phrases usually stress the last word (green HOUSE = a house that is green). Only the stress place changes the meaning."), "refs": ["[B6]"]},
 {**B("Một nghiên cứu nhỏ ghi nhận người học nâng cao tiếng Anh gốc Việt có thể khớp được cao độ và độ to, nhưng chưa khớp được độ dài (nhịp) của âm tiết, nên bài này luyện cả ba.",
 "A small study reports that advanced Vietnamese-background learners can match pitch and loudness but not syllable timing, so this unit practises all three."), "refs": ["[B6]"]},
 {**B("Tiếng Việt có thanh điệu chứ không có trọng âm từ, nên học sinh thường nói các từ trong một cụm với độ nặng gần như nhau; đặt sai trọng âm là lỗi thường gặp ở người học Việt, và mức ưu tiên của bài này là P2.",
 "Vietnamese uses tones, not word stress, so learners often give every word in a phrase similar weight; misplaced stress is a common error for Vietnamese learners, and this unit has priority P2."), "refs": ["[B3]", "[B13]"]},
]
d["howTo"] = [
 B("Với từ ghép, vỗ mạnh ở từ đầu và nhẹ ở từ sau: SEA-food, SUN-set, BOOK-shop. Từ thứ hai ngắn và nhẹ.",
   "For a compound, hit hard on the first part and lightly on the second: SEA-food, SUN-set, BOOK-shop. Keep the second part short and light."),
 B("Với cụm tính từ + danh từ, nhấn từ cuối: old TOWN, green HOUSE. Từ đầu nhẹ hơn và nhanh hơn.",
   "For adjective + noun phrases, stress the last word: old TOWN, green HOUSE. Make the first word lighter and faster."),
 B("Nhấn bằng độ dài và độ to: kéo dài một chút và mở miệng rộng hơn ở âm tiết nhấn. Không đổi cao độ như dấu sắc.",
   "Stress with length and loudness: hold the stressed syllable a little longer and open your mouth wider. Do not use pitch like a tone mark."),
 B("So sánh hai cách nói của cùng một chữ: GREENhouse (nhà kính) và green HOUSE (ngôi nhà màu xanh). Nghe và nói lại cả hai.",
   "Compare two ways of saying the same letters: GREENhouse (for plants) and green HOUSE (a house that is green). Listen and say both."),
]
d["words"] = [{"text": w, "targets": "stress", "stress": 1, "errors": []} for w in
  ["seafood","sunset","sunrise","bookshop","greenhouse","blackboard","weekend","airport"]]
d["pairs"] = []  # BLOCKED: compound/phrase stress pairs unsupported by build_pron.py (see report)
d["sentences"] = [
 S("I like the night market by the river.", [(3,1),(7,1)], True, prosody={"stressWord":3,"stressSyllable":1}),
 S("We eat fresh seafood on the beach.", [(3,1),(2,1)], True, prosody={"stressWord":3,"stressSyllable":1}),
 S("Hội An is an old town by a quiet river.", [(5,1),(9,1)], True, unscored=["Hội","An"], prosody={"stressWord":5,"stressSyllable":1}),
 S("We wait at the bus stop for the weekend bus.", [(3,1),(4,1)], False, prosody={"stressWord":3,"stressSyllable":1}),
 S("The green house is near the market.", [(1,1),(2,1)], False, prosody={"stressWord":2,"stressSyllable":1}),
]
d["contrasts"] = [
 {"wrongText":"sea-FOOD","rightText":"SEA-food","note":B("Từ ghép bị nhấn ở từ sau. Nhấn từ đầu: SEA-food, và nói \"food\" nhẹ và ngắn.","The compound stressed on the second part. Stress the first: SEA-food, and say \"food\" light and short.")},
 {"wrongText":"GREEN-house (a house that is green)","rightText":"green HOUSE","note":B("Cụm tính từ + danh từ bị nhấn ở từ đầu. Nhấn từ cuối: green HOUSE, và nói \"green\" nhẹ.","An adjective + noun phrase stressed on the first word. Stress the last word: green HOUSE, and say \"green\" lightly.")},
 {"wrongText":"night MAR-ket (both equal)","rightText":"NIGHT mar-ket","note":B("Hai từ nặng như nhau. Nhấn rõ \"night\", để \"market\" yếu và ngắn hơn.","Both words with equal weight. Stress \"night\" clearly and let \"market\" be weaker and shorter.")},
]
d["selfCheck"] = B("Ghi âm từng từ ghép và cụm từ, rồi nghe lại: từ ghép có nhấn từ đầu, cụm từ có nhấn từ cuối không? Vỗ tay theo nhịp để kiểm tra.",
                   "Record each compound and phrase, then listen back: is the first part stressed in compounds and the last word in phrases? Clap along to check.")
d["teacherNotes"] = B("Phần mềm so sánh độ dài, độ to và cao độ của từng âm tiết với vị trí nhấn mong đợi; nó không phân biệt được người nói nhấn bằng cách nào. Quy tắc từ ghép nhấn từ đầu là quy tắc thường gặp, có ngoại lệ (ví dụ một số từ ghép như apple pie nhấn ở từ sau), và giọng Anh-Anh và Anh-Mỹ có thể khác nhau ở một số từ; hãy chấp nhận khi người nghe vẫn hiểu. Một số người dùng cao độ thay cho độ dài vì quen thanh điệu; không quy cho cả một vùng. Độ tin cậy phát hiện: trung bình, chưa được đo trên học sinh thật; điểm số chỉ là gợi ý và không đánh giá độ tự nhiên của giọng.",
 "The app compares each syllable's length, loudness and pitch with the expected stress position; it cannot tell how a speaker produces the stress. First-part stress in compounds is a common pattern with exceptions (some compounds such as apple pie stress the second part), and British and American speakers may differ on some words; accept it if listeners understand. Some speakers use pitch instead of length because they are used to tones; do not attribute this to a whole region. Detection confidence: medium, not yet measured on real students; the score is only a hint and does not judge how natural the voice is.")
save("U14", d)

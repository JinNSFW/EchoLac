import sys,os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from b2lib import *
d = {}
d["cando"] = B("Em chuyển trọng âm đúng khi từ đổi đuôi (photograph → photography) và ở cặp danh từ/động từ (REcord → reCORD).",
               "I can move the stress when a word changes its ending (photograph → photography) and in noun/verb pairs (REcord → reCORD).")
d["why"] = [
 {**B("Trong tiếng Anh, thêm hậu tố có thể làm trọng âm nhảy sang âm tiết khác: PHOtograph nhưng phoTOgraphy. Tiếng Việt có thanh điệu chứ không có trọng âm từ, nên học sinh hay giữ nguyên chỗ nhấn của từ gốc. Đặt sai trọng âm được báo cáo là lỗi thường gặp ở người học Việt.",
 "In English, adding a suffix can move the stress to another syllable: PHOtograph but phoTOgraphy. Vietnamese has tones, not word stress, so learners often keep the stress of the base word. Misplaced stress is reported as a common error for Vietnamese learners.",), "refs": ["[B3]", "[B4]"]},
 {**B("Trọng âm đúng giúp người nghe nhận ra từ: một nghiên cứu cho thấy trọng âm chính đặt đúng làm điểm đánh giá và khả năng nhớ từ tốt hơn. Cặp như REcord (danh từ) và reCORD (động từ) khác nhau chủ yếu ở chỗ nhấn.",
 "Correct stress helps listeners recognise words: a study reports better ratings and recall when the main stress is in the right place. Pairs like REcord (noun) and reCORD (verb) differ mainly in where the stress falls."), "refs": ["[B13]"]},
 {**B("Học sinh Việt thường giữ nguyên nguyên âm đầy đủ ở âm tiết không nhấn, kể cả người học nâng cao, nên khi trọng âm dời đi, âm tiết cũ vẫn bị đọc to và dài. Bài này thuộc mức ưu tiên P2.",
 "Vietnamese learners are often reported to keep full vowels in unstressed syllables, even at advanced level, so after the stress moves the old syllable is still said loud and long. This unit has priority P2."), "refs": ["[9]", "[B7]"]},
]
d["howTo"] = [
 B("Đuôi -tion, -ic, -ity, -ical kéo trọng âm về âm tiết ngay trước nó: celeBRAtion, ecoNOMic, hisTORical.",
   "The endings -tion, -ic, -ity and -ical pull the stress onto the syllable right before them: celeBRAtion, ecoNOMic, hisTORical."),
 B("Với -graphy và -grapher, nhấn âm tiết ngay trước gra: phoTOgraphy, phoTOgrapher. Còn từ gốc là PHOtograph, nhấn âm đầu.",
   "With -graphy and -grapher, stress the syllable before gra: phoTOgraphy, phoTOgrapher. The base word is PHOtograph, stressed first."),
 B("Khi trọng âm dời đi, âm tiết cũ phải ngắn và yếu, thường là /ə/: ở photography, \"pho\" chỉ còn là \"fờ\" ngắn.",
   "When the stress moves, the old syllable becomes short and weak, often /ə/: in photography, \"pho\" is only a quick \"fuh\"."),
 B("Cặp danh từ/động từ: danh từ thường nhấn âm đầu (REcord), động từ nhấn âm sau (reCORD). Nhấn bằng độ dài và độ to, không bằng cao độ.",
   "Noun/verb pairs: the noun is usually stressed first (REcord), the verb second (reCORD). Stress with length and loudness, not pitch."),
 B("Vỗ nhịp theo từ: mạnh ở âm nhấn, nhẹ ở âm còn lại. Đây là quy tắc thường gặp, không phải mọi từ; khi không chắc, tra từ điển.",
   "Clap the rhythm: hard on the stressed syllable, light on the rest. These rules are common, not universal; if unsure, check a dictionary."),
]
words = ["photograph","photography","photographer","history","historical","economy","economic","celebrate","celebration","communication","tradition","traditional"]
d["words"] = [{"text": w, "targets": "stress", "errors": []} for w in words]
d["pairs"] = [
 P("record","record","stress",aVariant=1,bVariant=0),
 P("present","present","stress",aVariant=0,bVariant=1),
 P("increase","increase","stress",aVariant=1,bVariant=0),
 P("import","import","stress",aVariant=1,bVariant=0),
]
d["sentences"] = [
 S("The traditional celebration by the river is lovely.", [(1,2),(2,3)], True),
 S("The photographer likes to photograph the bridge at night.", [(1,2),(4,1)], True),
 S("The history lesson was interesting, but the economic news was boring.", [(1,1),(7,3)]),
 S("Please record the traditional music at the market.", [(1,2),(3,2)], True),
 S("Good communication helps me present my ideas clearly.", [(1,4),(4,2)], False, variants={"4":1}),
]
d["contrasts"] = [
 {"wrongText": "PHOtography (stress stays on the first syllable)", "rightText": "phoTOgraphy (stress moves to TO)",
  "note": B("Từ gốc photograph nhấn âm đầu, nhưng photography nhấn âm thứ hai. Làm \"pho\" ngắn và yếu, kéo dài và nhấn \"TO\".",
            "The base word photograph is stressed first, but photography is stressed on the second syllable. Make \"pho\" short and weak, and lengthen and stress \"TO\".")},
 {"wrongText": "CELebration (stress copied from celebrate)", "rightText": "celeBRAtion (stress before -tion)",
  "note": B("Celebrate nhấn âm đầu, nhưng với -tion trọng âm dời sang âm tiết ngay trước: ce-le-BRA-tion.",
            "Celebrate is stressed first, but with -tion the stress moves to the syllable right before it: ce-le-BRA-tion.")},
 {"wrongText": "reCORD for the thing you play (verb stress on a noun)", "rightText": "REcord for the thing you play (noun: first syllable)",
  "note": B("Danh từ nhấn âm đầu: REcord. Động từ nhấn âm sau: reCORD. Chỉ đổi chỗ nhấn, giọng vẫn tự nhiên.",
            "The noun is stressed first: REcord. The verb is stressed second: reCORD. Only the stress place changes; keep your voice natural.")},
]
d["selfCheck"] = B("Ghi âm photograph, photography, photographer rồi nghe lại: chỗ nhấn có dời đúng chưa, và âm tiết cũ có trở nên ngắn, yếu không? Vỗ tay theo nhịp để kiểm tra.",
                   "Record photograph, photography and photographer and listen back: did the stress move, and did the old syllable become short and weak? Clap along to check.")
d["teacherNotes"] = B("Phần mềm so sánh độ dài, độ to và cao độ của từng âm tiết với âm tiết được nhấn mong đợi; nó không phân biệt được người nói nhấn bằng cách nào và không biết người nói định dùng danh từ hay động từ. Một số người nói tiếng Anh, nhất là giọng Anh-Anh, nhấn khác ở vài từ (ví dụ economy, history có hai cách đọc), hãy chấp nhận khi người nghe vẫn hiểu. Học sinh quen thanh điệu có thể dùng cao độ thay cho độ dài; không quy cho cả một vùng. Độ tin cậy phát hiện: trung bình, chưa được đo trên học sinh thật; điểm số chỉ là gợi ý và không đánh giá độ tự nhiên của giọng.",
 "The app compares each syllable's length, loudness and pitch with the expected stressed syllable; it cannot tell how a speaker produces the stress, nor whether the speaker meant the noun or the verb. Some English speakers, especially with British accents, stress a few words differently (economy and history have more than one pronunciation); accept it if listeners understand. Students used to tones may use pitch instead of length; do not attribute this to a whole region. Detection confidence: medium, not yet measured on real students; the score is only a hint and does not judge how natural the voice is.")
save("U18", d)

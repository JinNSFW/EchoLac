import json
def N(vi,en): return {"vi":vi,"en":en}
INS=N("Chèn thêm nguyên âm \"ờ\" vào giữa cụm.","Extra vowel inserted inside the cluster.")
DEL=N("Mất một phụ âm đầu của cụm.","One consonant of the cluster is missing.")
def w(t,idx,errs,**k):
    d={"text":t,"targets":[{"index":idx}],"errors":[{"variantIpa":v,"note":n} for v,n in errs]}
    d.update(k); return d
words=[
 w("street",[0,1,2],[("s ə t ɹ iː t",INS),("t ɹ iː t",DEL),("s iː t",DEL)]),
 w("spring",[0,1,2],[("s ə p ɹ ɪ ŋ",INS),("s ɹ ɪ ŋ",DEL),("p ɹ ɪ ŋ",DEL)]),
 w("strong",[0,1,2],[("s ə t ɹ ɔː ŋ",INS),("s ɔː ŋ",DEL)]),
 w("stop",[0,1],[("s ə t ɑː p",INS),("t ɑː p",DEL)]),
 w("spoon",[0,1],[("s ə p uː n",INS),("p uː n",DEL)]),
 w("sky",[0,1],[("s ə k aɪ",INS),("k aɪ",DEL)]),
 w("small",[0,1],[("s ə m ɔː l",INS),("m ɔː l",DEL)]),
 w("play",[0,1],[("p ə l eɪ",INS),("p eɪ",DEL)]),
 w("black",[0,1],[("b ə l æ k",INS),("b æ k",DEL)]),
 w("clean",[0,1],[("k ə l iː n",INS),("k iː n",DEL)]),
 w("train",[0,1],[("t ə ɹ eɪ n",INS),("t eɪ n",DEL)]),
 w("friend",[0,1],[("f ə ɹ ɛ n d",INS),("f ɛ n d",DEL)]),
]
pairs=[{"a":a,"b":b,"type":t} for a,b,t in [("sport","support","insertion"),("pay","play","deletion"),("pot","spot","deletion"),("team","steam","deletion"),("sack","snack","deletion"),("pay","pray","deletion")]]
def s(t,tg,culture,**k):
    d={"text":t,"targets":[{"word":x[0],"index":x[1]} for x in tg],"culture":culture}; d.update(k); return d
sentences=[
 s("We stop for fresh street food near the bridge.",[("stop",[0,1]),("fresh",[0,1]),("street",[0,1,2]),("bridge",[0,1])],True),
 s("Black clouds hide the sky over the beach.",[("Black",[0,1]),("clouds",[0,1]),("sky",[0,1])],True),
 s("I play with my friend on the clean beach.",[("play",[0,1]),("friend",[0,1]),("clean",[0,1])],True),
 s("The spring wind is strong near the river.",[("spring",[0,1,2]),("strong",[0,1,2])],True),
]
contrasts=[
 {"wrong":"s ə t ɹ iː t","right":"s t ɹ iː t","note":N("Street nghe như \"sơ-trít\". Giữ lưỡi ở vị trí /s/ rồi trượt thẳng sang /t/, không thả thêm nguyên âm.","Street sounds like \"suh-treet\". Keep the tongue at /s/, then go straight to /t/ with no vowel between.")},
 {"wrong":"t ɹ iː t","right":"s t ɹ iː t","note":N("Mất /s/ đầu từ. Bắt đầu bằng \"sss\" ngắn rồi mới đóng lưỡi cho /t/.","The first /s/ is lost. Start with a short \"sss\", then close the tongue for /t/.")},
 {"wrong":"p ə l eɪ","right":"p l eɪ","note":N("Play nghe như \"pờ-lay\". Khi môi mở cho /p/ thì lưỡi đã sẵn sàng chạm nướu cho /l/.","Play sounds like \"puh-lay\". While the lips open for /p/, the tongue is already ready for /l/.")},
]
chain=[
 {"text":"eet → reet → treet → street","steps":["iː t","ɹ iː t","t ɹ iː t","s t ɹ iː t"],"note":N("Nói từ cuối ra đầu, mỗi bước thêm một âm và không chèn nguyên âm. Đến street thì nối liền ba âm đầu.","Say the word from the end, adding one sound per step with no vowel inserted. At street, join the three starting sounds.")},
 {"text":"ing → ring → pring → spring","steps":["ɪ ŋ","ɹ ɪ ŋ","p ɹ ɪ ŋ","s p ɹ ɪ ŋ"],"note":N("Cùng cách làm với spring: thêm /ɹ/, rồi /p/, rồi /s/ trong một hơi.","Same method for spring: add /ɹ/, then /p/, then /s/ in one breath.")},
 {"text":"ay → lay → play","steps":["eɪ","l eɪ","p l eɪ"],"note":N("Với play, /l/ đến ngay sau /p/, không có \"ờ\" ở giữa.","In play, /l/ follows /p/ at once, with no \"uh\" between.")},
]
d={
"cando":N("Em nói được các từ như street, play, spring mà không thêm nguyên âm và không bỏ phụ âm.","I can say words like street, play and spring with no extra vowel and no missing consonant."),
"why":[
 {"vi":"Tiếng Việt chuẩn có âm tiết dạng C(w)V(C), không có cụm phụ âm đầu, nên học sinh thường chèn thêm một nguyên âm vào cụm hoặc bỏ bớt một phụ âm: street thành \"sơ-trít\" hoặc \"trít\". Lỗi này được báo cáo là thường gặp ở người Việt học tiếng Anh.","en":"Standard Vietnamese syllables are C(w)V(C) with no onset clusters, so learners often insert a vowel into the cluster or drop a consonant: street becomes \"suh-treet\" or \"treet\". This is reported as a common error for Vietnamese learners of English.","refs":["[4]","[1]"]},
 {"vi":"Một khảo sát nhỏ ở Cần Thơ (39 người) báo cáo rằng với cụm đầu từ, việc bỏ phụ âm gặp nhiều hơn việc chèn nguyên âm. Vì vậy bài này luyện cả hai hướng.","en":"A small survey in Can Tho (39 learners) reported that for word-initial clusters, dropping a consonant was more common than inserting a vowel, so this unit trains both.","refs":["[4]","[13]"]},
 {"vi":"Phụ âm là nhóm âm cốt lõi để hai người hiểu nhau trong tiếng Anh quốc tế, và bỏ phụ âm đầu cụm làm hai từ trùng nhau (steam nghe như team), nên bài này có mức ưu tiên cao (P1). Giáo viên thường dùng kỹ thuật nói ngược từ cuối ra đầu (back-chaining).","en":"Consonants are core sounds for mutual intelligibility in international English, and dropping the first consonant makes words collide (steam sounds like team), so this unit has high priority (P1). Teachers commonly use back-chaining, from the end of the word to the start.","refs":["[B16]"]},
],
"howTo":[
 {"vi":"Nghe và nói cặp pay–play. Ở play, môi mở cho /p/ thì đầu lưỡi đã chạm nướu cho /l/, nên giữa hai âm không có \"ờ\".","en":"Say the pair pay–play. In play, the tongue tip is already on the ridge for /l/ as your lips open for /p/, so no \"uh\"."},
 {"vi":"Với /s/ đầu từ, thổi \"sss\" ngắn rồi chuyển thẳng sang âm sau. Chỉ có hơi, không rung cổ, không thêm nguyên âm.","en":"For a starting /s/, blow a short \"sss\" and go straight to the next sound. Only air, no voice, no added vowel."},
 {"vi":"Tập nói ngược (back-chaining): eet, reet, treet, street. Mỗi bước thêm một âm ở đầu, không dừng giữa các âm.","en":"Practise back-chaining: eet, reet, treet, street. Each step adds one sound at the front, with no pause between sounds."},
 {"vi":"Nói chậm cả từ street trong một hơi liền. Sau đó nói nhanh dần mà vẫn đủ ba phụ âm /s t ɹ/.","en":"Say street slowly in one smooth breath, then speed up while keeping all three consonants /s t ɹ/."},
 {"vi":"Ghi âm và nghe lại: giữa các phụ âm đầu từ có nghe \"ờ\" không, và có đủ phụ âm không?","en":"Record yourself and listen back: do you hear an \"uh\" between the starting consonants, and are all of them there?"},
],
"words":words,"pairs":pairs,"sentences":sentences,"contrasts":contrasts,"chain":chain,
"selfCheck":N("Ghi âm street, spring, play, clean. Nghe lại: có \"ờ\" chen vào giữa không, và có đủ phụ âm đầu không? Thử cặp sport–support và steam–team để chắc người nghe phân biệt được.","Record street, spring, play and clean. Listen back: is there an \"uh\" inside the cluster, and are all the starting consonants there? Try sport–support and steam–team to check a listener can tell them apart."),
"teacherNotes":N("Một số người nói có thể chèn nguyên âm hoặc bỏ phụ âm ở đầu từ; đây là ảnh hưởng của cấu trúc âm tiết tiếng Việt, không phải dấu hiệu năng lực thấp. Phần mềm phát hiện nguyên âm chèn và phụ âm bị mất; không đo độ dài từng âm và có thể nhầm khi nói nhanh hoặc ghi âm ồn. Nguyên âm chèn rất ngắn có thể không bị phát hiện. Độ tin cậy phát hiện: cao, chưa được đo trên học sinh thật. Cụm cuối từ (texts, months) thuộc bài U15.","Some speakers may insert a vowel or drop a consonant at the start of a word; this follows from Vietnamese syllable structure, not from low ability. The app detects an inserted vowel or a lost consonant; it does not measure the duration of each sound and may err in fast speech or noisy recordings. A very short inserted vowel may go undetected. Detection confidence: high, not yet measured on real students. Final clusters (texts, months) belong to unit U15."),
"id":"U08"}
json.dump(d,open("authored/u08.json","w",encoding="utf8"),ensure_ascii=False,indent=1)

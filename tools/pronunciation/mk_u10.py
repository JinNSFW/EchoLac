from b2lib import *
D = {}
D["cando"] = B("Em nói bed khác bet, rise khác rice: giữ rung cổ ở âm cuối và kéo dài nguyên âm trước đó.",
               "I can make bed and bet, rise and rice sound different: keep the voice on the final sound and lengthen the vowel before it.")
D["why"] = [
 {**B("Tiếng Việt chỉ có âm cuối /p t k/ (không bật hơi), không có /b d ɡ v z/ ở cuối, nên bed dễ nghe như \"bét\" và dog như \"dốc\". Các nghiên cứu nhỏ báo cáo lỗi bỏ hoặc vô thanh hóa âm cuối hữu thanh là thường gặp (độ tin cậy trung bình).",
 "Vietnamese has only unreleased final /p t k/ and no final /b d ɡ v z/, so bed easily sounds like \"bet\" and dog like \"dock\". Small studies report devoicing or dropping voiced finals as common (medium confidence)."),"refs":["[1]","[12]","[14]"]},
 {**B("Khi âm cuối mất rung, hai từ trùng nhau: bed/bet, rise/rice, leave/leaf. Người nghe tiếng Anh dựa nhiều vào độ dài nguyên âm trước âm cuối để biết âm đó hữu thanh hay vô thanh.",
 "When the final loses its voice, two words collide: bed/bet, rise/rice, leave/leaf. English listeners rely a lot on the length of the vowel before the ending to tell voiced from voiceless."),"refs":["[B14]","[B15]"]},
 {**B("Phần mềm chủ yếu nhận ra âm cuối bị đổi thành âm vô thanh; độ dài nguyên âm khó đo hơn, nên bài này có mức ưu tiên P2 và điểm số chỉ là gợi ý.",
 "The software mainly detects a final changed to its voiceless pair; vowel length is harder to measure, so this unit is priority P2 and the score is only a hint."),"refs":["[1]"]},
]
D["howTo"] = [
 B("Đặt tay lên cổ. Nói \"sss\" rồi \"zzz\": zzz có rung. Giữ cảm giác rung đó đến hết từ rise, không để tắt trước khi từ kết thúc.",
   "Put a hand on your throat. Say \"sss\" then \"zzz\": zzz buzzes. Keep that buzz to the very end of rise, not fading early."),
 B("Kéo dài nguyên âm trước âm cuối hữu thanh: bed, bag dài hơn một chút so với bet, back. Hãy nói \"bee-d\" chậm rồi rút lại cho gọn.",
   "Lengthen the vowel before a voiced ending: bed and bag are a little longer than bet and back."),
 B("Với /d b ɡ/: lưỡi hoặc môi chạm nhẹ rồi thả, vẫn rung cổ, không bật hơi mạnh. Với /t p k/ thì dừng dứt khoát, không rung.",
   "For /d b ɡ/: touch tongue or lips lightly, keep the voice on, no strong puff. For /t p k/ stop sharply, no voice."),
 B("Với /v/ và /z/: răng trên chạm môi dưới (v) hoặc lưỡi gần nướu răng (z), vừa thổi vừa rung cổ. Đừng đổi thành /f/ hay /s/ ở cuối.",
   "/v/: upper teeth touch the lower lip. /z/: tongue near the ridge. Blow and buzz together; do not turn them into /f/ or /s/."),
 B("Kết thúc từ ngay khi hết rung. Đừng thêm nguyên âm \"ờ\" (bed không phải \"bét-ờ\"). Luyện từng cặp rise–rice, leave–leaf bằng tay trên cổ.",
   "End the word as the buzz ends. Add no vowel \"uh\" (bed is not \"bed-uh\"). Practise rise–rice and leave–leaf with a hand on your throat."),
]
dev = ("Nghe như âm cuối vô thanh (mất rung cổ).", "Sounds like the voiceless pair (the voice is lost).")
drp = ("Bỏ mất âm cuối.", "Final sound dropped.")
def wd(text, d, dr, **kw):
    return W(text, [(d, *dev), (dr, *drp)], [-1], vowelIdx=False, **kw)
D["words"] = [wd("bed","b ɛ t","b ɛ"), wd("bag","b æ k","b æ"), wd("dog","d ɔː k","d ɔː"),
 wd("food","f uː t","f uː"), wd("card","k ɑː ɹ t","k ɑː ɹ"), wd("prize","p ɹ aɪ s","p ɹ aɪ"),
 wd("leave","l iː f","l iː"), wd("save","s eɪ f","s eɪ"), wd("five","f aɪ f","f aɪ"),
 wd("eyes","aɪ s","aɪ",lemma="eye"), wd("cheese","tʃ iː s","tʃ iː"), wd("noise","n ɔɪ s","n ɔɪ")]
D["pairs"] = [P("bed","bet","substitution"),P("bag","back","substitution"),P("cab","cap","substitution"),
 P("prize","price","substitution"),P("rise","rice","substitution"),P("leave","leaf","substitution")]
def T(w, **k): return {"word": w, "index": [-1], **k}
D["sentences"] = [
 {"text":"The night market is big and I love the cheese.","targets":[T(4),T(7),T(9)],"culture":True},
 {"text":"We leave the beach and have rice.","targets":[T(1),T(5)],"culture":True},
 {"text":"My dog sleeps on a red bed.","targets":[T(1),T(5),T(6)],"culture":False},
 {"text":"The food in Huế is good, and the noise is fun.","targets":[T(1),T(5),T(8)],"culture":True,"unscored":["Huế"]},
 {"text":"He gave his dog a bag of food.","targets":[T(1),T(3),T(5),T(7)],"culture":False,"lemmas":{"gave":"give"}},
]
D["contrasts"] = [
 C("b ɛ t","b ɛ d","Bed nghe như bet. Giữ rung cổ và kéo dài /ɛ/ hơn một chút, rồi chạm lưỡi nhẹ cho /d/.","Bed sounds like bet. Keep the voice on and make /ɛ/ a little longer, then touch the tongue lightly for /d/."),
 C("ɹ aɪ s","ɹ aɪ z","Rise nghe như rice. Thổi hơi và rung cổ cùng lúc ở cuối, tay trên cổ phải thấy rung.","Rise sounds like rice. Blow and buzz together at the end; your hand on the throat should feel it."),
 C("l iː f","l iː v","Leave nghe như leaf. Răng trên chạm môi dưới và giữ rung cổ đến hết từ.","Leave sounds like leaf. Touch upper teeth to the lower lip and keep the voice on to the end."),
 C("b æ k","b æ ɡ","Bag nghe như back. Nâng cuối lưỡi nhưng vẫn rung cổ, thả nhẹ, không bật hơi mạnh.","Bag sounds like back. Raise the back of the tongue but keep the voice on and release softly with no strong puff."),
]
D["selfCheck"] = B("Ghi âm bed–bet, rise–rice, leave–leaf. Nghe lại: nguyên âm trong từ hữu thanh có dài hơn không, và cổ có rung đến cuối từ không? Nhờ bạn đoán từ em nói.",
 "Record bed–bet, rise–rice, leave–leaf. Listen back: is the vowel longer in the voiced word, and does the voice last to the end? Ask a friend to guess which word you said.")
D["teacherNotes"] = B("Một số người nói tiếng Anh cũng vô thanh hóa nhẹ âm cuối hữu thanh khi nói nhanh hoặc ở cuối câu, và nhiều giọng chỉ thể hiện sự khác biệt bằng độ dài nguyên âm; hãy chấp nhận khi người nghe vẫn hiểu. Một số học sinh nói âm cuối không bật hơi, điều này bình thường. Phần mềm chủ yếu thấy âm cuối bị đổi sang âm vô thanh hoặc bị mất; không đo độ dài nguyên âm hay mức rung cổ. Độ tin cậy phát hiện: trung bình, chưa được đo trên học sinh thật.",
 "Some English speakers also partly devoice a final voiced sound in fast speech or at the end of a phrase, and many accents show the difference mainly through vowel length; accept it if the listener understands. Some students release finals very lightly, which is normal. The app mainly sees a final changed to a voiceless sound or dropped; it does not measure vowel length or voicing strength. Detection confidence: medium, not yet measured on real students.")
save("U10", D)

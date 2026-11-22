from b2lib import *
D = {}
D["cando"] = B("Em nói phân biệt được v/w/j, l/n/r và p/b, và nói trọn âm /l/ ở cuối từ.",
               "I can keep v/w/j, l/n/r and p/b apart, and finish a final /l/.")
D["why"] = [
 {**B("Tiếng Việt có các chữ v, d, gi, r, l, n, nhưng cách đọc của chúng khác nhau tùy giọng, nên một số người nói đọc very thành \"yery\", yes thành \"zes\" hoặc red nghe gần như \"zed\" khi nói tiếng Anh. Các tài liệu giảng dạy cho thấy việc lẫn /v w j z/ khá thường gặp (độ tin cậy trung bình); đây là thói quen ánh xạ âm, không phải đặc điểm của một vùng nào.",
 "Vietnamese has the letters v, d, gi, r, l and n, but how they sound varies between accents, so some speakers say very as \"yery\", yes as \"zes\", or red close to \"zed\" in English. Teaching sources describe /v w j z/ mix-ups as fairly common (medium confidence); it is a habit of sound mapping, not a trait of any one region."),"refs":["[17]","[1]"]},
 {**B("Tiếng Việt không có âm /l/ ở cuối từ và không có /p/ ở đầu từ bản ngữ, nên ball, school, well hay mất âm cuối hoặc nghe như \"bon\", còn pig dễ nghe như big. Một số người nói cũng lẫn /l/ với /n/, nên light nghe như night (được báo cáo, chưa có số liệu rõ).",
 "Vietnamese has no final /l/ and no native initial /p/, so ball, school and well often lose the ending or sound like \"bon\", and pig can sound like big. Some speakers also mix /l/ with /n/, so light sounds like night (reported, no clear figures)."),"refs":["[12]","[14]"]},
 {**B("Các cặp này làm hai từ trùng nhau (wine/vine, light/right, pig/big) nên ảnh hưởng đến việc hiểu nhau; đây là phụ âm cốt lõi (P2). Phần mềm chỉ tin ở mức trung bình.",
 "These pairs make two words collide (wine/vine, light/right, pig/big), so they affect understanding; they are core consonants (priority P2). The app's detection confidence is only medium."),"refs":["[B16]"]},
]
D["howTo"] = [
 B("/v/: răng trên chạm nhẹ môi dưới, thổi hơi và rung cổ (tay trên cổ thấy rung). /w/: tròn môi như nói \"u\" rồi mở nhanh sang nguyên âm. Hai âm này không giống nhau.",
   "/v/: upper teeth touch the lower lip, blow and buzz. /w/: round the lips as for \"oo\", then open into the vowel."),
 B("/j/ (trong yes): lưỡi nâng gần vòm miệng như bắt đầu nói \"i\", rồi trượt sang nguyên âm. /z/ (trong zoo) rung giữa lưỡi và nướu; /dʒ/ bắt đầu bằng một cú bật nhẹ.",
   "/j/ (yes): raise the tongue toward the palate as for \"ee\", then glide into the vowel. /z/ (zoo) buzzes; /dʒ/ starts with a small stop."),
 B("/l/ đầu từ: đầu lưỡi chạm nướu răng trên, hơi thoát hai bên lưỡi. /n/: cũng chạm nướu nhưng hơi đi ra mũi. /ɹ/: cuộn lưỡi lên, không chạm vào đâu.",
   "/l/: tongue tip on the ridge, air out the sides. /n/: same touch, air through the nose. /ɹ/: curl the tongue up, touch nothing."),
 B("/l/ cuối từ (ball, well): để đầu lưỡi chạm nướu và giữ một chút, đừng dừng ở nguyên âm hay chuyển thành \"n\" hoặc \"u\".",
   "Final /l/ (ball, well): tongue tip on the ridge, hold it a moment. Do not stop on the vowel or change it to \"n\"."),
 B("/p/ đầu từ: mím môi, thả ra kèm một luồng hơi nhỏ (tay trước miệng thấy hơi). /b/ thì rung cổ, ít hơi. Luyện cặp pig–big.",
   "/p/ at the start: close the lips, release with a small puff on your hand. /b/ buzzes, less air. Try pig–big."),
]
dr = ("Bỏ mất âm cuối /l/.", "Final /l/ dropped.")
nn = ("Âm /l/ cuối nghe như /n/.", "Final /l/ sounds like /n/.")
def E(v, a, b): return (v, a, b)
def ws(t, e, **kw): return W(t, e, [0], vowelIdx=False, **kw)
def fl(t, d, n, **kw): return W(t, [(d, *dr), (n, *nn)], [-1], vowelIdx=False, cat="final_consonant", **kw)
INI = lambda x, y: ("Âm đầu thành " + x + ".", "Initial sound became " + y + ".")
D["words"] = [
 ws("very", [E("j ɛ ɹ i", *INI("/j/ (như \"yery\")", "/j/ (\"yery\")")), E("w ɛ ɹ i", *INI("/w/", "/w/"))]),
 ws("vote", [E("w oʊ t", *INI("/w/", "/w/")), E("b oʊ t", *INI("/b/", "/b/"))]),
 ws("wine", [E("v aɪ n", *INI("/v/ (nghe như vine)", "/v/ (like vine)")), E("j aɪ n", *INI("/j/", "/j/"))]),
 ws("yes", [E("z ɛ s", *INI("/z/ (nghe như \"zes\")", "/z/ (\"zes\")")), E("dʒ ɛ s", *INI("/dʒ/ (nghe như jess)", "/dʒ/ (like jess)"))]),
 ws("zoo", [E("dʒ uː", *INI("/dʒ/", "/dʒ/")), E("j uː", *INI("/j/", "/j/"))]),
 ws("red", [E("z ɛ d", *INI("/z/ (nghe như zed)", "/z/ (like zed)")), E("l ɛ d", *INI("/l/ (nghe như led)", "/l/ (like led)"))]),
 ws("light", [E("n aɪ t", *INI("/n/ (nghe như night)", "/n/ (like night)")), E("ɹ aɪ t", *INI("/ɹ/ (nghe như right)", "/ɹ/ (like right)"))]),
 ws("pig", [E("b ɪ ɡ", *INI("/b/ (nghe như big)", "/b/ (like big)"))]),
 ws("park", [E("b ɑː ɹ k", *INI("/b/ (nghe như bark)", "/b/ (like bark)"))]),
 fl("ball", "b ɔː", "b ɔː n"),
 fl("school", "s k uː", "s k uː n"),
 fl("well", "w ɛ", "w ɛ n"),
]
D["pairs"] = [P("wine","vine","substitution"),P("wet","vet","substitution"),P("yet","jet","substitution"),
 P("light","right","substitution"),P("line","nine","substitution"),P("pig","big","substitution")]
def T(w, i=0, **k): return {"word": w, "index": [i], **k}
FC = {"category": "final_consonant"}
D["sentences"] = [
 {"text":"The yellow lights look very pretty in Hội An.","targets":[T(1),T(2),T(3),T(4),T(5)],"culture":True,"unscored":["Hội","An"]},
 {"text":"I like the red bridge and the park by the river.","targets":[T(3),T(7),T(10)],"culture":True},
 {"text":"Yes, the zoo near our school has a big pig.","targets":[T(0),T(2),T(5,-1,**FC),T(9)],"culture":False},
 {"text":"I feel well when I walk on the beach at night.","targets":[T(1,-1,**FC),T(2,-1,**FC),T(3),T(5)],"culture":True},
 {"text":"We eat rice and light soup in Huế, and the food is very good.","targets":[T(2),T(4),T(12)],"culture":True,"unscored":["Huế"]},
]
D["contrasts"] = [
 C("j ɛ ɹ i","v ɛ ɹ i","Very nghe như \"yery\". Đặt răng trên chạm môi dưới và rung cổ, đừng bắt đầu bằng âm \"y\".","Very sounds like \"yery\". Touch the upper teeth to the lower lip and buzz; do not start with \"y\"."),
 C("n aɪ t","l aɪ t","Light nghe như night. Hơi phải thoát hai bên lưỡi, không đi qua mũi (bịt mũi vẫn nói được).","Light sounds like night. The air goes round the sides of the tongue, not through the nose (it works with a pinched nose)."),
 C("b ɪ ɡ","p ɪ ɡ","Pig nghe như big. Mím môi rồi thả kèm luồng hơi nhỏ, không rung cổ.","Pig sounds like big. Close the lips and release with a small puff, no voice."),
 C("b ɔː","b ɔː l","Ball mất /l/ cuối. Sau nguyên âm, đưa đầu lưỡi chạm nướu và giữ lại.","Ball lost its final /l/. After the vowel, put the tongue tip on the ridge and hold it."),
]
D["selfCheck"] = B("Ghi âm wine–vine, light–right, pig–big và ball, well. Nghe lại: /v/ có chạm răng–môi không, /l/ cuối có nghe rõ không? Nhờ bạn đoán từ em nói.",
 "Record wine–vine, light–right, pig–big, then ball and well. Listen back: do you hear the teeth-on-lip /v/, and a clear final /l/? Ask a friend to guess which word you said.")
D["teacherNotes"] = B("Cách đọc các chữ v, d, gi, r, l, n khác nhau giữa các giọng tiếng Việt, và một số người nói có thể lẫn /v w j z/ hoặc /l n/; đây là ảnh hưởng của hệ thống âm quen thuộc, không phải lỗi của một vùng. Một số giọng Anh cũng đọc /l/ cuối rất nhẹ hoặc gần như \"w\"; hãy chấp nhận khi người nghe vẫn hiểu. Phần mềm chủ yếu thấy khi âm bị đổi sang âm khác; không đo độ bật hơi của /p/ hay độ cong lưỡi của /ɹ/. Độ tin cậy phát hiện: trung bình, chưa được đo trên học sinh thật.",
 "How the letters v, d, gi, r, l and n are pronounced differs between Vietnamese accents, and some speakers may mix /v w j z/ or /l n/; this is an effect of familiar sound habits, not a trait of one region. Some English accents also say a final /l/ very lightly or close to \"w\"; accept it if the listener understands. The app mainly sees a sound replaced by another; it does not measure the puff of /p/ or tongue curl of /ɹ/. Detection confidence: medium, not yet measured on real students.")
save("U12", D)

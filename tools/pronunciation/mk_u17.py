import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
b = lambda vi, en, refs=None: ({"vi": vi, "en": en, "refs": refs} if refs else {"vi": vi, "en": en})
FUNC = {"the", "will", "for", "them", "and", "by", "at", "a", "of", "to"}
def S(text, culture=False, **kw):
    ws = [w.strip(".,?!") for w in text.split()]
    weak = [i for i, w in enumerate(ws) if w.lower() in FUNC]
    beats = [i for i in range(len(ws)) if i not in weak]
    d = {"text": text, "targets": [], "culture": culture, "prosody": {"beats": beats, "weak": weak},
         "cefrNull": {w.lower(): "lantern" for w in ws if w.lower() in ("lantern", "lanterns", "noodles")}}
    d.update(kw); return d
d = {
 "cando": b("Em giữ nhịp đều trên các từ chính (danh từ, động từ, tính từ) và nói nhanh, nhẹ các từ chức năng ở giữa.",
            "I can keep a steady beat on content words and squeeze the function words in between."),
 "why": [
  b("Tiếng Việt là ngôn ngữ nhịp theo âm tiết: mỗi âm tiết có độ dài gần bằng nhau. Tiếng Anh thiên về nhịp theo trọng âm: các từ chính đến đều đặn, còn từ chức năng bị ép ngắn. Người học Việt thường được báo cáo nói đều từng âm tiết, nghe cứng và ngắt từng chữ.",
    "Vietnamese is syllable-timed: syllables are about equally long. English leans stress-timed: content words arrive at a steady beat while function words are squeezed. Vietnamese learners are often reported to give every syllable equal length, which sounds choppy.",
    ["[B5]", "[B4]"]),
  b("Một nghiên cứu nhỏ về người học Việt ghi nhận độ dài âm tiết ít biến đổi hơn người bản ngữ. Vì vậy bài này luyện nhịp mạnh-nhẹ, không chỉ luyện từng âm.",
    "A small study of Vietnamese learners reports less variation in syllable durations than native speakers show. So this unit trains the strong-weak beat, not only single sounds.",
    ["[B5]"]),
  b("Nhịp là mức ưu tiên thấp hơn âm cuối và cụm phụ âm (P3), và phần mềm chỉ ước lượng nhịp với độ tin cậy thấp. Dù vậy, nghe được nhịp giúp em hiểu người bản ngữ nói nhanh. Bắt chước theo (shadowing) được báo cáo là giúp cải thiện độ dễ hiểu.",
    "Rhythm is lower priority than final sounds and clusters (P3), and the app estimates it with low confidence. Still, hearing the beat helps you follow fast native speech. Shadowing is reported to improve intelligibility.",
    ["[B16]", "[B10]"]),
 ],
 "howTo": [
  b("Đếm các từ chính (danh từ, động từ, tính từ, trạng từ) trong câu. Mỗi từ chính là một nhịp. \"Cats eat fish\" có 3 nhịp.",
    "Count the content words (nouns, verbs, adjectives, adverbs). Each is one beat. \"Cats eat fish\" has three beats."),
  b("Vỗ tay hoặc gõ bàn đều đặn, mỗi nhịp một lần. Nói sao cho từ chính rơi đúng vào tiếng vỗ.",
    "Clap or tap the desk steadily, once per beat. Time your speech so each content word lands on a clap."),
  b("Thêm từ chức năng (the, will, for, them). Giữ nguyên nhịp vỗ, nói các từ này nhỏ, nhanh, dồn vào giữa hai tiếng vỗ.",
    "Add function words (the, will, for, them). Keep the clapping steady and squeeze these quiet words between two claps."),
  b("Câu dài hơn không làm các nhịp xa nhau hơn nhiều. \"The cats will eat the fish\" vẫn gần như 3 nhịp như \"Cats eat fish\".",
    "A longer sentence keeps the same beats. \"The cats will eat the fish\" still has three beats, like \"Cats eat fish\"."),
  b("Đừng đọc to từng chữ rõ như nhau. Chữ yếu nhẹ và ngắn, chữ chính dài hơn và rõ hơn.",
    "Do not say every word loud and equal. Weak words are light and short; content words are longer and clearer."),
 ],
 "sentences": [
  S("Cats eat fish."),
  S("The cats eat fish."),
  S("The cats will eat the fish."),
  S("Lanterns light streets.", True),
  S("The lanterns light the streets.", True),
  S("The lanterns will light the streets at night.", True),
  S("Cooks make noodles."),
  S("The cooks will make the noodles for them."),
  S("The market sells fresh fruit and fish.", True),
  S("Walk by the river and watch the boats at sunset.", True),
 ],
 "contrasts": [
  {"wrongText": "THE-CATS-WILL-EAT-THE-FISH (every word equal)",
   "rightText": "the CATS will EAT the FISH (three beats, weak words squeezed)",
   "note": b("Nói đều từng chữ làm câu dài ra và nghe như đọc từng âm tiết. Chỉ nhấn cats, eat, fish; the và will nhẹ và nhanh.",
             "Saying each word equally stretches the sentence and sounds syllable by syllable. Beat only cats, eat and fish; keep the and will light and quick.")},
  {"wrongText": "The (pause) cats (pause) will (pause) eat (pause) the (pause) fish.",
   "rightText": "the CATS‿will EAT‿the FISH (words run on between beats)",
   "note": b("Dừng sau mỗi chữ làm nhịp bị vỡ. Để từ chức năng dính vào từ chính, chỉ nghỉ ở cuối câu.",
             "Pausing after each word breaks the beat. Let function words lean on the content words and pause only at the end.")},
  {"wrongText": "The LANterns WILL light THE streets. (beat on function words)",
   "rightText": "the LANterns will LIGHT the STREETS (beat on content words)",
   "note": b("Đặt nhịp nhầm lên will hoặc the làm người nghe mất từ chính. Vỗ tay chỉ ở lanterns, light, streets.",
             "Putting the beat on will or the hides the content words. Clap only on lanterns, light and streets.")},
 ],
 "chain": [
  {"text": "The cats will eat the fish.", "shadow": [
    b("Nghe câu mẫu hai lần và đếm 3 nhịp (cats, eat, fish) bằng cách vỗ tay theo.", "Listen to the model twice and clap along to the three beats (cats, eat, fish)."),
    b("Ngân nga (hum) nhịp mạnh-nhẹ của câu và tiếp tục vỗ tay, không nói chữ.", "Hum the strong-weak beat of the sentence while clapping, without words."),
    b("Thì thầm cùng lúc với âm thanh mẫu và gõ nhịp, bắt chước hình dạng, không bắt chước giọng.", "Whisper along with the audio while tapping the beat, copying the shape, not the voice."),
    b("Nói thành tiếng cùng với âm thanh mẫu và vỗ tay; nhìn đường cao độ và khớp hình dạng.", "Speak aloud with the audio and clap; watch the pitch line and match its shape."),
    b("Nói một mình, không âm thanh, vẫn vỗ tay đều; so sánh với đường cao độ của mẫu.", "Speak alone with no audio, still clapping steadily; compare with the model pitch line."),
   ],
   "note": b("Bắt chước hình dạng đường cao độ và nhịp vỗ, không bắt chước giọng của người nói mẫu.", "Copy the shape of the pitch line and the clap rhythm, not the voice of the model speaker.")},
 ],
 "selfCheck": b("Ghi âm 3 câu trong cùng một bậc thang (ví dụ Cats eat fish / The cats eat fish / The cats will eat the fish). Nghe lại và vỗ tay: số nhịp có giữ nguyên 3 và khoảng cách giữa các nhịp có gần đều không? Từ chức năng có nhẹ và ngắn không?",
                "Record three sentences from one ladder (e.g. Cats eat fish / The cats eat fish / The cats will eat the fish). Listen back and clap: does the count stay at three beats with roughly even gaps? Are the function words light and short?"),
 "teacherNotes": b("Một số người nói quen nhịp theo âm tiết nên giữ độ dài đều; đó là ảnh hưởng của tiếng mẹ đẻ chứ không phải lỗi nghiêm trọng, và nhiều giọng tiếng Anh quốc tế cũng nhịp gần theo âm tiết. Phần mềm chỉ ước lượng độ biến thiên độ dài nguyên âm và khoảng nghỉ giữa các từ (độ tin cậy thấp, chưa đo trên học sinh thật); nó không đếm được nhịp vỗ tay của em và không phán đoán được nhịp tự nhiên. Chỉ dùng điểm để tham khảo cùng phần tự kiểm tra; giáo viên có thể nghe trực tiếp.",
                   "Some speakers are used to syllable timing and keep syllables even; this is first-language influence, not a serious error, and many international English accents are also closer to syllable-timed. The app only estimates vowel-duration variability and pauses between words (low confidence, not yet measured on real students); it cannot count your claps or judge naturalness. Treat the score as a guide alongside the self-check; a teacher can listen directly."),
}
d["id"] = "U17"
with open(os.path.join(HERE, "authored", "u17.json"), "w", encoding="utf-8", newline=chr(10)) as f:
    f.write(json.dumps(d, indent=2, ensure_ascii=False) + chr(10))

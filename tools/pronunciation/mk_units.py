"""Scratch helper that writes authored/u01..u05.json from compact Python (not part of the contract)."""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))


def b(vi, en):
    return {"vi": vi, "en": en}


def w(text, errs, idx, **kw):
    """word: errs = [(variantIpa, vi, en)], idx = target indexes."""
    d = {"text": text, "targets": [{"index": idx, **kw.pop("t", {})}],
         "errors": [{"variantIpa": e[0], "note": b(e[1], e[2])} for e in errs]}
    d.update(kw)
    return d


def s(text, tg, culture=False, **kw):
    d = {"text": text, "targets": [{"word": x[0], "index": x[1], **(x[2] if len(x) > 2 else {})} for x in tg], "culture": culture}
    d.update(kw)
    return d


def save(n, d):
    d["id"] = f"U{n:02d}"
    with open(os.path.join(HERE, "authored", f"u{n:02d}.json"), "w", encoding="utf-8", newline="\n") as f:
        f.write(json.dumps(d, indent=2, ensure_ascii=False) + "\n")


DROP = ("Bỏ mất âm cuối.", "Final sound dropped.")
GLOT = ("Dừng ở cổ họng, lưỡi/môi không chạm.", "Glottal stop instead of the final sound.")

# ---------------------------------------------------------------- U01
def fin(text, base, last, **kw):
    return w(text, [(base, *DROP), (base + " ʔ", *GLOT)], [-1], **kw)

save(1, {
    "cando": b("Em nói rõ âm cuối /p t k s/ trong từ ngắn.", "I can finish short words with a clear final /p t k s/."),
    "why": [
        b("Âm cuối /p t k/ của tiếng Việt thường không bật hơi (môi/lưỡi đóng rồi dừng), nên khi nói tiếng Anh học sinh hay nuốt hoặc thay âm cuối bằng một nhịp dừng ở họng: cat nghe như \"ca\". Các nghiên cứu nhỏ ghi nhận đây là lỗi hay gặp nhất; một nghiên cứu (22 người) thấy khoảng một nửa (49,3%) âm tắc cuối bị nuốt hoặc thay bằng âm tắc họng.",
          "Vietnamese final /p t k/ are usually unreleased, so learners often drop the English final consonant or replace it with a glottal stop: cat sounds like \"ca\". Small studies report this as the most common error; one study (22 speakers) found about half (49.3%) of final stops were unreleased or glottalised.") | {"refs": ["[1]", "[8]"]},
        b("Tiếng Việt chuẩn không có /s/ hoặc /f/ ở cuối âm tiết, nên nice dễ thành \"nai\" và rice thành \"rai\". Đây là những âm cuối mà học sinh thường quên hoàn toàn.",
          "Standard Vietnamese has no final /s/ or /f/, so nice easily becomes \"nai\" and rice becomes \"rai\". These are final sounds learners often leave out completely.") | {"refs": ["[14]", "[1]"]},
        b("Phụ âm là nhóm âm cốt lõi cho việc hiểu nhau trong tiếng Anh quốc tế, và âm cuối thiếu làm hai từ trùng nhau (why/white, see/seat), nên bài này có mức ưu tiên cao (P1).",
          "Consonants are core sounds for mutual intelligibility in international English, and a missing final sound makes two words collide (why/white, see/seat), so this unit has high priority (P1).") | {"refs": ["[B16]"]},
    ],
    "howTo": [
        b("/t/: nói \"ca\", rồi đưa đầu lưỡi lên chạm nướu sau răng trên và thả ra thật nhẹ. Đừng dừng ở cổ họng.",
          "/t/: say \"ca\", then touch the tongue tip to the ridge behind your top teeth and release lightly. Do not stop in your throat."),
        b("/p/: mím hai môi, rồi thả ra kèm một luồng hơi nhỏ. Để tay trước miệng, em phải cảm thấy hơi.",
          "/p/: close your lips, then open them with a small puff of air. Hold a hand before your mouth to feel it."),
        b("/k/: nâng cuối lưỡi chạm phần mềm của vòm miệng, rồi thả ra nhẹ như tiếng \"k\" ngắn.",
          "/k/: raise the back of the tongue to the soft palate, then release it like a short \"k\"."),
        b("/s/: để lưỡi gần nướu răng trên, hai hàm gần sát nhau và thổi \"sss\" mảnh, không rung cổ (đặt tay lên cổ: không thấy rung).",
          "/s/: tongue near the ridge behind the top teeth, teeth close, blow a thin \"sss\" with no voice (no buzz under your hand)."),
        b("Sau âm cuối chỉ cần một hơi thở rất ngắn. Đừng thêm nguyên âm \"ờ\" (cat không phải \"cát-ờ\").",
          "After the final sound add only a very short breath. Do not add a vowel \"uh\" (cat is not \"cat-uh\")."),
    ],
    "words": [
        fin("cat", "k æ", -1), fin("kite", "k aɪ", -1), fin("map", "m æ", -1), fin("bike", "b aɪ", -1),
        fin("book", "b ʊ", -1), fin("night", "n aɪ", -1), fin("cup", "k ʌ", -1), fin("boat", "b oʊ", -1),
        fin("white", "w aɪ", -1), fin("lake", "l eɪ", -1), fin("nice", "n aɪ", -1), fin("rice", "ɹ aɪ", -1),
    ],
    "pairs": [
        {"a": "why", "b": "white", "type": "deletion"}, {"a": "see", "b": "seat", "type": "deletion"},
        {"a": "buy", "b": "bike", "type": "deletion"}, {"a": "lie", "b": "light", "type": "deletion"},
        {"a": "tie", "b": "tight", "type": "deletion"}, {"a": "my", "b": "might", "type": "deletion"},
    ],
    "sentences": [
        s("I like the night market.", [(1, [-1]), (3, [-1]), (4, [-1])], True),
        s("The beach is nice and quiet.", [(1, [-1]), (3, [-1]), (5, [-1])], True),
        s("Let's eat rice and fish.", [(0, [-1]), (1, [-1]), (2, [-1]), (4, [-1])]),
        s("We take a bike to Hội An.", [(1, [-1]), (3, [-1])], True, unscored=["Hội", "An"]),
        s("Please put the cup on the map.", [(1, [-1]), (3, [-1]), (6, [-1])]),
    ],
    "contrasts": [
        {"wrong": "n aɪ", "right": "n aɪ s", "note": b("Nice nghe như \"nai\". Đặt lưỡi gần nướu răng trên và thổi \"sss\" ở cuối.", "Nice sounds like \"nai\". Put the tongue near the ridge behind the top teeth and blow \"sss\" at the end.")},
        {"wrong": "k æ ʔ", "right": "k æ t", "note": b("Cổ họng đóng thay cho lưỡi. Đưa đầu lưỡi lên nướu rồi thả ra.", "The throat closes instead of the tongue. Lift the tongue tip to the ridge and release.")},
        {"wrong": "b aɪ", "right": "b aɪ k", "note": b("Bike mất /k/. Nâng cuối lưỡi chạm vòm mềm rồi thả.", "Bike lost its /k/. Raise the back of the tongue to the soft palate, then release.")},
        {"wrong": "k ʌ", "right": "k ʌ p", "note": b("Cup mất /p/. Mím môi lại rồi thả ra kèm chút hơi.", "Cup lost its /p/. Close the lips, then open with a little air.")},
    ],
    "chain": [
        {"text": "ike → bike", "steps": ["aɪ k", "b aɪ k"], "note": b("Nói phần cuối trước, rồi thêm âm đầu. Nghe và giữ lại /k/ cuối.", "Say the end first, then add the start. Hear and keep the final /k/.")},
        {"text": "ight → night", "steps": ["aɪ t", "n aɪ t"], "note": b("Giữ đầu lưỡi chạm nướu ở cuối từ night.", "Keep the tongue tip on the ridge at the end of night.")},
    ],
    "selfCheck": b("Ghi âm từng từ rồi nghe lại: cuối mỗi từ có nghe rõ /p t k s/ không? Thử cặp why–white để chắc chắn người nghe phân biệt được.",
                   "Record each word and listen back: can you hear the final /p t k s/? Try the why–white pair to be sure a listener can tell them apart."),
    "teacherNotes": b("Tiếng Việt cũng có âm cuối /p t k/ nhưng không bật hơi, vì vậy âm \"có đó nhưng không nghe\" dễ bị tính là thiếu. Phần mềm chỉ phát hiện âm cuối bị mất hoặc thay bằng âm tắc họng; không đo độ bật hơi. Giọng Anh ở một số vùng cũng nuốt /t/ cuối thành âm tắc họng; đừng tính là lỗi nếu người nghe vẫn hiểu. Độ tin cậy phát hiện: cao, chưa được đo trên học sinh thật.",
                      "Vietnamese has final /p t k/ too, but unreleased, so a sound that is \"there but not heard\" may count as missing. The app only detects a final that is lost or replaced by a glottal stop; it does not judge release. Some British accents also glottalise a final /t/, so do not count that as an error if the listener understands. Detection confidence: high, not yet measured on real students."),
})

# ---------------------------------------------------------------- U02
SEND = ("Mất âm /s/ hoặc /z/ cuối.", "Final /s/ or /z/ dropped.")
MORPH = {"t": {"morph": True}}


def pl(text, lemma, base, zform=False, var=0, idx=None):
    errs = [(base, *SEND)]
    if zform:
        errs.append((base + " s", "Âm /z/ bị đọc thành /s/ (không rung cổ).", "The /z/ is said as /s/ (no voice)."))
    if idx is None:
        idx = [-1]
    d = w(text, errs, idx, lemma=lemma, **MORPH)
    if var:
        d["variant"] = var
    return d

save(2, {
    "cando": b("Em nói được đuôi -s của danh từ số nhiều và động từ ngôi thứ ba số ít.", "I can say plural and he/she -s endings."),
    "why": [
        b("Tiếng Việt không chia từ (không có số nhiều hay -s ngôi thứ ba), nên đuôi -s dễ bị bỏ. Một nghiên cứu (16 bài nói độc thoại) thấy khoảng 28,4% /s z/ cuối bị bỏ, và hơn một nửa (50,7%) khi đứng sau một phụ âm khác.",
          "Vietnamese does not inflect words (no plural or third-person -s), so the -s ending is easily dropped. One study (16 monologues) found about 28.4% of final /s z/ omitted, and over half (50.7%) when it followed another consonant.") | {"refs": ["[2]"]},
        b("-s ngữ pháp (books, goes) bị bỏ nhiều hơn /s/ nằm trong từ (như bus). Vì vậy cần luyện riêng đuôi -s, nhưng ở đây ta xem nó là lỗi phát âm của một từ đã biết, không phải lỗi ngữ pháp.",
          "A grammatical -s (books, goes) is omitted more often than an /s/ inside a word (like bus). So the ending needs its own practice, but here we treat it as a pronunciation error on a known word, not a grammar error.") | {"refs": ["[2]"]},
        b("Âm tiết tiếng Việt chuẩn không có /s z/ ở cuối; /z/ của bags hay bees còn hay bị đọc thành /s/. Hai điều này được báo cáo ở người nói tiếng Việt miền Bắc.",
          "Standard Vietnamese syllables have no final /s z/, and the /z/ of bags or bees is often said as /s/. Both are reported for Northern Vietnamese speakers.") | {"refs": ["[14]", "[12]"]},
    ],
    "howTo": [
        b("Sau âm vô thanh (p, t, k, f, θ) đuôi là /s/ không rung: books, maps, cats, bikes.",
          "After a voiceless sound (p, t, k, f, θ) the ending is a voiceless /s/: books, maps, cats, bikes."),
        b("Sau nguyên âm hoặc âm hữu thanh (b, ɡ, m, n, l) đuôi là /z/: đặt tay lên cổ, phải thấy rung: bags, rooms, trees, goes.",
          "After a vowel or voiced sound the ending is /z/. Feel the buzz with a hand on your throat: bags, rooms, goes."),
        b("Sau âm xì hoặc /tʃ dʒ/ (s, z, ʃ, tʃ, dʒ) thêm một âm tiết ngắn /ɪz/: bridges, beaches, dishes.",
          "After a hissing sound or /tʃ dʒ/ (s, z, ʃ, tʃ, dʒ) add a short extra syllable /ɪz/: bridges, beaches, dishes."),
        b("Nói từ gốc rồi kéo thẳng sang \"sss\" hoặc \"zzz\", không ngắt và không thêm \"ờ\".",
          "Say the base word, then slide straight into \"sss\" or \"zzz\" with no break and no extra \"uh\"."),
    ],
    "words": [
        pl("books", "book", "b ʊ k"), pl("maps", "map", "m æ p"), pl("cats", "cat", "k æ t"), pl("bikes", "bike", "b aɪ k"),
        pl("bags", "bag", "b æ ɡ", True), pl("rooms", "room", "ɹ uː m", True), pl("trees", "tree", "t ɹ iː", True),
        pl("goes", "go", "ɡ oʊ", True), pl("likes", "like", "l aɪ k"),
        pl("bridges", "bridge", "b ɹ ɪ dʒ", False, 1, [-2, -1]), pl("beaches", "beach", "b iː tʃ", False, 1, [-2, -1]),
        pl("dishes", "dish", "d ɪ ʃ", False, 1, [-2, -1]),
    ],
    "pairs": [
        {"a": "bag", "b": "bags", "type": "deletion", "bLemma": "bag"}, {"a": "bee", "b": "bees", "type": "deletion", "bLemma": "bee"},
        {"a": "tie", "b": "ties", "type": "deletion", "bLemma": "tie"}, {"a": "book", "b": "books", "type": "deletion", "bLemma": "book"},
        {"a": "cat", "b": "cats", "type": "deletion", "bLemma": "cat"}, {"a": "map", "b": "maps", "type": "deletion", "bLemma": "map"},
    ],
    "sentences": [
        s("I like the bridges and the beaches.", [(3, [-2, -1], MORPH["t"]), (6, [-2, -1], MORPH["t"])], True),
        s("The market sells fresh fruits and eggs.", [(2, [-1], MORPH["t"]), (4, [-1], MORPH["t"]), (6, [-1], MORPH["t"])], True),
        s("My friends play games on the beach.", [(1, [-1], MORPH["t"]), (3, [-1], MORPH["t"])], True),
        s("She goes to the bridge with her friends.", [(1, [-1], MORPH["t"]), (7, [-1], MORPH["t"])], True),
        s("The bikes and books are on the table.", [(1, [-1], MORPH["t"]), (3, [-1], MORPH["t"])]),
    ],
    "contrasts": [
        {"wrong": "b ʊ k", "right": "b ʊ k s", "note": b("Books mất /s/. Nói \"book\" rồi thổi \"sss\" ngay, không dừng.", "Books lost its /s/. Say \"book\", then blow \"sss\" straight away without a pause.")},
        {"wrong": "b æ ɡ s", "right": "b æ ɡ z", "note": b("Đuôi của bags có rung cổ: /z/, không phải /s/. Đặt tay lên cổ để kiểm tra.", "The ending of bags is voiced: /z/, not /s/. Check with a hand on your throat.")},
        {"wrong": "b ɹ ɪ dʒ", "right": "b ɹ ɪ dʒ ɪ z", "note": b("Bridges có hai âm tiết: thêm /ɪz/ sau /dʒ/.", "Bridges has two syllables: add /ɪz/ after /dʒ/.")},
    ],
    "chain": [
        {"text": "ks → ʊks → books", "steps": ["k s", "ʊ k s", "b ʊ k s"], "note": b("Luyện từ cuối về đầu để giữ /s/ cuối.", "Practise from the end back to the start to keep the final /s/.")},
    ],
    "selfCheck": b("Ghi âm 12 từ rồi nghe lại: đuôi -s có rõ, và có rung cổ ở bags, rooms, trees, goes không?",
                   "Record the 12 words and listen back: is each -s clear, and is it voiced in bags, rooms, trees, goes?"),
    "teacherNotes": b("Đây là lỗi phát âm trên từ đã biết (đọc to, Tutor). Khi nói tự do, nếu bản ghi chữ thiếu -s thì phần mềm xem là lỗi ngữ pháp, không phải lỗi phát âm; mô hình ngôn ngữ nhận diện đôi khi tự thêm -s nên lỗi này có thể bị bỏ sót. Một số người nói tiếng Việt miền Bắc được báo cáo hay đọc /z/ cuối thành /s/. Độ tin cậy phát hiện: cao khi đọc to, thấp hơn khi nói tự do.",
                      "This is a pronunciation error on a known word (read-aloud, Tutor). In free speech, a transcript without -s is treated as a grammar error, not a pronunciation error; the recogniser sometimes adds the -s itself, so the error may be missed. Some Northern Vietnamese speakers are reported to say final /z/ as /s/. Detection confidence: high for read-aloud, lower for free speech."),
})

# ---------------------------------------------------------------- U03
def th(text, idx, subs, **kw):
    return w(text, [(v, vi, en) for v, vi, en in subs], [idx], **kw)

T = lambda base: (base, "/θ/ bị đọc thành /t/ (\"th\" tiếng Việt).", "/θ/ said as /t/ (like Vietnamese \"th\").")
S = lambda base: (base, "/θ/ bị đọc thành /s/.", "/θ/ said as /s/.")
Dd = lambda base: (base, "/ð/ bị đọc thành /d/.", "/ð/ said as /d/.")
Z = lambda base: (base, "/ð/ bị đọc thành /z/.", "/ð/ said as /z/.")
save(3, {
    "cando": b("Em nói được /θ/ và /ð/ trong những từ quen thuộc.", "I can say /θ/ and /ð/ in common words."),
    "why": [
        b("Tiếng Việt không có /θ/ và /ð/. Người học thường đọc /θ/ thành /t/ (think → \"tink\") hoặc /s/, và /ð/ thành /d/ hoặc /z/ (this → \"dis\", \"zis\"). Dữ liệu từ 10 bản ghi và 115 phiếu khảo sát người lớn.",
          "Vietnamese has no /θ/ or /ð/. Learners often say /θ/ as /t/ (think → \"tink\") or /s/, and /ð/ as /d/ or /z/ (this → \"dis\", \"zis\"). Data came from 10 recordings and 115 questionnaires of adult learners.") | {"refs": ["[3]"]},
        b("Chữ \"th\" trong tiếng Việt (như \"thở\") là âm /t/ bật hơi, không phải âm đặt lưỡi giữa hai hàm răng, nên chữ viết dễ đánh lừa.",
          "The Vietnamese letters \"th\" (as in \"thở\") stand for an aspirated /t/, not a tongue-between-teeth sound, so the spelling can mislead.") | {"refs": ["[3]"]},
        b("Theo Lingua Franca Core, /θ ð/ không thuộc nhóm âm cốt lõi cho việc hiểu nhau trong tiếng Anh quốc tế, nên bài này có mức ưu tiên thấp (P3) nhưng vẫn được dạy vì thường được kỳ vọng ở bài kiểm tra.",
          "In the Lingua Franca Core, /θ ð/ are not core sounds for mutual intelligibility in international English, so this unit has low priority (P3), but it is still taught because tests and teachers often expect it.") | {"refs": ["[B16]"]},
    ],
    "howTo": [
        b("Đặt đầu lưỡi nhẹ nhàng giữa hai hàm răng, đủ để nhìn thấy một chút đầu lưỡi trong gương.",
          "Place the tongue tip lightly between your teeth, so you can see a little of it in a mirror."),
        b("/θ/: thổi hơi nhẹ qua khe giữa lưỡi và răng, không rung cổ. Đừng đọc như \"th\" của \"thở\".",
          "/θ/: blow a gentle stream of air over the tongue and teeth with no voice. Do not say it like the Vietnamese \"th\" in \"thở\"."),
        b("/ð/: giữ nguyên vị trí lưỡi nhưng rung cổ. Đặt tay lên cổ khi nói this, that: phải thấy rung.",
          "/ð/: keep the same tongue position but add voice. With a hand on your throat, you should feel buzzing in this and that."),
        b("Rút lưỡi về nhanh sau khi nói; không cắn hay ép lưỡi mạnh.",
          "Pull the tongue back quickly afterwards; do not bite or press hard."),
    ],
    "words": [
        th("think", 0, [T("t ɪ ŋ k"), S("s ɪ ŋ k")]), th("thank", 0, [T("t æ ŋ k"), S("s æ ŋ k")]),
        th("three", 0, [T("t ɹ iː"), S("s ɹ iː")]), th("thing", 0, [T("t ɪ ŋ"), S("s ɪ ŋ")]),
        th("mouth", 2, [T("m aʊ t"), S("m aʊ s")]), th("month", 3, [T("m ʌ n t"), S("m ʌ n s")]),
        th("bath", 2, [T("b æ t"), S("b æ s")]), th("birthday", 2, [T("b ɜː t d eɪ"), S("b ɜː s d eɪ")]),
        th("this", 0, [Dd("d ɪ s"), Z("z ɪ s")]), th("that", 0, [Dd("d æ t"), Z("z æ t")]),
        th("they", 0, [Dd("d eɪ"), Z("z eɪ")]), th("mother", 2, [Dd("m ʌ d ɚ"), Z("m ʌ z ɚ")]),
    ],
    "pairs": [
        {"a": "thin", "b": "tin", "type": "substitution"}, {"a": "three", "b": "tree", "type": "substitution"},
        {"a": "bath", "b": "bat", "type": "substitution"}, {"a": "path", "b": "pass", "type": "substitution"},
        {"a": "they", "b": "day", "type": "substitution"}, {"a": "then", "b": "den", "type": "substitution"},
    ],
    "sentences": [
        s("I think the weather is nice at the beach.", [(1, [0]), (2, [0]), (3, [2]), (7, [0])], True),
        s("They think this bridge is nice.", [(0, [0]), (1, [0]), (2, [0])], True),
        s("Thank you, my mother likes the market.", [(0, [0]), (3, [2]), (5, [0])], True),
        s("Thank them for the three cups of tea.", [(0, [0]), (1, [0]), (3, [0]), (4, [0])]),
    ],
    "contrasts": [
        {"wrong": "t ɪ ŋ k", "right": "θ ɪ ŋ k", "note": b("Think nghe như \"tink\". Đưa lưỡi ra giữa răng và thổi hơi.", "Think sounds like \"tink\". Move the tongue between the teeth and blow air.")},
        {"wrong": "f ɹ iː", "right": "θ ɹ iː", "note": b("Three đọc thành \"free\" hoặc \"tree\". Lưỡi chạm răng chứ không phải môi dưới hay nướu.", "Three is said as \"free\" or \"tree\". The tongue touches the teeth, not the lower lip or ridge.")},
        {"wrong": "d ɪ s", "right": "ð ɪ s", "note": b("This đọc thành \"dis\". Giữ lưỡi giữa răng và rung cổ.", "This said as \"dis\". Keep the tongue between the teeth and add voice.")},
        {"wrong": "z ɪ s", "right": "ð ɪ s", "note": b("This đọc thành \"zis\". Đưa lưỡi ra trước, đừng để sau răng.", "This said as \"zis\". Bring the tongue forward, not behind the teeth.")},
    ],
    "chain": [],
    "selfCheck": b("Nhìn gương: khi nói think, this, có thấy đầu lưỡi giữa hai hàm răng không? Thử cặp three–tree để kiểm tra.",
                   "Look in a mirror: when you say think and this, can you see the tongue tip between your teeth? Try the three–tree pair to check."),
    "teacherNotes": b("Một số người nói tiếng Việt có thể đọc /θ/ gần /t/ hoặc /s/ và /ð/ gần /d/ hoặc /z/; mẫu thay thế /ð/ → /z/ hay /d/ khác nhau tùy người, không nên gắn với một vùng cụ thể. Cũng cần lưu ý Lingua Franca Core xem các âm này là không cốt lõi. Độ tin cậy phát hiện: cao (thay thế /θ/ → t s f và /ð/ → d z).",
                      "Some Vietnamese speakers may say /θ/ close to /t/ or /s/ and /ð/ close to /d/ or /z/; the /ð/ pattern (z or d) varies by person and should not be tied to a region. Note that the Lingua Franca Core treats these sounds as non-core. Detection confidence: high (/θ/ heard as t s f, /ð/ as d z)."),
})

# ---------------------------------------------------------------- U04
SUB = lambda a, vi, en: (a, vi, en)
sa = ("/ʃ/ bị đọc thành /s/.", "/ʃ/ said as /s/.")
save(4, {
    "cando": b("Em phân biệt được ship và sip, và nói rõ /ʃ tʃ dʒ/.", "I can tell ship from sip and say /ʃ tʃ dʒ/."),
    "why": [
        b("Tiếng Việt không có /ʃ ʒ tʃ dʒ/. Chữ \"ch\" của tiếng Việt là âm tắc, không phải /tʃ/; vì vậy cheese dễ thành \"tiz\" hoặc \"shiz\", và /ʃ/ thường được đọc thành /s/ (ship → \"sip\").",
          "Vietnamese has no /ʃ ʒ tʃ dʒ/. The Vietnamese \"ch\" is a stop, not /tʃ/, so cheese easily becomes \"tiz\" or \"shiz\", and /ʃ/ is often said as /s/ (ship → \"sip\").") | {"refs": ["[5]", "[6]"]},
        b("Một luận văn dùng 58 cặp tối thiểu (/tʃ–dʒ/, /s–ʃ/) để đo và cho thấy các cặp này thường bị lẫn ở người học Việt.",
          "A thesis used 58 minimal pairs (/tʃ–dʒ/, /s–ʃ/) and found these pairs are often confused by Vietnamese learners.") | {"refs": ["[7]"]},
        b("Phân biệt /ʃ tʃ dʒ/ với /s z/ làm đổi nghĩa (ship/sip, chip/ship, job), nên bài này có mức ưu tiên cao (P1).",
          "Telling /ʃ tʃ dʒ/ from /s z/ changes meaning (ship/sip, chip/ship, job), so this unit has high priority (P1).") | {"refs": ["[B16]"]},
    ],
    "howTo": [
        b("/ʃ/: môi hơi chu tròn, lưỡi lùi lại so với /s/, thổi \"shhh\" như khi bảo ai đó giữ im lặng.",
          "/ʃ/: round the lips slightly, pull the tongue back from where /s/ is, and blow \"shhh\" like asking for quiet."),
        b("/s/: môi bẹt, lưỡi sát răng, thổi \"sss\" mảnh và sắc. So sánh với /ʃ/: lưỡi tiến ra trước hơn.",
          "/s/: spread lips, tongue close to the teeth, thin sharp \"sss\". Compare /ʃ/: the tongue is further forward."),
        b("/tʃ/: bắt đầu như /t/ (lưỡi chạm nướu), rồi thả ra thành /ʃ/ trong một nhịp: \"t-sh\". Tiếng Việt \"ch\" không có luồng hơi xì này.",
          "/tʃ/: start like /t/ (tongue on the ridge), then release into /ʃ/ in one beat: \"t-sh\". Vietnamese \"ch\" has no hissing release."),
        b("/dʒ/: làm giống /tʃ/ nhưng rung cổ, như chữ \"j\" ở đầu job. Đừng đọc thành \"z\" hoặc \"gi\".",
          "/dʒ/: do the same as /tʃ/ but with voice, like the \"j\" at the start of job. Do not say \"z\" or \"gi\"."),
    ],
    "words": [
        w("ship", [("s ɪ p", *sa)], [0]), w("she", [("s iː", *sa)], [0]), w("shoe", [("s uː", *sa)], [0]),
        w("fish", [("f ɪ s", "/ʃ/ cuối bị đọc thành /s/.", "Final /ʃ/ said as /s/.")], [2]),
        w("fresh", [("f ɹ ɛ s", "/ʃ/ cuối bị đọc thành /s/.", "Final /ʃ/ said as /s/.")], [3]),
        w("sugar", [("s ʊ ɡ ɚ", *sa)], [0]), w("shell", [("s ɛ l", *sa)], [0]),
        w("cheese", [("t iː z", "/tʃ/ bị đọc thành /t/.", "/tʃ/ said as /t/."), ("ʃ iː z", "/tʃ/ bị đọc thành /ʃ/.", "/tʃ/ said as /ʃ/.")], [0]),
        w("chair", [("t ɛ ɹ", "/tʃ/ bị đọc thành /t/.", "/tʃ/ said as /t/."), ("ʃ ɛ ɹ", "/tʃ/ bị đọc thành /ʃ/.", "/tʃ/ said as /ʃ/.")], [0]),
        w("beach", [("b iː t", "/tʃ/ cuối bị đọc thành /t/.", "Final /tʃ/ said as /t/."), ("b iː ʃ", "/tʃ/ cuối bị đọc thành /ʃ/.", "Final /tʃ/ said as /ʃ/.")], [2]),
        w("juice", [("z uː s", "/dʒ/ bị đọc thành /z/.", "/dʒ/ said as /z/."), ("j uː s", "/dʒ/ bị đọc thành /j/.", "/dʒ/ said as /j/.")], [0]),
        w("job", [("z ɑː b", "/dʒ/ bị đọc thành /z/.", "/dʒ/ said as /z/."), ("j ɑː b", "/dʒ/ bị đọc thành /j/.", "/dʒ/ said as /j/.")], [0]),
    ],
    "pairs": [
        {"a": "ship", "b": "sip", "type": "substitution"}, {"a": "she", "b": "see", "type": "substitution"},
        {"a": "shoe", "b": "sue", "type": "substitution"}, {"a": "sheet", "b": "seat", "type": "substitution"},
        {"a": "chip", "b": "ship", "type": "substitution"}, {"a": "chin", "b": "shin", "type": "substitution"},
    ],
    "sentences": [
        s("She sells fresh fish at the market.", [(0, [0]), (2, [3]), (3, [2])], True),
        s("We choose fresh juice at the market.", [(1, [0]), (2, [3]), (3, [0])], True),
        s("She shops for shoes near the beach.", [(0, [0]), (1, [0]), (3, [0]), (6, [-1])], True),
        s("The ship is near the bridge.", [(1, [0]), (5, [-1])]),
    ],
    "contrasts": [
        {"wrong": "s ɪ p", "right": "ʃ ɪ p", "note": b("Ship nghe như \"sip\". Lùi lưỡi lại và chu môi nhẹ để có /ʃ/.", "Ship sounds like \"sip\". Pull the tongue back and round the lips slightly for /ʃ/.")},
        {"wrong": "s iː", "right": "ʃ iː", "note": b("She nghe như \"see\". Bắt đầu bằng \"shhh\" rồi mới sang /iː/.", "She sounds like \"see\". Start with \"shhh\" before /iː/.")},
        {"wrong": "t iː z", "right": "tʃ iː z", "note": b("Cheese bắt đầu bằng /t/ thôi. Thả /t/ ra thành luồng hơi xì /ʃ/.", "Cheese starts with plain /t/. Release the /t/ into a hissing /ʃ/.")},
        {"wrong": "z ɑː b", "right": "dʒ ɑː b", "note": b("Job nghe như \"zop\". Bắt đầu bằng lưỡi chạm nướu rồi thả thành /ʒ/ có rung cổ.", "Job sounds like \"zop\". Start with the tongue on the ridge, then release into a voiced /ʒ/ sound.")},
    ],
    "chain": [],
    "selfCheck": b("Đọc ship–sip, she–see, chip–ship cho bạn nghe. Bạn có phân biệt được từng cặp không?",
                   "Read ship–sip, she–see, chip–ship to a friend. Can they tell each pair apart?"),
    "teacherNotes": b("Một số người nói tiếng Việt ở miền Bắc được báo cáo đọc \"s\" và \"x\" giống nhau; ở miền Trung (Huế, Đà Nẵng, Quảng Nam) các âm này được báo cáo là phân biệt rõ hơn. Các nhận định này đến từ nguồn giảng dạy, chưa kiểm chứng; hãy quan sát học sinh thật. Độ tin cậy phát hiện: cao (thay thế trong nhóm s z ʃ ʒ tʃ dʒ).",
                      "Some Northern Vietnamese speakers are reported to say \"s\" and \"x\" alike; in Central Vietnam (Huế, Đà Nẵng, Quảng Nam) the distinction is reported to be kept more clearly. These claims come from teaching sources and are unverified; observe real students. Detection confidence: high (substitution among s z ʃ ʒ tʃ dʒ)."),
})

# ---------------------------------------------------------------- U05
def vl(text, idx, wrong, note, **kw):
    return w(text, [(wrong, *note)], [idx], **kw)

TENSE = ("Nguyên âm bị nói ngắn và lơi như /ɪ/.", "The vowel is said short and lax like /ɪ/.")
LAX = ("Nguyên âm bị kéo dài và căng như /iː/ hoặc /uː/.", "The vowel is stretched and tense like /iː/ or /uː/.")
save(5, {
    "cando": b("Em nói khác nhau ship–sheep và full–fool.", "I can make ship–sheep and full–fool sound different."),
    "why": [
        b("Tiếng Việt không dùng độ dài nguyên âm để phân biệt nghĩa, nên ship và sheep dễ nghe giống nhau, và full gần với fool.",
          "Vietnamese does not use vowel length to tell words apart, so ship and sheep easily sound alike and full sounds like fool.") | {"refs": ["[10]", "[11]"]},
        b("Một luận văn đo âm thanh (20 người) cho biết sự khác nhau giữa các cặp này chủ yếu nằm ở chất lượng nguyên âm (độ căng, vị trí lưỡi), không chỉ ở độ dài.",
          "A thesis with acoustic measurements (20 speakers) reports that these pairs differ mainly in vowel quality (tenseness, tongue position), not only in length.") | {"refs": ["[11]"]},
        b("Độ dài và chất lượng nguyên âm được xem là một phần cốt lõi của việc hiểu nhau trong tiếng Anh quốc tế, nên bài này có mức ưu tiên cao (P1).",
          "Vowel length and quality are treated as part of the core for mutual intelligibility in international English, so this unit has high priority (P1).") | {"refs": ["[B16]"]},
    ],
    "howTo": [
        b("/iː/ (sheep): kéo môi sang hai bên như cười nhẹ, lưỡi nâng cao ở phía trước, giữ âm lâu hơn một chút.",
          "/iː/ (sheep): spread the lips as in a gentle smile, raise the front of the tongue high, and hold the sound a bit longer."),
        b("/ɪ/ (ship): thả lỏng môi, lưỡi thấp hơn một chút, nói ngắn và nhanh. Đừng cười.",
          "/ɪ/ (ship): relax the lips, let the tongue sit a little lower, and say it short and quick. Do not smile."),
        b("/uː/ (fool): chu môi tròn nhỏ, nâng cuối lưỡi lên cao, giữ âm lâu hơn một chút.",
          "/uː/ (fool): push the lips into a small round shape, raise the back of the tongue high, and hold the sound a bit longer."),
        b("/ʊ/ (full): môi tròn nhưng lỏng hơn, hàm thả lỏng, nói ngắn.",
          "/ʊ/ (full): lips round but looser, jaw relaxed, say it short."),
        b("Luyện theo cặp trước gương: ship – sheep, full – fool. Môi phải thay đổi hình dạng giữa hai từ.",
          "Practise in pairs in front of a mirror: ship – sheep, full – fool. Your lips should change shape between the two words."),
    ],
    "words": [
        vl("sheep", 1, "ʃ ɪ p", TENSE), vl("leave", 1, "l ɪ v", TENSE), vl("feel", 1, "f ɪ l", TENSE), vl("seat", 1, "s ɪ t", TENSE),
        vl("green", 2, "ɡ ɹ ɪ n", TENSE), vl("pool", 1, "p ʊ l", TENSE), vl("food", 1, "f ʊ d", TENSE), vl("school", 2, "s k ʊ l", TENSE),
        vl("full", 1, "f uː l", LAX), vl("good", 1, "ɡ uː d", LAX), vl("look", 1, "l uː k", LAX), vl("cook", 1, "k uː k", LAX),
    ],
    "pairs": [
        {"a": "ship", "b": "sheep", "type": "substitution"}, {"a": "sit", "b": "seat", "type": "substitution"},
        {"a": "live", "aVariant": 1, "b": "leave", "type": "substitution"}, {"a": "fill", "b": "feel", "type": "substitution"},
        {"a": "full", "b": "fool", "type": "substitution"}, {"a": "pull", "b": "pool", "type": "substitution"},
    ],
    "sentences": [
        s("We feel good at the beach.", [(1, [1]), (2, [1]), (5, [2])], True),
        s("The food at the market is good.", [(1, [1]), (6, [1])], True),
        s("I like to cook and read a book.", [(3, [1]), (7, [1])]),
        s("The green pool is full of fish.", [(1, [2]), (2, [1]), (4, [1])]),
        s("Sit on the seat and look at the sea.", [(0, [1]), (3, [1]), (5, [1]), (8, [1])]),
    ],
    "contrasts": [
        {"wrong": "ʃ ɪ p", "right": "ʃ iː p", "note": b("Sheep nghe như ship. Kéo môi sang hai bên, nâng lưỡi cao và giữ lâu hơn.", "Sheep sounds like ship. Spread the lips, raise the tongue and hold the vowel longer.")},
        {"wrong": "ʃ iː p", "right": "ʃ ɪ p", "note": b("Ship nghe như sheep. Thả lỏng môi, nói ngắn và nhanh.", "Ship sounds like sheep. Relax the lips and say it short and quick.")},
        {"wrong": "f uː l", "right": "f ʊ l", "note": b("Full đọc như fool. Môi tròn lỏng hơn và nói ngắn.", "Full said like fool. Looser rounded lips and a short vowel.")},
        {"wrong": "l ɪ v", "right": "l iː v", "note": b("Leave đọc như live. Kéo dài nguyên âm và căng môi sang hai bên.", "Leave said like live. Lengthen the vowel and spread the lips.")},
    ],
    "chain": [],
    "selfCheck": b("Ghi âm cặp ship–sheep rồi nghe lại. Hai từ có khác nhau rõ không? Bạn có nhìn thấy môi đổi hình dạng trong gương không?",
                   "Record the ship–sheep pair and listen back. Do the two words sound clearly different? Can you see your lips change shape in the mirror?"),
    "teacherNotes": b("Phần mềm chỉ nghe được chất lượng nguyên âm (iː hay ɪ, uː hay ʊ), không đo độ dài, nên độ tin cậy phát hiện là trung bình; phản hồi nên dùng giọng \"có thể\". Một số người nói không phân biệt được hai âm khi nghe, nên cần cho nghe nhiều giọng. Cẩn thận với live (động từ /lɪv/, tính từ /laɪv/) khi dùng làm cặp tối thiểu.",
                      "The app can only hear vowel quality (iː or ɪ, uː or ʊ), not length, so detection confidence is medium and feedback should be hedged (\"may\"). Some speakers cannot hear the difference yet, so use many voices. Be careful with live (verb /lɪv/, adjective /laɪv/) as a minimal-pair word."),
})
print("written")

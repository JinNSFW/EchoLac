"""Renders credits.json and docs/giao-an-phat-am.md from validated unit data (NOT shipped)."""
import os
import pron_data as D

CEFR_URL = "http://www.cefr-j.org/download.html"
CITE = "The CEFR-J Wordlist Version 1.5. Compiled by Yukio Tono, Tokyo University of Foreign Studies. Retrieved from http://www.cefr-j.org/download.html"


def credits(here):
    notice = open(os.path.join(here, "cmu_license.txt"), encoding="utf-8").read().strip()
    return {"data": [
        {"id": "cmudict", "name": "The CMU Pronouncing Dictionary", "url": "https://github.com/cmusphinx/cmudict",
         "license": "BSD-2-Clause", "copyright": notice, "use": "IPA for every item (converted to espeak tokens)"},
        {"id": "cefrj", "name": "CEFR-J Wordlist Version 1.5", "compiler": "Yukio Tono, Tokyo University of Foreign Studies",
         "url": CEFR_URL, "distribution": "https://github.com/openlanguageprofiles/olp-en-cefrj",
         "license": "Free for research and commercial purposes with proper citation; copyright Tono Laboratory, TUFS",
         "citation": CITE, "use": "CEFR level of each word"}],
        "research": "See docs/giao-an-phat-am.md, Tài liệu tham khảo (ids from the research notes).",
        "inspiration": "Unit structure loosely inspired by Cadence (MIT); no Cadence content copied."}


def j(ipa):
    return "".join(ipa)


def bold_ipa(ipa, idx):
    s = "".join(("**" + t + "**") if i in idx else t for i, t in enumerate(ipa))
    return "/" + s.replace("****", "") + "/"


def pair_diff(p):
    t = p["type"]
    if t in ("substitution", "deletion", "insertion"):
        a, b = p["contrast"]
        return f"thiếu /{b}/" if a == "∅" else f"/{a}/ ↔ /{b}/"
    return {"stress": "vị trí trọng âm", "stress_phrase": "từ ghép hay cụm từ (trọng âm)", "tune": "lên/xuống giọng cuối câu", "nucleus": "từ mang trọng âm câu",
            "weak": "can / can't", "juncture": "chỗ nối giữa các từ"}[t]


def pair_cell(s, p, side):
    x = p[side]
    if "text" not in x and "text" in p:  # tune/nucleus pairs: shared text, differing prosody
        return p["text"] + " (" + ", ".join(str(v) for v in x.values()) + ")", ""
    if "text" not in x:
        return "", ""
    return x["text"], (f"/{j(x['ipa'])}/" if "ipa" in x else "")


SEC1 = """## 1. Mục đích và cách dùng

Giáo án này dành cho giáo viên và học sinh lớp 10–12 ở Đà Nẵng đang học tiếng Anh ở trình độ A1–C1. Mỗi bài tập trung vào **một nhóm lỗi phát âm** thường gặp ở người Việt (xem PRD §6) và dài khoảng 15–20 phút: nghe phân biệt trước, rồi nói từ, rồi nói câu.

Dữ liệu của giáo án nằm trong `content/pronunciation/` và được tạo tự động cùng với tài liệu này, nên hai nơi luôn khớp nhau. Ứng dụng **chưa nạp** dữ liệu này; khi tích hợp, AI Tutor dùng nó cho các yêu cầu T-02 (phân tích lỗi), T-03/T-04 (luyện tập) và T-05 (đánh dấu thành thạo), còn các bài học của chương trình Đà Nẵng (R-13) liên kết đến bài phát âm tương ứng.

Cách dùng với một lớp: (1) đọc phần "Vì sao học sinh Việt hay sai" và "Cách phát âm"; (2) làm bài nghe 10 lượt; (3) luyện từ, rồi câu; (4) tự kiểm tra bằng bảng cuối bài.
"""

SEC2 = """## 2. Nguyên tắc sư phạm

- **Ưu tiên theo mức ảnh hưởng đến việc hiểu nhau** (Intelligibility Principle [B15], Munro & Derwing [B14], Lingua Franca Core [B16]). P1 là lỗi hay gây hiểu nhầm; P3 chủ yếu ảnh hưởng độ tự nhiên. Mục tiêu là **dễ hiểu, không phải giọng bản ngữ**.
- **Nghe trước, nói sau.** Mỗi bài có bài nghe phân biệt (HVPT: nhiều giọng, nhiều ví dụ [B9]); chỉ luyện nói khi nghe đúng từ 8/10 lượt.
- **Chuỗi luyện ngược (back-chaining)** cho cụm phụ âm và âm cuối: nói từ cuối từ về đầu từ.
- **Nhại theo (shadowing)** cho nhịp, nối âm và ngữ điệu [B10].
- **Đồ thị cao độ** giúp thấy hình dạng giọng nói: so khớp hình dạng, không bắt chước giọng người nói [B11][B12].
- Dữ liệu dùng IPA kiểu Mỹ (CMUdict). Các biến thể Anh, Úc... được chấp nhận; giáo viên có thể ghi chú khác đi khi duyệt.
- Phương ngữ: ứng dụng không nhận diện hay gắn nhãn phương ngữ. Ghi chú phương ngữ chỉ để giáo viên tham khảo và dùng cách nói "một số người nói...".
"""

CHECKLIST = ["Mọi IPA khớp giọng đích; biến thể được ghi chú.",
             "Mọi cặp tối thiểu chỉ khác nhau ở âm đích, kể cả theo giọng của giáo viên.",
             "Các bước phát âm tiếng Việt đúng và an toàn, không có ví dụ so sánh gây hiểu nhầm.",
             "Lời giải thích phù hợp học sinh lớp 10–12.",
             "Các câu là tiếng Anh tự nhiên.",
             "Các câu không chứa thông tin ngoài phiếu thông tin đã xác minh.",
             "Trình độ khớp cấp CEFR của nhóm bài.",
             "Các nhận định nghiên cứu khớp với nguồn được dẫn.",
             "Ghi chú phương ngữ tôn trọng, không khuôn mẫu hoá.",
             "Chỉ giáo viên duyệt mới đặt `verified: true` trong tệp JSON của bài; người tạo dữ liệu không bao giờ đặt."]

CREDITS = """## 8. Nguồn dữ liệu và giấy phép

- **IPA:** The CMU Pronouncing Dictionary (BSD-2-Clause), https://github.com/cmusphinx/cmudict. Nguyên văn thông báo bản quyền nằm trong `content/pronunciation/credits.json`.
- **Cấp độ CEFR:** {cite} Giấy phép: miễn phí cho nghiên cứu và mục đích thương mại khi trích dẫn đúng; bản quyền thuộc Tono Laboratory, TUFS.
- **Câu mẫu:** toàn bộ do EchoLạc viết (nguồn `original`).
- **Mã âm:** quy ước mã theo bộ ký hiệu espeak IPA của facebook/wav2vec2-lv-60-espeak-cv-ft (Apache-2.0); tệp từ vựng của model không được đưa vào kho.
- **Cadence (MIT):** chỉ là nguồn cảm hứng cho cấu trúc bài; không sao chép nội dung.
"""


def status(units):
    done = {(u.get("reviewedBy"), u.get("reviewedAt")) for u in units if u["verified"]}
    if len(done) == 1 and all(u["verified"] for u in units):
        by, at = next(iter(done))
        return f"Đã duyệt bởi {by}, {at[8:10]}/{at[5:7]}/{at[:4]}"
    return "BẢN NHÁP — chưa được giáo viên duyệt"


def render(units, labels, bib):
    out = ["# Giáo án phát âm tiếng Anh cho học sinh Việt Nam (A1–C1)", "",
           f"> Trạng thái: {status(units)}. Ngày tạo {D.GENERATED}. Dữ liệu: `content/pronunciation/` (tạo tự động; không sửa tay tài liệu này).",
           "", SEC1, SEC2, "## 3. Bảng 14 mã lỗi", "",
           "Quy tắc chấm điểm và định nghĩa đầy đủ nằm ở [PRD §6](../EchoLac_PRD.md); bảng này chỉ để tra cứu.", "",
           "| Mã | Tên (VI) | Ví dụ lỗi | Nhóm | Ưu tiên | Độ tin cậy phát hiện | Bài |", "| --- | --- | --- | --- | --- | --- | --- |"]
    have = {u["id"]: u for u in units}
    for cid in D.CAT_ORDER:
        c = D.CATS[cid]
        ids = ", ".join(r[0] for r in D.ROADMAP if r[2] == cid)
        conf = D.CONF_VI[c["confidence"]] + (" (trọng âm câu: thấp)" if cid == "intonation" else "")
        out.append(f"| `{cid}` | {labels[cid]['vi']} | {D.CAT_EXAMPLE[cid]} | {D.GROUPS[c['group']]} | {c['priority']} | {conf} | {ids} |")
    out += ["", "## 4. Lộ trình 20 bài", "", "| Bài | Cấp | Mã lỗi | Tên | Học trước | Nội dung |", "| --- | --- | --- | --- | --- | --- |"]
    for r in D.ROADMAP:
        out.append(f"| {r[0]} | {r[1]} | `{r[2]}` | {r[4]} ({r[5]}) | {', '.join(r[6]) or '—'} | {'có' if r[0] in have else 'chưa viết'} |")
    out += ["", "## 5. Các bài học", ""]
    for u in units:
        out += unit_md(u, labels)
    out += ["## 6. Danh sách kiểm tra khi duyệt (toàn bộ)", ""]
    out += [f"{i}. {t}" for i, t in enumerate(CHECKLIST, 1)]
    out += ["", "## 7. Tài liệu tham khảo", "",
            "Trạng thái \"chưa kiểm\": các mục chỉ mới được tìm qua tóm tắt; `[U]` là chưa xác minh. Nhận định từ nguồn giảng dạy chỉ là \"thường gặp\", không phải số liệu.", ""]
    seen = set()
    for label, text in bib.values():
        if label not in seen:
            seen.add(label)
            out.append(f"- {label} {text} — Trạng thái: chưa kiểm")
    out += ["", CREDITS.format(cite=CITE)]
    return "\n".join(out).rstrip("\n") + "\n"


def unit_md(u, labels):
    c = D.CATS[u["category"]]
    L = []
    pre = ", ".join(u["prereq"]) or "—"
    L += [f"### {u['id']} · {u['level']} · {u['title']['vi']} ({u['title']['en']})", "",
          f"**Mục tiêu:** {u['cando']['vi']} *(EN: {u['cando']['en']})*  ",
          f"**Mã lỗi:** `{u['category']}` · Ưu tiên {c['priority']} · Phát hiện: {D.CONF_VI[c['confidence']]}  **Học trước:** {pre}", "",
          "#### Vì sao học sinh Việt hay sai", ""]
    L += [f"- {w['vi']} {' '.join(w['refs'])}" for w in u["why"]]
    L += ["", "#### Cách phát âm", ""]
    L += [f"{i}. {h['vi']} *(EN: {h['en']})*" for i, h in enumerate(u["howTo"], 1)]
    pr = u["perception"]
    L += ["", "#### Luyện nghe", ""]
    if u["pairs"]:
        L += ["| Từ A | IPA | Từ B | IPA | Khác nhau ở |", "| --- | --- | --- | --- | --- |"]
        for p in u["pairs"]:
            ta, ia = pair_cell(0, p, "a")
            tb, ib = pair_cell(0, p, "b")
            L.append(f"| {ta} | {ia} | {tb} | {ib} | {pair_diff(p)} |")
        L.append("")
    L.append(f"Dạng bài: `{pr['type']}` · {pr['trials']} lượt, ≥{pr['voices']} giọng khác nhau (chọn ngẫu nhiên), đạt khi đúng ≥{int(pr['criterion'] * 10)}/10 (HVPT [B9]). "
             "Âm thanh do TTS tạo, không lưu trong dữ liệu.")
    if u["words"]:
        L += ["", "#### Luyện nói — từ", "", "| Từ | IPA (Mỹ) | CEFR | Âm trọng tâm |", "| --- | --- | --- | --- |"]
        for w in u["words"]:
            idx = {i for t in w["targets"] for i in t["index"]}
            tg = ", ".join(f"/{w['ipa'][i]}/" for i in sorted(idx))
            L.append(f"| {w['text']} | {bold_ipa(w['ipa'], idx)} | {w['cefr'] or '—'} | {tg}{' (trọng âm âm tiết ' + str(w['stress']) + ')' if u['kind'] == 'stress' else ''} |")
    L += ["", "#### Luyện nói — câu", ""]
    L += [f"{i}. {s['text']} (EchoLạc)" for i, s in enumerate(u["sentences"], 1)]
    L += ["", "#### Lỗi thường gặp → cách sửa", "", "| Sai | Đúng | Ghi chú |", "| --- | --- | --- |"]
    for c2 in u["contrasts"]:
        if "wrongText" in c2:
            L.append(f"| {c2['wrongText']} | {c2['rightText']} | {c2['note']['vi']} |")
        else:
            L.append(f"| [{j(c2['wrongIpa'])}] | /{j(c2['rightIpa'])}/ | {c2['note']['vi']} |")
    L += ["", "#### Chuỗi luyện", ""]
    if not u["chain"]:
        L.append("Không bắt buộc ở bài này.")
    for ch in u["chain"]:
        if "steps" in ch:
            L.append(f"- **{ch['text']}:** " + " → ".join(f"/{j(s)}/" for s in ch["steps"]) + f" — {ch['note']['vi']}")
        else:
            L.append(f"- **{ch['text']}** — {ch['note']['vi']}")
            L += [f"  {i}. {s['vi']}" for i, s in enumerate(ch["shadow"], 1)]
    sc = u["selfCheck"]
    gate = "Điểm số có tính vào việc qua bài." if sc["gate"] == "score" else "Bài độ tin cậy thấp: qua bài bằng bài nghe, bảng tự kiểm tra và (nếu có) giáo viên kiểm tra; ứng dụng chỉ hiện điểm, không chặn."
    L += ["", "#### Tự kiểm tra và tiêu chí đạt", "",
          f"{sc['vi']}", "",
          f"- Mỗi từ/câu chấm 0–100; dưới 60 tạo mục lỗi (chỉ với mã lỗi tin cậy cao/trung bình); từ/câu được xem là thành thạo khi ≥80 vào hai ngày khác nhau.",
          f"- Qua bài khi nghe ≥{int(sc['perceptionToPass'] * 100)}% và ≥{int(sc['itemsToPass'] * 100)}% mục luyện nói từng đạt ≥{sc['threshold']}. {gate}",
          "", "#### Ghi chú cho giáo viên", "", u["teacherNotes"]["vi"], "",
          "#### Duyệt bài", "", "- [ ] IPA đúng  - [ ] Cặp tối thiểu đúng  - [ ] Giải thích đúng, dễ hiểu  - [ ] Câu tự nhiên, không sai sự thật",
          "- [ ] Đúng cấp độ  - [ ] Đã duyệt bởi: ____ ngày: ____", ""]
    return L

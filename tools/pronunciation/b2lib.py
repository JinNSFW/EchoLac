import json, re, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lookup as L
VOW = {"iː","i","ɪ","ɛ","æ","ɑː","ɔː","ʊ","uː","ʌ","ə","ɚ","ɜː","eɪ","aɪ","ɔɪ","oʊ","aʊ"}
def B(vi, en): return {"vi": vi, "en": en}
def W(text, errs, tg=None, **kw):
    """word: errs = [(variantIpa, vi, en)], tg default = first vowel; int n = nth vowel; list = explicit index"""
    ip = L.lookup(text)[kw.get("variant", 0)]["ipa"]
    if tg is None: tg = 1
    if isinstance(tg, int) and tg > 0 and tg < 9 and kw.pop("vowelIdx", True):
        vs = [i for i, t in enumerate(ip) if t in VOW]; tg = [vs[tg - 1]]
    cat = kw.pop("cat", None); mo = kw.pop("morph", False)
    t = "stress" if tg == "stress" else [{"index": tg, **({"category": cat} if cat else {}), **({"morph": True} if mo else {})}]
    d = {"text": text, "targets": t, "errors": [{"variantIpa": v, "note": B(a, b)} for v, a, b in errs]}
    d.update(kw); return d
def S(text, tg, culture=False, **kw):
    ws = [w.strip(".,?!;:\"") for w in text.split()]
    out = []
    for item in tg:
        wi, spec = item[0], item[1]; ex = item[2] if len(item) > 2 else {}
        r = L.lookup(ws[wi].lower())
        ip = r[kw.get("variants", {}).get(str(wi), 0)]["ipa"]
        if isinstance(spec, int):
            vs = [i for i, t in enumerate(ip) if t in VOW]; spec = [vs[spec - 1]]
        out.append({"word": wi, "index": spec, **ex})
    d = {"text": text, "targets": out, "culture": culture}; d.update(kw); return d
def P(a, b, ty, **kw): d = {"a": a, "b": b, "type": ty}; d.update(kw); return d
def C(wrong, right, vi, en): return {"wrong": wrong, "right": right, "note": B(vi, en)}
def save(uid, d):
    d["id"] = uid
    with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "authored", uid.lower() + ".json"), "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=2)

"""Pronunciation content generator (NOT shipped). See AUTHORING.md.
Usage: python -I build_pron.py [--repo D:\\Project] [--check]
Reads authored/uNN.json, validates (plan D.5 + F.2), writes content/pronunciation/* and docs/giao-an-phat-am.md.
"""
import argparse, glob, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import lookup as L
import pron_data as D
import doc_gen

ENG, VOW = set(D.TOKENS["english"]), set(D.TOKENS["vowels"])
ANYTOK = ENG | set(D.TOKENS["variant"])
FUNC = {"a", "an", "the", "to", "of", "and", "can", "for", "from", "was", "some", "them", "are", "at"}
AUTHOR_IPA = {"of": ["ə", "v"], "at": ["ə", "t"], "from": ["f", "ɹ", "ə", "m"], "some": ["s", "ə", "m"]}  # CMUdict lacks a weak form
STRIP = ".,?!;:\"“”"
PROS_FINAL = {"fall", "rise", "fall-rise"}
PROS_TYPE = {"statement", "wh", "yesno", "choice", "list", "tag", "echo"}
LINK_TYPE = {"CV", "VV_w", "VV_j", "elision", "assimilation"}
PAIR_TYPES = {"substitution", "deletion", "insertion", "stress", "stress_phrase", "tune", "nucleus", "weak", "juncture"}
BIB = {}


class Fail(Exception):
    pass


def need(cond, msg):
    if not cond:
        raise Fail(msg)


def toks(s):
    return s.split() if isinstance(s, str) else list(s)


def bil(o, ctx):
    need(isinstance(o, dict) and all(isinstance(o.get(k), str) and o[k].strip() for k in ("vi", "en")), f"{ctx}: needs non-empty vi and en")
    return {"vi": o["vi"].strip(), "en": o["en"].strip()}


def lk(text, variant, ctx):
    r = L.lookup(text)
    need(r, f"{ctx}: '{text}' not in CMUdict")
    need(0 <= variant < len(r), f"{ctx}: '{text}' has {len(r)} variants, asked {variant}")
    return r[variant]


def guess_lemma(w):
    """shortcut: strips common inflections to find a CEFR-J headword; give `lemmas` for irregular forms."""
    w = re.sub(r"('s|'m|'re|'ll|'d|'ve)$", "", w)
    if L.cefr(w):
        return w
    for suf, add in (("ies", "y"), ("es", ""), ("s", ""), ("ied", "y"), ("ed", ""), ("d", ""), ("ing", ""), ("ing", "e")):
        if w.endswith(suf) and len(w) > len(suf) + 1 and L.cefr(w[:-len(suf)] + add):
            return w[:-len(suf)] + add
    return w


def nsyl(ipa):
    return sum(1 for t in ipa if t in VOW)


def resolve_idx(idx, n, ctx):
    out = []
    for i in (idx if isinstance(idx, list) else [idx]):
        need(isinstance(i, int) and -n <= i < n, f"{ctx}: index {i} out of range 0..{n - 1}")
        out.append(i % n)
    return sorted(set(out))


def check_toks(tk, allowed, ctx):
    bad = [t for t in tk if t not in allowed]
    need(not bad, f"{ctx}: unknown tokens {bad}")


class Unit:
    def __init__(self, a, scen):
        self.a, self.scen = a, scen
        rm = next((r for r in D.ROADMAP if r[0] == a.get("id")), None)
        need(rm, f"{a.get('id')}: not in ROADMAP")
        (self.id, self.level, self.cat, self.kind, tvi, ten, self.prereq, self.slug) = rm
        self.title = {"vi": tvi, "en": ten}
        self.band = D.BAND[self.level]
        self.cap = D.CEFR_ORD[D.CAP[self.band]]
        self.nulls = 0
        self.targets_all = []

    # ---- cefr ----
    def cefr_checked(self, lemma, ctx, scenario=None):
        c = L.cefr(lemma)
        if c is None:
            need(self.band == "B2-C1" or (scenario and scenario in self.scen),
                 f"{ctx}: no CEFR-J level for '{lemma}'; use lemma, or set scenarioVocab to a scenario id")
            self.nulls += 1
        else:
            need(D.CEFR_ORD[c] <= self.cap, f"{ctx}: '{lemma}' is {c}, above band cap {D.CAP[self.band]}")
        return c

    def norm_targets(self, tl, n, ctx):
        out = []
        for t in tl:
            cat = t.get("category", self.cat)
            need(cat in D.CATS, f"{ctx}: unknown category {cat}")
            out.append({"index": resolve_idx(t["index"], n, ctx), "category": cat, "morph": bool(t.get("morph", False))})
            self.targets_all.append(cat)
        return out

    # ---- words ----
    def word(self, a, n):
        wid = f"{self.id}-w{n:02d}"
        text, var = a["text"], a.get("variant", 0)
        lemma = a.get("lemma", text)
        if "ipaAuthor" in a:
            need(text in AUTHOR_IPA, f"{wid}: ipaAuthor only for {sorted(AUTHOR_IPA)}")
            ipa, src, stress = toks(a["ipaAuthor"]), "author", None
            check_toks(ipa, ENG, wid)
        else:
            r = lk(text, var, wid)
            ipa, src, stress = r["ipa"], "cmudict", r["stress_syllable"]
        syl = nsyl(ipa)
        if a.get("stress") is not None:
            need(a["stress"] == stress, f"{wid}: authored stress {a['stress']} != CMUdict {stress}")
        if self.kind == "stress":
            need(isinstance(stress, int) and 1 <= stress <= syl, f"{wid}: stress word needs stress in 1..{syl}")
        scen = a.get("scenarioVocab")
        c = self.cefr_checked(lemma, wid, scen)
        tl = a.get("targets")
        if tl == "stress":
            vp = [i for i, t in enumerate(ipa) if t in VOW]
            tl = [{"index": [vp[stress - 1]], "category": "word_stress"}]
        tgt = self.norm_targets(tl or [], len(ipa), wid)
        need(tgt, f"{wid}: needs >=1 target")
        alts, elide = [], bool(a.get("allowElision", False))
        for v in a.get("altVariants", []):
            need(v != var, f"{wid}: alt variant equals main")
            alt = lk(text, v, wid)["ipa"]
            need(len(alt) == len(ipa) or elide, f"{wid}: alt {v} has different length; set allowElision (only for linking units / non-target phones)")
            if len(alt) != len(ipa) and self.cat != "linking":
                need(all(i < len(alt) for t in tgt for i in t["index"]), f"{wid}: elision alt hides a target phone")
            alts.append(alt)
        errs = []
        for e in a.get("errors", []):
            v = toks(e["variantIpa"])
            check_toks(v, ANYTOK, wid + " variantIpa")
            need(v != ipa, f"{wid}: variantIpa equals ipa")
            cat = e.get("category", tgt[0]["category"])
            need(cat in D.CATS, f"{wid}: unknown error category {cat}")
            errs.append({"category": cat, "variantIpa": v, "note": bil(e.get("note"), wid + " error note")})
        if self.kind == "segmental":
            need(errs, f"{wid}: segmental word needs >=1 expected error")
        return {"id": wid, "text": text, "lemma": lemma, "cefr": c, "scenarioVocab": scen, "ipa": ipa, "ipaSource": src,
                "variant": var, "ipaAlt": alts, "allowElision": elide, "syllables": syl, "stress": stress,
                "targets": tgt, "expectedErrors": errs, "detectConfidence": D.CATS[tgt[0]["category"]]["confidence"]}

    # ---- pairs ----
    def side(self, text, var, lemma, ctx):
        r = lk(text, var, ctx)
        return {"text": text, "ipa": r["ipa"], "cefr": L.cefr(lemma or text), "variant": var}, r

    def pair(self, a, n):
        pid = f"{self.id}-p{n:02d}"
        ty = a["type"]
        need(ty in PAIR_TYPES, f"{pid}: bad type {ty}")
        cat = a.get("category", self.cat)
        need(cat in D.CATS, f"{pid}: unknown category")
        out = {"id": pid, "type": ty, "category": cat}
        if ty in ("tune", "nucleus"):
            key = "final" if ty == "tune" else "nucleus"
            need(all(key in a[s] for s in "ab") and a["a"][key] != a["b"][key], f"{pid}: a and b need different '{key}'")
            if ty == "tune":
                need(all(a[s]["final"] in PROS_FINAL for s in "ab"), f"{pid}: bad final")
            out.update({"text": a["text"], "a": a["a"], "b": a["b"]})
            return out
        if ty == "weak":
            wa, wb = a["a"].split(), a["b"].split()
            need(len(wa) == len(wb) and sum(x != y for x, y in zip(wa, wb)) == 1, f"{pid}: weak pair texts must differ in one word (can/can't)")
            out.update({"a": {"text": a["a"]}, "b": {"text": a["b"]}})
            return out
        if ty == "juncture":
            def cat_ipa(ph):
                res = []
                for w in ph.split():
                    r = L.lookup(w.lower())
                    need(r, f"{pid}: '{w}' not in CMUdict")
                    if w.lower() in FUNC:
                        r = [x for x in r if x["stress_syllable"] is None] or r
                    res += r[0]["ipa"]
                return res
            ia, ib = cat_ipa(a["a"]), cat_ipa(a["b"])
            need(a["a"].lower() != a["b"].lower() and ia == ib, f"{pid}: juncture pair must have identical joined ipa ({ia} vs {ib})")
            out.update({"a": {"text": a["a"], "ipa": ia}, "b": {"text": a["b"], "ipa": ib}})
            return out
        if ty == "stress_phrase":  # compound vs phrase (greenhouse / green house): same phones, different stressed word
            need(self.kind == "stress", f"{pid}: stress_phrase pairs only in stress units")
            sides = {}
            for k in "ab":
                x = a[k]; ws = x["text"].split(); ipa = []; cefrs = []
                for w in ws:
                    r = lk(w.lower(), 0, pid); ipa += r["ipa"]; cefrs.append(L.cefr(w.lower()))
                sw, ss = x["stressWord"], x["stressSyllable"]
                need(isinstance(sw, int) and 0 <= sw < len(ws), f"{pid}: bad stressWord")
                syl = sum(1 for t in lk(ws[sw].lower(), 0, pid)["ipa"] if t in D.TOKENS["vowels"])
                need(isinstance(ss, int) and 1 <= ss <= syl, f"{pid}: bad stressSyllable")
                known = [c for c in cefrs if c]
                cefr = max(known, key=lambda c: D.CEFR_ORD[c]) if len(known) == len(cefrs) else None
                sides[k] = {"text": x["text"], "ipa": ipa, "cefr": cefr, "stressWord": sw, "stressSyllable": ss}
            A, B = sides["a"], sides["b"]
            need(A["text"].lower() != B["text"].lower(), f"{pid}: texts must differ")
            need(A["ipa"] == B["ipa"], f"{pid}: joined ipa differs ({' '.join(A['ipa'])} vs {' '.join(B['ipa'])})")
            need(len(A["text"].split()) != len(B["text"].split()), f"{pid}: one side must be one word, the other a phrase")
            known = [x["cefr"] for x in (A, B) if x["cefr"]]
            need(self.band == "B2-C1" or (known and min(D.CEFR_ORD[c] for c in known) <= self.cap), f"{pid}: no side within band cap")
            out.update({"a": A, "b": B})
            return out
        sa, ra = self.side(a["a"], a.get("aVariant", 0), a.get("aLemma"), pid)
        sb, rb = self.side(a["b"], a.get("bVariant", 0), a.get("bLemma"), pid)
        known = [s["cefr"] for s in (sa, sb) if s["cefr"]]
        need(self.band == "B2-C1" or known, f"{pid}: neither side has a CEFR-J level")
        need(self.band == "B2-C1" or min(D.CEFR_ORD[c] for c in known) <= self.cap, f"{pid}: both sides above band cap")
        A, B = sa["ipa"], sb["ipa"]
        if ty == "stress":
            sa["stress"], sb["stress"] = ra["stress_syllable"], rb["stress_syllable"]
            need(sa["stress"] != sb["stress"], f"{pid}: stress must differ")
            out.update({"a": sa, "b": sb})
        elif ty == "substitution":
            d = [i for i in range(min(len(A), len(B))) if A[i] != B[i]]
            need(len(A) == len(B) and len(d) == 1,
                 f"{pid}: {sa['text']}/{sb['text']} not a minimal substitution pair ({' '.join(A)} vs {' '.join(B)})")
            out.update({"a": sa, "b": sb, "diffIndex": d[0], "contrast": [A[d[0]], B[d[0]]]})
        else:  # deletion / insertion: b = a + one token
            ok = [i for i in range(len(B)) if B[:i] + B[i + 1:] == A]
            need(len(B) == len(A) + 1 and ok, f"{pid}: {sb['text']} is not '{sa['text']}' plus one token ({' '.join(A)} vs {' '.join(B)})")
            out.update({"a": sa, "b": sb, "diffIndex": ok[-1], "contrast": ["∅", B[ok[-1]]]})
        return out

    # ---- sentences ----
    def sentence(self, a, n):
        sid = f"{self.id}-s{n:02d}"
        text = a["text"].replace("’", "'")
        need(not re.search(r"\d", text), f"{sid}: digits are not allowed")
        need(a.get("source", {}).get("type", "original") == "original", f"{sid}: only original sentences (no Tatoeba)")
        surf = [w.strip(STRIP) for w in text.split()]
        need(all(surf) and len(surf) <= D.WORD_LIMIT[self.band], f"{sid}: {len(surf)} words > {D.WORD_LIMIT[self.band]}")
        unsc, lemmas, vmap, nullok = a.get("unscored", []), a.get("lemmas", {}), a.get("variants", {}), a.get("cefrNull", {})
        words, mx = [], 0
        for i, w in enumerate(surf):
            if w in unsc:
                need(w[0].isupper() or not w.isascii(), f"{sid}: unscored word '{w}' must be a capitalised/Vietnamese name")
                words.append({"w": w, "ipa": None})
                continue
            lw = w.lower()
            if lw in FUNC and str(i) not in vmap:
                rs = L.lookup(lw)
                need(rs or lw in AUTHOR_IPA, f"{sid}: '{w}' not in CMUdict")
                weak = [r for r in rs if r["stress_syllable"] is None]
                ipa = weak[0]["ipa"] if weak else AUTHOR_IPA.get(lw) or rs[0]["ipa"]
                authored = not weak and lw in AUTHOR_IPA
            else:
                ipa = lk(lw, vmap.get(str(i), 0), f"{sid} word '{w}'")["ipa"]
                authored = False
            lem = lemmas.get(lw) or guess_lemma(lw)
            c = L.cefr(lem)
            if c is None:
                need(lw in nullok and (self.band == "B2-C1" or nullok[lw] in self.scen),
                     f"{sid}: no CEFR-J for '{w}'; add lemmas {{word: lemma}} or cefrNull {{word: scenarioId}}")
            else:
                need(D.CEFR_ORD[c] <= self.cap, f"{sid}: '{w}' is {c}, above band cap")
                mx = max(mx, D.CEFR_ORD[c])
            ww = {"w": w, "ipa": ipa}
            if authored:
                ww["ipaSource"] = "author"  # weak form CMUdict lacks (plan D.5)
            alts = []
            for v in a.get("alts", {}).get(str(i), []):  # linking units only: reduced/assimilated forms (CMUdict variant index or author tokens)
                need(self.cat == "linking", f"{sid}: 'alts' only in linking units")
                alt = lk(lw, v, sid)["ipa"] if isinstance(v, int) else toks(v)
                check_toks(alt, ENG, sid + " alt")
                need(alt != ipa, f"{sid}: alt equals ipa")
                alts.append(alt)
            if alts:
                ww.update({"ipaAlt": alts, "allowElision": True})
            words.append(ww)
        tg = []
        for t in a.get("targets", []):
            wi = t["word"]
            if isinstance(wi, str):
                wi = next((i for i, x in enumerate(words) if x["w"].lower() == wi.lower()), None)
                need(wi is not None, f"{sid}: target word not in sentence")
            need(0 <= wi < len(words) and words[wi]["ipa"], f"{sid}: target word {wi} invalid or unscored")
            cat = t.get("category", self.cat)
            need(cat in D.CATS, f"{sid}: unknown category")
            item = {"word": wi, "index": resolve_idx(t["index"], len(words[wi]["ipa"]), sid), "category": cat, "morph": bool(t.get("morph", False))}
            if cat == "weak_form":  # the typical Vietnamese error is the full (strong) form: derive it from CMUdict's stressed variant
                strong = [r["ipa"] for r in L.lookup(words[wi]["w"].lower()) if r["stress_syllable"] is not None]
                need(strong and strong[0] != words[wi]["ipa"], f"{sid}: no strong form for weak target '{words[wi]['w']}'")
                item["expectedErrors"] = [{"category": "weak_form", "variantIpa": strong[0],
                                           "note": {"vi": "Đọc dạng mạnh, nguyên âm đầy đủ.", "en": "Full (strong) form instead of the weak form."}}]
            tg.append(item)
            self.targets_all.append(cat)
        if self.kind in ("segmental", "stress"):
            need(sum(len(t["index"]) for t in tg) >= 2, f"{sid}: needs >=2 target phone instances")
        pr = self.prosody(a.get("prosody"), words, sid)
        if a.get("factFrom"):
            need(a["factFrom"] in self.scen, f"{sid}: factFrom not a scenario id")
        return {"id": sid, "text": text, "cefr": next((k for k, v in D.CEFR_ORD.items() if v == mx), None), "words": words,
                "targets": tg, "prosody": pr, "detectConfidence": D.CATS[self.cat]["confidence"],
                "source": {"type": "original", "author": "EchoLạc"}, "factFrom": a.get("factFrom")}

    def prosody(self, p, words, sid):
        c, n = self.cat, len(words)
        if c not in ("intonation", "word_stress", "rhythm", "linking", "weak_form"):
            need(p is None, f"{sid}: prosody must be null in {c} units")
            return None
        if c == "weak_form":
            return p
        if c == "word_stress":
            if self.kind == "stress" and p is None:
                return None
            need(isinstance(p, dict) and 0 <= p.get("stressWord", -1) < n and isinstance(p.get("stressSyllable"), int), f"{sid}: bad stress prosody")
            return p
        need(isinstance(p, dict), f"{sid}: {c} sentences need prosody")
        if c == "intonation":
            need(p.get("final") in PROS_FINAL and p.get("type") in PROS_TYPE, f"{sid}: bad intonation prosody")
            nu = p.get("nucleus")
            need(nu is None or (isinstance(nu, int) and 0 <= nu < n), f"{sid}: bad nucleus")
        elif c == "rhythm":
            for k in ("beats", "weak"):
                need(isinstance(p.get(k), list) and all(isinstance(i, int) and 0 <= i < n for i in p[k]), f"{sid}: bad {k}")
            need(p["beats"], f"{sid}: needs beats")
        elif c == "linking":
            need(isinstance(p.get("links"), list) and p["links"], f"{sid}: needs links")
            for l in p["links"]:
                need(0 <= l["after"] < n - 1 and l["type"] in LINK_TYPE, f"{sid}: bad link")
                bil(l.get("note"), sid + " link note")
        return p

    # ---- build ----
    def build(self):
        a = self.a
        for k, v in (("level", self.level), ("category", self.cat), ("kind", self.kind)):
            need(a.get(k, v) == v, f"{self.id}: {k} differs from ROADMAP ({v})")
        why = []
        for i, w in enumerate(a.get("why", [])):
            o = bil(w, f"{self.id} why#{i + 1}")
            need(w.get("refs") and all(r in BIB for r in w["refs"]), f"{self.id} why#{i + 1}: refs must be research.md ids like [2] or [B7]")
            o["refs"] = w["refs"]
            why.append(o)
        howto = [bil(h, f"{self.id} howTo#{i + 1}") for i, h in enumerate(a.get("howTo", []))]
        for h in howto:
            need(len(h["en"].split()) <= 25 and len(h["vi"].split()) <= 35, f"{self.id}: howTo step too long: {h['en'][:40]}")
        words = [self.word(w, i + 1) for i, w in enumerate(a.get("words", []))]
        pairs = [self.pair(p, i + 1) for i, p in enumerate(a.get("pairs", []))]
        sents = [self.sentence(s, i + 1) for i, s in enumerate(a.get("sentences", []))]
        need(sum(1 for s in a.get("sentences", []) if s.get("culture")) >= 2, f"{self.id}: needs >=2 sentences with \"culture\": true (Đà Nẵng/Hội An/Huế)")
        contrasts = []
        for i, c in enumerate(a.get("contrasts", [])):
            cid = f"{self.id}-c{i + 1:02d}"
            if "wrongText" in c:  # prosody units: stress/tune/linking cannot be written as IPA tokens
                need(self.kind in ("prosody", "stress"), f"{cid}: text contrasts only in prosody/stress units")
                wt, rt = c["wrongText"].strip(), c["rightText"].strip()
                need(wt and rt and wt != rt, f"{cid}: wrongText/rightText empty or equal")
                need(not re.search(r"\d", wt + rt), f"{cid}: digits in contrast")
                contrasts.append({"id": cid, "wrongText": wt, "rightText": rt, "note": bil(c.get("note"), cid)})
                continue
            w, r = toks(c["wrong"]), toks(c["right"])
            check_toks(w, ANYTOK, cid)
            check_toks(r, ENG, cid)
            need(w != r, f"{cid}: wrong equals right")
            contrasts.append({"id": cid, "wrongIpa": w, "rightIpa": r, "note": bil(c.get("note"), cid)})
        chain = []
        for c in a.get("chain", []):
            o = {"text": c["text"]}
            if "steps" in c:
                o["steps"] = [toks(s) for s in c["steps"]]
                for s in o["steps"]:
                    check_toks(s, ANYTOK, self.id + " chain")
                o["ipaSource"] = "author"
            else:
                need(3 <= len(c.get("shadow", [])) <= 5, f"{self.id}: chain 'shadow' needs 3-5 steps")
                o["shadow"] = [bil(s, self.id + " shadow") for s in c["shadow"]]
            o["note"] = bil(c.get("note"), self.id + " chain note")
            chain.append(o)
        self.counts(why, howto, words, pairs, sents, contrasts, chain)
        need(self.nulls <= 2 or self.band == "B2-C1", f"{self.id}: {self.nulls} null-CEFR words/pair sides (max 2)")
        if self.targets_all:
            share = self.targets_all.count(self.cat) / len(self.targets_all)
            need(share >= 0.7, f"{self.id}: only {share:.0%} of targets carry {self.cat} (need >=70%)")
        ids = [x["id"] for g in (words, pairs, sents, contrasts) for x in g]
        need(len(ids) == len(set(ids)), f"{self.id}: duplicate ids")
        gate = "selfcheck" if D.CATS[self.cat]["confidence"] == "low" else "score"
        sc = {"threshold": 80, "itemsToPass": 0.8, "perceptionToPass": 0.8, "gate": gate, **bil(a.get("selfCheck"), self.id + " selfCheck")}
        return {"id": self.id, "level": self.level, "band": self.band, "category": self.cat, "kind": self.kind, "prereq": self.prereq,
                "title": self.title, "cando": bil(a.get("cando"), self.id + " cando"), "why": why, "howTo": howto,
                "perception": self.perception(a.get("perception", {}), words, pairs, sents), "words": words, "pairs": pairs,
                "sentences": sents, "contrasts": contrasts, "chain": chain, "selfCheck": sc,
                "teacherNotes": bil(a.get("teacherNotes"), self.id + " teacherNotes"), "verified": bool(a.get("reviewedBy")), "reviewedBy": a.get("reviewedBy"), "reviewedAt": a.get("reviewedAt")}

    def counts(self, why, howto, words, pairs, sents, contrasts, chain):
        k, c = self.kind, self.cat
        if k == "stress":
            pr = (0, 6)
        elif k == "segmental":
            pr = (4, 6)
        else:
            pr = {"intonation": (4, 6), "weak_form": (2, 4), "rhythm": (0, 0)}.get(c) or ((4, 6) if self.id == "U13" else (0, 4))
        spec = {"why": ((2, 3), why), "howTo": ((3, 5), howto), "contrasts": ((2, 4), contrasts),
                "words": ((0, 0) if k == "prosody" else (8, 12), words), "pairs": (pr, pairs),
                "sentences": ((8, 12) if k == "prosody" else (3, 5), sents)}
        for name, ((lo, hi), arr) in spec.items():
            need(lo <= len(arr) <= hi, f"{self.id}: {name} has {len(arr)}, needs {lo}-{hi}")
        need(chain or not (c == "cluster" or k == "prosody"), f"{self.id}: chain required for {c}/{k} units")

    def perception(self, p, words, pairs, sents):
        default = {"stress": "stress-tap", "segmental": "2afc"}.get(self.kind) or {
            "intonation": "2afc-tune", "weak_form": "dictation", "linking": "2afc-juncture", "rhythm": "beats"}[self.cat]
        ty = p.get("type", default)
        o = {"type": ty, "pairIds": [], "trials": 4 if ty == "beats" else 10, "voices": 3, "criterion": 0.8}
        if ty.startswith("2afc"):
            need(pairs, f"{self.id}: 2afc perception needs pairs")
            o["pairIds"] = [x["id"] for x in pairs]
        elif ty == "stress-tap":
            o["wordIds"] = [x["id"] for x in words]
        else:
            o["sentenceIds"] = [x["id"] for x in sents]
        return o


def parse_bib():
    ids = {}
    for line in open(os.path.join(HERE, "research.md"), encoding="utf-8"):
        m = re.match(r"^(\[[^\]]+\](?:/\[[^\]]+\])?) (.*)$", line.rstrip("\n"))
        if m:
            for i in re.findall(r"\[[^\]]+\]", m.group(1)):
                ids[i] = (m.group(1), m.group(2))
    return ids


def err_cat_labels(repo):
    src = open(os.path.join(repo, "content", "practice.js"), encoding="utf-8").read()
    blk = src[src.index("const ERR_CAT"):src.index("const WORDS")]
    pat = r"(\w+): \{ vi: '((?:[^'\\]|\\.)*)', en: '((?:[^'\\]|\\.)*)' \}"
    return {m[0]: {"vi": m[1], "en": m[2]} for m in re.findall(pat, blk)}


def scenario_ids(repo):
    ids = set()
    for f in glob.glob(os.path.join(repo, "content", "**", "*.js"), recursive=True):
        ids |= set(re.findall(r"\bid: *'([a-z0-9_-]+)'", open(f, encoding="utf-8").read()))
    return ids


def dump(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(json.dumps(obj, indent=2, ensure_ascii=False) + "\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", default=os.path.dirname(os.path.dirname(HERE)))
    ap.add_argument("--reviewed-by", help="reviewer name; marks every unit verified and is stored in authored/")
    ap.add_argument("--reviewed-at", help="review date YYYY-MM-DD (required with --reviewed-by)")
    ap.add_argument("--check", action="store_true", help="validate only, write nothing")
    ap.add_argument("--only", help="validate just these units, e.g. u06 or u06,u07 (implies --check)")
    args = ap.parse_args()
    if bool(args.reviewed_by) != bool(args.reviewed_at) or (args.reviewed_at and not re.fullmatch(r"\d{4}-\d{2}-\d{2}", args.reviewed_at)):
        sys.exit("FAIL: --reviewed-by and --reviewed-at YYYY-MM-DD go together")
    BIB.update(parse_bib())
    labels = err_cat_labels(args.repo)
    need(set(labels) - {"grammar"} == set(D.CATS), f"ERR_CAT keys differ from taxonomy: {set(labels) ^ set(D.CATS)}")
    scen = scenario_ids(args.repo)
    units = []
    only = set(args.only.lower().split(",")) if args.only else None
    if only: args.check = True
    for f in sorted(glob.glob(os.path.join(HERE, "authored", "u[0-9][0-9].json"))):
        if only and os.path.basename(f)[:3] not in only: continue
        a = json.load(open(f, encoding="utf-8"))
        if args.reviewed_by and not args.check:  # keep the review in authored/ so plain rebuilds retain it
            a["reviewedBy"], a["reviewedAt"] = args.reviewed_by, args.reviewed_at
            dump(f, a)
        units.append(Unit(a, scen).build())
        print("ok", os.path.basename(f), {k: len(units[-1][k]) for k in ("why", "howTo", "words", "pairs", "sentences", "contrasts", "chain")})
    order = [r[0] for r in D.ROADMAP]
    need(len({u["id"] for u in units}) == len(units), "duplicate unit ids")
    for u in units:
        need(all(p in order and order.index(p) < order.index(u["id"]) for p in u["prereq"]), f"{u['id']}: bad prereq")
    cats_used = {u["category"] for u in units}
    if args.check:
        print("check only; categories covered:", len(cats_used), "of 14")
        return
    out = os.path.join(args.repo, "content", "pronunciation")
    for old in glob.glob(os.path.join(out, "units", "u*.json")):
        os.remove(old)
    slug = {r[0]: r[7] for r in D.ROADMAP}
    index = {"version": 1, "generated": D.GENERATED, "generator": "tools/pronunciation/build_pron.py",
             "units": [{"id": u["id"], "file": f"units/{u['id'].lower()}-{slug[u['id']]}.json", "level": u["level"],
                        "band": u["band"], "category": u["category"]} for u in units]}
    for u, e in zip(units, index["units"]):
        dump(os.path.join(out, e["file"]), u)
    dump(os.path.join(out, "index.json"), index)
    dump(os.path.join(out, "categories.json"), D.CATS)
    dump(os.path.join(out, "tokens.json"), D.TOKENS)
    dump(os.path.join(out, "credits.json"), doc_gen.credits(HERE))
    doc = doc_gen.render(units, labels, BIB)
    with open(os.path.join(args.repo, "docs", "giao-an-phat-am.md"), "w", encoding="utf-8", newline="\n") as f:
        f.write(doc)
    print(f"wrote {len(units)} units; categories covered {len(cats_used)}/14")


if __name__ == "__main__":
    try:
        main()
    except Fail as e:
        print("FAIL:", e)
        sys.exit(1)

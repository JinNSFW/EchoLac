# Brief for a single-unit author (Sonnet 5.5 medium)

W = this folder (scratchpad\pron). Shared by several authors working in parallel on DIFFERENT units.

You author exactly ONE unit: authored/uNN.json (NN given in your task).

READ (in this order, skim long files with grep/offsets):
1. plan.md: row for your unit in section C table, its seeds in C.1, counts C.2, authoring rules C.3, schema D.5 (pair types, prosody objects).
2. AUTHORING.md (authored format, worked example, common errors).
3. authored/u01.json and authored/u11.json (approved examples; match quality/style). mk_units.py and b2lib.py show how earlier authors generated files with small Python helpers.
4. research.md (cite ONLY ids that exist there).

HOW TO WORK (avoid giant single outputs — they stall):
- Write a small generator script mk_uNN.py in W (use b2lib.py helpers or plain dicts), built up in 2–3 Write/Edit steps (e.g. words first, then pairs/sentences, then texts). Run it to produce authored/uNN.json.
- Check IPA/CEFR/stress with `python -I lookup.py word ...`. Never hand-type IPA except where plan allows (weak forms CMUdict lacks; chain fragments).
- Validate ONLY your unit: `python -I build_pron.py --only uNN`. Never run build_pron.py without --only/--check. Never touch d:\Project.
- DO NOT edit build_pron.py, pron_data.py, doc_gen.py, lookup.py or other units' files. If the generator rejects something the plan requires, or lacks a feature, STOP that part and report the exact error + your proposed minimal code fix (diff snippet). Work around if possible within the plan (e.g. drop an unsupported optional field).

CONTENT RULES:
- All sentences ORIGINAL (`source` original, author EchoLạc). No digits, no facts/dates/prices/opening hours/history. ≥2 sentences with Đà Nẵng/Hội An/Huế flavour (beach, bridge, river, market, lanterns, food, weather) as opinions/descriptions. Vietnamese names unscored (ipa null).
- vi text: simple, accurate Vietnamese for grades 10–12, with matching English. Articulation physically correct. Claims from [teaching]/[U] sources worded "thường gặp"/"được báo cáo" — no invented statistics. teacherNotes: dialect note ("một số người nói…", never stereotype) + detection-confidence caveat + what the app cannot judge.
- Prosody units: shadowing chain required (listen ×2 → hum → whisper with audio → speak with audio → speak alone); visual pitch: "bắt chước hình dạng, không bắt chước giọng". Low-confidence categories (rhythm, weak_form, linking): selfCheck gate "selfcheck".
- verified false, reviewedBy null.

REPORT (≤200 words): counts (why/howTo/words/pairs/sentences/contrasts/chain), seeds replaced and why, any generator problem with proposed fix, doubts for the reviewer. Last line: "uNN: PASS" or "uNN: BLOCKED <reason>".

UPDATE (orchestrator): prosody and stress units may write contrasts as text instead of IPA:
`{"wrongText": "Is it far? ↘ (falls)", "rightText": "Is it far? ↗ (rises)", "note": {"vi": "...", "en": "..."}}`.
Use marks like CAPITALS for stress, ↗/↘ for tunes, ‿ for links, (pause) or [ʔ] for a glottal stop. Prefer these over borrowing IPA contrasts from another category.

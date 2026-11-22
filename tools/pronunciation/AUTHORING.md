# Authoring guide: pronunciation units (builders U06-U20)

Files: `build_pron.py` (generator + validator), `pron_data.py` (taxonomy, tokens, ROADMAP), `doc_gen.py` (doc + credits), `lookup.py` (CMUdict -> IPA, CEFR-J), `research.md` (allowed `refs` ids), `plan.md` (spec). `mk_units.py` is only a scratch helper that wrote u01-u05 from Python; hand-written JSON is fine.

## Commands (run from this folder)
```
python -I build_pron.py            # validate authored/u??.json and write content/pronunciation/* + docs/giao-an-phat-am.md
python -I build_pron.py --check    # validate only, write nothing
python -I lookup.py word1 word2    # variants, CEFR, stress (use it to pick `variant` and check minimal pairs)
```
`--repo` overrides the repo path (default `d:\Project`). Stops at the first failure with `FAIL: <unit id ...>: <reason>`. `index.json` lists only units that exist.
Then in the repo: `npm run check && npm test`.

## What you write (`authored/uNN.json`)
`id` is the only key you must give for identity: level, category, kind, prereq, title and slug come from `ROADMAP` in `pron_data.py` (do not add them; if you do they must match). The generator fills IPA, `cefr`, `syllables`, `stress`, ids, `detectConfidence`, `perception`, `selfCheck` numbers, `verified:false`, `reviewedBy:null`. Never type IPA for words; type the text and the generator looks it up. Always type the IPA letter `ɡ` (U+0261) for /g/ and `ɹ` for /r/ (as in `lookup.py` output).

| key | meaning |
| --- | --- |
| `cando`, `teacherNotes`, `selfCheck` | `{vi, en}`; `selfCheck` text only (threshold/gate are generated; gate is `selfcheck` for low-confidence categories) |
| `why` | 2-3 `{vi, en, refs:["[2]","[B7]"]}`; every ref must be an id in `research.md`; wording "thuong gap / duoc bao cao" for teaching sources |
| `howTo` | 3-5 `{vi, en}`; en <= 25 words, vi <= 35 words |
| `words` | segmental/stress units only. `{text, lemma?, variant?, altVariants?, allowElision?, stress?, scenarioVocab?, ipaAuthor?, targets, errors}` |
| `targets` | `[{index:[-1], category?, morph?}]`; indexes 0-based into the word IPA, negative from the end; `"targets":"stress"` marks the stressed vowel (stress units); category defaults to the unit category; `morph:true` for inflection suffix phones |
| `errors` | `[{variantIpa:"k ae", note:{vi,en}, category?}]` space-separated tokens (allowed: english + variant tokens in `tokens.json`); must differ from the target IPA; >= 1 per segmental word |
| `stress` | optional assertion; must equal CMUdict's stress syllable or the build fails (catches wrong seeds) |
| `pairs` | `{a, b, type, aVariant?, bVariant?, aLemma?, bLemma?}` types: `substitution` (same length, exactly 1 token differs), `deletion`/`insertion` (b = a + 1 token), `stress` (same text, different `aVariant`/`bVariant` with different stress), `tune`/`nucleus` (`{text, a:{final}, b:{final}}` or `{nucleus}`), `weak` (texts differ only in can/can't), `juncture` (different texts, identical joined IPA; a/an/the use weak forms) |
| `sentences` | `{text, targets:[{word:<index or text>, index:[...], category?, morph?}], culture?, unscored?, lemmas?, variants?, cefrNull?, prosody?, factFrom?}` |
| `contrasts` | `{wrong:"n ai", right:"n ai s", note}`; wrong = realistic Vietnamese realisation |
| `chain` | segmental: `{text, steps:["aI k","b aI k"], note}`; prosody (shadowing): `{text, shadow:[{vi,en} x3-5], note}` |
| `perception` | optional `{type}` override; default by unit kind (2afc, stress-tap, 2afc-tune, dictation, 2afc-juncture, beats) |

Sentence rules: original text only (no Tatoeba), no digits, <= 10/15/22 words by band, function words (a an the to of and can for from was some them are at) get their weak form automatically (override with `variants:{"<word index>":n}`), >= 2 target phone instances for segmental/stress, >= 2 sentences per unit with `"culture": true` (Da Nang / Hoi An / Hue; opinions and descriptions only, no facts, dates, numbers). Vietnamese names go in `unscored:["Hoi","An"]` and must be capitalised or contain a non-ASCII letter. CEFR: the generator guesses the headword (strips s/es/ed/ing); for irregular forms give `lemmas:{"went":"go"}`; for words absent from CEFR-J give `cefrNull:{"noodles":"a1-noodles"}` (scenario id; free in B2-C1). Words above the band cap (A2, B1, B2) fail. Prosody objects per category: see plan D.5 (intonation `{final,type,nucleus}`, rhythm `{beats,weak}`, linking `{links:[{after,type,note}]}`, word_stress multiword `{stressWord,stressSyllable}`).

Counts enforced (plan C.2): why 2-3, howTo 3-5, contrasts 2-4; segmental/stress words 8-12, sentences 3-5; prosody units 0 words and 8-12 sentences and a `chain`; pairs 4-6 (segmental), 0-6 (stress), intonation 4-6, U13 4-6, U20 0-4, weak_form 2-4, rhythm 0; cluster units need a `chain`. >= 70% of all targets must carry the unit category; at most 2 words with null CEFR below B2-C1 (pair sides are not counted).

## Common errors and fixes
| message | fix |
| --- | --- |
| `not a minimal substitution pair (... vs ...)` | CMUdict differs in more than one token (dog/dock). Pick another pair or `aVariant`/`bVariant`. |
| `is not 'x' plus one token` | for deletion/insertion b must be a plus exactly one token; mind CMUdict variants. |
| `no CEFR-J level for 'w'` | add `lemma` (words), `lemmas` (sentences), `scenarioVocab`/`cefrNull` (scenario id), or pick a CEFR-J word. |
| `is B1, above band cap A2` | use an easier word. |
| `authored stress 2 != CMUdict 1` | your seed stress is wrong; fix it. |
| `alt N has different length; set allowElision` | only for linking units or phones that are not targets. |
| `unknown tokens ['g']` | you typed ASCII g/r; use `ɡ` and `ɹ`. |
| `refs must be research.md ids` | cite only ids listed in `research.md`. |
| `needs >=2 target phone instances` | add targets (word index counts words, not letters). |
| `howTo step too long` | <= 25 English words per step. |

## Complete example: authored/u01.json
(Every `{vi,en}` pair holds both languages.)

```json
{
  "cando": {
    "vi": "Em nói rõ âm cuối /p t k s/ trong từ ngắn.",
    "en": "I can finish short words with a clear final /p t k s/."
  },
  "why": [
    {
      "vi": "Âm cuối /p t k/ của tiếng Việt thường không bật hơi (môi/lưỡi đóng rồi dừng), nên khi nói tiếng Anh học sinh hay nuốt hoặc thay âm cuối bằng một nhịp dừng ở họng: cat nghe như \"ca\". Các nghiên cứu nhỏ ghi nhận đây là lỗi hay gặp nhất; một nghiên cứu (22 người) thấy khoảng một nửa (49,3%) âm tắc cuối bị nuốt hoặc thay bằng âm tắc họng.",
      "en": "Vietnamese final /p t k/ are usually unreleased, so learners often drop the English final consonant or replace it with a glottal stop: cat sounds like \"ca\". Small studies report this as the most common error; one study (22 speakers) found about half (49.3%) of final stops were unreleased or glottalised.",
      "refs": [
        "[1]",
        "[8]"
      ]
    },
    {
      "vi": "Tiếng Việt chuẩn không có /s/ hoặc /f/ ở cuối âm tiết, nên nice dễ thành \"nai\" và rice thành \"rai\". Đây là những âm cuối mà học sinh thường quên hoàn toàn.",
      "en": "Standard Vietnamese has no final /s/ or /f/, so nice easily becomes \"nai\" and rice becomes \"rai\". These are final sounds learners often leave out completely.",
      "refs": [
        "[14]",
        "[1]"
      ]
    },
    {
      "vi": "Phụ âm là nhóm âm cốt lõi cho việc hiểu nhau trong tiếng Anh quốc tế, và âm cuối thiếu làm hai từ trùng nhau (why/white, see/seat), nên bài này có mức ưu tiên cao (P1).",
      "en": "Consonants are core sounds for mutual intelligibility in international English, and a missing final sound makes two words collide (why/white, see/seat), so this unit has high priority (P1).",
      "refs": [
        "[B16]"
      ]
    }
  ],
  "howTo": [
    {
      "vi": "/t/: nói \"ca\", rồi đưa đầu lưỡi lên chạm nướu sau răng trên và thả ra thật nhẹ. Đừng dừng ở cổ họng.",
      "en": "/t/: say \"ca\", then touch the tongue tip to the ridge behind your top teeth and release lightly. Do not stop in your throat."
    },
    {
      "vi": "/p/: mím hai môi, rồi thả ra kèm một luồng hơi nhỏ. Để tay trước miệng, em phải cảm thấy hơi.",
      "en": "/p/: close your lips, then open them with a small puff of air. Hold a hand before your mouth to feel it."
    },
    {
      "vi": "/k/: nâng cuối lưỡi chạm phần mềm của vòm miệng, rồi thả ra nhẹ như tiếng \"k\" ngắn.",
      "en": "/k/: raise the back of the tongue to the soft palate, then release it like a short \"k\"."
    },
    {
      "vi": "/s/: để lưỡi gần nướu răng trên, hai hàm gần sát nhau và thổi \"sss\" mảnh, không rung cổ (đặt tay lên cổ: không thấy rung).",
      "en": "/s/: tongue near the ridge behind the top teeth, teeth close, blow a thin \"sss\" with no voice (no buzz under your hand)."
    },
    {
      "vi": "Sau âm cuối chỉ cần một hơi thở rất ngắn. Đừng thêm nguyên âm \"ờ\" (cat không phải \"cát-ờ\").",
      "en": "After the final sound add only a very short breath. Do not add a vowel \"uh\" (cat is not \"cat-uh\")."
    }
  ],
  "words": [
    {
      "text": "cat",
      "targets": [
        {
          "index": [
            -1
          ]
        }
      ],
      "errors": [
        {
          "variantIpa": "k æ",
          "note": {
            "vi": "Bỏ mất âm cuối.",
            "en": "Final sound dropped."
          }
        },
        {
          "variantIpa": "k æ ʔ",
          "note": {
            "vi": "Dừng ở cổ họng, lưỡi/môi không chạm.",
            "en": "Glottal stop instead of the final sound."
          }
        }
      ]
    },
    {
      "text": "kite",
      "targets": [
        {
          "index": [
            -1
          ]
        }
      ],
      "errors": [
        {
          "variantIpa": "k aɪ",
          "note": {
            "vi": "Bỏ mất âm cuối.",
            "en": "Final sound dropped."
          }
        },
        {
          "variantIpa": "k aɪ ʔ",
          "note": {
            "vi": "Dừng ở cổ họng, lưỡi/môi không chạm.",
            "en": "Glottal stop instead of the final sound."
          }
        }
      ]
    },
    {
      "text": "map",
      "targets": [
        {
          "index": [
            -1
          ]
        }
      ],
      "errors": [
        {
          "variantIpa": "m æ",
          "note": {
            "vi": "Bỏ mất âm cuối.",
            "en": "Final sound dropped."
          }
        },
        {
          "variantIpa": "m æ ʔ",
          "note": {
            "vi": "Dừng ở cổ họng, lưỡi/môi không chạm.",
            "en": "Glottal stop instead of the final sound."
          }
        }
      ]
    },
    {
      "text": "bike",
      "targets": [
        {
          "index": [
            -1
          ]
        }
      ],
      "errors": [
        {
          "variantIpa": "b aɪ",
          "note": {
            "vi": "Bỏ mất âm cuối.",
            "en": "Final sound dropped."
          }
        },
        {
          "variantIpa": "b aɪ ʔ",
          "note": {
            "vi": "Dừng ở cổ họng, lưỡi/môi không chạm.",
            "en": "Glottal stop instead of the final sound."
          }
        }
      ]
    },
    {
      "text": "book",
      "targets": [
        {
          "index": [
            -1
          ]
        }
      ],
      "errors": [
        {
          "variantIpa": "b ʊ",
          "note": {
            "vi": "Bỏ mất âm cuối.",
            "en": "Final sound dropped."
          }
        },
        {
          "variantIpa": "b ʊ ʔ",
          "note": {
            "vi": "Dừng ở cổ họng, lưỡi/môi không chạm.",
            "en": "Glottal stop instead of the final sound."
          }
        }
      ]
    },
    {
      "text": "night",
      "targets": [
        {
          "index": [
            -1
          ]
        }
      ],
      "errors": [
        {
          "variantIpa": "n aɪ",
          "note": {
            "vi": "Bỏ mất âm cuối.",
            "en": "Final sound dropped."
          }
        },
        {
          "variantIpa": "n aɪ ʔ",
          "note": {
            "vi": "Dừng ở cổ họng, lưỡi/môi không chạm.",
            "en": "Glottal stop instead of the final sound."
          }
        }
      ]
    },
    {
      "text": "cup",
      "targets": [
        {
          "index": [
            -1
          ]
        }
      ],
      "errors": [
        {
          "variantIpa": "k ʌ",
          "note": {
            "vi": "Bỏ mất âm cuối.",
            "en": "Final sound dropped."
          }
        },
        {
          "variantIpa": "k ʌ ʔ",
          "note": {
            "vi": "Dừng ở cổ họng, lưỡi/môi không chạm.",
            "en": "Glottal stop instead of the final sound."
          }
        }
      ]
    },
    {
      "text": "boat",
      "targets": [
        {
          "index": [
            -1
          ]
        }
      ],
      "errors": [
        {
          "variantIpa": "b oʊ",
          "note": {
            "vi": "Bỏ mất âm cuối.",
            "en": "Final sound dropped."
          }
        },
        {
          "variantIpa": "b oʊ ʔ",
          "note": {
            "vi": "Dừng ở cổ họng, lưỡi/môi không chạm.",
            "en": "Glottal stop instead of the final sound."
          }
        }
      ]
    },
    {
      "text": "white",
      "targets": [
        {
          "index": [
            -1
          ]
        }
      ],
      "errors": [
        {
          "variantIpa": "w aɪ",
          "note": {
            "vi": "Bỏ mất âm cuối.",
            "en": "Final sound dropped."
          }
        },
        {
          "variantIpa": "w aɪ ʔ",
          "note": {
            "vi": "Dừng ở cổ họng, lưỡi/môi không chạm.",
            "en": "Glottal stop instead of the final sound."
          }
        }
      ]
    },
    {
      "text": "lake",
      "targets": [
        {
          "index": [
            -1
          ]
        }
      ],
      "errors": [
        {
          "variantIpa": "l eɪ",
          "note": {
            "vi": "Bỏ mất âm cuối.",
            "en": "Final sound dropped."
          }
        },
        {
          "variantIpa": "l eɪ ʔ",
          "note": {
            "vi": "Dừng ở cổ họng, lưỡi/môi không chạm.",
            "en": "Glottal stop instead of the final sound."
          }
        }
      ]
    },
    {
      "text": "nice",
      "targets": [
        {
          "index": [
            -1
          ]
        }
      ],
      "errors": [
        {
          "variantIpa": "n aɪ",
          "note": {
            "vi": "Bỏ mất âm cuối.",
            "en": "Final sound dropped."
          }
        },
        {
          "variantIpa": "n aɪ ʔ",
          "note": {
            "vi": "Dừng ở cổ họng, lưỡi/môi không chạm.",
            "en": "Glottal stop instead of the final sound."
          }
        }
      ]
    },
    {
      "text": "rice",
      "targets": [
        {
          "index": [
            -1
          ]
        }
      ],
      "errors": [
        {
          "variantIpa": "ɹ aɪ",
          "note": {
            "vi": "Bỏ mất âm cuối.",
            "en": "Final sound dropped."
          }
        },
        {
          "variantIpa": "ɹ aɪ ʔ",
          "note": {
            "vi": "Dừng ở cổ họng, lưỡi/môi không chạm.",
            "en": "Glottal stop instead of the final sound."
          }
        }
      ]
    }
  ],
  "pairs": [
    {
      "a": "why",
      "b": "white",
      "type": "deletion"
    },
    {
      "a": "see",
      "b": "seat",
      "type": "deletion"
    },
    {
      "a": "buy",
      "b": "bike",
      "type": "deletion"
    },
    {
      "a": "lie",
      "b": "light",
      "type": "deletion"
    },
    {
      "a": "tie",
      "b": "tight",
      "type": "deletion"
    },
    {
      "a": "my",
      "b": "might",
      "type": "deletion"
    }
  ],
  "sentences": [
    {
      "text": "I like the night market.",
      "targets": [
        {
          "word": 1,
          "index": [
            -1
          ]
        },
        {
          "word": 3,
          "index": [
            -1
          ]
        },
        {
          "word": 4,
          "index": [
            -1
          ]
        }
      ],
      "culture": true
    },
    {
      "text": "The beach is nice and quiet.",
      "targets": [
        {
          "word": 1,
          "index": [
            -1
          ]
        },
        {
          "word": 3,
          "index": [
            -1
          ]
        },
        {
          "word": 5,
          "index": [
            -1
          ]
        }
      ],
      "culture": true
    },
    {
      "text": "Let's eat rice and fish.",
      "targets": [
        {
          "word": 0,
          "index": [
            -1
          ]
        },
        {
          "word": 1,
          "index": [
            -1
          ]
        },
        {
          "word": 2,
          "index": [
            -1
          ]
        },
        {
          "word": 4,
          "index": [
            -1
          ]
        }
      ],
      "culture": false
    },
    {
      "text": "We take a bike to Hội An.",
      "targets": [
        {
          "word": 1,
          "index": [
            -1
          ]
        },
        {
          "word": 3,
          "index": [
            -1
          ]
        }
      ],
      "culture": true,
      "unscored": [
        "Hội",
        "An"
      ]
    },
    {
      "text": "Please put the cup on the map.",
      "targets": [
        {
          "word": 1,
          "index": [
            -1
          ]
        },
        {
          "word": 3,
          "index": [
            -1
          ]
        },
        {
          "word": 6,
          "index": [
            -1
          ]
        }
      ],
      "culture": false
    }
  ],
  "contrasts": [
    {
      "wrong": "n aɪ",
      "right": "n aɪ s",
      "note": {
        "vi": "Nice nghe như \"nai\". Đặt lưỡi gần nướu răng trên và thổi \"sss\" ở cuối.",
        "en": "Nice sounds like \"nai\". Put the tongue near the ridge behind the top teeth and blow \"sss\" at the end."
      }
    },
    {
      "wrong": "k æ ʔ",
      "right": "k æ t",
      "note": {
        "vi": "Cổ họng đóng thay cho lưỡi. Đưa đầu lưỡi lên nướu rồi thả ra.",
        "en": "The throat closes instead of the tongue. Lift the tongue tip to the ridge and release."
      }
    },
    {
      "wrong": "b aɪ",
      "right": "b aɪ k",
      "note": {
        "vi": "Bike mất /k/. Nâng cuối lưỡi chạm vòm mềm rồi thả.",
        "en": "Bike lost its /k/. Raise the back of the tongue to the soft palate, then release."
      }
    },
    {
      "wrong": "k ʌ",
      "right": "k ʌ p",
      "note": {
        "vi": "Cup mất /p/. Mím môi lại rồi thả ra kèm chút hơi.",
        "en": "Cup lost its /p/. Close the lips, then open with a little air."
      }
    }
  ],
  "chain": [
    {
      "text": "ike → bike",
      "steps": [
        "aɪ k",
        "b aɪ k"
      ],
      "note": {
        "vi": "Nói phần cuối trước, rồi thêm âm đầu. Nghe và giữ lại /k/ cuối.",
        "en": "Say the end first, then add the start. Hear and keep the final /k/."
      }
    },
    {
      "text": "ight → night",
      "steps": [
        "aɪ t",
        "n aɪ t"
      ],
      "note": {
        "vi": "Giữ đầu lưỡi chạm nướu ở cuối từ night.",
        "en": "Keep the tongue tip on the ridge at the end of night."
      }
    }
  ],
  "selfCheck": {
    "vi": "Ghi âm từng từ rồi nghe lại: cuối mỗi từ có nghe rõ /p t k s/ không? Thử cặp why–white để chắc chắn người nghe phân biệt được.",
    "en": "Record each word and listen back: can you hear the final /p t k s/? Try the why–white pair to be sure a listener can tell them apart."
  },
  "teacherNotes": {
    "vi": "Tiếng Việt cũng có âm cuối /p t k/ nhưng không bật hơi, vì vậy âm \"có đó nhưng không nghe\" dễ bị tính là thiếu. Phần mềm chỉ phát hiện âm cuối bị mất hoặc thay bằng âm tắc họng; không đo độ bật hơi. Giọng Anh ở một số vùng cũng nuốt /t/ cuối thành âm tắc họng; đừng tính là lỗi nếu người nghe vẫn hiểu. Độ tin cậy phát hiện: cao, chưa được đo trên học sinh thật.",
    "en": "Vietnamese has final /p t k/ too, but unreleased, so a sound that is \"there but not heard\" may count as missing. The app only detects a final that is lost or replaced by a glottal stop; it does not judge release. Some British accents also glottalise a final /t/, so do not count that as an error if the listener understands. Detection confidence: high, not yet measured on real students."
  },
  "id": "U01"
}
```

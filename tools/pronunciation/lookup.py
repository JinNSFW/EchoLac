"""Look up words in CMUdict (BSD-2) -> espeak-style IPA tokens matching the
wav2vec2-lv-60-espeak-cv-ft vocab, plus CEFR-J 1.5 level.
Usage: python -I lookup.py word1 word2 ...   (prints TSV: word, cefr, arpabet, ipa_tokens, stress_syllable)
Also importable: lookup(word) -> list of dicts (one per CMUdict variant).
"""
import csv, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, '.cache')  # filled by fetch_data.py
V = {  # vowels: base -> (stressed, unstressed)
    'AA': ('ɑː', 'ɑː'), 'AE': ('æ', 'æ'), 'AH': ('ʌ', 'ə'), 'AO': ('ɔː', 'ɔː'), 'AW': ('aʊ', 'aʊ'),
    'AY': ('aɪ', 'aɪ'), 'EH': ('ɛ', 'ɛ'), 'ER': ('ɜː', 'ɚ'), 'EY': ('eɪ', 'eɪ'), 'IH': ('ɪ', 'ɪ'),
    'IY': ('iː', 'i'), 'OW': ('oʊ', 'oʊ'), 'OY': ('ɔɪ', 'ɔɪ'), 'UH': ('ʊ', 'ʊ'), 'UW': ('uː', 'uː'),
}
C = {'B': 'b', 'CH': 'tʃ', 'D': 'd', 'DH': 'ð', 'F': 'f', 'G': 'ɡ', 'HH': 'h', 'JH': 'dʒ', 'K': 'k', 'L': 'l',
     'M': 'm', 'N': 'n', 'NG': 'ŋ', 'P': 'p', 'R': 'ɹ', 'S': 's', 'SH': 'ʃ', 'T': 't', 'TH': 'θ', 'V': 'v',
     'W': 'w', 'Y': 'j', 'Z': 'z', 'ZH': 'ʒ'}

def to_ipa(arpa):
    toks, stress, syl = [], None, 0
    for p in arpa:
        m = re.fullmatch(r'([A-Z]+)([012])?', p)
        base, st = m.group(1), m.group(2)
        if base in V:
            syl += 1
            if st == '1' and stress is None: stress = syl
            toks.append(V[base][0 if st in ('1', '2') else 1])
        else:
            toks.append(C[base])
    return toks, stress, syl

_dict = None
def _load():
    global _dict
    if _dict is None:
        _dict = {}
        with open(os.path.join(CACHE, 'cmudict.dict'), encoding='utf-8') as f:
            for line in f:
                line = line.split('#')[0].strip()
                if not line: continue
                w, *ph = line.split()
                _dict.setdefault(re.sub(r'\(\d+\)$', '', w), []).append(ph)
        _dict['__cefr'] = {}
        order = {'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4}
        with open(os.path.join(CACHE, 'cefrj.csv'), encoding='utf-8') as f:
            for r in csv.DictReader(f):
                for hw in r['headword'].split('/'):
                    hw = hw.strip().lower()
                    old = _dict['__cefr'].get(hw)
                    if old is None or order.get(r['CEFR'], 9) < order.get(old, 9):
                        _dict['__cefr'][hw] = r['CEFR']
    return _dict

def cefr(word):
    return _load()['__cefr'].get(word.lower())

def lookup(word):
    d = _load()
    out = []
    for arpa in d.get(word.lower(), []):
        toks, stress, syl = to_ipa(arpa)
        out.append({'word': word, 'cefr': cefr(word), 'arpabet': ' '.join(arpa), 'ipa': toks,
                    'stress_syllable': stress, 'syllables': syl})
    return out

if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    for w in sys.argv[1:]:
        res = lookup(w)
        if not res: print(f'{w}\t{cefr(w)}\tNOT_IN_CMUDICT'); continue
        for r in res:
            print(f"{w}\t{r['cefr']}\t{r['arpabet']}\t{' '.join(r['ipa'])}\tstress={r['stress_syllable']}/{r['syllables']}")

"""Download CMUdict and CEFR-J into .cache/ (not committed). Usage: python -I fetch_data.py"""
import os, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, ".cache")
FILES = {
    "cmudict.dict": "https://raw.githubusercontent.com/cmusphinx/cmudict/master/cmudict.dict",
    "cefrj.csv": "https://raw.githubusercontent.com/openlanguageprofiles/olp-en-cefrj/master/cefrj-vocabulary-profile-1.5.csv",
}

if __name__ == "__main__":
    os.makedirs(CACHE, exist_ok=True)
    for name, url in FILES.items():
        dest = os.path.join(CACHE, name)
        with urllib.request.urlopen(url, timeout=60) as r, open(dest, "wb") as f:
            f.write(r.read())
        print("ok", name, os.path.getsize(dest), "bytes")

"""Tìm ảnh test trùng hoặc gần trùng với ảnh train/val (rò rỉ dữ liệu), và trùng giữa train với val.

    python leak_check.py "../../model v4/dataset"

So bằng dHash + aHash 64 bit trên ảnh đã xoay theo EXIF; bắt được ảnh thu nhỏ, nén lại, đổi định dạng.
Ngưỡng: khoảng cách Hamming dHash <= 10 VÀ aHash <= 12 → nghi trùng (xem ảnh ghép trong leak/ để xác nhận).
"""
import csv, sys, unicodedata
from pathlib import Path
from PIL import Image, ImageOps

here = Path(__file__).parent
data = Path(sys.argv[1])
EXT = {'.jpg', '.jpeg', '.png', '.webp', '.avif', '.bmp'}

def load(p):
    return ImageOps.exif_transpose(Image.open(p)).convert('RGB')

def dhash(im):
    g = im.convert('L').resize((9, 8), Image.LANCZOS); px = list(g.getdata())
    return sum(1 << i for i in range(64) if px[(i // 8) * 9 + i % 8] > px[(i // 8) * 9 + i % 8 + 1])

def ahash(im):
    g = im.convert('L').resize((8, 8), Image.LANCZOS); px = list(g.getdata()); m = sum(px) / 64
    return sum(1 << i for i, v in enumerate(px) if v > m)

def hashes(paths):
    out = []
    for p in paths:
        try: im = load(p); out.append((p, dhash(im), ahash(im)))
        except Exception as e: print('bỏ qua', p.name, e)
    return out

nfc = lambda s: unicodedata.normalize('NFC', s)
ds = hashes(sorted(p for p in data.rglob('*') if p.suffix.lower() in EXT))
tests = hashes([here / 'test' / r['file'] for r in csv.DictReader(open(here / 'labels.csv', encoding='utf-8'))]
               + [here / 'carp' / r['file'] for r in csv.DictReader(open(here / 'labels_carp.csv', encoding='utf-8'))])
ham = lambda a, b: bin(a ^ b).count('1')
near = lambda x, y: ham(x[1], y[1]) <= 10 and ham(x[2], y[2]) <= 12

def pair_sheet(pairs, name):
    if not pairs: return
    W = 220; sheet = Image.new('RGB', (W * 2, (W + 18) * len(pairs)), 'white')
    from PIL import ImageDraw; d = ImageDraw.Draw(sheet)
    for i, (a, b, dh) in enumerate(pairs):
        for j, p in enumerate((a, b)):
            im = load(p); im.thumbnail((W, W)); sheet.paste(im, (j * W, i * (W + 18) + 18))
        d.text((4, i * (W + 18) + 3), f'{a.name[:30]}  <->  {b.parent.parent.name}/{b.parent.name[:14]}/{b.name[:20]}  d={dh}', fill='black')
    sheet.save(here / 'leak' / name, quality=85)

rows, test_pairs = [], []
for t in tests:
    for x in ds:
        if near(t, x):
            dh = ham(t[1], x[1]); split, cls = x[0].parent.parent.name, nfc(x[0].parent.name)
            rows.append([t[0].parent.name + '/' + t[0].name, split, cls, x[0].name, dh, ham(t[2], x[2])]); test_pairs.append((t[0], x[0], dh))
tv = [(a[0], b[0], ham(a[1], b[1])) for a in ds for b in ds if a[0] < b[0] and a[0].parent.parent.name == 'train' and b[0].parent.parent.name == 'val' and near(a, b)]
with open(here / 'leak' / 'leak_pairs.csv', 'w', newline='', encoding='utf-8') as fh:
    w = csv.writer(fh); w.writerow(['test_file', 'split', 'class', 'dataset_file', 'dhash_dist', 'ahash_dist']); w.writerows(rows)
pair_sheet(test_pairs, 'test_vs_dataset.jpg'); pair_sheet(tv[:40], 'train_vs_val.jpg')
leaked = sorted({r[0] for r in rows})
print(f'ảnh dataset: {len(ds)}, ảnh test: {len(tests)}')
print(f'ảnh test nghi trùng với train/val: {len(leaked)}')
for r in rows: print('  ', r)
print(f'cặp train<->val nghi trùng: {len(tv)}')
for a, b, dh in tv[:40]: print(f'   {nfc(a.parent.name)[:14]}/{a.name[:24]}  <->  {nfc(b.parent.name)[:14]}/{b.name[:24]}  d={dh}')

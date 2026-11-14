"""Đánh giá và chẩn đoán model v3 trên bộ ảnh test có nhãn.

    python eval.py                      # dùng ../landmarks.keras, ../labels.txt, labels.csv, test/
    python eval.py --gradcam            # thêm ảnh Grad-CAM cho ảnh cầu và ảnh sai vào gradcam/

Cần: pip install tensorflow pillow   (Pillow >= 11.2 đọc được .avif)
Đầu ra: results.csv (top-3 từng ảnh, từng cách tiền xử lý) và báo cáo in ra màn hình.
"""
import argparse, csv, math, unicodedata
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps
from tensorflow import keras
import tensorflow as tf

SIZE = 224
MARGIN = 0.20  # luật chênh lệch top-1/top-2 của nhóm (PRD C-04)


def stretch(im):  # giống Predict.py: keras.utils.load_img(target_size) kéo giãn, không giữ tỉ lệ
    return im.resize((SIZE, SIZE), Image.NEAREST)


def crop(im):  # giống app/Teachable Machine: cắt vuông ở giữa rồi thu nhỏ
    return ImageOps.fit(im, (SIZE, SIZE), Image.BILINEAR)


MODES = {'stretch': stretch, 'crop': crop, 'crop_flip': lambda im: ImageOps.mirror(crop(im))}


def wilson(k, n, z=1.96):
    if not n: return (0, 0)
    p = k / n; d = 1 + z * z / n
    c = (p + z * z / (2 * n)) / d; h = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return (c - h, c + h)


def decide(p, names):
    o = np.argsort(p)[::-1]
    return names[o[0]] if p[o[0]] - p[o[1]] >= MARGIN else 'Không chắc chắn'


def gradcam(model, x, cls):
    base = model.get_layer('MobileNetV3Large')
    feat = keras.Model(base.inputs, [base.get_layer('activation_19').output, base.output])
    dense = model.get_layer('dense')
    with tf.GradientTape() as t:
        conv, pooled = feat(x, training=False)
        score = dense(pooled)[:, cls]
    g = t.gradient(score, conv)[0]
    cam = tf.nn.relu(tf.reduce_sum(conv[0] * tf.reduce_mean(g, axis=(0, 1)), axis=-1)).numpy()
    return cam / (cam.max() + 1e-8)


def overlay(img, cam, path, title):
    heat = Image.fromarray(np.uint8(cam * 255)).resize(img.size, Image.BILINEAR)
    lit = np.asarray(img, dtype='float32') * (0.15 + 0.85 * np.asarray(heat, dtype='float32')[..., None] / 255)
    out = Image.fromarray(np.uint8(lit))  # "spotlight": bright = where the model looked, dark = ignored
    from PIL import ImageDraw
    ImageDraw.Draw(out).rectangle((0, 0, SIZE, 14), fill='black')
    ImageDraw.Draw(out).text((3, 2), title, fill='white')
    out.save(path)


def main():
    ap = argparse.ArgumentParser()
    here = Path(__file__).parent
    ap.add_argument('--model', default=here.parent / 'landmarks.keras')
    ap.add_argument('--labels', default=here.parent / 'labels.txt')
    ap.add_argument('--truth', default=here / 'labels.csv')
    ap.add_argument('--images', default=here / 'test')
    ap.add_argument('--gradcam', action='store_true')
    a = ap.parse_args()

    model = keras.models.load_model(a.model)
    nfc = lambda s: unicodedata.normalize('NFC', s).strip()
    names = [nfc(n) for n in Path(a.labels).read_text(encoding='utf-8').splitlines()]
    assert len(names) == model.output_shape[-1], 'labels.txt không khớp số ngõ ra của model'
    truth = {r['file']: nfc(r['label']) for r in csv.DictReader(open(a.truth, encoding='utf-8'))}
    imgs = {f: Image.open(Path(a.images) / f).convert('RGB') for f in truth}

    rows, probs = [], {}
    for mode, fn in MODES.items():
        x = np.stack([np.asarray(fn(imgs[f]), dtype='float32') for f in truth])  # 0–255, model tự rescale
        probs[mode] = model.predict(x, verbose=0)

    short = [n.split(' - ')[0] for n in names]
    for mode in MODES:
        P = probs[mode]; k = 0; cm = np.zeros((len(names),) * 2, int); acc = rej = wrong = 0
        for i, f in enumerate(truth):
            t = names.index(truth[f]); p = P[i]; top = int(p.argmax())
            cm[t, top] += 1; k += top == t
            d = decide(p, names)
            if d == 'Không chắc chắn': rej += 1
            elif d == truth[f]: acc += 1
            else: wrong += 1
            o = np.argsort(p)[::-1]
            rows.append([mode, f, truth[f], names[top], round(float(p[o[0]]), 3), names[o[1]], round(float(p[o[1]]), 3), d])
        n = len(truth); lo, hi = wilson(k, n)
        print(f'\n== {mode}: top-1 đúng {k}/{n} = {k/n:.1%} (Wilson 95%: {lo:.0%}–{hi:.0%})')
        print(f'   luật chênh lệch {MARGIN:.0%}: nhận đúng {acc}, nhận sai {wrong}, "không chắc chắn" {rej}')
        print('   ma trận nhầm lẫn (hàng = nhãn đúng, cột = dự đoán):')
        print('   ' + ''.join(f'{s[:12]:>14}' for s in short))
        for r, s in zip(cm, short): print(f'   {s[:12]:<12}' + ''.join(f'{v:>14}' for v in r))
        for i, f in enumerate(truth):
            if P[i].argmax() != names.index(truth[f]):
                print(f'   SAI {f[:50]:<50} đúng={truth[f][:14]:<14} đoán={names[P[i].argmax()][:14]:<14} p={P[i].max():.2f}')

    with open(Path(__file__).parent / 'results.csv', 'w', newline='', encoding='utf-8') as fh:
        w = csv.writer(fh); w.writerow(['mode', 'file', 'truth', 'top1', 'p1', 'top2', 'p2', 'decision_margin20']); w.writerows(rows)

    if a.gradcam:
        out = Path(__file__).parent / 'gradcam'; out.mkdir(exist_ok=True)
        bridges = {'Cầu Rồng', 'Cầu Sông Hàn'}
        for i, f in enumerate(truth):
            pred = int(probs['crop'][i].argmax())
            if truth[f] in bridges or names[pred] != truth[f]:
                im = crop(imgs[f]); x = np.asarray(im, dtype='float32')[None]
                cam = gradcam(model, tf.constant(x), pred)
                overlay(im, cam, out / (Path(f).stem[:40] + '.png'), f'{short[pred]} {probs["crop"][i][pred]:.2f} (dung: {truth[f].split(" ")[-1]})')
        print(f'\nGrad-CAM: {out}')


if __name__ == '__main__':
    main()

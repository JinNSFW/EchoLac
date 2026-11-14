"""Test model nhận diện địa điểm ở máy local.

Cách dùng:
    python predict.py anh.jpg
    python predict.py thu_muc_anh/
    python predict.py anh.jpg --model landmarks_1.keras --labels labels.txt

Cần cài: pip install tensorflow pillow
"""
import argparse
from pathlib import Path

import numpy as np
from tensorflow import keras

IMG_SIZE = (224, 224)
EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}


def load_labels(path):
    return Path(path).read_text(encoding="utf-8").splitlines()


def predict_one(model, class_names, img_path, threshold):
    img = keras.utils.load_img(img_path, target_size=IMG_SIZE)
    x = np.expand_dims(keras.utils.img_to_array(img), axis=0)  # giữ nguyên 0-255
    probs = model.predict(x, verbose=0)[0]

    top = np.argsort(probs)[::-1][:3]
    best = top[0]
    verdict = class_names[best] if probs[best] >= threshold else "Không chắc chắn"

    print(f"\n{img_path.name}  ->  {verdict}")
    for i in top:
        print(f"    {class_names[i]:<20} {probs[i]:.1%}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("path", help="Đường dẫn ảnh hoặc thư mục chứa ảnh")
    parser.add_argument("--model", default="landmarks.keras")
    parser.add_argument("--labels", default="labels.txt")
    parser.add_argument("--threshold", type=float, default=0.2,
                        help="Dưới ngưỡng này sẽ báo 'Không chắc chắn'")
    args = parser.parse_args()

    model = keras.models.load_model(args.model)
    class_names = load_labels(args.labels)
    if len(class_names) != model.output_shape[-1]:
        raise SystemExit(
            f"labels.txt có {len(class_names)} nhãn nhưng model có "
            f"{model.output_shape[-1]} ngõ ra. Kiểm tra lại cặp file model/labels.")

    p = Path(args.path)
    files = sorted(f for f in p.iterdir() if f.suffix.lower() in EXTS) if p.is_dir() else [p]
    if not files:
        raise SystemExit("Không tìm thấy ảnh nào.")

    for f in files:
        predict_one(model, class_names, f, args.threshold)


if __name__ == "__main__":
    main()

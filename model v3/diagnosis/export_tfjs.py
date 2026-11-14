"""Xuất landmarks.keras sang TF.js graph model cho app (thư mục model/ của EchoLạc).

    pip install tensorflow pillow
    pip install tensorflowjs --no-deps && pip install tensorflow_hub   # bản đầy đủ kéo theo gói không có cho Windows
    python export_tfjs.py ../../model

- Bỏ lớp augment (chỉ dùng khi train) và Dropout; giữ MobileNetV3Large (đã tự rescale 0–255) + Dense softmax.
- Lượng tử hoá trọng số float16 để tải nhanh hơn; kiểm tra lại độ lệch so với model gốc trước khi ghi.
- Ghi metadata.json {labels, imageSize, source} để app đọc nhãn.
"""
import json, sys, tempfile
from pathlib import Path

import numpy as np
import keras
import tensorflow as tf
import types
# tensorflowjs imports tensorflow_decision_forests and jax at load time; neither has a usable Windows wheel
# and a Keras SavedModel never needs them, so empty stand-ins let the SavedModel converter load.
for name in ('tensorflow_decision_forests', 'jax', 'jax.experimental', 'jax.experimental.jax2tf'):
    sys.modules.setdefault(name, types.ModuleType(name))
sys.modules['jax.experimental'].jax2tf = sys.modules['jax.experimental.jax2tf']
from tensorflowjs.converters import tf_saved_model_conversion_v2 as conv

here = Path(__file__).parent
out = Path(sys.argv[1] if len(sys.argv) > 1 else here / 'tfjs')
src = keras.models.load_model(here.parent / 'landmarks.keras')
labels = (here.parent / 'labels.txt').read_text(encoding='utf-8').splitlines()

inp = keras.Input((224, 224, 3), name='image')
infer = keras.Model(inp, src.get_layer('dense')(src.get_layer('MobileNetV3Large')(inp, training=False)))
x = np.random.default_rng(0).uniform(0, 255, (4, 224, 224, 3)).astype('float32')
assert np.allclose(infer.predict(x, verbose=0), src.predict(x, verbose=0), atol=1e-5), 'model suy luận khác model gốc'

with tempfile.TemporaryDirectory() as d:
    infer.export(d, format='tf_saved_model')
    out.mkdir(parents=True, exist_ok=True)
    for f in out.glob('group1-shard*'): f.unlink()  # bỏ shard cũ nếu số shard thay đổi
    conv.convert_tf_saved_model(d, str(out), signature_def='serve', quantization_dtype_map={'float16': '*'})

(out / 'metadata.json').write_text(json.dumps({
    'labels': labels, 'imageSize': 224,
    'source': 'model v3/landmarks.keras (Keras 3, MobileNetV3Large), exported by model v3/diagnosis/export_tfjs.py',
}, ensure_ascii=False, indent=1), encoding='utf-8')
print('OK ->', out, sorted(p.name for p in out.iterdir()))

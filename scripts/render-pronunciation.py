"""Render lesson word and sentence samples locally (Python 3.11).

In a separate environment, install kokoro-onnx==0.6.1, onnxruntime==1.32.0,
lameenc==1.8.1, numpy==2.4.6, phonemizer==3.6.0 and espeakng-loader==0.2.4.
Obtain kokoro-v1.0.onnx and voices-v1.0.bin from the Kokoro-ONNX v1.0 release
(https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0)
and pass their directory to this script. Rendering makes no network requests.
Every distinct text gets one synthesized rendition per accent using Kokoro's
standard phonemization and prosody.
"""

import argparse
from concurrent.futures import ProcessPoolExecutor
import hashlib
import json
import os
from pathlib import Path
import time

import lameenc
import numpy as np
from kokoro_onnx import Kokoro
from onnxruntime import InferenceSession, SessionOptions


ROOT = Path(__file__).resolve().parent.parent
LESSONS = ROOT / 'content' / 'pronunciation'
OUTPUT = ROOT / 'assets' / 'audio' / 'pronunciation'
VOICES = {'en-US': 'af_heart', 'en-GB': 'bf_emma'}
RECIPE = 'kokoro-onnx-0.6.1-ort-1.32.0-lameenc-1.8.1-48kbps'
MODEL = None


def read_json(path):
    return json.loads(path.read_text(encoding='utf-8'))


def lesson_items():
    items = {}
    for entry in read_json(LESSONS / 'index.json')['units']:
        unit = read_json(LESSONS / entry['file'])
        for item in unit['words'] + unit['sentences']:
            ident, text = item['id'], item['text']
            if ident in items or not text.strip():
                raise ValueError(f'Invalid lesson item: {ident}')
            items[ident] = text
    return items


def file_digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def clip_id(text, recipe):
    return hashlib.sha256(f'{recipe}\n{text}'.encode('utf-8')).hexdigest()[:20]


def load_model(model_path, voices_path, threads):
    global MODEL
    options = SessionOptions()
    options.intra_op_num_threads = threads
    options.inter_op_num_threads = 1
    session = InferenceSession(str(model_path), options, providers=['CPUExecutionProvider'])
    MODEL = Kokoro.from_session(session, str(voices_path))


def render(job):
    accent, voice, ident, text = job
    path = OUTPUT / accent / f'{ident}.mp3'
    if path.is_file() and path.stat().st_size > 144:
        with path.open('rb') as stream:
            head = stream.read(2)
        if head[0] == 0xff and head[1] & 0xe0 == 0xe0:
            return False
    samples, rate = MODEL.create(text, voice=voice, lang=accent.lower())
    if rate != 24000 or not len(samples) or not np.isfinite(samples).all() or np.max(np.abs(samples)) < .001:
        raise ValueError(f'Invalid audio for {accent} {ident}: {text}')
    pcm = np.rint(np.clip(samples, -1, 1) * 32767).astype('<i2').tobytes()
    encoder = lameenc.Encoder()
    encoder.set_in_sample_rate(rate)
    encoder.set_channels(1)
    encoder.set_bit_rate(48)
    encoder.set_quality(2)
    write_atomically(path, encoder.encode(pcm) + encoder.flush())
    return True


def write_atomically(path, body):
    temp = path.with_suffix(f'{path.suffix}.{os.getpid()}.tmp')
    try:
        temp.write_bytes(body)
        temp.replace(path)
    finally:
        temp.unlink(missing_ok=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('model_dir', type=Path)
    parser.add_argument('--workers', type=int, default=2)
    parser.add_argument('--threads', type=int, default=1, help='ONNX CPU threads per worker')
    args = parser.parse_args()
    if args.workers < 1 or args.threads < 1:
        parser.error('workers and threads must be positive')
    model_path = args.model_dir / 'kokoro-v1.0.onnx'
    voices_path = args.model_dir / 'voices-v1.0.bin'
    hashes = {'modelSha256': file_digest(model_path), 'voicesSha256': file_digest(voices_path)}
    recipe = json.dumps([RECIPE, hashes, VOICES], sort_keys=True)
    items = lesson_items()
    clips = {text: clip_id(text, recipe) for text in items.values()}
    if len(set(clips.values())) != len(clips):
        raise ValueError('Duplicate clip key')
    jobs = [(accent, voice, ident, text) for text, ident in clips.items() for accent, voice in VOICES.items()]
    for accent in VOICES:
        (OUTPUT / accent).mkdir(parents=True, exist_ok=True)
    started = time.monotonic()
    print(f'Rendering {len(jobs)} clips across {args.workers} worker(s)...', flush=True)
    with ProcessPoolExecutor(args.workers, initializer=load_model,
                             initargs=(model_path, voices_path, args.threads)) as pool:
        created = 0
        for done, new in enumerate(pool.map(render, jobs), 1):
            created += new
            if done % 20 == 0 or done == len(jobs):
                print(f'{done}/{len(jobs)} ready ({time.monotonic() - started:.0f}s)', flush=True)
    manifest = {'version': 1, 'model': 'Kokoro-82M v1.0', 'recipe': RECIPE, **hashes, 'voices': VOICES,
                'items': {ident: [text, clips[text]] for ident, text in items.items()}}
    write_atomically(OUTPUT / 'index.json', (json.dumps(manifest, ensure_ascii=False, indent=2) + '\n').encode('utf-8'))
    print(f'Published {len(items)} lesson mappings; created {created} MP3 files.', flush=True)


if __name__ == '__main__':
    main()

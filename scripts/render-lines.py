"""Render fixed scenario/lesson lines (see list-fixed-lines.cjs) with the same Kokoro stack as
render-pronunciation.py (same pins, voices, MP3 encoding, clip-id hashing). Usage: render-lines.py MODEL_DIR"""

import argparse
from concurrent.futures import ProcessPoolExecutor
import importlib.util
import json
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('render_pronunciation', HERE / 'render-pronunciation.py')
rp = importlib.util.module_from_spec(spec)
spec.loader.exec_module(rp)
rp.OUTPUT = rp.ROOT / 'assets' / 'audio' / 'lines'


# Module-level wrappers: spawned workers re-import this file, not the hyphenated one.
def init(*args):
    rp.load_model(*args)


def render(job):
    return rp.render(job)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('model_dir', type=Path)
    parser.add_argument('--workers', type=int, default=2)
    args = parser.parse_args()
    model_path, voices_path = args.model_dir / 'kokoro-v1.0.onnx', args.model_dir / 'voices-v1.0.bin'
    hashes = {'modelSha256': rp.file_digest(model_path), 'voicesSha256': rp.file_digest(voices_path)}
    recipe = json.dumps([rp.RECIPE, hashes, rp.VOICES], sort_keys=True)
    texts = json.loads(subprocess.check_output(['node', str(HERE / 'list-fixed-lines.cjs')], text=True, encoding='utf-8'))
    clips = {t: rp.clip_id(t, recipe) for t in texts}
    jobs = [(a, v, i, t) for t, i in clips.items() for a, v in rp.VOICES.items()]
    for a in rp.VOICES:
        (rp.OUTPUT / a).mkdir(parents=True, exist_ok=True)
    with ProcessPoolExecutor(args.workers, initializer=init, initargs=(model_path, voices_path, 1)) as pool:
        for n, _ in enumerate(pool.map(render, jobs), 1):
            if n % 50 == 0 or n == len(jobs):
                print(f'{n}/{len(jobs)}', flush=True)
    manifest = {'version': 1, 'recipe': rp.RECIPE, 'voices': rp.VOICES, 'clips': clips}
    rp.write_atomically(rp.OUTPUT / 'index.json', (json.dumps(manifest, ensure_ascii=False, indent=1) + '\n').encode('utf-8'))
    print(f'{len(clips)} lines x {len(rp.VOICES)} accents')


if __name__ == '__main__':
    main()

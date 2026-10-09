"""Verify world derivatives, aligned alpha frames, source integrity and pack budget."""
import argparse
import hashlib
import json
import tempfile
import sys
from pathlib import Path

from PIL import Image
from importlib.util import spec_from_file_location, module_from_spec

ROOT = Path(__file__).resolve().parents[1]
sys.dont_write_bytecode = True
spec = spec_from_file_location('build_world_art', ROOT / 'scripts/build-world-art.py')
builder = module_from_spec(spec)
spec.loader.exec_module(builder)


def check(baseline=None):
    code = (ROOT / 'src/config/world-art.js').read_text(encoding='utf-8')
    index = json.loads(code.split('module.exports=', 1)[1].rstrip(';\n'))
    assert len(index['buildings']) == 15 and len(index['effects']) == 9 and len(index['backgrounds']) == 1
    hashes = {}
    with tempfile.TemporaryDirectory(prefix='war-world-check-') as temporary:
        for group, entries in index.items():
            for key, meta in entries.items():
                source = ROOT / 'assets' / ('battlefield' if group == 'backgrounds' else group) / (key + '.png')
                hashes[source.relative_to(ROOT).as_posix()] = hashlib.sha256(source.read_bytes()).hexdigest()
                expected_file = Path(temporary) / Path(meta['path']).name
                expected = (builder.build_background if group == 'backgrounds' else builder.build_effect if group == 'effects' else builder.build_building)(source, expected_file)
                assert json.loads(json.dumps(expected)) == {k: v for k, v in meta.items() if k != 'path'}, key
                with Image.open(ROOT / meta['path']) as image, Image.open(expected_file) as rebuilt:
                    assert image.mode == ('RGB' if group == 'backgrounds' else 'RGBA') and image.size == (meta['width'], meta['height'])
                    assert image.tobytes() == rebuilt.tobytes(), key
                    if group == 'backgrounds':
                        assert 0 < meta['ground_y'] < image.height
                        continue
                    assert image.getchannel('A').getextrema() == (0, 255)
                    frames = meta.get('frames', [dict(x=0, y=0, width=image.width, height=image.height)])
                    for i, f in enumerate(frames):
                        alpha = image.crop((f['x'], f['y'], f['x'] + f['width'], f['y'] + f['height'])).getchannel('A')
                        box = alpha.getbbox()
                        if box:
                            assert i not in meta.get('empty_frames', [])
                            assert box[0] >= 4 and box[1] >= 4 and box[2] <= f['width'] - 4 and box[3] <= f['height'] - 4, key
                        else:
                            assert i in meta['empty_frames'], key
    if baseline:
        old = json.loads(Path(baseline).read_text(encoding='utf-8'))
        old_hashes = {item['file']: item['sha256'] for item in old}
        assert hashes == old_hashes, 'Source images changed since integration began'
    rules = json.loads((ROOT / 'project.config.json').read_text(encoding='utf-8'))['packOptions']['ignore']
    for folder in ['assets/buildings', 'assets/effects', 'assets/battlefield', 'assets/_work']:
        assert dict(value=folder, type='folder') in rules
    for group in index.values():
        for meta in group.values():
            path = meta['path']
            assert not any((r['type'] == 'folder' and (path == r['value'] or path.startswith(r['value'] + '/')))
                           or (r['type'] == 'file' and path == r['value'])
                           or (r['type'] == 'suffix' and path.endswith(r['value'])) for r in rules), path
    # Reuse the conservative package audit and existing portrait pixel verification.
    portrait_spec = spec_from_file_location('check_unit_portraits', ROOT / 'scripts/check-unit-portraits.py')
    portraits = module_from_spec(portrait_spec)
    portrait_spec.loader.exec_module(portraits)
    portraits.check()
    print(json.dumps(dict(buildings=15, effects=9, frames=27, backgrounds=1,
                         derivative_bytes=sum((ROOT / m['path']).stat().st_size for group in index.values() for m in group.values()),
                         source_hashes=hashes), ensure_ascii=False))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--baseline', help='Optional pre-integration source-info.json')
    check(parser.parse_args().baseline)

"""Validate transparent UI portraits, source metadata and the configured package budget."""
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]


def check():
    plan = json.loads((ROOT / 'assets/units/generation-plan.json').read_text(encoding='utf-8'))
    code = (ROOT / 'src/config/unit-portraits.js').read_text(encoding='utf-8')
    index = json.loads(code.split('module.exports=', 1)[1].rstrip(';\n'))
    assert len(plan) == len(index) == 30
    assert {u['unit_id'] for u in plan} == set(index)
    for age in range(1, 6):
        assert sum(u['age'] == f'age{age}' for u in plan) == 6
    for unit in plan:
        uid, age = unit['unit_id'], unit['age']
        assert unit['generated']['file'] == f'assets/units/{age}/{uid}.png'
        assert unit['generated']['era_dir'] == age
        with Image.open(ROOT / unit['generated']['file']) as source, Image.open(ROOT / index[uid]['path']) as portrait:
            assert source.mode == portrait.mode == 'RGBA'
            assert source.getchannel('A').getextrema() == portrait.getchannel('A').getextrema() == (0, 255)
            content = source.crop(source.getchannel('A').getbbox())
            content.thumbnail((360, 360), Image.Resampling.LANCZOS)
            assert portrait.size == (content.width + 24, content.height + 24)
            assert portrait.size == (index[uid]['width'], index[uid]['height'])
            assert portrait.crop((12, 12, portrait.width - 12, portrait.height - 12)).tobytes() == content.tobytes()
            left, top, right, bottom = portrait.getchannel('A').getbbox()
            assert left >= 12 and top >= 12 and right <= portrait.width - 12 and bottom <= portrait.height - 12
    config = json.loads((ROOT / 'project.config.json').read_text(encoding='utf-8'))
    rules = config['packOptions']['ignore']
    for excluded in ['assets/units', 'assets/ui', 'assets/reference-screenshots', 'output']:
        assert {'value': excluded, 'type': 'folder'} in rules

    def ignored(path):
        name = path.relative_to(ROOT).as_posix()
        return any((r['type'] == 'folder' and (name == r['value'] or name.startswith(r['value'] + '/')))
                   or (r['type'] == 'file' and name == r['value'])
                   or (r['type'] == 'suffix' and name.endswith(r['value'])) for r in rules)

    # Conservative uncompressed sum, including project configuration files.
    payload = [p for p in ROOT.rglob('*') if p.is_file() and not ignored(p)]
    size = sum(p.stat().st_size for p in payload)
    assert size <= 3.5 * 1024 * 1024, f'Package budget exceeded: {size} bytes'
    assert all(any(p == ROOT / m['path'] for p in payload) for m in index.values())
    print(json.dumps({'portraits': 30, 'portrait_bytes': sum((ROOT / m['path']).stat().st_size for m in index.values()),
                      'package_files': len(payload), 'package_bytes': size, 'budget_bytes': 3670016}))


if __name__ == '__main__':
    check()

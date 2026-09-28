"""只索引已存在且通过概念审核的本地预览图。"""
import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
assets={}
for item in json.loads((root/'assets/units/generation-plan.json').read_text()):
    if item.get('revision_required'): continue
    for kind in ['portrait_path','concept_path']:
        value=item.get(kind)
        if value and (root/'assets/units'/value).is_file():
            assets[item['unit_id']]={'path':'assets/units/'+value,'transparent':kind=='portrait_path'}
            break
(root/'src/art-map.js').write_text("'use strict';\n// python3 scripts/build-art-map.py\nmodule.exports="+json.dumps(assets,ensure_ascii=False,indent=2)+';\n')
print('Indexed',len(assets),'unit previews')

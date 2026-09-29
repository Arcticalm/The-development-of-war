"""保存 Canva 返回的预览原始像素，并同步 manifest；从 stdin 读取工具结果提取的 JSON。"""
import base64, csv, io, json, sys
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]
base=root/'assets/units'
payload=json.load(sys.stdin)
plan=json.loads((base/'generation-plan.json').read_text())
e=next(e for e in plan if e['unit_id']==payload['unit_id'])
kind=payload.get('kind','portrait')
version=payload.get('version',e.get('version','v01'))
raw=base64.b64decode(payload['data'],validate=True)
im=Image.open(io.BytesIO(raw));im.load()
alpha='A' in im.getbands() and im.getchannel('A').getextrema()[0]<255
if kind=='portrait' and not alpha: raise ValueError('Portrait has no transparent pixels')
relative=f"{e['age']}/{e['unit_id']}/unit_{e['unit_id']}_{kind}_preview_{version}.png"
path=base/relative
if path.exists(): raise FileExistsError(path)
# 返回 PNG 时逐字节保存；其他预览仅转换容器，不改变尺寸或像素。
if im.format=='PNG': path.write_bytes(raw)
else: im.save(path,'PNG')
e[kind+'_path']=relative
e[kind+'_media_id']=payload['media_id']
e[kind+'_source_url']=payload['url']
e[kind+'_width'],e[kind+'_height']=im.size
e[kind+'_saved_date']='2026-09-29'
e['alpha_check']='通过：存在透明像素' if alpha else '概念图，无透明要求'
e['status']='概念与透明预览已保存' if e.get('portrait_path') else '概念预览已保存'
if kind=='concept':
 e['media_id']=payload['media_id'];e['source_url']=payload['url'];e['width'],e['height']=im.size
 e['revision_required']=payload.get('revision_required',False);e['version']=version
(base/'generation-plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n')
source=path.parent/'source.md'
with source.open('a') as f:
 f.write(f"\n## 2026-09-29 {'透明' if kind=='portrait' else '概念'}预览归档\n\n- 文件：`{path.name}`\n- 工具：Canva\n- 尺寸：{im.width} × {im.height}，保留预览实际像素\n- 媒体 ID：`{payload['media_id']}`\n- [Open generated image]({payload['url']})\n- 校验：{e['alpha_check']}\n")
columns=['unit_id','name','age','version','concept_path','portrait_path','icon_path','provider','source_url','concept_source_url','portrait_source_url','width','height','portrait_width','portrait_height','alpha_check','status','revision_required']
with (base/'manifest.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.DictWriter(f,fieldnames=columns,extrasaction='ignore',lineterminator='\n');w.writeheader();w.writerows(plan)
print(json.dumps({'unit_id':e['unit_id'],'path':str(path.relative_to(root)),'size':im.size,'alpha':alpha},ensure_ascii=False))

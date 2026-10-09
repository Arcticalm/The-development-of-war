'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {UNITS}=require('../src/data');
const INDEX=require('../src/config/unit-portraits');
const {PortraitService}=require('../src/services/portraits');
const {containRect}=require('../src/ui/portraits');
const {GameApp}=require('../src/app');
const {TextUnitPresenter}=require('../src/ui/units');
global.requestAnimationFrame=()=>1;
function images(auto=false){
  const made=[];
  return {made,createImage(){const img={width:0,height:0,set src(path){this.path=path;if(auto)this.load();},load(){this.width=384;this.height=384;if(this.onload)this.onload();}};made.push(img);return img;}};
}
function platform(auto=false){
  const loader=images(auto),texts=[],draws=[],handlers={};
  const ctx=new Proxy({measureText:t=>({width:Array.from(String(t)).reduce((n,c)=>n+(c.charCodeAt(0)>255?20:10),0)}),fillText:t=>texts.push(String(t)),drawImage:(...a)=>draws.push(a)},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>{o[k]=v;return true;}});
  return {...loader,texts,draws,handlers,createCanvas:()=>({getContext:()=>ctx}),getWindowInfo:()=>({windowWidth:844,windowHeight:390,pixelRatio:3,safeArea:{left:47,right:797,top:0,bottom:369}}),getMenuButtonBoundingClientRect:()=>({bottom:34}),getStorageSync(){},setStorageSync(){},onTouchStart:f=>handlers.start=f,onTouchEnd:f=>handlers.end=f,onHide:f=>handlers.hide=f,onShow:f=>handlers.show=f};
}
test('portrait index matches all 30 unit IDs, real RGBA PNG dimensions and accepted source paths',()=>{
  assert.deepEqual(Object.keys(INDEX).sort(),UNITS.map(u=>u.id).sort());
  const plan=JSON.parse(fs.readFileSync('assets/units/generation-plan.json','utf8'));
  for(const d of UNITS){const m=INDEX[d.id],png=fs.readFileSync(m.path),u=plan.find(u=>u.unit_id===d.id);
    assert.equal(png.subarray(1,4).toString(),'PNG');assert.equal(png[25],6);assert.equal(png.readUInt32BE(16),m.width);assert.equal(png.readUInt32BE(20),m.height);assert.equal(Math.max(m.width,m.height),384);
    assert.equal(u.name,d.name);assert.equal(u.generated.era_dir,'age'+(d.era+1));assert.equal(u.generated.file,`assets/units/age${d.era+1}/${d.id}.png`);assert.ok(fs.existsSync(u.generated.file));
  }
});
test('portrait loading is lazy, deduplicated, reused after success and resolves browser paths',()=>{
  const w=images(),changes=[];w.resolveAssetPath=p=>'/'+p;const s=new PortraitService(w,{onChange:(...args)=>changes.push(args)});
  assert.equal(w.made.length,0);const a=s.get('age1_melee');assert.equal(a.status,'loading');assert.strictEqual(s.get('age1_melee'),a);assert.equal(w.made.length,1);assert.equal(w.made[0].path,'/'+INDEX.age1_melee.path);
  w.made[0].load();assert.equal(a.status,'ready');assert.strictEqual(s.get('age1_melee').image,w.made[0]);assert.deepEqual(changes,[['age1_melee','ready']]);assert.equal(s.get('unknown'),null);
});
test('failed or unsupported images fall back without retrying every draw',()=>{
  const w=images(),s=new PortraitService(w),a=s.get('age1_melee');w.made[0].onerror();for(let i=0;i<20;i++)assert.strictEqual(s.get('age1_melee'),a);assert.equal(a.status,'error');assert.equal(w.made.length,1);
  assert.equal(new PortraitService({}).get('age1_melee').status,'error');assert.equal(new PortraitService({createImage(){throw Error('unsupported');}}).get('age1_melee').status,'error');
});
test('LRU retains at most 12 entries and ignores evicted pending callbacks',()=>{
  const w=images(),changes=[],s=new PortraitService(w,{limit:99,onChange:id=>changes.push(id)}),ids=Object.keys(INDEX);
  ids.slice(0,12).forEach(id=>s.get(id));const late=w.made[1].onload;s.get(ids[0]);s.get(ids[12]);assert.equal(s.cache.size,12);assert.ok(s.cache.has(ids[0]));assert.ok(!s.cache.has(ids[1]));
  w.made[1].width=384;w.made[1].height=384;late();assert.deepEqual(changes,[]);assert.equal(s.cache.size,12);assert.equal(w.made[1].onload,null);
});
test('contain-fit shows complete narrow and wide portraits at the same aspect ratio',()=>{
  for(const [iw,ih] of [[384,173],[184,384],[384,384]])for(const [x,y,w,h] of [[10,20,100,144],[0,0,29,33],[186,199,270,350]]){
    const b=containRect(iw,ih,x,y,w,h);assert.ok(Math.abs(b.w/b.h-iw/ih)<1e-10);assert.ok(b.x>=x&&b.y>=y&&b.x+b.w<=x+w+1e-8&&b.y+b.h<=y+h+1e-8);assert.ok(Math.abs(b.x+b.w/2-x-w/2)<1e-8);assert.ok(Math.abs(b.y+b.h/2-y-h/2)<1e-8);
  }assert.equal(containRect(0,10,0,0,10,10),null);
});
test('all five codex pages and 30 details draw loaded portraits without changing battle state',()=>{
  const w=platform(true),a=new GameApp(w);a.startBattle();const before=a.battle.snapshot();a.navigate('codex');
  for(let era=0;era<5;era++){a.codexEra=era;w.draws.length=0;a.renderer.draw();assert.equal(w.draws.length,6);assert.ok(w.draws.every(([image])=>image.path.includes('age'+(era+1)+'_')));}
  for(const d of UNITS){a.modal={unit:d.id};w.draws.length=0;a.renderer.draw();assert.ok(w.draws.some(([im,x,y,width,height])=>im.path===INDEX[d.id].path&&x>=186&&y>=199&&width<=270&&height<=350));assert.ok(w.texts.includes(d.name+' · '+d.role));}
  assert.deepEqual(a.battle.snapshot(),before);
});
test('quick era changes and late image completion cannot display another era in the current cards',()=>{
  const w=platform(),a=new GameApp(w);a.navigate('codex');a.renderer.draw();const oldCallbacks=w.made.map(i=>i.onload);
  for(let era=1;era<5;era++){a.codexEra=era;a.renderer.draw();}oldCallbacks.forEach(f=>f());assert.equal(a.portraits.cache.size,12);
  w.made.slice(-6).forEach(i=>i.load());w.draws.length=0;a.renderer.draw();assert.equal(w.draws.length,6);assert.ok(w.draws.every(([i])=>i.path.includes('/age5_')));assert.equal(a.codexEra,4);
});
test('image arrival preserves pressed control IDs, hit boxes and one short-press purchase',()=>{
  const w=platform(),a=new GameApp(w);a.startBattle();a.renderer.draw();const b=a.renderer.buttons.find(b=>b.id==='battle:main:card:age1_melee');const bounds=({id,x,y,w,h})=>({id,x,y,w,h});const before=bounds(b),x=a.offsetX+140*a.scale,y=a.offsetY+589*a.scale;
  a.touchStart(x,y);w.made.forEach(i=>i.load());a.renderer.draw();assert.deepEqual(bounds(a.renderer.buttons.find(b=>b.id===before.id)),before);assert.equal(a.feedback.pressed,b.id);
  a.touchEnd(x,y);a.touchEnd(x,y);assert.equal(a.view.sides[0].queue.length,1);
});
test('loading and error fallback retain names, costs, progress and working controls',()=>{
  const w=platform(),a=new GameApp(w);a.startBattle();a.command({type:'train',id:'age1_melee'});a.renderer.draw();w.made.forEach(i=>i.onerror());w.texts.length=0;a.renderer.draw();assert.equal(w.draws.length,0);assert.ok(w.texts.includes('石棒战士'));assert.ok(w.texts.includes('70金 · 1人'));assert.ok(w.texts.includes('0%'));assert.ok(a.renderer.buttons.some(b=>b.id==='battle:main:queue:'+a.view.sides[0].queue[0].id));
});
test('mixed-era queue and cancel confirmation reuse the original queued unit portrait',()=>{
  const w=platform(true),a=new GameApp(w);a.startBattle();a.battle.sides[0].gold=99999;for(const d of [UNITS[0],UNITS[9],UNITS[22]]){a.battle.sides[0].era=d.era;a.command({type:'train',id:d.id});}a.renderer.draw();
  assert.equal(a.view.sides[0].queue.length,3);for(const q of a.view.sides[0].queue)assert.ok(w.draws.some(([i,,y])=>y>=504&&y<543&&i.path===INDEX[q.typeId].path));
  const q=a.view.sides[0].queue[1],count=w.made.length;a.queueCancel(q.id);w.draws.length=0;a.renderer.draw();const image=w.draws.find(([i,x,y])=>i.path===INDEX[q.typeId].path&&x>=184&&x<350&&y>=194&&y<434);assert.ok(image);assert.equal(w.made.length,count);assert.ok(a.renderer.buttons.some(b=>b.id.endsWith(':confirm-cancel')));
});
test('battle actors only draw text; production portraits remain outside the world area',()=>{
  const w=platform(true),a=new GameApp(w);a.startBattle();a.renderer.draw();const requests=w.made.length;for(const d of UNITS)a.battle.spawn(0,d.id);w.draws.length=0;a.renderer.draw();assert.equal(w.made.length,requests);assert.ok(w.draws.filter(([image])=>image.path.includes('/unit-portraits/')).every(([,x,y])=>y>=495));
  const before=w.made.length;new TextUnitPresenter().draw(a.renderer,a.view.units);assert.equal(w.made.length,before);assert.ok(w.texts.some(t=>t.includes('我·')));
});
test('README action table matches 30 units, five support aliases and 172 groups / 1136 frames',()=>{
  const plan=JSON.parse(fs.readFileSync('assets/units/generation-plan.json','utf8')),readme=fs.readFileSync('assets/units/README.md','utf8'),aliases={age1_support:'encourage',age2_support:'heal',age3_support:'encourage',age4_support:'heal',age5_support:'repair'};let prompts=0,groups=0,frames=0;
  const rows=readme.split('\n').filter(l=>/^\| .+ \| `age[1-5]_/.test(l));assert.equal(rows.length,30);
  for(const u of plan){const primary=aliases[u.unit_id]||'attack',extras=Object.keys(u.animation_prompts).filter(k=>!['idle','move','attack','hurt','death',primary].includes(k)),row=rows.find(l=>l.includes('`'+u.unit_id+'`'));assert.ok(row.includes(u.name)&&row.includes('`'+primary+'`')&&row.includes('全部待生成'));extras.forEach(k=>assert.ok(row.includes('`'+k+'`')));
    for(const [key,a]of Object.entries(u.animation_prompts)){prompts++;assert.equal(a.frames,{idle:6,move:8,hurt:4,death:6}[key]||8);assert.equal(a.loop,key==='idle'||key==='move');if(key==='attack'&&aliases[u.unit_id])continue;groups++;frames+=a.frames;}
  }assert.deepEqual([prompts,groups,frames],[177,172,1136]);assert.ok(readme.includes('assets/units/animations/age1/age1_melee/v01/idle/0001.png'));assert.ok(readme.includes('assets/units/_work/animations/age1/age1_melee/v01/idle/'));
});

'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const INDEX=require('../src/config/world-art');
const {WorldArtService}=require('../src/services/world-art');
const {BattleEffects,hitAsset}=require('../src/ui/battle-effects');
const {GameApp}=require('../src/app');
const {LocalBattleSession}=require('../src/sessions/local');
const {STEP}=require('../src/battle');
const {UNITS}=require('../src/data');
global.requestAnimationFrame=()=>1;
function platform(auto=true){
  const made=[],draws=[],transforms=[];
  const ctx=new Proxy({measureText:t=>({width:String(t).length*14}),drawImage:(...args)=>draws.push(args),scale:(...args)=>transforms.push(args)},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
  return {made,draws,transforms,createCanvas:()=>({getContext:()=>ctx}),createImage(){const img={width:0,height:0,set src(path){this.path=path;if(auto){this.width=600;this.height=200;this.onload();}}};made.push(img);return img;},getWindowInfo:()=>({windowWidth:1280,windowHeight:720,pixelRatio:1}),getStorageSync(){},setStorageSync(){},onTouchStart(){},onTouchEnd(){},onHide(){},onShow(){}};
}
const view=(time=0,fields={})=>({matchId:'fixture',time,strikes:[],effects:[],units:[],projectiles:[],...fields});
const unit=(id,side,typeId='age1_melee',hp=100)=>({id,side,typeId,hp,shield:0,x:500});

test('world index covers five bases, ten towers and nine three-frame RGBA strips',()=>{
  const buildings=Array.from({length:5},(_,i)=>['base_age'+(i+1),...Array.from({length:2},(_,k)=>`tower_age${i+1}_${k}`)]).flat();
  assert.deepEqual(Object.keys(INDEX.buildings).sort(),buildings.sort());
  assert.deepEqual(Object.keys(INDEX.effects).sort(),['skill_age1','skill_age2','skill_age3','skill_age4','skill_age5','hit_dust','hit_metal','hit_explosion','hit_energy'].sort());
  for(const [key,m] of Object.entries({...INDEX.buildings,...INDEX.effects})){
    const b=fs.readFileSync(m.path);assert.equal(b[25],6);assert.equal(b.readUInt32BE(16),m.width);assert.equal(b.readUInt32BE(20),m.height);
    assert.equal(m.path,`assets/world-art/${key}.png`);
    if(m.frames){assert.deepEqual(m.source_edges,[0,1182,2365,3547]);assert.equal(m.frames.length,3);m.frames.forEach((f,i)=>assert.deepEqual(f,{x:i*m.width/3,y:0,width:m.width/3,height:m.height}));}
  }
  assert.deepEqual(INDEX.effects.skill_age5.empty_frames,[0,2]);assert.deepEqual(INDEX.effects.hit_explosion.empty_frames,[2]);
});
test('building and effect caches load lazily, reuse images and remain independently bounded',()=>{
  const p=platform(),s=new WorldArtService(p);assert.equal(p.made.length,0);
  const a=s.get('base_age1');assert.strictEqual(s.get('base_age1'),a);assert.equal(p.made.length,1);
  Object.keys(INDEX.buildings).forEach(id=>s.get(id));Object.keys(INDEX.effects).forEach(id=>s.get(id));
  assert.equal(s.buildings.cache.size,12);assert.equal(s.effects.cache.size,9);const old=s.get('skill_age1');s.get('base_age1');assert.strictEqual(s.get('skill_age1'),old);assert.equal(s.get('missing'),null);
});
test('building mirroring and aspect fit preserve artwork; evolved bases retain old-era tower art',()=>{
  const p=platform(),app=new GameApp(p);app.startBattle();const s=app.battle.sides[0];s.era=4;s.towers[0]={era:0,kind:1,level:2,clock:0};
  const before=app.battle.snapshot();app.renderer.base(0,s);app.renderer.base(1,s);
  assert.deepEqual(p.draws.map(a=>a[0].path),['assets/world-art/base_age5.png','assets/world-art/tower_age1_1.png','assets/world-art/base_age5.png','assets/world-art/tower_age1_1.png']);
  assert.equal(p.transforms.filter(([x])=>x===-1).length,2);
  for(const [image,,,,,x,y,w,h]of p.draws){const m=INDEX.buildings[image.path.split('/').pop().slice(0,-4)];assert.ok(Math.abs(w/h-m.width/m.height)<1e-8);assert.ok(y+h<=456);}
  assert.deepEqual(app.battle.snapshot(),before);
});
test('loading or failed world art uses fallback without changing controls or combat',()=>{
  const p=platform(false),app=new GameApp(p);app.startBattle();app.renderer.draw();const before=app.battle.snapshot(),controls=app.renderer.buttons.map(({id,x,y,w,h})=>({id,x,y,w,h}));
  p.made.forEach(i=>i.onerror());app.renderer.draw();assert.equal(p.draws.length,0);assert.deepEqual(app.renderer.buttons.map(({id,x,y,w,h})=>({id,x,y,w,h})),controls);assert.deepEqual(app.battle.snapshot(),before);
});
test('all five skills use their own strip and fixed battle-time stages',()=>{
  for(let era=0;era<5;era++){
    const fx=new BattleEffects(),v=view(10,{strikes:[{era,side:0,x:500,wait:1,pulses:era===1?3:1}]});fx.sync(v);const item=fx.items[0];assert.equal(item.asset,'skill_age'+(era+1));assert.equal(fx.frame(item,10.5),0);assert.equal(fx.frame(item,11.1),1);assert.equal(fx.frame(item,11.3),2);
    fx.sync(view(11.1));assert.equal(fx.items.length,1);fx.sync(view(era===1?12.21:11.41));assert.equal(fx.items.length,0);
  }
});
test('arrow rain follows all three model pulses without duplicate visual instances',()=>{
  const fx=new BattleEffects();
  for(const [time,wait,pulses,frame]of [[0,1,3,0],[1.1,.3,2,1],[1.3,.1,2,2],[1.5,.3,1,1],[1.7,.1,1,2]]){fx.sync(view(time,{strikes:[{side:1,x:400,era:1,wait,pulses}]}));assert.equal(fx.items.length,1);assert.equal(fx.frame(fx.items[0],time),frame);}
  fx.sync(view(1.9));assert.equal(fx.frame(fx.items[0],1.9),1);fx.sync(view(2.21));assert.equal(fx.items.length,0);
});
test('paused redraw freezes feedback and clock rewind or new match clears history',()=>{
  const fx=new BattleEffects(),v=view(4,{strikes:[{era:2,side:0,x:400,wait:.7,pulses:1}]});fx.sync(v);const before=JSON.stringify(fx.items);for(let i=0;i<30;i++)fx.sync(v);assert.equal(JSON.stringify(fx.items),before);
  fx.sync(view(1));assert.equal(fx.items.length,0);fx.sync(v);fx.sync(view(5,{matchId:'new'}));assert.equal(fx.items.length,0);
});
test('projectile arrival selects dust, armor sparks, explosions and energy without fake repeat hits',()=>{
  for(const [type,splash,victimId,asset]of [['normal',0,'age1_melee','hit_dust'],['piercing',0,'age2_heavy','hit_metal'],['normal',40,'age1_melee','hit_explosion'],['explosive',0,'age1_melee','hit_explosion'],['energy',0,'age2_heavy','hit_energy']]){
    const fx=new BattleEffects(),u=unit(1,1,victimId),p={id:99,side:0,type,splash,remaining:.05,targetId:1,baseSide:null,to:500};fx.sync(view(1,{units:[u],projectiles:[p]}));fx.sync(view(1.1,{units:[{...u,hp:90}]}));assert.equal(fx.items.length,1);assert.equal(fx.items[0].asset,asset);fx.sync(view(1.1,{units:[{...u,hp:90}]}));assert.equal(fx.items.length,1);
  }
  assert.equal(hitAsset({type:'normal'},unit(2,1,'age4_vehicle')),'hit_metal');
  assert.equal(hitAsset(UNITS.find(d=>d.id==='age3_heavy'),unit(2,1)),'hit_explosion');
});
test('melee damage and death create impacts, healing and lost targets do not',()=>{
  const fx=new BattleEffects(),a=unit(1,0),b=unit(2,1);fx.sync(view(0,{units:[a,b]}));fx.sync(view(.1,{units:[a,{...b,hp:90}]}));assert.equal(fx.items.length,1);fx.sync(view(.2,{units:[a,{...b,hp:95}]}));assert.equal(fx.items.length,1);fx.sync(view(.3,{units:[a]}));assert.equal(fx.items.length,2);
  const f=new BattleEffects();f.sync(view(0,{projectiles:[{id:3,side:0,type:'normal',targetId:404,baseSide:null,remaining:.01}]}));f.sync(view(.1));assert.equal(f.items.length,0);
});
test('skill splash does not add duplicate explosion; visual history is bounded and expires',()=>{
  const fx=new BattleEffects();fx.sync(view(0,{strikes:[{era:2,side:0,x:500,wait:1,pulses:1}]}));fx.sync(view(1.1,{effects:[{side:0,to:500,life:.3}]}));assert.equal(fx.items.length,1);
  const v=view(1.1,{effects:Array.from({length:80},(_,i)=>({side:0,to:i*10,life:.4}))});fx.sync(v);assert.equal(fx.items.length,32);assert.ok(fx.seen.size<=64);fx.sync(view(2));assert.equal(fx.items.length,0);
});
test('transparent effect frames remain transparent and render with a shared anchor',()=>{
  const p=platform(),app=new GameApp(p),r=app.renderer,m=INDEX.effects.skill_age5;
  for(let i=0;i<3;i++)assert.equal(r.effectImage('skill_age5',i,600,456,228),true);
  assert.deepEqual(p.draws.map(([,x])=>x),m.frames.map(f=>f.x));assert.deepEqual(p.draws.map(a=>a.slice(5)),[p.draws[0].slice(5),p.draws[0].slice(5),p.draws[0].slice(5)]);
});
test('world feedback reads view state without mutating snapshots or requesting unit battle portraits',()=>{
  const p=platform(),app=new GameApp(p);app.startBattle();app.battle.sides[0].cooldown=0;app.command({type:'skill',x:500});for(const d of UNITS)app.battle.spawn(1,d.id);
  const before=app.battle.snapshot(),v=app.view,copy=JSON.stringify(v);app.renderer.combatEffects.sync(v);assert.equal(JSON.stringify(v),copy);app.renderer.draw();assert.deepEqual(app.battle.snapshot(),before);
  const portraitRequests=p.made.filter(i=>i.path.includes('unit-portraits')).map(i=>i.path);assert.equal(portraitRequests.length,3);assert.ok(portraitRequests.every(path=>path.includes('age1_')));
});
test('real fixed-step skills retain their final visual phase after the model removes a strike',()=>{
  for(let era=0;era<5;era++){
    const session=new LocalBattleSession(),fx=new BattleEffects();session.model.sides[0].era=era;session.model.sides[0].cooldown=0;session.sendCommand({type:'skill',x:500});fx.sync(session.getViewState());
    const duration=era===1?2.2:1.4;
    for(let i=0;i<Math.ceil((duration+.2)/STEP);i++){
      session.model.tick(STEP,false);const v=session.getViewState(),before=session.snapshot();fx.sync(v);assert.deepEqual(session.snapshot(),before);assert.ok(fx.items.filter(e=>e.kind==='skill').length<=1);
      if(v.time>=duration-.15&&v.time<duration-.01){assert.equal(v.strikes.length,0);assert.equal(fx.items.filter(e=>e.kind==='skill').length,1);assert.equal(fx.frame(fx.items.find(e=>e.kind==='skill'),v.time),2);}
    }assert.equal(fx.items.length,0);
  }
});
test('defense build thumbnails cover both kinds in all eras and preserve control bounds on image arrival',()=>{
  const p=platform(false),app=new GameApp(p);app.startBattle();app.modal='defense';
  for(let era=0;era<5;era++){
    app.battle.sides[0].era=era;app.renderer.draw();const controls=app.renderer.buttons.map(({id,x,y,w,h})=>({id,x,y,w,h}));
    p.made.filter(i=>i.onload).forEach(i=>{i.width=200;i.height=200;i.onload();});p.draws.length=0;app.renderer.draw();
    for(let k=0;k<2;k++)assert.ok(p.draws.some(([i])=>i.path===`assets/world-art/tower_age${era+1}_${k}.png`));
    assert.deepEqual(app.renderer.buttons.map(({id,x,y,w,h})=>({id,x,y,w,h})),controls);
  }
});
test('base orientation respects the left-facing modern source and keeps towers facing inward',()=>{
  const app=new GameApp(platform()),calls=[];app.renderer.worldImage=(id,x,y,w,h,options)=>(calls.push({id,mirror:options.mirror}),true);
  for(let era=0;era<5;era++){
    calls.length=0;const s={era,towers:[{era,kind:0,level:1}]};app.renderer.base(0,s);app.renderer.base(1,s);
    assert.deepEqual(calls.map(c=>c.mirror),[era===3,false,era!==3,true]);assert.equal(INDEX.buildings['base_age'+(era+1)].source_facing,era===3?'left':era<2?'front':'right');
  }
});
test('shared battlefield is lazy, aspect-correct, ground-aligned and skipped by simple-background setting',()=>{
  const p=platform(),app=new GameApp(p),m=INDEX.backgrounds.battlefield_shared;assert.equal(app.worldArt.backgrounds.cache.size,0);app.renderer.landscape(0);assert.equal(p.draws.length,1);
  const [image,x,y,w,h]=p.draws[0];assert.equal(image.path,m.path);assert.equal(x,0);assert.ok(Math.abs(w/h-m.width/m.height)<1e-8);assert.equal(y+m.ground_y*w/m.width,456);
  app.renderer.landscape(4);assert.equal(app.worldArt.backgrounds.cache.size,1);assert.equal(p.made.length,1);
  const q=platform(),simple=new GameApp(q);simple.settings.simpleBackground=true;simple.renderer.landscape(4);assert.equal(q.made.length,0);assert.equal(q.draws.length,0);
  const failed=platform(false),fallback=new GameApp(failed);fallback.renderer.landscape(0);failed.made[0].onerror();fallback.renderer.landscape(0);assert.equal(failed.draws.length,0);assert.equal(failed.made.length,1);
  const jpeg=fs.readFileSync(m.path);assert.equal(jpeg[0],255);assert.equal(jpeg[1],216);assert.ok(fs.existsSync('assets/battlefield/battlefield_shared.png'));
});

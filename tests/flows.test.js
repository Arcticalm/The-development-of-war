'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {GameApp,SAVE_KEY}=require('../src/app');
const {AudioService,SOUNDS}=require('../src/services/audio');
const {KEYS}=require('../src/services/storage');
const {UNITS}=require('../src/data');
const {TextUnitPresenter}=require('../src/ui/units');
global.requestAnimationFrame=()=>1;
function platform(){
  const handlers={},data={},texts=[],players=[];
  const ctx=new Proxy({fillText:t=>texts.push(String(t))},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>{o[k]=v;return true;}});
  return {handlers,data,texts,players,createCanvas:()=>({getContext:()=>ctx}),createImage:()=>{throw new Error('Character images must not load');},getWindowInfo:()=>({windowWidth:844,windowHeight:390,pixelRatio:3,safeArea:{left:35,right:809,top:0,bottom:369}}),getMenuButtonBoundingClientRect:()=>({bottom:34}),onTouchStart:f=>handlers.start=f,onTouchMove:f=>handlers.move=f,onTouchEnd:f=>handlers.end=f,onTouchCancel:f=>handlers.cancel=f,onHide:f=>handlers.hide=f,onShow:f=>handlers.show=f,getStorageSync:k=>data[k],setStorageSync:(k,v)=>{data[k]=JSON.parse(JSON.stringify(v));},removeStorageSync:k=>{delete data[k];},createInnerAudioContext:()=>{const p={plays:0,stops:0,play(){this.plays++;},stop(){this.stops++;},onError(){},destroy(){}};players.push(p);return p;}};
}
function tapLabel(a,label){
  const ctx=a.ctx,original=ctx.fillText,located=[];ctx.fillText=(text,x,y)=>{if(text===label)located.push({x,y});};a.renderer.draw();ctx.fillText=original;assert.ok(located.length,'missing label '+label);const p=located[0];a.touch(a.offsetX+p.x*a.scale,a.offsetY+p.y*a.scale);
}
function event(a,name,x,y){const p={clientX:a.offsetX+x*a.scale,clientY:a.offsetY+y*a.scale};a.wx.handlers[name]({changedTouches:[p],touches:[p]});}
test('PvP lobby navigation and every reserved entry preserve the PvE snapshot',()=>{
  const w=platform(),a=new GameApp(w);a.startBattle();const saved=JSON.stringify(w.data[SAVE_KEY]);a.pauseBattle();a.navigate('home');tapLabel(a,'PvP 在线对战');assert.equal(a.scene,'pvp');tapLabel(a,'尚未开放');assert.equal(a.scene,'pvp');assert.ok(a.toast.includes('尚未开放'));assert.equal(JSON.stringify(w.data[SAVE_KEY]),saved);tapLabel(a,'返回首页');tapLabel(a,'继续上次对战');assert.equal(a.scene,'battle');assert.ok(a.paused);
});
test('long press shows details without buying; a short press buys once',()=>{
  const a=new GameApp(platform());a.startBattle();a.renderer.draw();event(a,'start',140,589);a.frame(1000);a.frame(1250);a.frame(1500);assert.equal(a.modal.unit,'age1_melee');event(a,'end',140,589);assert.equal(a.battle.sides[0].queue.length,0);
  a.modal=null;a.renderer.draw();event(a,'start',140,589);event(a,'end',140,589);assert.equal(a.battle.sides[0].queue.length,1);
});
test('dragging the battlefield does not cast a selected skill',()=>{
  const a=new GameApp(platform());a.startBattle();a.battle.sides[0].cooldown=0;a.camera={zoom:1.8,x:0,y:0};a.skillMode=true;a.renderer.draw();event(a,'start',350,350);event(a,'move',470,350);event(a,'end',470,350);assert.equal(a.battle.strikes.length,0);assert.ok(a.skillMode);assert.ok(a.camera.x>0);event(a,'start',400,350);event(a,'end',400,350);assert.equal(a.battle.strikes.length,1);
});
test('skill clicks outside the zoomed world reject without consuming cooldown',()=>{
  const a=new GameApp(platform());a.startBattle();a.battle.sides[0].cooldown=0;a.camera={zoom:1,x:150,y:0};a.skillMode=true;a.renderer.draw();
  event(a,'start',102,350);event(a,'end',102,350);assert.equal(a.battle.strikes.length,0);assert.equal(a.battle.sides[0].cooldown,0);assert.ok(a.skillMode);assert.ok(a.toast.includes('战场内'));
});
test('saving from pause returns home and continues the same match paused',()=>{
  const a=new GameApp(platform());a.startBattle();const id=a.view.matchId;a.command({type:'train',id:'age1_melee'});a.pauseBattle();tapLabel(a,'保存并返回首页');assert.equal(a.scene,'home');assert.ok(a.paused);tapLabel(a,'继续上次对战');assert.equal(a.view.matchId,id);assert.equal(a.view.sides[0].queue.length,1);assert.ok(a.paused);
});
test('queue cancellation confirms before refund and expires when the unit spawns',()=>{
  const a=new GameApp(platform());a.startBattle();a.command({type:'train',id:'age1_melee'});const q=a.view.sides[0].queue[0],gold=a.view.sides[0].gold;a.queueCancel(q.id);assert.equal(a.view.sides[0].gold,gold);a.renderer.draw();tapLabel(a,'确认取消');assert.equal(a.view.sides[0].gold,gold+52);
  a.command({type:'train',id:'age1_melee'});a.queueCancel(a.view.sides[0].queue[0].id);for(let i=0;i<60;i++)a.battle.tick(1/30,false);a.renderer.draw();assert.ok(a.wx.texts.some(t=>t.includes('已经出场')));
});
test('new battle asks before replacing a saved battle; surrender confirms and records failure',()=>{
  const a=new GameApp(platform());a.startBattle({mode:'campaign',levelId:'1-1'});const id=a.view.matchId;a.pauseBattle();a.navigate('home');a.requestStartBattle();assert.equal(a.modal.confirm,'overwrite');assert.equal(a.view.matchId,id);a.modal=null;a.navigate('battle');a.pauseBattle();tapLabel(a,'投降');assert.equal(a.view.result,null);tapLabel(a,'确认投降');assert.equal(a.view.result.winner,1);assert.equal(a.progress.records['1-1'],undefined);assert.equal(a.saved,null);assert.equal(a.wx.data[SAVE_KEY],undefined);
});
test('victory settlement is persisted once and next level can start',()=>{
  const a=new GameApp(platform());a.startBattle({mode:'campaign',levelId:'1-1'});a.battle.sides[1].hp=0;a.frame(1000);a.frame(1100);assert.ok(a.progress.records['1-1']);const progress=JSON.stringify(a.progress);a.frame(1200);assert.equal(JSON.stringify(a.progress),progress);assert.equal(a.wx.data[KEYS.progress].records['1-1'].cleared,true);tapLabel(a,'下一关');assert.equal(a.view.rules.levelId,'1-2');assert.equal(a.view.result,null);
});
test('all screens, every unit detail and crowded text render with unsupported-image fallback and no mutation',()=>{
  const a=new GameApp(platform());for(const scene of ['home','campaign','codex','settings','pvp']){a.navigate(scene);for(let i=0;i<5;i++){a.chapter=i;a.codexEra=i;a.renderer.draw();}}for(const d of UNITS){a.modal={unit:d.id};a.renderer.draw();}
  a.modal=null;a.startBattle();for(let side=0;side<2;side++)for(let i=0;i<30;i++){const u=a.battle.spawn(side,'age1_melee');u.x=500;}
  const before=a.battle.snapshot();a.renderer.draw();assert.deepEqual(a.battle.snapshot(),before);assert.ok(a.wx.texts.includes('我·石棒×30'));assert.ok(a.wx.texts.includes('敌·石棒×30'));
});
test('text presenter collision placement does not overlap labels for mixed armies',()=>{
  const labels=[],r={line(){},unitLabel(x,y,w){labels.push({x,y:y-14,w,h:27});}};
  const units=Array.from({length:60},(_,i)=>({id:i,typeId:UNITS[i%30].id,side:i<30?0:1,x:500,hp:UNITS[i%30].hp,shield:0,status:'攻击'}));new TextUnitPresenter().draw(r,units);
  for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){const a=labels[i],b=labels[j];assert.ok(!(a.y===b.y&&a.x<b.x+b.w&&a.x+a.w>b.x));}
});
test('audio switch, volume and background persist; hiding stops playback',()=>{
  const w=platform(),a=new GameApp(w);a.audio.play('evolve',1000);assert.equal(w.players[0].plays,1);a.changeSetting('sound',false);a.audio.play('evolve',2000);assert.equal(w.players[0].plays,1);a.changeSetting('volume',0.2);a.changeSetting('simpleBackground',true);const stopped=w.players[0].stops;w.handlers.hide();assert.equal(w.players[0].stops,stopped+1);w.handlers.show();const restored=new GameApp(w);assert.deepEqual(restored.settings,{sound:false,volume:0.2,simpleBackground:true});
  Object.values(SOUNDS).forEach(path=>assert.ok(fs.existsSync(path)));const audio=new AudioService({createInnerAudioContext(){throw new Error('unsupported');}},{sound:true,volume:0.6});assert.doesNotThrow(()=>audio.play('click'));assert.ok(audio.failed);
});
test('old snapshots explain retry and failed progress storage preserves in-memory victory',()=>{
  const w=platform();w.data['war.pve.snapshot.v1']={version:'prototype-0.1'};const a=new GameApp(w);assert.ok(a.invalidSaved);assert.equal(a.saved,null);a.startBattle({mode:'campaign',levelId:'1-1'});w.setStorageSync=()=>{throw new Error('quota');};a.battle.sides[1].hp=0;a.frame(1000);a.frame(1100);assert.equal(a.progress.records['1-1'].cleared,true);assert.ok(a.saveUnavailable);a.nextLevel();assert.equal(a.view.rules.levelId,'1-2');
});

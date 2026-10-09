'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {GameApp}=require('../src/app');
const {FeedbackController}=require('../src/ui/feedback');
const {BY_ID,ERAS}=require('../src/data');
global.requestAnimationFrame=()=>1;
function platform(){
  const handlers={},storage={},players=[];
  const ctx=new Proxy({},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>{o[k]=v;return true;}});
  return {handlers,players,createCanvas:()=>({getContext:()=>ctx}),getWindowInfo:()=>({windowWidth:844,windowHeight:390,pixelRatio:3,safeArea:{left:47,right:797,top:0,bottom:369}}),getMenuButtonBoundingClientRect:()=>({bottom:34}),onTouchStart:f=>handlers.start=f,onTouchMove:f=>handlers.move=f,onTouchEnd:f=>handlers.end=f,onTouchCancel:f=>handlers.cancel=f,onHide:f=>handlers.hide=f,onShow:f=>handlers.show=f,getStorageSync:k=>storage[k],setStorageSync:(k,v)=>{storage[k]=JSON.parse(JSON.stringify(v));},removeStorageSync:k=>{delete storage[k];},createInnerAudioContext:()=>{const p={plays:0,play(){this.plays++;},stop(){},onError(){}};players.push(p);return p;}};
}
function control(a,key){a.renderer.draw();const b=a.renderer.buttons.find(b=>b.id.endsWith(':'+key));assert.ok(b,'missing control '+key);return b;}
function point(b){return {x:b.x+b.w/2,y:b.y+b.h/2};}
function event(a,name,p){const t={clientX:a.offsetX+p.x*a.scale,clientY:a.offsetY+p.y*a.scale};a.wx.handlers[name]({changedTouches:[t],touches:name==='end'?[]:[t]});}
function tap(a,key){const p=point(control(a,key));event(a,'start',p);event(a,'end',p);}
function battle(){const a=new GameApp(platform());a.startBattle();return a;}

test('stable control ID keeps 97 percent press through redraw and buys once on release',()=>{
  const a=battle(),b=control(a,'train:age1_melee'),p=point(b);
  event(a,'start',p);assert.equal(a.feedback.state(b.id).scale,0.97);assert.equal(a.view.sides[0].queue.length,0);
  a.renderer.draw();assert.equal(a.feedback.pressed,b.id);event(a,'end',p);event(a,'end',p);
  assert.equal(a.view.sides[0].queue.length,1);assert.equal(a.feedback.pressed,null);assert.equal(a.feedback.state(b.id).kind,'success');
  assert.equal(a.audio.players.confirm.plays,1);a.feedback.update(0.12);assert.equal(a.feedback.state(b.id).scale,1);
});
test('moving outside then back or dragging inside cannot buy on release',()=>{
  const a=battle(),b=control(a,'card:age1_melee'),p=point(b);
  event(a,'start',p);event(a,'move',{x:0,y:400});assert.equal(a.feedback.pressed,null);event(a,'move',p);event(a,'end',p);assert.equal(a.view.sides[0].queue.length,0);
  event(a,'start',p);event(a,'move',{x:p.x+40,y:p.y});event(a,'end',p);assert.equal(a.view.sides[0].queue.length,0);
});
test('touch cancel, modal, navigation and hide discard pressed actions',()=>{
  for(const cancel of [a=>a.wx.handlers.cancel(),a=>{a.modal='help';},a=>a.navigate('home'),a=>a.wx.handlers.hide()]){
    const a=battle(),p=point(control(a,'train:age1_melee'));event(a,'start',p);cancel(a);assert.equal(a.pointer,null);assert.equal(a.feedback.pressed,null);event(a,'end',p);assert.equal(a.view.sides[0].queue.length,0);
  }
});
test('release revalidates money and explains why a newly disabled button rejects',()=>{
  const a=battle(),b=control(a,'train:age1_melee'),p=point(b);event(a,'start',p);a.battle.sides[0].gold=0;event(a,'end',p);
  assert.equal(a.view.sides[0].queue.length,0);assert.equal(a.toast,'金币不足');assert.equal(a.toastKind,'error');assert.equal(a.feedback.state(b.id).kind,'error');assert.equal(a.audio.players.reject.plays,1);
});
test('roster changes invalidate a finger held over an old unit',()=>{
  const a=battle(),p=point(control(a,'train:age1_melee'));event(a,'start',p);a.page=1;event(a,'end',p);assert.equal(a.view.sides[0].queue.length,0);assert.equal(a.modal,null);
});
test('queue controls follow entity IDs when production and queue order change',()=>{
  const a=battle();a.battle.sides[0].gold=1000;a.command({type:'train',id:'age1_melee'});a.command({type:'train',id:'age1_melee'});
  const ids=a.view.sides[0].queue.map(q=>q.id),p=point(control(a,'queue:'+ids[0]));event(a,'start',p);
  a.command({type:'cancel',id:ids[0]});event(a,'end',p);assert.equal(a.modal,null);assert.deepEqual(a.view.sides[0].queue.map(q=>q.id),[ids[1]]);
  assert.ok(a.feedback.effects.some(e=>e.id==='battle:main:queue:'+ids[1]));
});
test('a queued unit spawning while refund confirmation is held cannot refund',()=>{
  const a=battle();a.command({type:'train',id:'age1_melee'});a.queueCancel(a.view.sides[0].queue[0].id);
  const p=point(control(a,'confirm-cancel'));event(a,'start',p);a.battle.sides[0].queue[0].remaining=0; a.battle.tick(1/30,false);
  const gold=a.view.sides[0].gold;event(a,'end',p);assert.equal(a.view.sides[0].gold,gold);assert.equal(a.view.sides[0].queue.length,0);assert.equal(a.view.sides[0].produced,1);
});
test('long press still opens disabled unit details and never buys on release',()=>{
  const a=battle();a.battle.sides[0].gold=0;const p=point(control(a,'card:age1_melee'));event(a,'start',p);a.frame(1000);a.frame(1250);a.frame(1500);assert.equal(a.modal.unit,'age1_melee');event(a,'end',p);assert.equal(a.view.sides[0].queue.length,0);assert.equal(a.feedback.pressed,null);
});
test('disabled reasons cover money, queue, population, cooldown and evolution',()=>{
  const a=battle();a.battle.sides[0].gold=0;assert.equal(control(a,'train:age1_melee').disabledReason,'金币不足');tap(a,'train:age1_melee');assert.equal(a.toast,'金币不足');
  a.battle.sides[0].gold=10000;for(let i=0;i<5;i++)a.command({type:'train',id:'age1_melee'});assert.equal(control(a,'train:age1_melee').disabledReason,'队列已满');
  a.battle.sides[0].queue=[];for(let i=0;i<30;i++)a.battle.spawn(0,'age1_melee');assert.equal(control(a,'train:age1_melee').disabledReason,'人口已满');
  tap(a,'skill');assert.equal(a.toast,'技能尚未冷却');tap(a,'evolve');assert.equal(a.toast,'进化经验不足');a.battle.sides[0].era=4;assert.equal(control(a,'evolve').disabledReason,'已达到本局时代上限');
});
test('build, upgrade, sell, cancel and evolve report success and accurate refund',()=>{
  const a=battle();a.battle.sides[0].gold=10000;
  a.command({type:'build',slot:0,kind:0});assert.equal(a.toast,'防御塔已建造');a.command({type:'upgrade',slot:0});assert.equal(a.toast,'防御塔已升级');
  const refund=Math.floor(a.view.sides[0].towers[0].paid*0.5);a.command({type:'sell',slot:0});assert.ok(a.toast.includes(String(refund)));
  a.command({type:'train',id:'age1_melee'});const q=a.view.sides[0].queue[0];a.command({type:'cancel',id:q.id});assert.ok(a.toast.includes(String(Math.floor(BY_ID.age1_melee.cost*0.75))));
  a.battle.sides[0].xp=ERAS[1].xp;tap(a,'evolve');assert.equal(a.view.sides[0].era,1);assert.equal(a.toastKind,'success');assert.ok(a.feedback.state('battle:main:era').alpha>0);
});
test('sound off and zero volume suppress click, confirm and rejection without suppressing visual feedback',()=>{
  for(const [key,value] of [['sound',false],['volume',0]]){
    const a=battle();a.changeSetting(key,value);tap(a,'roster-page');a.page=0;tap(a,'train:age1_melee');tap(a,'skill');assert.equal(a.wx.players.reduce((n,p)=>n+p.plays,0),0);assert.ok(a.feedback.effects.length>0);
  }
  const a=battle();a.changeSetting('volume',0.2);tap(a,'train:age1_melee');tap(a,'skill');assert.equal(a.audio.players.confirm.volume,0.2);assert.equal(a.audio.players.reject.volume,0.2);
});
test('UI feedback advances during pause and freezes while hidden',()=>{
  const a=battle();a.pauseBattle();a.feedback.release('battle:pause:help',850,380);a.frame(1000);a.frame(1100);
  assert.equal(a.view.time,0);assert.equal(a.feedback.effects[0].age,0.1);a.wx.handlers.hide();a.frame(1200);a.frame(1400);assert.equal(a.feedback.effects[0].age,0.1);a.wx.handlers.show();a.frame(1500);a.frame(1750);assert.equal(a.feedback.effects.length,0);assert.equal(a.view.time,0);
});
test('feedback budget is twelve and completed effects clean themselves up',()=>{
  const f=new FeedbackController();for(let i=0;i<30;i++)f.release('button:'+i,10,10);assert.equal(f.effects.length,12);assert.equal(f.effects[0].id,'button:18');f.update(0.2);assert.ok(f.effects.every(e=>e.age===0.2));f.update(0.11);assert.equal(f.effects.length,0);f.flash('wallet');f.update(0.25);f.update(0.25);f.update(0.1);assert.equal(f.effects.length,0);
});
test('shaped hit areas and logical coordinates honor canvas scaling and safe area',()=>{
  const a=new GameApp(platform());a.navigate('campaign');const b=control(a,'level:1-1');assert.equal(a.contains(b,b.x+1,b.y+1),false);tap(a,'level:1-1');assert.equal(a.modal.levelId,'1-1');
  a.navigate('home');const start=control(a,'start');assert.equal(a.contains(start,start.x+1,start.y+1),false);assert.ok(a.offsetX>=47);assert.ok(a.offsetX+1280*a.scale<=797);assert.ok(a.offsetY+720*a.scale<=369);
});
test('all screens register unique stable controls with explicit disabled explanations',()=>{
  const a=battle();for(const scene of ['home','campaign','codex','settings','pvp','battle']){a.navigate(scene);a.renderer.draw();const ids=a.renderer.buttons.map(b=>b.id);assert.equal(new Set(ids).size,ids.length);for(const b of a.renderer.buttons){assert.equal(typeof b.action,'function');assert.ok(b.w>0&&b.h>0);if(!b.enabled)assert.ok(b.disabledReason);}}
});

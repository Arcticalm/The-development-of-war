'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {Battle,STEP}=require('../src/battle');
const {BY_ID,UNITS}=require('../src/data');
const {LEVELS,resolveMode}=require('../src/config/modes');
const {LocalBattleSession}=require('../src/sessions/local');
const {StorageService,KEYS,unlocked,settleProgress}=require('../src/services/storage');
const {UnavailablePvpService}=require('../src/services/pvp');
function run(b,seconds){for(let i=0;i<Math.ceil(seconds/STEP);i++)b.tick(STEP,false);}
test('all text identities are unique and every chapter has three configured levels',()=>{
  assert.equal(new Set(UNITS.map(d=>d.shortName)).size,30);assert.ok(UNITS.every(d=>d.shortName.length<=3&&d.role&&d.strength&&d.weakness&&d.partners));
  assert.equal(LEVELS.length,15);for(let i=0;i<5;i++)assert.equal(LEVELS.filter(l=>l.chapter===i).length,3);
  for(const l of LEVELS){const b=new Battle({mode:'campaign',levelId:l.id});assert.equal(b.sides[0].era,l.startEra);assert.equal(b.sides[1].maxHp,l.enemyHp);assert.equal(b.sides[0].gold,resolveMode({mode:'campaign',levelId:l.id}).gold);assert.equal(!!b.sides[1].towers[0],l.initialTower!==null);assert.ok(Battle.restore(b.snapshot()));}
});
test('campaign era caps and income multipliers are applied to actual simulation',()=>{
  const b=new Battle({mode:'campaign',levelId:'3-2'});b.sides[0].xp=99999;assert.equal(b.command(0,{type:'evolve'}),'本关已达到时代上限');
  const a=b.sides[0].gold,z=b.sides[1].gold;run(b,1);assert.ok(Math.abs((b.sides[1].gold-z)/(b.sides[0].gold-a)-1.15)<1e-8);
});
test('each campaign handles timeout, early victory, defeat, draw and restore',()=>{
  for(const l of LEVELS){
    const b=new Battle({mode:'campaign',levelId:l.id});b.time=l.timeLimit-STEP;b.tick(STEP,false);assert.equal(b.result.winner,l.objective==='survive'?0:1);
    const win=new Battle({mode:'campaign',levelId:l.id});win.sides[1].hp=0;win.tick(STEP,false);assert.equal(win.result.winner,0);
    const lose=new Battle({mode:'campaign',levelId:l.id});lose.sides[0].hp=0;lose.tick(STEP,false);assert.equal(lose.result.winner,1);
    const draw=new Battle({mode:'campaign',levelId:l.id});draw.sides.forEach(s=>{s.hp=0;});draw.time=l.timeLimit-STEP;draw.tick(STEP,false);assert.equal(draw.result.winner,null);
  }
});
test('windup retargets without immediate damage when its target disappears',()=>{
  const b=new Battle(),u=b.spawn(0,'age1_melee'),a=b.spawn(1,'age1_melee');u.x=490;a.x=510;a.clock=9;b.tick(STEP,false);assert.equal(a.hp,BY_ID[a.typeId].hp);
  b.units=b.units.filter(v=>v.id!==a.id);const z=b.spawn(1,'age1_melee');z.x=510;z.clock=9;b.tick(STEP,false);assert.equal(z.hp,BY_ID[z.typeId].hp);assert.equal(u.pending.targetId,z.id);run(b,0.2);assert.ok(z.hp<BY_ID[z.typeId].hp);
});
test('single projectiles travel then expire if their original target dies',()=>{
  const b=new Battle(),u=b.spawn(0,'age2_range'),victim=b.spawn(1,'age1_melee');u.x=300;victim.x=500;victim.clock=99;
  run(b,0.4);assert.equal(victim.hp,BY_ID[victim.typeId].hp);assert.equal(b.projectiles.length,1);
  b.units=b.units.filter(v=>v.id!==victim.id);const other=b.spawn(1,'age1_melee');other.x=500;other.clock=99;run(b,0.4);assert.equal(other.hp,BY_ID[other.typeId].hp);assert.equal(b.projectiles.length,0);
});
test('area projectiles retain their landing point and hit surviving nearby enemies',()=>{
  const b=new Battle(),u=b.spawn(0,'age1_fire'),victim=b.spawn(1,'age1_melee'),near=b.spawn(1,'age1_melee');u.x=400;victim.x=500;near.x=510;victim.clock=near.clock=99;
  run(b,0.55);assert.equal(b.projectiles.length,1);b.units=b.units.filter(v=>v.id!==victim.id);run(b,0.3);assert.ok(near.hp<BY_ID[near.typeId].hp);assert.equal(b.sides[1].hp,3000);
});
test('empty area impacts do not reward kills or damage a base',()=>{
  const b=new Battle(),u=b.spawn(0,'age1_fire'),victim=b.spawn(1,'age1_melee');u.x=400;victim.x=500;victim.clock=99;run(b,0.55);assert.equal(b.projectiles.length,1);
  b.units=b.units.filter(v=>v.id!==victim.id);const gold=b.sides[0].gold;run(b,0.3);assert.equal(b.sides[0].kills,0);assert.ok(Math.abs(b.sides[0].gold-gold-8*0.3)<1e-7);assert.equal(b.sides[1].hp,3000);
});
test('rail hits at most two enemies and never pierces into their base',()=>{
  const b=new Battle(),u=b.spawn(0,'age5_rail');u.x=780;const enemies=[920,940,960].map(x=>{const v=b.spawn(1,'age1_melee');v.x=x;v.clock=99;return v;});
  run(b,1);assert.ok(enemies[0].hp<BY_ID.age1_melee.hp);assert.ok(enemies[1].hp<BY_ID.age1_melee.hp);assert.equal(enemies[2].hp,BY_ID.age1_melee.hp);assert.equal(b.sides[1].hp,3000);
});
test('same-type simultaneous healing uses the largest amount and excludes self',()=>{
  const b=new Battle(),u=b.spawn(0,'age1_melee');u.x=500;u.hp=20;u.clock=99;
  for(let i=0;i<2;i++){const h=b.spawn(0,'age2_support');h.x=450+i*10;}
  run(b,0.4);assert.equal(u.hp,20+BY_ID.age2_support.damage);
  const solo=new Battle(),medic=solo.spawn(0,'age2_support');medic.hp=1;run(solo,1);assert.equal(medic.hp,1);assert.ok(medic.x>0);
});
test('healing priorities use HP ratio then distance and pending heals cancel out of range',()=>{
  const b=new Battle(),h=b.spawn(0,'age2_support'),far=b.spawn(0,'age1_melee'),near=b.spawn(0,'age1_melee');h.x=400;far.x=500;near.x=450;far.hp=near.hp=50;
  b.tick(STEP,false);assert.equal(h.pending.targetId,near.id);near.x=900;b.tick(STEP,false);assert.equal(h.pending.targetId,far.id);assert.equal(near.hp,50);
});
test('support alone advances but cannot pass or attack an enemy',()=>{
  const b=new Battle(),h=b.spawn(0,'age1_support');h.x=100;run(b,1);assert.ok(h.x>100);const e=b.spawn(1,'age1_melee');e.x=h.x+20;e.clock=99;const hp=e.hp;run(b,1);assert.ok(h.x<=e.x);assert.equal(e.hp,hp);
});
test('snapshot restores windup and in-flight projectiles into the same future',()=>{
  const a=new Battle({mode:'campaign',levelId:'5-2',seed:42}),u=a.spawn(0,'age5_range'),e=a.spawn(1,'age5_heavy');u.x=400;e.x=540;e.clock=99;run(a,0.55);assert.ok(a.projectiles.length);
  const b=Battle.restore(a.snapshot());assert.ok(b);run(a,0.8);run(b,0.8);assert.deepEqual(a.snapshot(),b.snapshot());
  const invalid=a.snapshot();invalid.projectiles.push({});assert.equal(Battle.restore(invalid),null);
});
test('local session deduplicates commands, pauses all clocks and rejects PvP execution',()=>{
  const s=new LocalBattleSession({matchId:'test'}),gold=s.model.sides[0].gold;
  assert.equal(s.sendCommand({type:'train',id:'age1_melee'},'one').status,'accepted');assert.equal(s.sendCommand({type:'train',id:'age1_melee'},'one').status,'accepted');assert.equal(s.model.sides[0].gold,gold-BY_ID.age1_melee.cost);
  s.pause();const before=s.snapshot();s.update(0.2);assert.deepEqual(s.snapshot(),before);assert.equal(s.sendCommand({type:'train',id:'age1_melee'}).status,'rejected');s.resume();s.update(0.2);assert.ok(s.model.time>0);s.dispose();assert.equal(s.sendCommand({type:'skill',x:500}).status,'rejected');assert.throws(()=>new LocalBattleSession({mode:'pvp'}));
});
test('view copies hide enemy economy and mirror the right-side player',()=>{
  const s=new LocalBattleSession();s.model.spawn(1,'age1_melee').x=900;const view=s.getViewState(1);assert.equal(view.units[0].x,100);assert.equal(view.units[0].side,0);assert.equal(view.sides[1].gold,undefined);assert.equal(view.sides[1].xp,undefined);assert.equal(view.sides[1].queue,undefined);view.sides[0].gold=0;view.units[0].hp=0;assert.equal(s.model.sides[1].gold,200);assert.ok(s.model.units[0].hp>0);
});
test('campaign progress is idempotent and failure cannot overwrite best records',()=>{
  const p={version:1,records:{},settled:[]},b=new Battle({mode:'campaign',levelId:'1-1',matchId:'one'});assert.equal(unlocked(p,'1-2'),false);b.time=100;b.sides[1].hp=0;b.tick(STEP,false);
  assert.equal(settleProgress(p,b.result),true);const before=JSON.stringify(p);assert.equal(settleProgress(p,b.result),false);assert.equal(JSON.stringify(p),before);assert.ok(unlocked(p,'1-2'));
  const fail=new Battle({mode:'campaign',levelId:'1-1',matchId:'two'});fail.command(0,{type:'surrender'});settleProgress(p,fail.result);assert.equal(p.records['1-1'].bestTime,b.result.time);
});
test('survival best time only records early base destruction',()=>{
  const p={version:1,records:{},settled:[]},a=new Battle({mode:'campaign',levelId:'1-3',matchId:'survive'});a.time=300-STEP;a.tick(STEP,false);settleProgress(p,a.result);assert.equal(p.records['1-3'].bestTime,null);
  const b=new Battle({mode:'campaign',levelId:'1-3',matchId:'early'});b.time=200;b.sides[1].hp=0;b.tick(STEP,false);settleProgress(p,b.result);assert.ok(p.records['1-3'].bestTime<201);
});
test('settings and progress reject malformed persisted values without losing valid records',()=>{
  const data={[KEYS.settings]:{sound:'yes',volume:99,simpleBackground:true},[KEYS.progress]:{version:1,records:{'1-1':{cleared:true,bestHp:0.5,bestTime:100},'1-2':{cleared:true,bestHp:-1,bestTime:20}},settled:[null,'one']}},s=new StorageService({getStorageSync:k=>data[k]});assert.deepEqual(s.loadSettings(),{sound:true,volume:0.6,simpleBackground:true});assert.equal(Object.keys(s.loadProgress().records).length,1);
});
test('every reserved PvP operation returns unavailable without starting a match',async()=>{
  const p=new UnavailablePvpService();assert.equal(p.getAvailability().available,false);for(const method of ['ensureSession','matchmake','cancelMatchmaking','createRoom','joinRoom','leaveRoom','setReady','connectMatch','reconnect'])assert.equal((await p[method]()).errorCode,'PVP_UNAVAILABLE');
});
test('all 15 campaigns can be completed through legal commands without changing resources',()=>{
  const {simulate}=require('../scripts/check-campaign');
  for(const level of LEVELS){const result=simulate(level);assert.equal(result.winner,0,level.id+' did not finish');assert.ok(result.time<=level.timeLimit);}
});
test('siege units outrange towers but cannot shoot a blocked base',()=>{
  const b=new Battle({mode:'campaign',levelId:'2-3'}),siege=b.spawn(0,'age2_ballista');siege.x=710;b.tick(STEP,false);assert.ok(siege.pending);assert.equal(b.projectiles.length,0);run(b,1);assert.ok(b.sides[1].hp<3000);assert.equal(siege.hp,BY_ID.age2_ballista.hp);
  const blocker=b.spawn(1,'age2_melee');blocker.x=900;blocker.clock=99;const hp=b.sides[1].hp;run(b,2.8);assert.equal(b.sides[1].hp,hp);assert.ok(blocker.hp<BY_ID.age2_melee.hp);
});

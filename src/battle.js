'use strict';
const {VERSION,ERAS,BY_ID,ARMOR}=require('./data');
const {resolveMode}=require('./config/modes');
const {runAI}=require('./core/ai');
const STEP=1/30,LENGTH=1000,EPS=1e-8;
const copy=value=>JSON.parse(JSON.stringify(value));
/** 纯战斗模型：所有时间来自 tick，所有随机数来自 seed。 */
class Battle {
  constructor(options={}) {
    this.version=VERSION;this.rules=resolveMode(options);this.matchId=options.matchId||'local';
    this.time=0;this.result=null;this.nextId=1;this.eventId=0;this.units=[];this.projectiles=[];this.effects=[];this.strikes=[];this.events=[];
    this.difficulty=this.rules.difficulty;this.aiClock=0;this.seed=(options.seed===undefined?12345:options.seed)>>>0;
    this.sides=[0,1].map(side=>({gold:this.rules.gold,xp:ERAS[this.rules.startEra].xp,era:this.rules.startEra,hp:side?this.rules.enemyHp:3000,maxHp:side?this.rules.enemyHp:3000,queue:[],slots:1,towers:[null,null,null],cooldown:60,kills:0,produced:0,highestEra:this.rules.startEra}));
    if(this.rules.initialTower!==null){const s=this.sides[1],kind=this.rules.initialTower,cost=Math.ceil([180,240][kind]*ERAS[s.era].cost);s.towers[0]={era:s.era,kind,level:1,cost,paid:cost,clock:0};}
  }
  random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
  emit(type,details={}){this.events.push({id:++this.eventId,type,time:this.time,...details});if(this.events.length>256)this.events.shift();}
  population(side){return this.units.filter(u=>u.side===side).reduce((n,u)=>n+BY_ID[u.typeId].pop,0)+this.sides[side].queue.reduce((n,q)=>n+BY_ID[q.typeId].pop,0);}
  command(side,cmd){
    if(this.result)return '对局已经结束';
    if(!Number.isInteger(side)||side<0||side>1||!cmd)return '无效指令';
    const s=this.sides[side];
    if(cmd.type==='train'){
      const d=BY_ID[cmd.id];if(!d||d.era!==s.era)return '只能生产当前时代的兵种';
      if(s.gold<d.cost)return '金币不足';if(s.queue.length>=5)return '生产队列已满';if(this.population(side)+d.pop>30)return '人口已满';
      s.gold-=d.cost;s.queue.push({id:this.nextId++,typeId:d.id,remaining:d.train,paid:d.cost});
    }else if(cmd.type==='cancel'){
      const i=s.queue.findIndex(q=>q.id===cmd.id);if(i<0)return '队列已发生变化';
      s.gold+=Math.floor(s.queue[i].paid*(i===0?0.75:1));s.queue.splice(i,1);
    }else if(cmd.type==='evolve'){
      if(s.era>=this.rules.maxEra)return this.rules.maxEra===4?'已经到达最后时代':'本关已达到时代上限';
      if(s.xp<ERAS[s.era+1].xp)return '进化经验不足';s.era++;s.highestEra=Math.max(s.highestEra,s.era);this.emit('evolve',{side});
    }else if(cmd.type==='skill'){
      if(s.cooldown>EPS)return '技能尚未冷却';if(!Number.isFinite(cmd.x)||cmd.x<0||cmd.x>LENGTH)return '请选择战场内的落点';
      s.cooldown=60;this.strikes.push({side,x:cmd.x,era:s.era,wait:1,pulses:s.era===1?3:1});this.emit('skill',{side});
    }else if(cmd.type==='unlock'){
      if(s.slots===3)return '塔位全部开放';const cost=[0,200,350][s.slots];if(s.gold<cost)return '金币不足';s.gold-=cost;s.slots++;
    }else if(['build','upgrade','sell'].includes(cmd.type)){
      const i=cmd.slot;if(!Number.isInteger(i)||i<0||i>=s.slots)return '塔位未开放';const t=s.towers[i];
      if(cmd.type==='build'){
        if(t)return '请先出售原防御塔';if(cmd.kind!==0&&cmd.kind!==1)return '无效防御塔类型';
        const cost=Math.ceil([180,240][cmd.kind]*ERAS[s.era].cost);if(s.gold<cost)return '金币不足';
        s.gold-=cost;s.towers[i]={era:s.era,kind:cmd.kind,level:1,cost,paid:cost,clock:0};
      }else if(cmd.type==='upgrade'){
        if(!t||t.level>=2)return '无法升级';const cost=Math.ceil(t.cost*0.6);if(s.gold<cost)return '金币不足';s.gold-=cost;t.paid+=cost;t.level=2;
      }else{if(!t)return '空塔位';s.gold+=Math.floor(t.paid*0.5);s.towers[i]=null;}
    }else if(cmd.type==='surrender'){this.finish(1-side,'投降');}
    else return '未知指令';return null;
  }
  spawn(side,id){
    const d=BY_ID[id],u={id:this.nextId++,typeId:id,side,x:side?LENGTH:0,hp:d.hp,shield:d.trait==='shield'?d.hp*0.2:0,clock:0,first:true,warmup:0,slow:0,targetId:null,pending:null,status:'行进'};
    this.units.push(u);this.sides[side].produced++;this.emit('spawn',{side,typeId:id});return u;
  }
  finish(winner,reason){
    if(this.result)return;
    this.result={matchId:this.matchId,mode:this.rules.mode,levelId:this.rules.levelId,winner,reason,time:this.time,version:this.version,stats:this.sides.map(s=>({highestEra:s.highestEra,produced:s.produced,kills:s.kills,hp:s.hp,maxHp:s.maxHp}))};this.emit('result',{winner});
  }
  damage(d,armor,multiplier=1){return Math.max(1,Math.round(d.damage*ARMOR[d.type][armor]*multiplier));}
  sortedTargets(u,alive){return alive.filter(v=>v.side!==u.side).sort((a,b)=>Math.abs(a.x-u.x)-Math.abs(b.x-u.x)||a.id-b.id);}
  recipients(u,d,alive){
    return alive.filter(v=>{const vd=BY_ID[v.typeId];return v.side===u.side&&v.id!==u.id&&v.hp<vd.hp&&Math.abs(v.x-u.x)<=d.range&&(d.trait==='repair'?(vd.mechanical||vd.powerArmor):!vd.mechanical);})
      .sort((a,b)=>a.hp/BY_ID[a.typeId].hp-b.hp/BY_ID[b.typeId].hp||Math.abs(a.x-u.x)-Math.abs(b.x-u.x)||a.id-b.id);
  }
  tick(dt=STEP,ai=this.rules.mode!=='pvp'){
    if(this.result)return;if(!Number.isFinite(dt)||dt<=0||dt>0.1)throw new Error('Invalid simulation step');
    this.time+=dt;this.effects=this.effects.filter(e=>(e.life-=dt)>0);
    this.sides.forEach((s,side)=>{
      s.gold+=8*ERAS[s.era].cost*dt*(side?this.rules.enemyIncome:1);s.xp+=4*dt;s.cooldown=Math.max(0,s.cooldown-dt);
      if(s.queue.length){s.queue[0].remaining-=dt;if(s.queue[0].remaining<=EPS)this.spawn(side,s.queue.shift().typeId);}
    });
    if(ai)runAI(this,dt);
    const alive=this.units.slice(),hits=[],heals=[],baseDamage=[0,0];
    // 所有本步伤害统一结算，避免左右处理顺序改变胜负。
    this.projectiles=this.projectiles.filter(p=>{p.remaining-=dt;if(p.remaining>EPS)return true;this.impact(p,alive,hits,baseDamage);return false;});
    alive.forEach(u=>this.act(u,alive,dt,hits,heals,baseDamage));
    this.towers(alive,dt);
    this.strikes.forEach(s=>{
      s.wait-=dt;if(s.wait>EPS)return;
      const d={damage:(s.era===1?60:150)*(1+s.era*0.38),type:['explosive','normal','explosive','piercing','energy'][s.era]};
      alive.filter(u=>u.side!==s.side&&Math.abs(u.x-s.x)<=105).forEach(u=>{hits.push({id:u.id,side:s.side,amount:this.damage(d,BY_ID[u.typeId].armor)});if(s.era===4)u.slow=Math.max(u.slow,3);});
      this.effects.push({from:s.x,to:s.x,side:s.side,life:0.4,blast:true});s.pulses--;s.wait=0.4;
    });this.strikes=this.strikes.filter(s=>s.pulses>0);
    hits.forEach(h=>{const u=alive.find(v=>v.id===h.id);if(!u)return;const absorb=Math.min(u.shield,h.amount);u.shield-=absorb;u.hp-=h.amount-absorb;});
    const healing=new Map();heals.forEach(h=>{const key=h.id+':'+h.kind,previous=healing.get(key);if(!previous||h.amount>previous.amount)healing.set(key,h);});
    healing.forEach(h=>{const u=alive.find(v=>v.id===h.id);if(u&&u.hp>0)u.hp=Math.min(BY_ID[u.typeId].hp,u.hp+h.amount);});
    this.units=alive.filter(u=>{if(u.hp>0)return true;const d=BY_ID[u.typeId],s=this.sides[1-u.side];s.gold+=Math.floor(d.cost*0.2);s.xp+=Math.floor(d.cost*0.3);s.kills++;this.emit('death',{side:u.side,id:u.id});return false;});
    this.sides.forEach((s,i)=>{s.hp=Math.max(0,s.hp-baseDamage[i]);});this.decide();
  }
  act(u,alive,dt,hits,heals,baseDamage){
    const d=BY_ID[u.typeId],dir=u.side?-1:1,enemies=this.sortedTargets(u,alive),allies=alive.filter(v=>v.side===u.side&&v.id!==u.id);
    u.clock=Math.max(0,u.clock-dt);u.slow=Math.max(0,u.slow-dt);
    const haste=allies.some(v=>BY_ID[v.typeId].trait==='haste'&&Math.abs(v.x-u.x)<=130)?1.15:1;
    const march=allies.some(v=>BY_ID[v.typeId].trait==='march'&&Math.abs(v.x-u.x)<=140)?1.2:1;
    if(d.support){
      const recipients=this.recipients(u,d,alive),canHeal=['heal','heal3','repair'].includes(d.trait);
      if(u.pending){
        const target=recipients.find(v=>v.id===u.pending.targetId);
        if(!target)u.pending=null;
        else{u.pending.remaining-=dt;u.status=d.trait==='repair'?'维修':'治疗';if(u.pending.remaining<=EPS){
          const selected=[target,...recipients.filter(v=>v.id!==target.id)].slice(0,d.trait==='heal3'?3:1);
          selected.forEach(v=>heals.push({id:v.id,amount:d.damage,kind:d.trait==='repair'?'repair':'medical'}));
          u.clock=Math.max(0,d.interval-d.windup);u.pending=null;this.emit('heal',{side:u.side,id:u.id});
        }return;}
      }
      if(canHeal&&recipients.length&&u.clock<=EPS){u.pending={kind:'heal',targetId:recipients[0].id,remaining:d.windup};u.status=d.trait==='repair'?'维修':'治疗';return;}
      const front=allies.filter(v=>!BY_ID[v.typeId].support&&(v.x-u.x)*dir>0).sort((a,b)=>Math.abs(a.x-u.x)-Math.abs(b.x-u.x));
      if(!front.length||Math.abs(front[0].x-u.x)>Math.min(70,d.range*0.6))this.move(u,d,dir,dt,march,enemies);else u.status='支援';
      return;
    }
    const inRange=enemies.filter(v=>Math.abs(v.x-u.x)<=d.range+EPS);
    let target=inRange.find(v=>v.id===u.targetId);
    if(!target)target=(d.trait==='sniper'?inRange.find(v=>BY_ID[v.typeId].support):null)||inRange[0];
    const baseSide=1-u.side,baseX=baseSide?LENGTH:0;
    const canBase=!target&&Math.abs(baseX-u.x)<=d.range+EPS&&!enemies.some(v=>(v.x-u.x)*dir>=-EPS&&(baseX-v.x)*dir>=-EPS);
    if(u.pending){
      const valid=u.pending.baseSide!==null?canBase:inRange.find(v=>v.id===u.pending.targetId);
      if(!valid){u.pending=null;u.targetId=null;u.status='索敌';}
      else{u.pending.remaining-=dt;u.status='攻击';if(u.pending.remaining<=EPS){
        const victim=u.pending.baseSide!==null?null:valid,p=this.makeProjectile(u,d,victim,u.pending.baseSide);
        if(d.range<=70)this.impact(p,alive,hits,baseDamage);else this.projectiles.push(p);
        u.first=false;u.clock=Math.max(0,d.interval/haste-d.windup);u.pending=null;this.emit('attack',{side:u.side,id:u.id});
      }return;}
    }
    u.targetId=target?target.id:null;
    if(target||canBase){
      u.status='装填';u.warmup+=dt;
      if(u.clock<=EPS&&(d.trait!=='warmup'||u.warmup+EPS>=0.8)){u.pending={kind:'attack',targetId:target?target.id:null,baseSide:target?null:baseSide,remaining:d.windup};u.status=d.trait==='rail'?'蓄力':'攻击';}
      else if(d.trait==='warmup'&&u.warmup<0.8)u.status='预热';
    }else{u.warmup=0;this.move(u,d,dir,dt,march,enemies);}
  }
  makeProjectile(u,d,target,baseSide){
    const to=target?target.x:baseSide?LENGTH:0,duration=Math.max(STEP,Math.abs(to-u.x)/d.projectileSpeed);
    return {id:this.nextId++,side:u.side,from:u.x,to,targetId:target?target.id:null,baseSide,damage:d.damage,type:d.type,range:d.range,splash:d.splashRadius,pierce:d.pierce,firstMultiplier:d.trait==='charge'&&u.first?1.8:1,baseMultiplier:/base/i.test(d.trait)?1.5:1,remaining:duration,duration};
  }
  impact(p,alive,hits,baseDamage){
    if(p.baseSide!==null){baseDamage[p.baseSide]+=this.damage(p,'building',p.baseMultiplier*p.firstMultiplier);return;}
    let targets=[];
    if(p.splash){targets=alive.filter(v=>v.side!==p.side&&Math.abs(v.x-p.to)<=p.splash);this.effects.push({from:p.to,to:p.to,side:p.side,life:0.4,blast:true});}
    else if(p.pierce>1){const dir=p.side?-1:1;targets=alive.filter(v=>v.side!==p.side&&(v.x-p.from)*dir>=0&&(v.x-p.from)*dir<=p.range+EPS).sort((a,b)=>(a.x-b.x)*dir||a.id-b.id).slice(0,p.pierce);}
    else{const target=alive.find(v=>v.id===p.targetId&&v.side!==p.side);if(target)targets=[target];}
    targets.forEach(v=>{const vd=BY_ID[v.typeId],wall=vd.trait==='shieldWall'&&p.range>70&&!p.splash&&p.type!=='explosive';hits.push({id:v.id,side:p.side,amount:this.damage(p,vd.armor,p.firstMultiplier*(wall?0.8:1))});});
  }
  towers(alive,dt){
    this.sides.forEach((s,side)=>s.towers.forEach(t=>{
      if(!t)return;t.clock-=dt;const from=side?LENGTH:0,enemies=alive.filter(u=>u.side!==side&&Math.abs(u.x-from)<=270).sort((a,b)=>Math.abs(a.x-from)-Math.abs(b.x-from)||a.id-b.id);
      if(!enemies.length||t.clock>EPS)return;const target=enemies[0],duration=Math.max(STEP,Math.abs(target.x-from)/600);
      this.projectiles.push({id:this.nextId++,side,from,to:target.x,targetId:target.id,baseSide:null,damage:Math.round((t.kind?36:48)*(1+t.era*0.38)*(t.level===2?1.25:1)),type:t.kind?(t.era===4?'energy':t.era===3?'normal':'explosive'):(t.era===2?'normal':'piercing'),range:270,splash:t.kind?50:0,pierce:1,firstMultiplier:1,baseMultiplier:1,remaining:duration,duration});t.clock=1.5;
    }));
  }
  move(u,d,dir,dt,march,enemies){
    const previous=u.x;let next=u.x+dir*d.speed*dt*march*(u.slow>0?0.7:1);
    const obstacle=enemies.filter(v=>(v.x-u.x)*dir>=-EPS).sort((a,b)=>Math.abs(a.x-u.x)-Math.abs(b.x-u.x))[0];
    if(obstacle)next=dir>0?Math.min(next,Math.max(u.x,obstacle.x-20)):Math.max(next,Math.min(u.x,obstacle.x+20));
    u.x=Math.max(0,Math.min(LENGTH,next));u.status=Math.abs(u.x-previous)>EPS?'行进':'待命';
  }
  decide(){
    const dead=this.sides.map(s=>s.hp<=0);
    if(dead[0]&&dead[1])this.finish(null,'双方基地同时摧毁');
    else if(dead[0]||dead[1])this.finish(dead[0]?1:0,'基地被摧毁');
    else if(this.time+EPS>=this.rules.timeLimit){
      if(this.rules.objective==='survive')this.finish(0,'完成生存目标');
      else if(this.rules.objective==='destroy')this.finish(1,'未在时限内摧毁敌基地');
      else{const a=this.sides[0].hp/this.sides[0].maxHp,b=this.sides[1].hp/this.sides[1].maxHp;this.finish(a===b?null:a>b?0:1,this.rules.mode==='pvp'?'15 分钟时限':'20 分钟时限');}
    }
  }
  ai(dt){runAI(this,dt);}
  takeEvents(){const events=this.events;this.events=[];return events;}
  snapshot(){const state=copy(this);state.events=[];state.effects=[];return state;}
  static restore(raw){
    try{
      if(!raw||raw.version!==VERSION||raw.result||typeof raw.matchId!=='string'||raw.matchId.length>120)return null;
      const rules=resolveMode(raw.rules);if(JSON.stringify(rules)!==JSON.stringify(raw.rules))return null;
      const finite=n=>Number.isFinite(n),integer=n=>Number.isInteger(n),era=e=>integer(e)&&e>=rules.startEra&&e<=rules.maxEra;
      if(!finite(raw.time)||raw.time<0||raw.time>=rules.timeLimit||!integer(raw.nextId)||raw.nextId<1||!integer(raw.eventId)||raw.eventId<0||raw.difficulty!==rules.difficulty||!finite(raw.aiClock)||!integer(raw.seed)||raw.seed<0||raw.seed>0xffffffff)return null;
      if(!Array.isArray(raw.sides)||raw.sides.length!==2||!Array.isArray(raw.units)||raw.units.length>60||!Array.isArray(raw.strikes)||raw.strikes.length>6||!Array.isArray(raw.projectiles)||raw.projectiles.length>256)return null;
      const ids=new Set(),idValid=id=>{if(!integer(id)||id<1||id>=raw.nextId||ids.has(id))return false;ids.add(id);return true;};
      for(let side=0;side<2;side++){
        const s=raw.sides[side],maxHp=side?rules.enemyHp:3000;
        if(!s||!era(s.era)||![s.gold,s.xp,s.hp,s.cooldown].every(finite)||s.gold<0||s.xp<0||s.hp<=0||s.hp>maxHp||s.maxHp!==maxHp||s.cooldown<0||s.cooldown>60||!integer(s.kills)||s.kills<0||!integer(s.produced)||s.produced<0||s.highestEra!==s.era)return null;
        if(!integer(s.slots)||s.slots<1||s.slots>3||!Array.isArray(s.queue)||s.queue.length>5||!Array.isArray(s.towers)||s.towers.length!==3)return null;
        if(s.queue.some(q=>!q||!BY_ID[q.typeId]||!idValid(q.id)||!finite(q.remaining)||q.remaining<=0||q.remaining>BY_ID[q.typeId].train||q.paid!==BY_ID[q.typeId].cost||BY_ID[q.typeId].era>s.era))return null;
        if(s.towers.some((t,i)=>{if(!t)return false;if(i>=s.slots||!era(t.era)||t.era>s.era||![0,1].includes(t.kind)||![1,2].includes(t.level)||!finite(t.clock))return true;const cost=Math.ceil([180,240][t.kind]*ERAS[t.era].cost);return t.cost!==cost||t.paid!==cost+(t.level===2?Math.ceil(cost*0.6):0);}))return null;
      }
      if(raw.units.some(u=>{if(!u||!BY_ID[u.typeId]||!idValid(u.id)||![0,1].includes(u.side)||![u.hp,u.x,u.clock,u.shield,u.slow,u.warmup].every(finite)||u.hp<=0||u.hp>BY_ID[u.typeId].hp||u.x<0||u.x>LENGTH||u.shield<0||u.shield>BY_ID[u.typeId].hp*0.2||u.slow<0||u.slow>3||u.clock<0||u.warmup<0||typeof u.first!=='boolean'||typeof u.status!=='string'||u.status.length>12||BY_ID[u.typeId].era>raw.sides[u.side].era)return true;
        if(u.targetId!==null&&(!integer(u.targetId)||u.targetId<1||u.targetId>=raw.nextId))return true;
        const p=u.pending;return p!==null&&(!p||!['attack','heal'].includes(p.kind)||!finite(p.remaining)||p.remaining<=0||p.remaining>BY_ID[u.typeId].windup||p.kind==='attack'&&![null,0,1].includes(p.baseSide)||p.targetId!==null&&(!integer(p.targetId)||p.targetId<1||p.targetId>=raw.nextId));}))return null;
      if(raw.strikes.some(s=>!s||![0,1].includes(s.side)||!era(s.era)||![s.x,s.wait].every(finite)||s.x<0||s.x>LENGTH||s.wait<=0||s.wait>1||!integer(s.pulses)||s.pulses<1||s.pulses>3))return null;
      if(raw.projectiles.some(p=>!p||!idValid(p.id)||![0,1].includes(p.side)||![null,0,1].includes(p.baseSide)||p.baseSide===p.side||![p.from,p.to,p.damage,p.range,p.splash,p.remaining,p.duration,p.firstMultiplier,p.baseMultiplier].every(finite)||p.from<0||p.from>LENGTH||p.to<0||p.to>LENGTH||p.damage<=0||p.damage>10000||p.range<=0||p.range>300||p.splash<0||p.splash>105||![1,2].includes(p.pierce)||!ARMOR[p.type]||p.remaining<=0||p.remaining>p.duration||p.duration<=0||p.duration>LENGTH/600+STEP||![1,1.8].includes(p.firstMultiplier)||![1,1.5].includes(p.baseMultiplier)||p.baseSide===null&&(!integer(p.targetId)||p.targetId<1||p.targetId>=raw.nextId)))return null;
      const b=new Battle({mode:rules.mode,levelId:rules.levelId,difficulty:raw.difficulty,matchId:raw.matchId,seed:raw.seed});
      for(const key of ['time','nextId','eventId','aiClock','sides','units','projectiles','strikes'])b[key]=copy(raw[key]);
      if([0,1].some(side=>b.population(side)>30))return null;return b;
    }catch(e){return null;}
  }
}
module.exports={Battle,STEP,LENGTH};

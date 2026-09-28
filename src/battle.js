'use strict';
const {VERSION,ERAS,UNITS,BY_ID,ARMOR}=require('./data');
const STEP=1/30, LENGTH=1000;
class Battle {
  constructor(options={}) {
    this.version=VERSION; this.time=0; this.result=null; this.nextId=1; this.units=[]; this.effects=[]; this.strikes=[];
    this.difficulty=['easy','normal','hard'].includes(options.difficulty)?options.difficulty:'normal';
    this.aiClock=0; this.seed=options.seed||12345; this.events=[];
    this.sides=[0,1].map(()=>({gold:200,xp:0,era:0,hp:3000,maxHp:3000,queue:[],slots:1,towers:[null,null,null],cooldown:60,kills:0}));
  }
  random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
  population(side){return this.units.filter(u=>u.side===side).reduce((n,u)=>n+BY_ID[u.typeId].pop,0)+this.sides[side].queue.reduce((n,q)=>n+BY_ID[q.typeId].pop,0);}
  command(side,cmd){
    if(this.result)return '对局已经结束';
    if(!Number.isInteger(side)||side<0||side>1||!cmd)return '无效指令';
    const s=this.sides[side];
    if(cmd.type==='train'){
      const d=BY_ID[cmd.id];
      if(!d||d.era!==s.era)return '只能生产当前时代的兵种';
      if(s.gold<d.cost)return '金币不足';
      if(s.queue.length>=5)return '生产队列已满';
      if(this.population(side)+d.pop>30)return '人口已满';
      s.gold-=d.cost;s.queue.push({id:this.nextId++,typeId:d.id,remaining:d.train,paid:d.cost});
    } else if(cmd.type==='cancel'){
      const i=s.queue.findIndex(q=>q.id===cmd.id);if(i<0)return '队列已发生变化';
      s.gold+=Math.floor(s.queue[i].paid*(i===0?0.75:1));s.queue.splice(i,1);
    } else if(cmd.type==='evolve'){
      if(s.era===4)return '已经到达最后时代';
      if(s.xp<ERAS[s.era+1].xp)return '进化经验不足';
      s.era++;
    } else if(cmd.type==='skill'){
      if(s.cooldown>0)return '技能尚未冷却';
      if(!Number.isFinite(cmd.x)||cmd.x<0||cmd.x>LENGTH)return '请选择战场内的落点';
      s.cooldown=60;this.strikes.push({side,x:cmd.x,era:s.era,wait:1,pulses:s.era===1?3:1});
    } else if(cmd.type==='unlock'){
      if(s.slots===3)return '塔位全部开放';
      const cost=[0,200,350][s.slots];if(s.gold<cost)return '金币不足';
      s.gold-=cost;s.slots++;
    } else if(['build','upgrade','sell'].includes(cmd.type)){
      const i=cmd.slot;if(!Number.isInteger(i)||i<0||i>=s.slots)return '塔位未开放';
      const t=s.towers[i];
      if(cmd.type==='build'){
        if(t)return '请先出售原防御塔';
        if(cmd.kind!==0&&cmd.kind!==1)return '无效防御塔类型';
        const cost=Math.ceil([180,240][cmd.kind]*ERAS[s.era].cost);if(s.gold<cost)return '金币不足';
        s.gold-=cost;s.towers[i]={era:s.era,kind:cmd.kind,level:1,cost,paid:cost,clock:0};
      }else if(cmd.type==='upgrade'){
        if(!t||t.level>=2)return '无法升级';const cost=Math.ceil(t.cost*0.6);if(s.gold<cost)return '金币不足';
        s.gold-=cost;t.paid+=cost;t.level=2;
      }else{if(!t)return '空塔位';s.gold+=Math.floor(t.paid*0.5);s.towers[i]=null;}
    } else if(cmd.type==='surrender'){this.finish(1-side,'投降');}
    else return '未知指令';
    return null;
  }
  spawn(side,id){
    const d=BY_ID[id],u={id:this.nextId++,typeId:id,side,x:side?LENGTH:0,hp:d.hp,shield:d.trait==='shield'?d.hp*0.2:0,clock:0,first:true,warmup:0,slow:0};
    this.units.push(u);return u;
  }
  finish(winner,reason){if(!this.result)this.result={winner,reason,time:this.time,version:this.version};}
  damage(d,armor,multiplier=1){return Math.max(1,Math.round(d.damage*ARMOR[d.type][armor]*multiplier));}
  tick(dt=STEP,ai=true){
    if(this.result)return;
    // 固定步长由运行器保证；拒绝不合法时间以免污染存档。
    if(!Number.isFinite(dt)||dt<=0||dt>0.1)throw new Error('Invalid simulation step');
    this.time+=dt;this.events=[];
    this.effects=this.effects.filter(e=>(e.life-=dt)>0);
    this.sides.forEach((s,side)=>{
      s.gold+=8*ERAS[s.era].cost*dt;s.xp+=4*dt;s.cooldown=Math.max(0,s.cooldown-dt);
      if(s.queue.length){s.queue[0].remaining-=dt;if(s.queue[0].remaining<=0)this.spawn(side,s.queue.shift().typeId);}
    });
    if(ai)this.ai(dt);
    const hits=[],heals=[],baseDamage=[0,0];
    const alive=this.units.slice();
    // 所有本步行动基于同一批存活实体；统一扣血后裁决，支持同时摧毁。
    alive.forEach(u=>{
      const d=BY_ID[u.typeId],dir=u.side?-1:1;
      u.clock-=dt;u.slow=Math.max(0,u.slow-dt);
      const allies=alive.filter(v=>v.side===u.side&&v.id!==u.id);
      const enemies=alive.filter(v=>v.side!==u.side).sort((a,b)=>Math.abs(a.x-u.x)-Math.abs(b.x-u.x)||a.id-b.id);
      const inRange=enemies.filter(v=>Math.abs(v.x-u.x)<=d.range);
      let target=inRange[0];
      if(d.trait==='sniper')target=inRange.find(v=>BY_ID[v.typeId].support)||target;
      const haste=allies.some(v=>BY_ID[v.typeId].trait==='haste'&&Math.abs(v.x-u.x)<=130)?1.15:1;
      const march=allies.some(v=>BY_ID[v.typeId].trait==='march'&&Math.abs(v.x-u.x)<=140)?1.2:1;
      if(d.support){
        const recipients=allies.filter(v=>{
          const vd=BY_ID[v.typeId];return Math.abs(v.x-u.x)<=d.range&&v.hp<vd.hp&&(d.trait==='repair'?(vd.mechanical||vd.powerArmor):!vd.mechanical);
        }).sort((a,b)=>a.hp/BY_ID[a.typeId].hp-b.hp/BY_ID[b.typeId].hp||a.id-b.id);
        if(['heal','heal3','repair'].includes(d.trait)&&recipients.length&&u.clock<=0){
          recipients.slice(0,d.trait==='heal3'?3:1).forEach(v=>heals.push({id:v.id,amount:d.damage}));u.clock=d.interval;
        }
        const front=allies.filter(v=>!BY_ID[v.typeId].support&&(v.x-u.x)*dir>70);
        if(front.length&&(!enemies[0]||Math.abs(enemies[0].x-u.x)>90))this.move(u,d,dir,dt,march,enemies);
        return;
      }
      if(target){
        u.warmup+=dt;
        if(u.clock<=0&&(d.trait!=='warmup'||u.warmup>=0.8)){
          let targets=[target];
          if(/splash/i.test(d.trait))targets=enemies.filter(v=>Math.abs(v.x-target.x)<=48);
          if(d.trait==='rail')targets=inRange.slice(0,2);
          targets.forEach(v=>{const vd=BY_ID[v.typeId];let mult=d.trait==='charge'&&u.first?1.8:1;
            if(vd.trait==='shieldWall'&&d.range>70&&!/splash/i.test(d.trait)&&d.type!=='explosive')mult*=0.8;
            hits.push({id:v.id,side:u.side,amount:this.damage(d,vd.armor,mult)});
          });
          this.effects.push({from:u.x,to:target.x,side:u.side,life:0.18});u.first=false;u.clock=d.interval/haste;
        }
      }else{
        u.warmup=0;
        const baseX=u.side?0:LENGTH;
        const blocking=enemies.some(v=>(v.x-u.x)*dir>=-1&&(baseX-v.x)*dir>=0);
        if(Math.abs(baseX-u.x)<=d.range&&!blocking){
          if(u.clock<=0){baseDamage[1-u.side]+=this.damage(d,'building',/base/i.test(d.trait)?1.5:1);u.clock=d.interval/haste;u.first=false;}
        }else this.move(u,d,dir,dt,march,enemies);
      }
    });
    this.sides.forEach((s,side)=>s.towers.forEach(t=>{
      if(!t)return;t.clock-=dt;const x=side?LENGTH:0;
      const enemies=alive.filter(u=>u.side!==side&&Math.abs(u.x-x)<=270).sort((a,b)=>Math.abs(a.x-x)-Math.abs(b.x-x)||a.id-b.id);
      if(!enemies.length||t.clock>0)return;
      const d={damage:Math.round((t.kind?36:48)*(1+t.era*0.38)*(t.level===2?1.25:1)),type:t.kind?(t.era===4?'energy':t.era===3?'normal':'explosive'):(t.era===2?'normal':'piercing')};
      (t.kind?enemies.filter(u=>Math.abs(u.x-enemies[0].x)<=50):enemies.slice(0,1)).forEach(u=>hits.push({id:u.id,side,amount:this.damage(d,BY_ID[u.typeId].armor)}));
      this.effects.push({from:x,to:enemies[0].x,side,life:0.2});t.clock=1.5;
    }));
    this.strikes.forEach(s=>{
      s.wait-=dt;if(s.wait>0)return;
      const d={damage:(s.era===1?60:150)*(1+s.era*0.38),type:['explosive','normal','explosive','piercing','energy'][s.era]};
      alive.filter(u=>u.side!==s.side&&Math.abs(u.x-s.x)<=105).forEach(u=>{hits.push({id:u.id,side:s.side,amount:this.damage(d,BY_ID[u.typeId].armor)});if(s.era===4)u.slow=3;});
      this.effects.push({from:s.x,to:s.x,side:s.side,life:0.4,blast:true});s.pulses--;s.wait=0.4;
    });this.strikes=this.strikes.filter(s=>s.pulses>0);
    hits.forEach(h=>{const u=alive.find(v=>v.id===h.id);const absorb=Math.min(u.shield,h.amount);u.shield-=absorb;u.hp-=h.amount-absorb;});
    // 已被本步击杀的目标不会被治疗复活。
    heals.forEach(h=>{const u=alive.find(v=>v.id===h.id);if(u.hp>0)u.hp=Math.min(BY_ID[u.typeId].hp,u.hp+h.amount);});
    this.units=alive.filter(u=>{
      if(u.hp>0)return true;const d=BY_ID[u.typeId],s=this.sides[1-u.side];s.gold+=Math.floor(d.cost*0.2);s.xp+=Math.floor(d.cost*0.3);s.kills++;return false;
    });
    this.sides.forEach((s,i)=>{s.hp=Math.max(0,s.hp-baseDamage[i]);});
    const dead=this.sides.map(s=>s.hp<=0);
    if(dead[0]&&dead[1])this.finish(null,'双方基地同时摧毁');
    else if(dead[0]||dead[1])this.finish(dead[0]?1:0,'基地被摧毁');
    else if(this.time>=1200){const a=this.sides[0].hp/3000,b=this.sides[1].hp/3000;this.finish(a===b?null:a>b?0:1,'20 分钟时限');}
  }
  move(u,d,dir,dt,march,enemies){
    let next=u.x+dir*d.speed*dt*march*(u.slow>0?0.7:1);
    const obstacle=enemies.find(v=>(v.x-u.x)*dir>=0);
    if(obstacle)next=dir>0?Math.min(next,Math.max(u.x,obstacle.x-20)):Math.max(next,Math.min(u.x,obstacle.x+20));
    u.x=Math.max(0,Math.min(LENGTH,next));
  }
  ai(dt){
    this.aiClock-=dt;if(this.aiClock>0)return;
    this.aiClock={easy:3,normal:1.5,hard:0.75}[this.difficulty];
    const s=this.sides[1],enemies=this.units.filter(u=>u.side===0);
    if(s.era<4&&s.xp>=ERAS[s.era+1].xp+(this.difficulty==='easy'?150:0))this.command(1,{type:'evolve'});
    const danger=enemies.filter(u=>u.x>720);
    if(s.cooldown<=0&&danger.length>=2)this.command(1,{type:'skill',x:danger.reduce((a,u)=>a+u.x,0)/danger.length});
    if(danger.length>=3&&!s.towers[0]&&s.gold>300)this.command(1,{type:'build',slot:0,kind:0});
    if(s.queue.length>=2)return;
    const army=this.units.filter(u=>u.side===1),roster=UNITS.filter(u=>u.era===s.era);
    const options=roster.filter(u=>u.cost<=s.gold&&this.population(1)+u.pop<=30&&(!u.support||army.length>=3));
    const heavy=enemies.some(u=>BY_ID[u.typeId].armor==='heavy');
    const weights=options.map(u=>u.support?0.6:u.type==='piercing'&&heavy?4:u.range<100?3:u.type==='siege'&&enemies.length<3?3:2);
    let choice=this.random()*weights.reduce((a,b)=>a+b,0);
    for(let i=0;i<options.length;i++){choice-=weights[i];if(choice<=0){this.command(1,{type:'train',id:options[i].id});break;}}
  }
  snapshot(){return JSON.parse(JSON.stringify(this));}
  static restore(raw){
    // 本地存档属于不可信输入：校验后只恢复模型字段，拒绝旧版或残缺快照。
    try {
      if(!raw||raw.version!==VERSION||raw.result)return null;
      if(!Number.isFinite(raw.time)||raw.time<0||raw.time>=1200||!Number.isInteger(raw.nextId)||raw.nextId<1)return null;
      if(!['easy','normal','hard'].includes(raw.difficulty)||!Number.isFinite(raw.aiClock)||!Number.isInteger(raw.seed))return null;
      if(!Array.isArray(raw.sides)||raw.sides.length!==2||!Array.isArray(raw.units)||!Array.isArray(raw.strikes))return null;
      const eraValid=e=>Number.isInteger(e)&&e>=0&&e<=4;
      const ids=new Set();const idValid=id=>{if(!Number.isInteger(id)||id<1||id>=raw.nextId||ids.has(id))return false;ids.add(id);return true;};
      for(const s of raw.sides){
        if(!eraValid(s.era)||![s.gold,s.xp,s.hp,s.cooldown,s.kills].every(Number.isFinite)||s.hp<=0||s.hp>3000||s.maxHp!==3000||s.gold<0||s.xp<0||s.cooldown<0||s.cooldown>60)return null;
        if(!Number.isInteger(s.slots)||s.slots<1||s.slots>3||!Array.isArray(s.queue)||s.queue.length>5||!Array.isArray(s.towers)||s.towers.length!==3)return null;
        if(s.queue.some(q=>!q||!BY_ID[q.typeId]||!idValid(q.id)||!Number.isFinite(q.remaining)||q.remaining<=0||q.remaining>BY_ID[q.typeId].train||q.paid!==BY_ID[q.typeId].cost||BY_ID[q.typeId].era>s.era))return null;
        if(s.towers.some((t,i)=>t&&(i>=s.slots||!eraValid(t.era)||t.era>s.era||![0,1].includes(t.kind)||![1,2].includes(t.level)||![t.cost,t.paid,t.clock].every(Number.isFinite)||t.cost<=0||t.paid<t.cost)))return null;
      }
      if(raw.units.some(u=>!u||!BY_ID[u.typeId]||!idValid(u.id)||![0,1].includes(u.side)||![u.hp,u.x,u.clock,u.shield,u.slow,u.warmup].every(Number.isFinite)||u.hp<=0||u.hp>BY_ID[u.typeId].hp||u.x<0||u.x>LENGTH||u.shield<0||typeof u.first!=='boolean'))return null;
      if(raw.strikes.some(s=>!s||![0,1].includes(s.side)||!eraValid(s.era)||![s.x,s.wait].every(Number.isFinite)||s.x<0||s.x>LENGTH||s.wait<=0||s.wait>1||!Number.isInteger(s.pulses)||s.pulses<1||s.pulses>3))return null;
      const b=new Battle();
      for(const key of ['time','nextId','difficulty','aiClock','seed','sides','units','strikes'])b[key]=JSON.parse(JSON.stringify(raw[key]));
      if([0,1].some(side=>b.population(side)>30))return null;
      return b;
    } catch(e){return null;}
  }
}
module.exports={Battle,STEP,LENGTH};

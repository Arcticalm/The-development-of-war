'use strict';
const {BY_ID}=require('../data');
const hitAsset=(p,victim)=>p.type==='energy'?'hit_energy':p.type==='explosive'||p.splash||p.splashRadius?'hit_explosion':victim&&(BY_ID[victim.typeId].armor==='heavy'||BY_ID[victim.typeId].mechanical)?'hit_metal':'hit_dust';
/** Read-only presentation history. All animation ages use ViewState.time. */
class BattleEffects {
  constructor(){this.reset(null);}
  reset(matchId){this.matchId=matchId;this.previous=null;this.items=[];this.seen=new Map();}
  add(item,now){
    if(item.end<=now||this.seen.has(item.key))return;
    this.seen.set(item.key,item.end);this.items.push(item);
    if(this.items.length>32){const i=this.items.findIndex(e=>e.kind!=='skill');this.items.splice(i<0?0:i,1);}
  }
  sync(view){
    const now=view.time;
    if(this.matchId!==view.matchId||this.previous&&now<this.previous.time)this.reset(view.matchId);
    this.items=this.items.filter(e=>e.end>now);for(const [key,end]of this.seen)if(end<=now)this.seen.delete(key);
    for(const s of view.strikes){
      const total=s.era===1?3:1,pulse=total-s.pulses,elapsed=pulse===0?1-s.wait:1+(pulse-1)*.4+.4-s.wait,start=now-elapsed;
      this.add({key:'skill:'+s.side+':'+s.x+':'+s.era+':'+start.toFixed(4),kind:'skill',asset:'skill_age'+(s.era+1),side:s.side,x:s.x,start,end:start+1+total*.4},now);
    }
    const previous=this.previous,units=new Map(view.units.map(u=>[u.id,u])),touched=new Set();
    if(previous&&now>previous.time){
      const liveProjectiles=new Set(view.projectiles.map(p=>p.id)),dt=now-previous.time;
      for(const p of previous.projectiles){
        if(liveProjectiles.has(p.id)||p.remaining>dt+1e-6)continue;
        const victim=units.get(p.targetId)||previous.units.find(u=>u.id===p.targetId);
        if(p.baseSide===null&&!victim&&!p.splash)continue;
        if(victim)touched.add(victim.id);
        const start=previous.time+p.remaining;
        this.add({key:'projectile:'+p.id,kind:'hit',asset:hitAsset(p,victim),side:p.side,x:p.baseSide!==null?(p.side?0:1000):victim?victim.x:p.to,start,end:start+.3},now);
      }
      for(const u of previous.units){
        const current=units.get(u.id);
        if(touched.has(u.id)||current&&current.hp+current.shield>=u.hp+u.shield)continue;
        const x=current?current.x:u.x;
        // Model effects already describe splash impacts; avoid a spark per victim.
        if(view.effects.some(e=>e.side!==u.side&&Math.abs(e.to-x)<=105))continue;
        const attacker=previous.units.filter(v=>v.side!==u.side&&!BY_ID[v.typeId].support&&Math.abs(v.x-u.x)<=BY_ID[v.typeId].range+20).sort((a,b)=>Math.abs(a.x-u.x)-Math.abs(b.x-u.x))[0];
        const d=attacker?BY_ID[attacker.typeId]:{type:'normal'};
        this.add({key:'hurt:'+u.id+':'+now,kind:'hit',asset:hitAsset(d,u),side:1-u.side,x,start:now,end:now+.3},now);
      }
    }
    for(const e of view.effects){
      if(this.items.some(item=>item.side===e.side&&Math.abs(item.x-e.to)<1e-6&&item.start<=now&&item.end>now))continue;
      const end=now+e.life;
      this.add({key:'blast:'+e.side+':'+e.to+':'+end.toFixed(4),kind:'hit',asset:'hit_explosion',side:e.side,x:e.to,start:end-.4,end},now);
    }
    // A stalled renderer must not accumulate identities from expired events.
    if(this.seen.size>64)this.seen=new Map(Array.from(this.seen).slice(-64));
    this.previous={time:now,units:view.units.map(u=>({...u})),projectiles:view.projectiles.map(p=>({...p}))};
    return this.items;
  }
  frame(item,time){
    const age=Math.max(0,time-item.start);
    return item.kind==='skill'?(age<1?0:(age-1)%.4<.2?1:2):Math.min(2,Math.floor(age/(item.end-item.start)*3));
  }
  draw(renderer,view){
    this.sync(view);
    for(const item of this.items){
      const x=100+item.x*1.08,frame=this.frame(item,view.time),size=item.kind==='skill'?228:64;
      if(!renderer.effectImage(item.asset,frame,x,456,size)){
        const age=view.time-item.start;if(item.kind==='skill'&&age<1)continue;
        renderer.painter.circle(x,448,item.kind==='skill'?26:9,item.side?renderer.colors.redLight:renderer.colors.goldLight);
      }
    }
  }
}
module.exports={BattleEffects,hitAsset};

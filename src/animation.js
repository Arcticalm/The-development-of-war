'use strict';
const {BY_ID}=require('./data');
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
// 表现状态只存在于渲染器中，不进入战斗模型、随机数或存档。
class BattleAnimation {
  constructor(){this.reset(null);}
  reset(battle){this.battle=battle;this.time=battle?battle.time:0;this.units=new Map();this.fallen=[];this.shake=0;this.zoom=1;}
  update(battle){
    if(this.battle!==battle)this.reset(battle);
    const dt=clamp(battle.time-this.time,0,0.25);this.time=battle.time;
    const live=new Set();let impact=0;
    for(const u of battle.units){
      live.add(u.id);const d=BY_ID[u.typeId];let s=this.units.get(u.id);
      if(!s){s={...u,moving:false,attackAt:-100,hurtAt:-100,healAt:-100,spawnAt:this.time};this.units.set(u.id,s);}
      else if(dt>0){
        s.moving=Math.abs(u.x-s.x)>0.01;
        if(u.clock>s.clock+0.1){s.attackAt=this.time;impact=Math.max(impact,d.pop===3&&!d.support?1.4:0);}
        if(u.hp<s.hp||u.shield<s.shield){s.hurtAt=this.time;impact=Math.max(impact,d.pop===3?1:0.35);}
        if(u.hp>s.hp)s.healAt=this.time;
        Object.assign(s,u);
      }
    }
    for(const [id,s] of this.units){if(!live.has(id)){this.fallen.push({...s,deathAt:this.time});this.units.delete(id);}}
    this.fallen=this.fallen.filter(s=>this.time-s.deathAt<0.65);
    this.shake=Math.max(this.shake*Math.exp(-dt*13),impact);
    const engaged=battle.units.some(u=>{const s=this.units.get(u.id);return this.time-s.attackAt<0.5&&!BY_ID[u.typeId].support;});
    this.zoom+=(engaged?1.025-this.zoom:1-this.zoom)*(1-Math.exp(-dt*3));
    return this;
  }
  camera(){return{zoom:this.zoom,x:Math.sin(this.time*83)*this.shake*1.6,y:Math.cos(this.time*67)*this.shake*0.7};}
  pose(u){
    const s=this.units.get(u.id)||u,d=BY_ID[u.typeId],t=this.time;
    const mounted=/chariot|age1_heavy/.test(d.id),machine=d.mechanical||d.id==='age5_siege',heavy=d.pop===3;
    const frequency=mounted?11:machine?17:heavy?7:10;
    const phase=t*frequency+u.id*2.399,step=s.moving?Math.sin(phase):0;
    const age=t-s.attackAt,attack=age>=0&&age<0.48?Math.sin(Math.PI*age/0.48):0;
    const hurt=clamp(1-(t-s.hurtAt)/0.24,0,1),healing=clamp(1-(t-s.healAt)/0.6,0,1);
    const supportPulse=d.support&&(d.trait==='haste'||d.trait==='march')?Math.sin(t*9+u.id):0;
    const melee=!d.support&&d.range<=70;
    return{moving:s.moving,machine,mounted,step,attack,hurt,healing,
      bob:s.moving?Math.abs(step)*(machine?0.9:mounted?3.5:heavy?1.8:3):Math.sin(t*2.7+u.id)*0.65,
      tilt:step*(machine?0.007:mounted?0.02:0.035)+(melee?0.16:-0.065)*attack+supportPulse*0.025-hurt*0.09,
      lunge:(melee?7:d.support?2.5:-4)*attack-hurt*3,
      stride:machine||mounted?0:step*(heavy?2:3.5),
      spawn:clamp((t-s.spawnAt)/0.3,0,1),
      flash:!d.support&&age>=0&&age<0.12,
      supporting:d.support&&(attack>0||supportPulse!==0)};
  }
}
module.exports={BattleAnimation};

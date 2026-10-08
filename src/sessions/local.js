'use strict';
const {Battle,STEP,LENGTH}=require('../battle');
const {BY_ID}=require('../data');
const clone=v=>JSON.parse(JSON.stringify(v));
/**
 * @typedef {{commandId:string,status:'accepted'|'rejected'|'pending',errorCode?:string,message?:string}} CommandResult
 * @typedef {{canPause:boolean,canSaveLocally:boolean}} SessionCapabilities
 * 界面只读取 getViewState；后续远端会话沿用同一组方法。
 */
class LocalBattleSession {
  constructor(options={}){
    this.model=options.snapshot?Battle.restore(options.snapshot):new Battle(options);
    if(!this.model)throw new Error('Invalid battle snapshot');
    if(this.model.rules.mode==='pvp')throw new Error('PvP requires a remote session');
    this.capabilities={canPause:true,canSaveLocally:true};this.paused=!!options.snapshot;this.disposed=false;
    this.accumulator=0;this.sequence=0;this.responses=new Map();this.events=[];
  }
  /** @returns {CommandResult} commandId 可用于重试，重复指令不重复扣费。 */
  sendCommand(command,commandId){
    const id=commandId||this.model.matchId+':'+(++this.sequence);
    if(this.responses.has(id))return {...this.responses.get(id)};
    const message=this.disposed?'对局已关闭':!command?'无效指令':this.paused&&command.type!=='surrender'?'对局已暂停':this.model.command(0,command);
    const result=message?{commandId:id,status:'rejected',errorCode:'COMMAND_REJECTED',message}:{commandId:id,status:'accepted'};
    this.responses.set(id,result);
    this.events.push(...this.model.takeEvents());return {...result};
  }
  update(elapsed){
    if(this.disposed||this.paused||this.model.result){this.accumulator=0;return;}
    if(!Number.isFinite(elapsed)||elapsed<0)return;
    this.accumulator+=Math.min(elapsed,0.25);
    while(this.accumulator+1e-9>=STEP){this.model.tick(STEP);this.accumulator=Math.max(0,this.accumulator-STEP);this.events.push(...this.model.takeEvents());if(this.model.result){this.accumulator=0;break;}}
  }
  getViewState(viewerSide=0){
    if(viewerSide!==0&&viewerSide!==1)throw new Error('Invalid viewer side');
    const b=this.model,own=b.sides[viewerSide],enemy=b.sides[1-viewerSide];
    const mirror=x=>viewerSide?LENGTH-x:x;
    const result=clone(b.result);if(result&&viewerSide)result.winner=result.winner===null?null:1-result.winner;
    if(result&&viewerSide)result.stats.reverse();
    return {version:b.version,matchId:b.matchId,rules:clone(b.rules),time:b.time,result,
      population:b.population(viewerSide),livingPopulation:b.units.filter(u=>u.side===viewerSide).reduce((n,u)=>n+BY_ID[u.typeId].pop,0),
      sides:[clone(own),{hp:enemy.hp,maxHp:enemy.maxHp,era:enemy.era,slots:enemy.slots,towers:clone(enemy.towers)}],
      units:b.units.map(u=>({...clone(u),x:mirror(u.x),side:u.side===viewerSide?0:1})),
      projectiles:b.projectiles.map(p=>({...clone(p),from:mirror(p.from),to:mirror(p.to),side:p.side===viewerSide?0:1})),
      strikes:b.strikes.map(s=>({...s,x:mirror(s.x),side:s.side===viewerSide?0:1})),effects:b.effects.map(e=>({...e,from:mirror(e.from),to:mirror(e.to),side:e.side===viewerSide?0:1}))};
  }
  drainEvents(){const events=this.events;this.events=[];return events;}
  pause(){if(this.capabilities.canPause){this.paused=true;this.accumulator=0;}}
  resume(){this.paused=false;this.accumulator=0;}
  snapshot(){return this.model.snapshot();}
  dispose(){this.disposed=true;this.accumulator=0;this.events=[];this.responses.clear();}
}
module.exports={LocalBattleSession};

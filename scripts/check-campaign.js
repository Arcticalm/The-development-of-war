'use strict';
// 无特权玩家：只读取状态并提交合法指令，用于验证关卡可完成。
const {Battle,STEP}=require('../src/battle');
const {UNITS,BY_ID,ERAS}=require('../src/data');
const {LEVELS}=require('../src/config/modes');
const STRATEGIES={'1-2':'heavy','2-1':'siege','2-3':'siege','3-3':'siege','5-2':'siege'};
function player(b,strategy){
  const s=b.sides[0],army=b.units.filter(u=>u.side===0),enemies=b.units.filter(u=>u.side===1),roster=UNITS.filter(d=>d.era===s.era);
  if(s.era<b.rules.maxEra&&s.xp>=ERAS[s.era+1].xp)b.command(0,{type:'evolve'});
  if(s.era!==roster[0].era)return;
  if(s.cooldown<=1e-8&&enemies.length>=2){
    const best=enemies.slice().sort((a,z)=>enemies.filter(u=>Math.abs(u.x-z.x)<100).length-enemies.filter(u=>Math.abs(u.x-a.x)<100).length)[0];
    b.command(0,{type:'skill',x:best.x});
  }
  const danger=enemies.filter(u=>u.x<350);
  if(danger.length>=2){
    const heavy=danger.some(u=>BY_ID[u.typeId].armor==='heavy');
    for(let i=0;i<s.slots;i++){
      if(!s.towers[i]&&s.gold>=Math.ceil((heavy?180:240)*ERAS[s.era].cost))b.command(0,{type:'build',slot:i,kind:heavy?0:1});
      else if(s.towers[i]&&s.towers[i].level===1&&s.gold>=Math.ceil(s.towers[i].cost*0.6))b.command(0,{type:'upgrade',slot:i});
    }
    if(s.hp<1500&&s.slots<3&&s.gold>400)b.command(0,{type:'unlock'});
  }
  if(s.queue.length>=2)return;
  const all=[...army,...s.queue.map(q=>({typeId:q.typeId}))],fronts=all.filter(u=>{const d=BY_ID[u.typeId];return d.range<=70||d.armor==='heavy';}),supports=all.filter(u=>BY_ID[u.typeId].support);
  let desired;
  if(strategy==='heavy')desired=roster[2];
  else if(fronts.length<Math.max(1,Math.ceil(all.length/4)))desired=s.era===2?roster[0]:roster[2];
  else if(all.length>=5&&supports.length===0)desired=roster[5];
  else if(strategy==='siege')desired=roster.find(d=>d.type==='siege')||roster[4];
  else if(enemies.some(u=>BY_ID[u.typeId].armor==='heavy'))desired=roster.find(d=>d.type==='piercing')||roster[1];
  else if(enemies.length>=3)desired=roster.find(d=>d.splashRadius)||roster[1];
  else desired=roster[1];
  if(desired&&s.gold>=desired.cost&&b.population(0)+desired.pop<=30)b.command(0,{type:'train',id:desired.id});
}
function simulate(level,strategy=STRATEGIES[level.id]||'balanced',seed=42){
  const b=new Battle({mode:'campaign',levelId:level.id,seed,matchId:'check-'+level.id});
  for(let i=0;i<Math.ceil(level.timeLimit/STEP)+2&&!b.result;i++){
    if(i%15===0)player(b,strategy);b.tick(STEP);
    if(i%900===0){
      if(b.sides.some(s=>s.gold<0)||[0,1].some(side=>b.population(side)>30))throw new Error('Economy invariant');
      if(!b.result&&!Battle.restore(b.snapshot()))throw new Error('Unrestorable '+level.id);
    }
  }
  return b.result;
}
if(require.main===module){
  let failed=0;
  for(const level of LEVELS){
    const strategy=STRATEGIES[level.id]||'balanced',result=simulate(level,strategy);
    if(!result||result.winner!==0)failed++;
    console.log(JSON.stringify({level:level.id,win:!!result&&result.winner===0,seconds:result&&Math.round(result.time),reason:result&&result.reason,strategy,seed:42}));
  }
  process.exitCode=failed?1:0;
}
module.exports={simulate,player};

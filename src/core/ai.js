'use strict';
const {ERAS,UNITS,BY_ID}=require('../data');
const PROFILES={melee:{melee:6,range:2},beast:{heavy:7,melee:2},tribe:{melee:4,range:4,heavy:2},phalanx:{heavy:5,range:4},fort:{melee:4,range:4},volley:{chariot:5,range:6,melee:3},crowd:{melee:7,range:4},artillery:{range:5,heavy:3,melee:3},armor:{heavy:5,vehicle:5,melee:3},medical:{heavy:5,support:4,melee:3},pressure:{melee:5,rocket:4,vehicle:4},energy:{heavy:5,range:5,melee:2},repair:{heavy:5,support:4,siege:2}};
/** AI 只产生与玩家相同的合法指令，不直接添加资源或实体。 */
function runAI(b,dt){
  b.aiClock-=dt;if(b.aiClock>0)return;
  b.aiClock={easy:3,normal:1.5,hard:0.75}[b.difficulty];
  const s=b.sides[1],enemies=b.units.filter(u=>u.side===0);
  if(s.era<b.rules.maxEra&&s.xp>=ERAS[s.era+1].xp+(b.difficulty==='easy'?150:0))b.command(1,{type:'evolve'});
  const danger=enemies.filter(u=>u.x>720);
  if(s.cooldown<=0&&danger.length>=2)b.command(1,{type:'skill',x:danger.reduce((n,u)=>n+u.x,0)/danger.length});
  const fort=['fort','artillery','repair'].includes(b.rules.strategy);
  if(b.rules.buildTowers&&!s.towers[0]&&(danger.length>=3||fort)&&s.gold>=Math.ceil(180*ERAS[s.era].cost))b.command(1,{type:'build',slot:0,kind:0});
  if(s.queue.length>=2)return;
  if(b.rules.wave&&b.time%b.rules.wave.period>=b.rules.wave.active)return;
  // 留出补线间隔，机枪阵地需要先完成预热。
  if(b.rules.strategy==='phalanx'&&b.time%12>8)return;
  const army=b.units.filter(u=>u.side===1),roster=UNITS.filter(u=>u.era===s.era);
  let options=roster.filter(u=>u.cost<=s.gold&&b.population(1)+u.pop<=30&&(!u.support||army.filter(a=>!BY_ID[a.typeId].support).length>=3));
  if(b.rules.strategy==='beast'&&s.gold<roster[2].cost&&army.length>=1)return;
  if(b.rules.strategy==='tribe'&&b.time<90)options=options.filter(u=>u.id.split('_')[1]!=='heavy');
  const heavy=enemies.some(u=>BY_ID[u.typeId].armor==='heavy'),profile=PROFILES[b.rules.strategy];
  if(profile)options=options.filter(u=>profile[u.id.split('_')[1]]);
  const weights=options.map(u=>profile?profile[u.id.split('_')[1]]:u.support?0.6:u.type==='piercing'&&heavy?4:u.range<100?3:u.type==='siege'&&enemies.length<3?3:2);
  let choice=b.random()*weights.reduce((a,w)=>a+w,0);
  for(let i=0;i<options.length;i++){choice-=weights[i];if(choice<=0){b.command(1,{type:'train',id:options[i].id});break;}}
}
module.exports={runAI};

'use strict';
// 原型数值，待平衡验证；配置版本固定于开局。
const VERSION = 'prototype-0.1';
const ERAS = [
  ['原始时代',0,1,'落石冲击','骨矛塔','投石塔'],
  ['古典文明时代',300,1.2,'箭雨覆盖','重弩塔','火油塔'],
  ['火药时代',900,1.45,'炮火轰击','连发枪塔','榴弹塔'],
  ['现代战争时代',1800,1.75,'定点空袭','反装甲导弹塔','机枪阵列'],
  ['未来科技时代',3000,2.1,'电磁震荡','磁轨塔','等离子塔']
].map((r,i)=>({id:i,name:r[0],xp:r[1],cost:r[2],skill:r[3],towers:r.slice(4)}));
// 后缀、名称、费用档、人口、护甲、伤害类型、HP、伤害、射程、间隔、移速、特性。
const rows = [
  ['melee','石棒战士',0,1,'light','normal',210,23,25,1,30,''],
  ['range','投石猎手',1,1,'light','normal',105,31,150,1.5,26,''],
  ['heavy','猛犸骑手',2,3,'heavy','normal',700,58,35,1.8,19,'base'],
  ['spear','骨矛猎手',1,1,'light','piercing',145,32,65,1.3,28,''],
  ['fire','火罐投手',2,2,'light','explosive',130,45,135,2,23,'splashBase'],
  ['support','图腾鼓手',1,1,'light','normal',155,0,130,1,25,'haste'],
  ['melee','剑盾士兵',0,1,'light','normal',230,25,25,1,30,'shieldWall'],
  ['range','长弓手',1,1,'light','normal',100,35,210,1.6,25,''],
  ['heavy','重甲枪兵',2,3,'heavy','piercing',580,56,60,1.6,21,''],
  ['ballista','弩车手',2,2,'light','siege',180,74,220,2.8,18,'mechanical'],
  ['chariot','战车突袭兵',1,2,'light','normal',270,34,30,1.2,46,'charge'],
  ['support','战地医师',1,1,'light','normal',130,22,135,1.5,26,'heal'],
  ['melee','刺刀步兵',0,1,'light','normal',200,29,25,0.9,32,''],
  ['range','火枪手',1,1,'light','normal',110,72,175,2.5,24,''],
  ['heavy','重炮兵',2,3,'light','siege',230,100,230,3.5,16,'mechanicalSplash'],
  ['grenade','掷弹兵',1,2,'light','explosive',160,46,130,2,28,'splash'],
  ['antiarmor','穿甲枪手',1,1,'light','piercing',110,48,180,2,25,''],
  ['support','军旗鼓手',1,1,'light','normal',165,0,140,1,30,'march'],
  ['melee','突击兵',0,1,'light','normal',195,22,95,0.8,32,''],
  ['range','精确射手',1,1,'light','normal',100,66,240,2.4,25,'sniper'],
  ['heavy','重装机枪兵',2,3,'heavy','normal',540,22,155,0.35,18,'warmup'],
  ['rocket','火箭筒兵',1,2,'light','piercing',130,92,190,3,24,''],
  ['vehicle','履带突击车',2,3,'heavy','siege',650,80,145,2.5,22,'mechanical'],
  ['support','战地医疗兵',1,1,'light','normal',150,18,145,1.5,28,'heal3'],
  ['melee','能量剑士',0,1,'light','energy',210,35,25,0.9,40,'charge'],
  ['range','等离子射手',1,1,'light','energy',125,40,180,1.7,27,'splash'],
  ['heavy','动力装甲兵',2,3,'heavy','energy',600,53,120,1.3,22,'shield'],
  ['rail','磁轨炮手',1,2,'light','piercing',130,72,220,2.5,24,'rail'],
  ['siege','攻城机甲',2,3,'heavy','siege',700,105,150,2.8,18,'mechanical'],
  ['support','维修机兵',1,1,'light','normal',180,30,140,1.5,26,'repair']
];
const UNITS = rows.map((r,i)=>{
  const era=Math.floor(i/6), scale=1+era*0.38;
  return {id:`age${era+1}_${r[0]}`,era,name:r[1],cost:Math.ceil([70,110,200][r[2]]*ERAS[era].cost),train:[2,3,5][r[2]],pop:r[3],armor:r[4],type:r[5],hp:Math.round(r[6]*scale),damage:Math.round(r[7]*scale),range:r[8],interval:r[9],speed:r[10],trait:r[11],support:r[0]==='support',mechanical:r[11].indexOf('mechanical')===0||r[11]==='repair',powerArmor:era===4&&i%6<4};
});
const BY_ID = {}; UNITS.forEach(u=>{ BY_ID[u.id]=u; });
const ARMOR = {normal:{light:1,heavy:0.65,building:0.5},piercing:{light:0.8,heavy:1.4,building:0.7},explosive:{light:1.2,heavy:0.7,building:0.8},siege:{light:0.65,heavy:0.8,building:1.8},energy:{light:1,heavy:0.9,building:0.6}};
module.exports={VERSION,ERAS,UNITS,BY_ID,ARMOR};

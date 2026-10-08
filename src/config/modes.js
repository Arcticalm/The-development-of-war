'use strict';
const {ERAS}=require('../data');
// 关卡详情、AI 和模拟读取同一份配置；这里不保存玩家进度。
const rows=[
  ['1-1','初次交锋','学会出兵、队列和承伤',0,0,360,'destroy','melee',1500,1,null],
  ['1-2','猛兽来袭','用骨矛反重甲、火罐处理兵群',0,0,480,'destroy','beast',3000,1,null],
  ['1-3','部落守卫','学会建塔、技能和支援',0,0,300,'survive','tribe',3000,1,null],
  ['2-1','文明跃迁','EXP、进化与旧兵混编',0,1,600,'destroy','mixed',3000,1,null],
  ['2-2','枪阵缺口','枪阵、战车与远程克制',1,1,480,'destroy','phalanx',3000,1,null],
  ['2-3','城门攻坚','弩车攻城、医师保护前排',1,1,600,'destroy','fort',3000,1,0],
  ['3-1','火药变革','长装填武器的前排掩护',1,2,600,'destroy','volley',3000,1,null],
  ['3-2','密集战线','掷弹与重炮处理密集阵形',2,2,480,'destroy','crowd',3000,1.15,null],
  ['3-3','炮阵推进','军旗加速慢兵、组织攻城',2,2,600,'destroy','artillery',3000,1,0],
  ['4-1','装甲压力','用火箭反装甲、混合阵容',2,3,600,'destroy','armor',3000,1,null],
  ['4-2','切断补给','精确射手优先压制医疗',3,3,480,'destroy','medical',3000,1,null],
  ['4-3','坚守阵地','管理人口、技能和补线',3,3,360,'survive','pressure',3000,1.15,null],
  ['5-1','能源前线','能量伤害、护盾与维修',3,4,600,'destroy','energy',3000,1,null],
  ['5-2','钢铁突破','磁轨破甲、保护攻城机甲',4,4,600,'destroy','repair',3000,1,0],
  ['5-3','战争进化史','综合运用五时代全部机制',0,4,900,'destroy','adaptive',3000,1,null]
];
const WAVES={beast:{period:36,active:24},fort:{period:30,active:18},artillery:{period:30,active:18},repair:{period:30,active:18}};
const LEVELS=rows.map((r,index)=>({id:r[0],index,chapter:Math.floor(index/3),name:r[1],lesson:r[2],startEra:r[3],maxEra:r[4],timeLimit:r[5],objective:r[6],strategy:r[7],buildTowers:index>=2,wave:WAVES[r[7]]||null,enemyHp:r[8],enemyIncome:r[9],initialTower:r[10],difficulty:index===14?'hard':'normal'}));
const LEVEL_BY_ID={};LEVELS.forEach(l=>{LEVEL_BY_ID[l.id]=l;});
/** @param {{mode?:string,levelId?:string,difficulty?:string}} options */
function resolveMode(options={}){
  const mode=options.mode||'classic';
  if(mode==='campaign'){
    const l=LEVEL_BY_ID[options.levelId];if(!l)throw new Error('Unknown campaign level');
    return {...l,wave:l.wave?{...l.wave}:null,mode,levelId:l.id,gold:Math.ceil(200*ERAS[l.startEra].cost)};
  }
  if(!['classic','pvp'].includes(mode))throw new Error('Unknown game mode');
  return {mode,levelId:null,name:mode==='classic'?'经典对战':'在线对战',startEra:0,maxEra:4,gold:200,timeLimit:mode==='classic'?1200:900,objective:'compare',strategy:'adaptive',buildTowers:true,enemyHp:3000,enemyIncome:1,initialTower:null,difficulty:['easy','normal','hard'].includes(options.difficulty)?options.difficulty:'normal'};
}
module.exports={LEVELS,LEVEL_BY_ID,resolveMode};

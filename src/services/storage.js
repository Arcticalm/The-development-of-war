'use strict';
const {LEVELS,LEVEL_BY_ID}=require('../config/modes');
const KEYS={snapshot:'war.pve.snapshot.v2',progress:'war.pve.progress.v1',settings:'war.settings.v1'};
const DEFAULT_SETTINGS={sound:true,volume:0.6,simpleBackground:false};
class StorageService {
  constructor(platform){this.platform=platform;this.failed=false;this.lastError='';}
  read(key){try{return this.platform.getStorageSync(key);}catch(e){this.failed=true;this.lastError='本地存储不可用';return null;}}
  write(key,value){try{this.platform.setStorageSync(key,value);return true;}catch(e){this.failed=true;this.lastError='本地存储不可用';return false;}}
  remove(key){try{this.platform.removeStorageSync(key);return true;}catch(e){this.failed=true;this.lastError='本地存储不可用';return false;}}
  loadSettings(){const raw=this.read(KEYS.settings);return {sound:raw&&typeof raw.sound==='boolean'?raw.sound:DEFAULT_SETTINGS.sound,volume:raw&&Number.isFinite(raw.volume)&&raw.volume>=0&&raw.volume<=1?raw.volume:DEFAULT_SETTINGS.volume,simpleBackground:raw&&typeof raw.simpleBackground==='boolean'?raw.simpleBackground:DEFAULT_SETTINGS.simpleBackground};}
  loadProgress(){
    const raw=this.read(KEYS.progress),progress={version:1,records:{},settled:[]};
    if(!raw||raw.version!==1||!raw.records)return progress;
    LEVELS.forEach(l=>{const r=raw.records[l.id];if(r&&r.cleared===true&&Number.isFinite(r.bestHp)&&r.bestHp>=0&&r.bestHp<=1&&(r.bestTime===null||Number.isFinite(r.bestTime)&&r.bestTime>=0&&r.bestTime<=l.timeLimit))progress.records[l.id]={cleared:true,bestHp:r.bestHp,bestTime:r.bestTime};});
    if(Array.isArray(raw.settled))progress.settled=raw.settled.filter(id=>typeof id==='string'&&id.length<=120).slice(-256);
    return progress;
  }
}
function unlocked(progress,levelId){const l=LEVEL_BY_ID[levelId];return !!l&&(l.index===0||!!progress.records[LEVELS[l.index-1].id]);}
/** 纯进度更新。失败不覆盖成绩，结算 ID 去重。 */
function settleProgress(progress,result){
  if(!result||result.mode!=='campaign'||!LEVEL_BY_ID[result.levelId]||progress.settled.includes(result.matchId))return false;
  progress.settled.push(result.matchId);progress.settled=progress.settled.slice(-256);
  if(result.winner===0){
    const l=LEVEL_BY_ID[result.levelId],hp=result.stats[0].hp/result.stats[0].maxHp,old=progress.records[l.id];
    const time=l.objective==='survive'&&result.reason!=='基地被摧毁'?null:result.time;
    progress.records[l.id]={cleared:true,bestHp:Math.max(old?old.bestHp:0,hp),bestTime:time===null?old?old.bestTime:null:old&&old.bestTime!==null?Math.min(old.bestTime,time):time};
  }
  return true;
}
module.exports={KEYS,DEFAULT_SETTINGS,StorageService,unlocked,settleProgress};

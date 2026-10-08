'use strict';
const {ERAS,UNITS}=require('../data');
const {LEVELS}=require('../config/modes');
const {unlocked}=require('../services/storage');
const minutes=s=>Math.floor(s/60)+'分'+Math.floor(s%60)+'秒';
function heading(r,title,subtitle){r.text(title,64,90,42);r.text(subtitle,66,144,23,r.colors.muted);r.button('返回首页',1020,62,196,56,()=>r.app.navigate('home'));}
function home(r){
  const a=r.app,C=r.colors;r.rect(0,0,1280,12,C.teal);r.text('战争进化史',80,140,58);r.text('五个时代，三十种兵，先搭配阵容，再突破防线。',84,218,24,C.muted);
  r.rect(78,272,684,220,C.panel);r.text('经典对战 · PvE',104,307,30);r.text('公平资源 / 自动战斗 / 可暂停续局',104,351,23,C.muted);
  [['easy','简单'],['normal','普通'],['hard','困难']].forEach(([id,name],i)=>r.button((a.difficulty===id?'● ':'')+name,104+i*200,390,180,54,()=>{a.difficulty=id;}));
  r.button('开始对战',78,520,330,64,()=>a.requestStartBattle());r.button('继续上次对战',432,520,330,64,()=>a.resume(),!!a.saved);
  r.button('操作说明',78,620,230,48,()=>{a.modal='help';},true,true);
  r.text('战役通关 '+Object.keys(a.progress.records).length+' / 15',344,644,23,C.teal);
  [['战役 · 五章十五关','campaign'],['兵种图鉴 · 全部开放','codex'],['设置','settings'],['PvP 在线对战','pvp']].forEach(([label,scene],i)=>r.button(label,816,272+i*94,388,74,()=>a.navigate(scene)));
  if(a.invalidSaved)r.text('旧版或不完整对局无法恢复，请重新挑战。',78,696,20,C.red);
  else if(a.saveUnavailable)r.text('本地存储不可用，本次仍可进行单机游戏。',78,696,20,C.red);
}
function campaign(r){
  const a=r.app,C=r.colors;heading(r,'战役','顺序通关解锁，可重玩；关卡加成只在本关生效。');
  ERAS.forEach((e,i)=>r.button((a.chapter===i?'● ':'')+'第'+(i+1)+'章',64+i*232,185,218,50,()=>{a.chapter=i;}));
  LEVELS.filter(l=>l.chapter===a.chapter).forEach((l,i)=>{
    const x=64+i*390,open=unlocked(a.progress,l.id),record=a.progress.records[l.id];r.rect(x,258,370,340,C.panel);
    r.text(l.id+' '+l.name,x+20,292,28);r.text(record?'已通关':open?'可挑战':'尚未解锁',x+20,335,22,record?C.teal:open?C.ink:C.muted);
    r.wrap(l.lesson,x+20,381,320,23,32);r.text((l.objective==='survive'?'生存':'摧毁敌基地')+' · '+minutes(l.timeLimit),x+20,465,22);
    if(record)r.text('最佳生命 '+Math.round(record.bestHp*100)+'%'+(record.bestTime===null?'':' / '+minutes(record.bestTime)),x+20,506,20,C.teal);
    r.button('目标与敌情',x+20,538,330,46,()=>{a.modal={levelId:l.id};},true,true);
  });
  r.button('查看本章六种兵',64,626,330,54,()=>{a.codexEra=a.chapter;a.navigate('codex');});
  r.text('失败、平局与投降不解锁下一关。',438,653,23,C.muted);
}
function codex(r){
  const a=r.app,C=r.colors;heading(r,'兵种图鉴','所有兵种可查阅；战斗中只生产当前时代的六种兵。');
  ERAS.forEach((e,i)=>r.button((a.codexEra===i?'● ':'')+e.name.replace('时代',''),64+i*232,185,218,50,()=>{a.codexEra=i;},true,true));
  UNITS.filter(d=>d.era===a.codexEra).forEach((d,i)=>{const x=64+i%3*390,y=258+Math.floor(i/3)*197;r.rect(x,y,370,177,C.panel);r.text(d.name,x+20,y+30,27);r.text(d.role+' / '+(d.armor==='heavy'?'重甲':'轻甲'),x+20,y+73,22,C.muted);r.text(d.cost+' 金 · '+d.pop+' 人 · '+d.train+' 秒',x+20,y+111,22);r.button('查看详情',x+228,y+124,122,39,()=>{a.modal={unit:d.id};},true,true);});
}
function settings(r){
  const a=r.app,C=r.colors;heading(r,'设置','设置保存在本设备；不影响战斗数值。');r.rect(64,200,1152,435,C.panel);
  r.text('基础音效',94,260,28);r.button(a.settings.sound?'已开启':'已关闭',510,228,220,56,()=>a.changeSetting('sound',!a.settings.sound));
  r.text('音量 '+Math.round(a.settings.volume*100)+'%',94,354,28);
  r.button('－',510,326,90,56,()=>a.changeSetting('volume',Math.max(0,Math.round((a.settings.volume-0.1)*10)/10)));
  r.button('＋',624,326,90,56,()=>a.changeSetting('volume',Math.min(1,Math.round((a.settings.volume+0.1)*10)/10)));
  r.button('试听',758,326,160,56,()=>a.audio.play('evolve'));
  r.text('背景显示',94,448,28);r.button(a.settings.simpleBackground?'简化背景':'完整背景',510,420,280,56,()=>a.changeSetting('simpleBackground',!a.settings.simpleBackground));
  r.button('操作说明',94,536,260,56,()=>{a.modal='help';});
  r.text('角色当前采用文字显示；造型和动作将在后续完善。',94,612,22,C.muted);
  if(a.audio.failed)r.text('当前设备音频播放不可用，游戏可继续。',64,680,22,C.red);
}
function pvp(r){
  const a=r.app,C=r.colors;heading(r,'PvP 在线对战','真人匹配与好友房尚未开放。');
  [['真人匹配','与另一位玩家进行公平的实时 1v1。'],['创建好友房','创建房间后邀请好友加入。'],['加入好友房','通过房间码进入好友的房间。']].forEach(([title,description],i)=>{
    const x=64+i*390;r.rect(x,245,370,340,C.panel);r.text(title,x+22,292,30);r.wrap(description,x+22,360,324,24,35);
    r.button('尚未开放',x+22,502,326,60,()=>a.pvpAction(),false);
  });r.text('当前可先体验经典对战和五章战役。',64,655,24,C.muted);
}
module.exports={home,campaign,codex,settings,pvp};

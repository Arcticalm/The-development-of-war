'use strict';
const {ERAS,UNITS}=require('../data');
const {LEVELS}=require('../config/modes');
const {unlocked}=require('../services/storage');
const {ERA_COLORS,ERA_ICONS}=require('./theme');
const minutes=s=>Math.floor(s/60)+'分'+Math.floor(s%60)+'秒';
function chapterTabs(r,key){
  const a=r.app;r.panel(48,187,1184,62,r.colors.panel,20);
  ERAS.forEach((e,i)=>r.button((key==='chapter'?'第'+(i+1)+'章 · ':'')+e.name.replace('时代',''),60+i*236,195,224,46,()=>{a[key]=i;},true,true,{id:'era:'+i,variant:'ghost',shape:'flag',selected:a[key]===i,icon:ERA_ICONS[i]}));
}
function home(r){
  const a=r.app,C=r.colors;
  r.rect(0,0,1280,326,C.dark);r.painter.polygon([[0,298],[855,298],[899,326],[1280,326],[1280,336],[0,336]],C.gold);
  r.tag('战术指挥室',64,42,'#335447',C.goldLight,19,152);r.text('战争进化史',64,134,62,C.white);r.text('跨越五个时代，用阵容与战术突破防线。',68,205,25,'#b9cbbb');
  r.line(797,111,1197,111,'#517060',3);
  ERAS.forEach((e,i)=>{const x=797+i*98;r.badge(ERA_ICONS[i],x,111,29,'#2f5042',C.goldLight);r.text(['原始','古典','火药','现代','未来'][i],x,161,20,'#c6d6c8','center');});
  r.panel(48,272,728,365);r.badge('swords',89,317,27,C.tealLight,C.teal);r.text('经典对战',134,308,34);r.tag('PvE',344,294,C.goldLight,C.ink,19,62);
  r.text('公平资源 · 自动战斗 · 可暂停续局',134,349,22,C.muted);
  r.painter.shape(80,391,648,62,'#ecebdb',null,'round',22);
  [['easy','简单'],['normal','普通'],['hard','困难']].forEach(([id,name],i)=>r.button(name,86+i*214,397,208,50,()=>{a.difficulty=id;},true,false,{id:'difficulty:'+id,variant:'ghost',selected:a.difficulty===id}));
  r.button('开始对战',80,480,356,72,()=>a.requestStartBattle(),true,false,{id:'start',variant:'gold',shape:'cut',icon:'play'});
  r.button('继续上次对战',460,480,280,72,()=>a.resume(),!!a.saved,true,{id:'resume',variant:'outline',icon:'clock',disabledReason:'暂时没有可继续的对局'});
  r.button('操作说明',80,579,176,42,()=>{a.modal='help';},true,true,{id:'help',variant:'ghost',icon:'book'});
  r.icon('flag',304,599,25,C.teal);r.text('战役进度',328,587,20,C.muted);r.text(Object.keys(a.progress.records).length+' / 15',470,587,23,C.teal);r.bar(328,612,377,6,Object.keys(a.progress.records).length/15,C.gold);
  const entrances={campaign:{shape:'flag',background:C.goldLight,fill:'#e9d18f'},codex:{radius:24,background:'#eef0df'},settings:{shape:'cut',fill:'#e5e8dc',color:C.muted},pvp:{radius:28,background:'#e7e5d8',fill:'#d7ddce',color:C.muted,locked:true}};
  [['战役 · 五章十五关','沿地图逐章推进','flag','campaign'],['兵种图鉴 · 全部开放','查看定位、克制与搭配','book','codex'],['设置','声音与显示偏好','gear','settings'],['PvP 在线对战','真人匹配与好友房待开放','swords','pvp']].forEach(([title,sub,icon,scene],i)=>r.tile(scene,title,sub,icon,816,272+i*97,416,81,()=>a.navigate(scene),entrances[scene]));
  if(a.invalidSaved)r.text('旧版或不完整对局无法恢复，请重新挑战。',64,680,21,C.red);
  else if(a.saveUnavailable)r.text('本地存储不可用，本次仍可进行单机游戏。',64,680,21,C.red);
  else {r.icon('shield',79,680,22,C.teal);r.text('单机指挥 · 文字角色原型',102,680,21,C.muted);}
}
function campaign(r){
  const a=r.app,C=r.colors;r.heading('时代战役','沿路线通关，下一站随胜利解锁；已完成关卡可重玩。','flag');chapterTabs(r,'chapter');
  r.text(ERAS[a.chapter].name+' · 三场战术挑战',64,279,22,C.muted);
  const nodes=LEVELS.filter(l=>l.chapter===a.chapter),c=r.ctx;c.beginPath();c.moveTo(230,388);c.bezierCurveTo(340,388,485,435,640,420);c.bezierCurveTo(795,405,924,388,1050,388);c.strokeStyle=C.line;c.lineWidth=12;c.stroke();c.strokeStyle=C.gold;c.lineWidth=2;c.stroke();
  nodes.forEach((l,i)=>{
    const x=[230,640,1050][i],y=[388,420,388][i],open=unlocked(a.progress,l.id),record=a.progress.records[l.id],color=record?C.teal:open?C.gold:C.muted;
    r.control({id:'level:'+l.id,x:x-48,y:y-48,w:96,h:96,shape:'circle',action:()=>{a.modal={levelId:l.id};}},state=>{
      r.painter.circle(x,y+5,48,C.shadow);r.painter.circle(x,y,48,state.pressed?C.goldLight:open?color:'#e2e2d2',open?C.panel:C.line);r.icon(record?'check':open?'flag':'lock',x,y,39,open?C.white:C.muted);
      if(open)r.painter.circle(x,y,56,null,color);
    });
    r.tag(l.id,x-39,y-82,C.panel,C.ink,20,78);r.text(l.name,x,y+81,29,C.ink,'center');
    const status=record?'已通关':open?'可挑战':'尚未解锁';r.tag(status,x-63,y+108,record?C.tealLight:open?C.goldLight:'#e0e1d2',color,19,126);
    if(record)r.text('最佳生命 '+Math.round(record.bestHp*100)+'%'+(record.bestTime===null?'':' · '+minutes(record.bestTime)),x,y+158,20,C.teal,'center');
    else r.text((l.objective==='survive'?'生存':'摧毁基地')+' · '+minutes(l.timeLimit),x,y+156,20,C.muted,'center');
  });
  r.button('查看本章六种兵',64,631,280,52,()=>{a.codexEra=a.chapter;a.navigate('codex');},true,true,{id:'chapter-codex',variant:'outline',icon:'book'});
  r.text('点击路线节点查看目标与敌情；失败与平局不解锁。',386,655,22,C.muted);
}
function codex(r){
  const a=r.app,C=r.colors;r.heading('兵种图鉴','30 种单位全部可查阅，找到你的前排、火力与支援组合。','book');chapterTabs(r,'codexEra');
  UNITS.filter(d=>d.era===a.codexEra).forEach((d,i)=>{
    const x=48+i%3*402,y=273+Math.floor(i/3)*191;
    r.region(x,y,380,168,()=>{a.modal={unit:d.id};},null,{id:'unit:'+d.id,radius:18,draw:state=>{
      r.panel(x,y,380,168,state.pressed?C.goldLight:C.panel);r.badge(d.support?'heart':d.mechanical?'gear':d.range>70?'target':'swords',x+38,y+40,24,C.tealLight,ERA_COLORS[d.era]);
      r.fitText(d.name,x+75,y+35,285,27);r.tag(d.role,x+20,y+73,C.tealLight,C.teal,19);r.tag(d.armor==='heavy'?'重甲':'轻甲',x+266,y+73,C.goldLight,C.ink,18,94);
      r.icon('coin',x+28,y+130,21,C.gold);r.text(d.cost+'金 · '+d.pop+'人 · '+d.train+'秒',x+47,y+130,20,C.muted);
    }});
    r.button('查看详情',x+258,y+109,104,43,()=>{a.modal={unit:d.id};},true,true,{id:'detail:'+d.id,variant:'ghost'});
  });
  r.text('同一时代的六种兵随进化全部开放。',64,681,21,C.muted);
}
function toggle(r,id,label,x,y,selected,action){
  const C=r.colors;r.control({id,x,y,w:178,h:54,radius:27,action},state=>{
    r.painter.shape(x,y,178,54,selected?C.teal:'#c8ccba',state.pressed?C.gold:null,'round',27);
    r.painter.circle(x+(selected?149:29),y+27,22,C.panel);r.fitText(label,x+(selected?74:111),y+27,103,21,selected?C.white:C.ink,'center');
  });
}
function settings(r){
  const a=r.app,C=r.colors;r.heading('设置','调整声音与背景，所有偏好保存在本设备。','gear');
  [[200,'music','基础音效','点击、出兵、进化与战斗结果提示'],[339,'volume','音量 '+Math.round(a.settings.volume*100)+'%','使用分段音量条或加减按钮调整'],[478,'eye','背景显示','简化背景可减少装饰，保留战斗信息']].forEach(([y,icon,title,subtitle])=>{r.panel(48,y,1184,115);r.badge(icon,99,y+57,29,C.tealLight);r.text(title,144,y+40,29);r.text(subtitle,145,y+78,20,C.muted);});
  toggle(r,'sound',a.settings.sound?'已开启':'已关闭',988,230,a.settings.sound,()=>a.changeSetting('sound',!a.settings.sound));
  r.button('－',454,365,50,50,()=>a.changeSetting('volume',Math.max(0,Math.round((a.settings.volume-0.1)*10)/10)),true,true,{id:'volume-minus',variant:'soft',shape:'circle',icon:'minus',iconOnly:true});
  for(let i=0;i<10;i++)r.button('',522+i*48,370,39,40,()=>a.changeSetting('volume',(i+1)/10),true,true,{id:'volume:'+i,variant:'soft',selected:i<a.settings.volume*10,radius:9});
  r.button('＋',1022,365,50,50,()=>a.changeSetting('volume',Math.min(1,Math.round((a.settings.volume+0.1)*10)/10)),true,true,{id:'volume-plus',variant:'soft',shape:'circle',icon:'plus',iconOnly:true});
  r.button('试听',1100,365,98,50,()=>a.audio.play('evolve'),true,true,{id:'listen',variant:'outline'});
  toggle(r,'background',a.settings.simpleBackground?'简化':'完整',988,508,a.settings.simpleBackground,()=>a.changeSetting('simpleBackground',!a.settings.simpleBackground));
  r.button('操作说明',64,638,198,48,()=>{a.modal='help';},true,true,{id:'help',variant:'soft',icon:'book'});
  r.text(a.audio.failed?'当前设备音频播放不可用，游戏可继续。':'角色采用文字显示；正式造型与动作将在后续完善。',296,663,22,a.audio.failed?C.red:C.muted);
}
function pvp(r){
  const a=r.app,C=r.colors;r.heading('PvP 在线对战','指挥台已就绪，真人匹配与好友房尚未开放。','swords');
  [['真人匹配','与另一位玩家实时交锋，公平对战。','swords','match'],['创建好友房','创建房间后，邀请你的好友加入。','flag','create'],['加入好友房','通过房间码进入好友的对局。','home','join']].forEach(([title,description,icon,id],i)=>{
    const x=64+i*390;r.panel(x,218,370,390,C.panel,28);r.tag('待开放',x+251,236,'#e7e4d4',C.muted,18,97);
    r.badge(icon,x+185,329,55,i===1?C.goldLight:C.tealLight,i===1?C.gold:C.teal);r.badge('lock',x+230,365,17,C.panel,C.muted);
    r.text(title,x+185,419,31,C.ink,'center');r.wrap(description,x+32,469,306,22,30);
    r.button('尚未开放',x+28,546,314,46,()=>a.pvpAction(),false,true,{id,variant:'outline',icon:'lock',disabledReason:a.pvp.getAvailability().message});
  });
  r.icon('shield',78,659,25,C.teal);r.text('当前可先体验经典对战和五章战役。',105,659,24,C.muted);
}
module.exports={home,campaign,codex,settings,pvp};

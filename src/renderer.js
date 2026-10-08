'use strict';
const {ERAS,UNITS,BY_ID}=require('./data');
const {LEVEL_BY_ID,LEVELS}=require('./config/modes');
const {unlocked}=require('./services/storage');
const screens=require('./ui/screens');
const {TextUnitPresenter}=require('./ui/units');
const C={paper:'#eee4ce',ink:'#283a36',muted:'#6f7568',teal:'#347b70',red:'#b9664e',gold:'#d0a34f',panel:'#faf4e6',line:'#cec4ae'};
const DAMAGE={normal:'普通',piercing:'穿甲',explosive:'爆破',siege:'攻城',energy:'能量'};
const TRAITS={base:'对基地伤害提高 50%',splashBase:'范围爆破 / 基地伤害提高 50%',haste:'附近友军攻速 +15%，同名光环不叠加',shieldWall:'单体远程普攻减伤 20%',mechanical:'机械单位，接受维修，不接受医疗',charge:'出场首次攻击伤害提高 80%',heal:'前摇后治疗一名生物友军',mechanicalSplash:'机械 / 范围攻城',splash:'落点范围伤害',march:'附近友军移动速度 +20%',sniper:'优先锁定射程内支援兵',warmup:'架枪预热 0.8 秒，停火重新预热',heal3:'前摇后治疗最多三名生物友军',shield:'出场护盾为最大生命的 20%，不恢复',rail:'蓄力发射，穿透最多两个敌兵',repair:'维修机械与动力装甲，不恢复护盾'};
class Renderer {
  constructor(app){this.app=app;this.ctx=app.ctx;this.buttons=[];this.colors=C;this.units=new TextUnitPresenter();}
  get worldCamera(){return this.app.camera;}
  set worldCamera(value){this.app.camera=value;}
  rect(x,y,w,h,color){this.ctx.fillStyle=color;this.ctx.fillRect(x,y,w,h);}
  text(text,x,y,size=24,color=C.ink,align='left'){const c=this.ctx;c.fillStyle=color;c.font=size+'px sans-serif';c.textAlign=align;c.textBaseline='middle';c.fillText(String(text),x,y);}
  wrap(value,x,y,width,size=22,height=32){
    let line='',row=0;for(const ch of String(value)){if(line.length*size>=width||ch==='\n'){this.text(line,x,y+row*height,size);row++;line=ch==='\n'?'':ch;}else line+=ch;}
    if(line)this.text(line,x,y+row*height,size);
  }
  line(x,y,x2,y2,color=C.line,width=2){const c=this.ctx;c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
  button(label,x,y,w,h,action,active=true,small=false){
    this.rect(x,y,w,h,active?C.teal:'#c4c4b5');this.text(label,x+w/2,y+h/2,small?20:24,active?'#fff':'#566057','center');
    this.buttons.push({x,y,w,h,action});
  }
  region(x,y,w,h,action,longAction){this.buttons.push({x,y,w,h,action,longAction});}
  bar(x,y,w,h,value,color){this.rect(x,y,w,h,C.line);this.rect(x,y,w*Math.max(0,Math.min(1,value)),h,color);}
  draw(){
    const a=this.app,c=this.ctx;this.buttons=[];c.setTransform(a.dpr,0,0,a.dpr,0,0);this.rect(0,0,a.width,a.height,'#202e2a');c.translate(a.offsetX,a.offsetY);c.scale(a.scale,a.scale);this.rect(0,0,1280,720,C.paper);
    if(a.scene==='battle'&&a.session)this.battle();else (screens[a.scene]||screens.home)(this);
    const view=a.scene==='battle'?a.view:null;
    if(view&&view.result)this.result(view.result);
    else if(a.modal==='help')this.help();
    else if(a.modal==='defense')this.defense(view.sides[0]);
    else if(a.modal&&a.modal.unit)this.details(BY_ID[a.modal.unit]);
    else if(a.modal&&a.modal.levelId)this.levelDetails(LEVEL_BY_ID[a.modal.levelId]);
    else if(a.modal&&a.modal.confirm)this.confirm();
    else if(a.modal&&a.modal.cancel!==undefined)this.cancelQueue();
    else if(a.scene==='battle'&&a.paused)this.pause();
    if(a.toastTime>0){this.rect(190,670,900,42,C.ink);this.text(a.toast,640,691,21,'#fff','center');}
  }
  battle(){
    const a=this.app,b=a.view,p=b.sides[0],enemy=b.sides[1];this.rect(0,0,1280,142,C.panel);
    this.text('我方 · '+ERAS[p.era].name,28,30,25,C.teal);this.text('敌方 · '+ERAS[enemy.era].name,900,30,25,C.red);
    this.bar(28,57,326,13,p.hp/p.maxHp,C.teal);this.bar(900,57,326,13,enemy.hp/enemy.maxHp,C.red);this.text(Math.ceil(p.hp)+' / '+p.maxHp,28,90,20);this.text(Math.ceil(enemy.hp)+' / '+enemy.maxHp,900,90,20);
    this.text('金币 '+Math.floor(p.gold),390,30,24);this.text('人口 '+b.livingPopulation+'+'+(b.population-b.livingPopulation)+' / 30',390,64,22);
    this.text('经验 '+Math.floor(p.xp)+(p.era<b.rules.maxEra?' / '+ERAS[p.era+1].xp:' · 时代上限'),390,99,20);
    const remaining=Math.max(0,Math.ceil(b.rules.timeLimit-b.time));this.text(Math.floor(remaining/60)+':'+String(remaining%60).padStart(2,'0'),770,30,25);
    this.button('暂停',720,66,130,48,()=>a.pauseBattle(),!b.result);
    const c=this.ctx,camera=this.worldCamera;c.save();c.beginPath();c.rect(0,143,1280,347);c.clip();c.translate(640+camera.x,414+camera.y);c.scale(camera.zoom,camera.zoom);c.translate(-640,-414);
    this.landscape(p.era);this.base(0,p);this.base(1,enemy);
    b.strikes.forEach(s=>{const x=100+s.x*1.08;this.rect(x-113,431,226,25,'rgba(185,102,78,0.16)');this.text('技能预警',x,448,19,s.side?C.red:C.teal,'center');});
    b.projectiles.forEach(p=>{const progress=1-p.remaining/p.duration,x=100+(p.from+(p.to-p.from)*progress)*1.08;this.text(p.splash?'●':p.side?'←':'→',x,468,19,p.side?C.red:C.teal,'center');});
    this.units.draw(this,b.units);
    this.text('我方基地',94,478,19,C.teal,'center');this.text('敌方基地',1184,478,19,C.red,'center');c.restore();
    this.text(b.rules.mode==='campaign'?b.rules.levelId+' '+b.rules.name+' · '+(b.rules.objective==='survive'?'生存或摧毁敌基地':'摧毁敌基地'):'经典对战 · '+({easy:'简单',normal:'普通',hard:'困难'}[b.rules.difficulty]),24,164,20,C.muted);
    this.button(camera.zoom>1?'全景':'局部视图',966,151,128,38,()=>{a.camera=camera.zoom>1?{zoom:1,x:0,y:0}:{zoom:1.8,x:0,y:0};},!b.result,true);
    this.button('回到基地',1108,151,148,38,()=>{a.camera={zoom:1.8,x:432,y:0};},!b.result,true);
    this.controls(p,b);
    if(a.skillMode){this.rect(240,190,800,43,C.panel);this.text('点击战场选择落点；拖动只移动视野',640,212,24,C.teal,'center');this.button('取消施放',532,238,216,40,()=>{a.skillMode=false;},true,true);}
  }
  screenXToBattle(x){const camera=this.worldCamera;return(((x-640-camera.x)/camera.zoom+640)-100)/1.08;}
  landscape(era){
    const colors=[['#dce2d0','#bfcbb4'],['#e6dfc8','#c8c8ad'],['#ddd9cc','#b7bfbd'],['#d7e0df','#b6c5c3'],['#d3e2e1','#a7c6c4']][era];
    this.rect(-800,143,2900,347,colors[0]);if(!this.app.settings.simpleBackground){for(let i=0;i<13;i++)this.rect(i*110-32,370-(i%3)*20,65,120,colors[1]);}this.line(-800,460,2100,460,C.muted,2);
  }
  base(side,s){const x=side?1166:46;this.rect(x,345,68,110,side?C.red:C.teal);this.text('基地',x+34,398,22,'#fff','center');s.towers.forEach((t,i)=>{if(t)this.text('塔'+(i+1),x+34,309-i*24,18,C.ink,'center');});}
  controls(p,b){
    const a=this.app;this.rect(0,495,1280,225,C.panel);this.text('队列',24,517,20,C.muted);
    p.queue.forEach((q,i)=>{const d=BY_ID[q.typeId],x=160+i*178;this.button(d.name,x,500,167,31,()=>a.queueCancel(q.id),!b.result,true);this.text(i===0?q.remaining.toFixed(1)+'秒':'等待',x+83,540,17,C.muted,'center');if(i===0)this.bar(x,553,167,3,1-q.remaining/d.train,C.gold);});
    UNITS.filter(u=>u.era===p.era).slice(a.page*3,a.page*3+3).forEach((d,i)=>{
      const x=24+i*244;this.rect(x,565,230,128,'#e6e3d2');this.region(x,565,230,128,()=>a.command({type:'train',id:d.id}),()=>{a.modal={unit:d.id};a.skillMode=false;});
      this.text(d.name,x+12,586,24);this.text(d.cost+' 金 / '+d.pop+' 人 · '+d.role,x+12,615,17,C.muted);
      const reason=p.gold<d.cost?'金币不足':p.queue.length>=5?'队列已满':b.population+d.pop>30?'人口已满':null;
      this.button('详情',x+8,643,64,40,()=>{a.modal={unit:d.id};a.skillMode=false;},!b.result,true);
      this.button(reason||'生产 '+d.train+'秒',x+82,638,139,49,()=>a.command({type:'train',id:d.id}),!b.result&&!reason,true);
    });
    this.button(a.page?'B 组 → A 组':'A 组 → B 组',762,565,172,42,()=>{a.page=1-a.page;},!b.result,true);
    this.button('防御塔',762,619,172,66,()=>{a.modal='defense';a.skillMode=false;},!b.result);
    this.button(p.cooldown>1e-8?'技能 '+Math.ceil(p.cooldown)+'秒':'技能 · 选择落点',950,565,304,48,()=>{if(p.cooldown>1e-8)a.notify('技能尚未冷却');else a.skillMode=!a.skillMode;},!b.result&&p.cooldown<=1e-8,true);
    const capped=p.era>=b.rules.maxEra,ready=!capped&&p.xp>=ERAS[p.era+1].xp;
    this.button(capped?'已达时代上限':'进化 → '+ERAS[p.era+1].name,950,637,304,48,()=>a.command({type:'evolve'}),!b.result&&ready,true);
    this.text('短按卡片生产 · 长按查看详情 · 密集同类部队显示数量',24,708,17,C.muted);
  }
  overlay(title){this.buttons=[];this.rect(0,0,1280,720,'rgba(20,35,30,0.76)');this.rect(144,72,992,580,C.panel);this.text(title,184,119,32);}
  close(){this.button('关闭',962,93,136,44,()=>{this.app.modal=null;},true,true);}
  details(d){
    if(!d)return;this.overlay(d.name+' · '+d.role);this.close();
    this.text(ERAS[d.era].name+' / '+(d.armor==='heavy'?'重甲':'轻甲')+' / '+(d.mechanical?'机械':'生物'),184,177,24);
    this.text('生命 '+d.hp+' · '+(d.support?'支援量 ':'伤害 ')+d.damage+' · 射程 '+d.range+' · 移速 '+d.speed,184,219,24);
    this.text(d.cost+' 金 · '+d.pop+' 人 · '+d.train+' 秒生产 · 间隔 '+d.interval+' 秒 · 前摇 '+d.windup+' 秒',184,261,22);
    this.wrap(TRAITS[d.trait]||(DAMAGE[d.type]+'伤害，自动锁定最近有效敌兵'),184,306,850,23,32);
    this.wrap('优势：'+d.strength,184,374,850,23,32);this.wrap('弱点：'+d.weakness,184,426,850,23,32);this.wrap('搭配：'+d.partners,184,478,850,23,32);
    this.text(this.app.scene==='battle'?'详情不暂停战斗；需要时请先暂停。':'每个时代六种兵，进化后全部开放。',184,591,22,C.muted);
  }
  levelDetails(l){
    const a=this.app;this.overlay(l.id+' '+l.name);this.close();this.text(l.lesson,184,178,25,C.teal);
    this.text('时代：'+ERAS[l.startEra].name+(l.startEra===l.maxEra?'（固定）':' → '+ERAS[l.maxEra].name),184,225,23);
    this.text('目标：'+(l.objective==='survive'?'存活到时限，或提前摧毁敌基地':'在时限内摧毁敌基地')+' · '+l.timeLimit/60+' 分钟',184,272,23);
    this.text('双方金币 '+Math.ceil(200*ERAS[l.startEra].cost)+' · EXP '+ERAS[l.startEra].xp+' · 我方基地 3000',184,319,23);
    this.text('敌基地 '+l.enemyHp+' · 敌金币收入 ×'+l.enemyIncome+(l.initialTower!==null?' · 初始'+ERAS[l.startEra].towers[l.initialTower]:''),184,366,23);
    const strategy={melee:'石棒为主，少量投石',beast:'存钱生产猛犸，石棒掩护',tribe:'石棒、投石混编，后段加入猛犸',mixed:'普通混编，达标后进化',phalanx:'重甲枪兵配长弓，间歇补线',fort:'建塔、剑盾掩护长弓',volley:'前期战车，进化后火枪齐射',crowd:'连续刺刀步兵配火枪',artillery:'塔下火枪、间歇重炮',armor:'偏重机枪与履带车',medical:'机枪配医疗推进',pressure:'突击、火箭、履带车混编',energy:'动力装甲配等离子',repair:'动力装甲、维修与塔',adaptive:'按敌军调整反制、支援和攻城组合'};
    this.wrap('敌军：'+strategy[l.strategy],184,413,850,23,32);
    this.text('敌方防御策略：'+(l.buildTowers?'根据战线建塔':'不建塔'),184,455,22,C.muted);
    if(l.wave)this.text('补兵指令：每 '+l.wave.period+' 秒，前 '+l.wave.active+' 秒补兵；休整时队列继续。',184,486,22,C.muted);
    const open=unlocked(a.progress,l.id);this.button(open?'开始挑战':'先通关前一关',184,542,426,62,()=>a.requestStartBattle({mode:'campaign',levelId:l.id}),open);
    this.button('查看本章兵种',642,542,426,62,()=>{a.codexEra=l.chapter;a.navigate('codex');});
  }
  defense(p){
    this.overlay('基地防御');this.close();const a=this.app;
    p.towers.forEach((t,i)=>{const x=178+i*313;this.rect(x,185,296,355,'#e3e4d5');this.text('塔位 '+(i+1),x+16,220,26);
      if(i>=p.slots){this.text('尚未开放',x+16,275,23,C.muted);if(i===p.slots)this.button('开放 '+[0,200,350][i]+' 金',x+16,450,264,55,()=>a.command({type:'unlock'}),true,true);}
      else if(!t){this.text('空塔位',x+16,275,23,C.muted);[0,1].forEach(kind=>this.button(ERAS[p.era].towers[kind]+' '+Math.ceil([180,240][kind]*ERAS[p.era].cost)+'金',x+12,334+kind*81,272,60,()=>a.command({type:'build',slot:i,kind}),true,true));}
      else{this.text(ERAS[t.era].towers[t.kind],x+16,275,24);this.text('等级 '+t.level,x+16,320,22);this.button(t.level===2?'已满级':'升级 '+Math.ceil(t.cost*0.6)+'金',x+16,366,264,55,()=>a.command({type:'upgrade',slot:i}),t.level<2,true);this.button('出售 +'+Math.floor(t.paid*0.5)+'金',x+16,445,264,55,()=>a.command({type:'sell',slot:i}),true,true);}
    });this.text('面板打开时战斗继续；旧时代防御塔会保留。',184,595,22,C.muted);
  }
  pause(){const a=this.app;this.overlay('对战已暂停');this.text('双方计时、收入、前摇与弹丸都已停止。',184,213,25,C.muted);this.text('本局每 5 秒和进入后台时自动保存。',184,270,24,C.muted);
    this.button('继续战斗',184,354,426,64,()=>a.continueBattle());this.button('操作说明',642,354,426,64,()=>{a.modal='help';});this.button('投降',184,469,426,64,()=>{a.modal={confirm:'surrender'};});this.button('保存并返回首页',642,469,426,64,()=>a.saveAndReturnHome());}
  confirm(){
    const a=this.app,surrender=a.modal.confirm==='surrender',options=a.modal.options;this.overlay(surrender?'确认投降？':'覆盖未完成的对局？');
    this.wrap(surrender?'投降后本局判负，战役不会解锁下一关。':'开始新局会替换当前续局存档。你也可以返回首页继续上次对局。',184,242,850,26,40);
    this.button('取消',184,450,426,64,()=>{a.modal=null;});this.button(surrender?'确认投降':'开始新局',642,450,426,64,()=>{a.modal=null;if(surrender)a.command({type:'surrender'});else a.startBattle(options);});
  }
  cancelQueue(){
    const a=this.app,id=a.modal.cancel,p=a.view.sides[0],index=p.queue.findIndex(q=>q.id===id);this.overlay('取消生产');this.close();
    if(index<0){this.text('该单位已经出场或队列已发生变化。',184,253,25);return;}
    const q=p.queue[index],refund=Math.floor(q.paid*(index===0?0.75:1));this.text(BY_ID[q.typeId].name+' · '+(index===0?'正在生产':'等待生产'),184,237,27);
    this.text('确认后返还 '+refund+' 金币'+(index===0?'（实付费用的 75%）':'（全额）'),184,312,25);this.text('确认时按当前队列状态核对退款；出生后不能取消。',184,371,22,C.muted);
    this.button('确认取消',184,475,884,64,()=>{a.modal=null;a.command({type:'cancel',id});});
  }
  result(result){
    const a=this.app;this.overlay(result.winner===null?'平局':result.winner===0?'战斗胜利':'战斗失败');this.text(result.reason,184,197,26,C.muted);
    this.text('对局 '+Math.floor(result.time/60)+'分'+Math.floor(result.time%60)+'秒',184,244,25);
    result.stats.forEach((s,i)=>this.text((i?'敌方':'我方')+' · 最高 '+ERAS[s.highestEra].name+' · 生产 '+s.produced+' · 击杀 '+s.kills+' · 基地 '+Math.round(s.hp/s.maxHp*100)+'%',184,305+i*54,23));
    this.button('重试',184,463,270,64,()=>a.retry());this.button('返回首页',798,463,270,64,()=>a.returnHome());
    const l=LEVEL_BY_ID[result.levelId];if(result.winner===0&&l&&LEVELS[l.index+1])this.button('下一关',491,463,270,64,()=>a.nextLevel());
    else if(result.winner===0&&l&&l.index===14)this.text('五章战役全部通关！',184,585,26,C.teal);
  }
  help(){
    this.overlay('如何指挥军队');this.close();
    ['1  短按卡片生产，长按查看详情；A / B 切换六种兵。','2  队列最多 5 项，人口最多 30；取消前可核对退款。','3  穿甲克重甲，爆破克兵群，攻城武器擅长拆基地。','4  经验达标可进化，旧兵、队列、防御塔和冷却保留。','5  建塔保护基地；技能有 1 秒预警，确认落点后消耗冷却。','6  局部视图可拖动；切后台会暂停，返回需手动继续。','7  战役按目标判定；经典 20 分钟到时比较基地生命比例。','8  在线 PvP 尚未开放，单机进度只保存在本设备。'].forEach((s,i)=>this.text(s,184,192+i*52,23));
  }
}
module.exports={Renderer};

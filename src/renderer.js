'use strict';
const {ERAS,UNITS,BY_ID}=require('./data');
const {LEVEL_BY_ID,LEVELS}=require('./config/modes');
const {unlocked}=require('./services/storage');
const screens=require('./ui/screens');
const {TextUnitPresenter}=require('./ui/units');
const {UIComponents}=require('./ui/components');
const {BattleEffects}=require('./ui/battle-effects');
const {containRect}=require('./ui/portraits');
const WORLD_ART=require('./config/world-art');
const {COLORS:C,ERA_COLORS,ERA_ICONS}=require('./ui/theme');
const DAMAGE={normal:'普通',piercing:'穿甲',explosive:'爆破',siege:'攻城',energy:'能量'};
const TRAITS={base:'对基地伤害提高 50%',splashBase:'范围爆破 / 基地伤害提高 50%',haste:'附近友军攻速 +15%，同名光环不叠加',shieldWall:'单体远程普攻减伤 20%',mechanical:'机械单位，接受维修，不接受医疗',charge:'出场首次攻击伤害提高 80%',heal:'前摇后治疗一名生物友军',mechanicalSplash:'机械 / 范围攻城',splash:'落点范围伤害',march:'附近友军移动速度 +20%',sniper:'优先锁定射程内支援兵',warmup:'架枪预热 0.8 秒，停火重新预热',heal3:'前摇后治疗最多三名生物友军',shield:'出场护盾为最大生命的 20%，不恢复',rail:'蓄力发射，穿透最多两个敌兵',repair:'维修机械与动力装甲，不恢复护盾'};
class Renderer extends UIComponents {
  constructor(app){super(app);this.units=new TextUnitPresenter();this.combatEffects=new BattleEffects();this.resultVisible=false;}
  get worldCamera(){return this.app.camera;}
  set worldCamera(value){this.app.camera=value;}
  draw(){
    const a=this.app,c=this.ctx;this.buttons=[];const view=a.scene==='battle'&&a.session?a.view:null;this.resultVisible=!!(view&&view.result);
    c.setTransform(a.dpr,0,0,a.dpr,0,0);this.rect(0,0,a.width,a.height,C.shell);c.translate(a.offsetX,a.offsetY);c.scale(a.scale,a.scale);this.rect(0,0,1280,720,C.paper);
    if(view)this.battle(view);else (screens[a.scene]||screens.home)(this);
    if(view&&view.result)this.result(view.result);
    else if(a.modal==='help')this.help();
    else if(a.modal==='defense'&&view)this.defense(view.sides[0]);
    else if(a.modal&&a.modal.unit)this.details(BY_ID[a.modal.unit]);
    else if(a.modal&&a.modal.levelId)this.levelDetails(LEVEL_BY_ID[a.modal.levelId]);
    else if(a.modal&&a.modal.confirm)this.confirm();
    else if(a.modal&&a.modal.cancel!==undefined)this.cancelQueue(view);
    else if(view&&a.paused)this.pause();
    this.drawFeedback();this.toast();
  }
  battle(b){
    const a=this.app,p=b.sides[0],enemy=b.sides[1];this.rect(0,0,1280,142,C.dark);
    [p,enemy].forEach((s,i)=>{const x=i?948:20,color=i?C.red:'#79a78d',evolving=!i&&a.feedback.state('battle:main:era').alpha>0;this.painter.shape(x,17,312,111,evolving?'#456844':'#25493d',evolving?C.gold:'#40614e','round',16);this.badge('shield',x+31,48,21,'#355b49',i?'#e8a98a':C.goldLight);this.fitText((i?'敌方 · ':'我方 · ')+ERAS[s.era].name,x+63,45,234,23,C.white);this.text(Math.ceil(s.hp)+' / '+s.maxHp,x+63,79,22,'#c9d9c6');this.bar(x+24,108,264,8,s.hp/s.maxHp,color);});
    const wallet=this.app.feedback.state('battle:main:wallet');
    this.painter.shape(353,22,179,51,wallet.alpha>0?C.goldLight:'#2b5142',null,'round',14);this.icon('coin',380,48,26,C.gold);this.text(Math.floor(p.gold),403,48,29,wallet.alpha>0?C.ink:C.white);
    this.painter.shape(544,22,227,51,'#2b5142',null,'round',14);this.icon('people',570,48,24,'#b1c8b2');this.text(b.livingPopulation+'+'+(b.population-b.livingPopulation)+' / 30',598,48,23,C.white);
    const remaining=Math.max(0,Math.ceil(b.rules.timeLimit-b.time));this.icon('clock',804,46,22,C.goldLight);this.text(Math.floor(remaining/60)+':'+String(remaining%60).padStart(2,'0'),826,46,25,C.white);
    this.icon('xp',368,95,22,C.gold);this.text('经验 '+Math.floor(p.xp)+(p.era<b.rules.maxEra?' / '+ERAS[p.era+1].xp:' · 时代上限'),390,93,20,'#c6d6c4');
    this.bar(390,116,368,5,p.era<b.rules.maxEra?p.xp/ERAS[p.era+1].xp:1,C.gold);
    this.button('暂停',793,84,120,43,()=>a.pauseBattle(),true,true,{id:'pause',variant:'outline',icon:'pause',onDark:true});
    const c=this.ctx,camera=this.worldCamera;c.save();c.beginPath();c.rect(0,143,1280,347);c.clip();c.translate(640+camera.x,414+camera.y);c.scale(camera.zoom,camera.zoom);c.translate(-640,-414);
    this.landscape(p.era);this.base(0,p);this.base(1,enemy);
    b.strikes.forEach(s=>{const x=100+s.x*1.08;c.save();c.setLineDash([7,6]);this.line(x-113,457,x+113,457,s.side?C.red:C.teal,3);c.restore();this.tag('技能预警',x-55,422,C.redLight,C.red,18,110);});
    b.projectiles.forEach(p=>{const progress=1-p.remaining/p.duration,x=100+(p.from+(p.to-p.from)*progress)*1.08;this.text(p.splash?'●':p.side?'←':'→',x,468,19,p.side?C.red:C.teal,'center');});
    this.combatEffects.draw(this,b);
    this.units.draw(this,b.units);
    [0,1].forEach(side=>{const x=side?1184:94;this.painter.shape(x-48,465,96,24,C.panel,null,'round',9);this.text(side?'敌方基地':'我方基地',x,478,17,side?C.red:C.teal,'center');});c.restore();
    this.tag(b.rules.mode==='campaign'?b.rules.levelId+' '+b.rules.name:'经典对战 · '+({easy:'简单',normal:'普通',hard:'困难'}[b.rules.difficulty]),24,151,C.panel,C.ink,20);
    this.button(camera.zoom>1?'全景':'局部视图',960,150,139,40,()=>{a.camera=camera.zoom>1?{zoom:1,x:0,y:0}:{zoom:1.8,x:0,y:0};},true,true,{id:'camera',variant:'soft',icon:'eye'});
    this.button('回到基地',1110,150,147,40,()=>{a.camera={zoom:1.8,x:432,y:0};},true,true,{id:'camera-home',variant:'soft',icon:'home'});
    this.controls(p,b);
    if(a.skillMode){this.painter.shape(270,194,650,45,C.panel,C.gold,'round',20);this.text('点击战场选择落点；拖动只移动视野',595,216,22,C.teal,'center');this.button('取消施放',540,246,200,41,()=>{a.skillMode=false;},true,true,{id:'skill-cancel',variant:'outline'});}
  }
  screenXToBattle(x){const camera=this.worldCamera;return(((x-640-camera.x)/camera.zoom+640)-100)/1.08;}
  landscape(era){
    if(!this.app.settings.simpleBackground){
      const background=this.app.worldArt.get('battlefield_shared');
      if(background&&background.status==='ready'){
        const scale=1280/background.width;
        this.ctx.drawImage(background.image,0,456-background.ground_y*scale,1280,background.height*scale);return;
      }
    }
    const palettes=[['#e3e8d0','#b8c4a0','#cfd6b8'],['#eadfc8','#cabc9c','#d9cbb1'],['#dee3df','#afbeb7','#c7d0c7'],['#dce4d9','#a9b99f','#c3cfbb'],['#d9e8e0','#9fc4b7','#c1d9cd']],colors=palettes[era];
    this.rect(-800,143,2900,347,colors[0]);
    if(!this.app.settings.simpleBackground){
      for(let i=-2;i<14;i++){const x=i*125,y=346+(i%3)*18;
        if(era===0){this.painter.polygon([[x-58,438],[x+22,y-30],[x+86,438]],colors[2]);this.painter.polygon([[x+21,438],[x+90,y+15],[x+146,438]],colors[1]);}
        else if(era===1){this.rect(x,y,86,107,colors[2]);this.painter.polygon([[x-7,y],[x+43,y-31],[x+92,y]],colors[1]);}
        else if(era===2){this.rect(x,y,87,118,colors[2]);this.rect(x+53,y-31,17,52,colors[1]);this.painter.shape(x-11,y+37,110,80,colors[1],null,'round',18);}
        else if(era===3){this.painter.shape(x,y,91,108,colors[2],null,'round',14);this.line(x,y+26,x+91,y+26,colors[1],3);}
        else{this.painter.polygon([[x,y+33],[x+43,y],[x+87,y+33],[x+87,455],[x,455]],colors[2]);this.line(x+43,y+18,x+43,455,colors[1],2);}
      }
    }
    this.rect(-800,456,2900,34,'#c7cbae');this.line(-800,458,2100,458,'#86967b',2);
  }
  base(side,s){
    const id='base_age'+(s.era+1),center=side?1180:100,color=side?C.red:C.teal;
    const meta=WORLD_ART.buildings[id],box=containRect(meta.width,meta.height,center-80,341,160,115),top=456-box.h;
    const mirror=meta.source_facing==='left'?!side:!!side;
    if(!this.worldImage(id,center-80,341,160,115,{mirror,bottom:true}))this.basePlaceholder(side,s);
    // Stable faction flag and slot markers remain visible without recoloring the art.
    this.line(center-66,top+10,center-66,top-16,color,2);this.painter.polygon([[center-66,top-16],[center-40,top-12],[center-48,top],[center-66,top-3]],color);
    s.towers.forEach((t,i)=>{if(!t)return;const x=center+(side?-1:1)*(i-1)*48,y=top+8,key='tower_age'+(t.era+1)+'_'+t.kind;
      if(!this.worldImage(key,x-23,y-51,46,51,{mirror:!!side,bottom:true}))this.badge('tower',x,y-20,17,C.panel,color);
      this.text((i+1)+(t.level===2?'★':''),x,y+9,13,color,'center');
    });
  }
  basePlaceholder(side,s){
    const x=side?1150:32,color=side?C.red:C.teal,era=s.era;
    this.painter.shape(x-7,433,103,24,'#6c8166',null,'round',10);
    if(era===0){this.painter.shape(x,384,85,62,color,null,'round',9);this.painter.polygon([[x-13,388],[x+42,342],[x+99,388]],color);this.painter.polygon([[x+9,383],[x+42,355],[x+75,383]],'#cfb074');}
    else if(era===1){this.rect(x+4,367,79,78,color);for(let i=0;i<4;i++)this.rect(x+1+i*23,352,17,30,color);this.painter.shape(x+32,406,23,39,'#233e34',null,'round',10);}
    else if(era===2){this.painter.shape(x,374,87,70,color,null,'round',10);this.rect(x+11,361,28,18,color);this.painter.shape(x+44,386,55,15,color,null,'round',5);this.line(x+48,381,x+101,370,color,7);}
    else if(era===3){this.painter.shape(x-3,386,96,58,color,null,'round',24);this.rect(x+14,367,55,31,color);this.painter.shape(x+17,400,52,10,C.dark,null,'round',5);}
    else{this.painter.polygon([[x+42,344],[x+87,372],[x+87,439],[x,439],[x,372]],color);this.painter.polygon([[x+42,360],[x+66,376],[x+66,403],[x+42,418],[x+19,403],[x+19,376]],'#8ec4af');this.icon('bolt',x+42,390,32,C.white);}
  }
  unitLabel(x,y,w,label,side,hp,shield){
    const color=side?C.red:C.teal;this.painter.shape(x,y-14,w,27,C.panel,null,'round',12);this.painter.circle(x+12,y,8,color);this.fitText(label,x+27,y,w-32,19,color);this.bar(x+3,y+16,w-6,3,hp,color);if(shield>0)this.bar(x+3,y+21,w-6,2,shield,'#58998d');
  }
  controls(p,b){
    const a=this.app;this.painter.shape(0,495,1280,225,C.panel,null,'round',18);this.icon('clock',36,524,23,C.muted);this.text('队列',55,524,21,C.muted);
    if(!p.queue.length)this.text('选择兵种，组织下一轮推进。',141,525,21,C.muted);
    p.queue.forEach((q,i)=>{const d=BY_ID[q.typeId],x=140+i*180,state=a.feedback.state('battle:main:queue:'+q.id);
      this.button(d.shortName+(i===0?' '+q.remaining.toFixed(1)+'秒':' · 等待'),x,504,169,39,()=>a.queueCancel(q.id),true,true,{id:'queue:'+q.id,variant:'soft',selected:state.alpha>0,portraitId:d.id});
      if(i===0)this.bar(x+9,548,151,4,1-q.remaining/d.train,C.gold);
    });
    UNITS.filter(u=>u.era===p.era).slice(a.page*3,a.page*3+3).forEach((d,i)=>{
      const x=24+i*244,reason=p.gold<d.cost?'金币不足':p.queue.length>=5?'队列已满':b.population+d.pop>30?'人口已满':null,queueIndex=p.queue.findIndex(q=>q.typeId===d.id),producing=queueIndex===0?p.queue[0]:null;
      this.region(x,565,230,129,()=>a.command({type:'train',id:d.id}),()=>{a.modal={unit:d.id};a.skillMode=false;},{id:'card:'+d.id,enabled:!reason,disabledReason:reason,draw:state=>{
        this.panel(x,565,230,129,state.pressed||state.kind==='success'&&state.alpha>0?C.goldLight:C.panel,14);this.unitPortrait(d.id,x+8,575,62,64);this.fitText(d.name,x+80,586,140,21);
        this.tag(d.role,x+80,605,C.tealLight,C.teal,16);this.icon('coin',x+83,642,15,C.gold);this.text(d.cost+'金 · '+d.pop+'人',x+94,642,16,C.muted);
        if(producing){const progress=Math.max(0,Math.min(1,1-producing.remaining/d.train));this.bar(x+10,569,210,3,progress,C.gold);this.text(Math.round(progress*100)+'%',x+39,647,14,C.teal,'center');}
        else if(queueIndex>0)this.text('排队',x+39,647,14,C.muted,'center');
      }});
      this.button('详情',x+9,660,61,29,()=>{a.modal={unit:d.id};a.skillMode=false;},true,true,{id:'detail:'+d.id,variant:'ghost'});
      this.button(reason||'生产 '+d.train+'秒',x+82,655,139,36,()=>a.command({type:'train',id:d.id}),!reason,true,{id:'train:'+d.id,variant:'primary',disabledReason:reason});
    });
    this.button(a.page?'B 组 → A 组':'A 组 → B 组',762,565,170,42,()=>{a.page=1-a.page;},true,true,{id:'roster-page',variant:'soft',selected:!!a.page});
    this.button('防御塔',762,623,170,66,()=>{a.modal='defense';a.skillMode=false;},true,false,{id:'defense',variant:'primary',icon:'tower'});
    const ready=p.cooldown<=1e-8;
    this.control({id:'skill',x:950,y:557,w:304,h:79,radius:28,action:()=>{a.skillMode=!a.skillMode;},enabled:ready,disabledReason:'技能尚未冷却'},state=>{
      this.painter.shape(950,557,304,79,state.pressed?C.goldLight:C.tealLight,a.skillMode?C.gold:null,'round',28);this.dial(994,596,30,1-p.cooldown/60,ready?C.gold:C.teal);if(!this.worldImage('skill_age'+(p.era+1),972,574,44,44))this.icon('bolt',994,596,26,ready?C.gold:C.teal);this.fitText(ERAS[p.era].skill,1040,582,198,25);this.text(ready?'点击选择落点':'冷却 '+Math.ceil(p.cooldown)+'秒',1040,612,20,ready?C.teal:C.muted);
    });
    const capped=p.era>=b.rules.maxEra,evolved=!capped&&p.xp>=ERAS[p.era+1].xp;
    this.button(capped?'已达时代上限':'进化 → '+ERAS[p.era+1].name,950,650,304,41,()=>a.command({type:'evolve'}),evolved,true,{id:'evolve',variant:'gold',shape:'cut',icon:'xp',disabledReason:capped?'已达到本局时代上限':'进化经验不足'});
    this.text('短按生产 · 长按详情 · A / B 查看六兵 · 密集部队按数量显示',24,709,17,C.muted);
  }
  overlay(title,icon='flag',tone=C.teal){
    this.buttons=[];this.rect(0,0,1280,720,'rgba(15,35,26,0.78)');this.panel(136,64,1008,592,C.panel,25);this.badge(icon,194,112,27,tone===C.red?C.redLight:C.goldLight,tone);this.fitText(title,237,113,710,32);this.line(176,157,1104,157,C.line,1);
  }
  close(){this.button('关闭',968,88,137,47,()=>{this.app.modal=null;},true,true,{id:'close',variant:'ghost',icon:'close'});}
  details(d){
    if(!d)return;this.overlay(d.name+' · '+d.role,d.support?'heart':d.mechanical?'gear':'swords');this.close();
    this.painter.shape(176,186,290,399,C.tealLight,null,'round',20);this.unitPortrait(d.id,186,199,270,350);this.text('静态立绘 · 朝右侧视',321,567,19,C.muted,'center');
    this.fitText(ERAS[d.era].name+' / '+(d.armor==='heavy'?'重甲':'轻甲')+' / '+(d.mechanical?'机械':'生物'),496,179,592,21,C.muted);
    [['heart','生命',d.hp],['swords',d.support?'支援量':'伤害',d.damage],['target','射程',d.range],['flag','移速',d.speed]].forEach(([icon,label,value],i)=>{const x=496+i%2*300,y=207+Math.floor(i/2)*69;this.painter.shape(x,y,280,56,C.tealLight,null,'round',12);this.icon(icon,x+24,y+28,25,C.teal);this.text(label,x+46,y+16,17,C.muted);this.text(value,x+46,y+40,24,C.ink);});
    this.text(d.cost+' 金 · '+d.pop+' 人 · '+d.train+' 秒生产',496,355,22);this.text('间隔 '+d.interval+' 秒 · 前摇 '+d.windup+' 秒',496,386,20,C.muted);
    this.wrap(TRAITS[d.trait]||(DAMAGE[d.type]+'伤害，自动锁定最近有效敌兵'),496,422,592,20,26);
    this.icon('check',507,482,22,C.teal);this.wrap('优势：'+d.strength,531,482,557,20,26);
    this.icon('shield',507,529,22,C.red);this.wrap('弱点：'+d.weakness,531,529,557,20,26);
    this.icon('people',507,576,22,C.gold);this.wrap('搭配：'+d.partners,531,576,557,20,26);
    this.text(this.app.scene==='battle'?'详情不暂停战斗；需要时请先暂停。':'每个时代六种兵，进化后全部开放。',184,627,20,C.muted);
  }
  levelDetails(l){
    const a=this.app;this.overlay(l.id+' '+l.name,'flag');this.close();this.text(l.lesson,184,178,25,C.teal);
    this.text('时代：'+ERAS[l.startEra].name+(l.startEra===l.maxEra?'（固定）':' → '+ERAS[l.maxEra].name),184,225,23);
    this.text('目标：'+(l.objective==='survive'?'存活到时限，或提前摧毁敌基地':'在时限内摧毁敌基地')+' · '+l.timeLimit/60+' 分钟',184,272,23);
    this.text('双方金币 '+Math.ceil(200*ERAS[l.startEra].cost)+' · EXP '+ERAS[l.startEra].xp+' · 我方基地 3000',184,319,23);
    this.text('敌基地 '+l.enemyHp+' · 敌金币收入 ×'+l.enemyIncome+(l.initialTower!==null?' · 初始'+ERAS[l.startEra].towers[l.initialTower]:''),184,366,23);
    const strategy={melee:'石棒为主，少量投石',beast:'存钱生产猛犸，石棒掩护',tribe:'石棒、投石混编，后段加入猛犸',mixed:'普通混编，达标后进化',phalanx:'重甲枪兵配长弓，间歇补线',fort:'建塔、剑盾掩护长弓',volley:'前期战车，进化后火枪齐射',crowd:'连续刺刀步兵配火枪',artillery:'塔下火枪、间歇重炮',armor:'偏重机枪与履带车',medical:'机枪配医疗推进',pressure:'突击、火箭、履带车混编',energy:'动力装甲配等离子',repair:'动力装甲、维修与塔',adaptive:'按敌军调整反制、支援和攻城组合'};
    this.wrap('敌军：'+strategy[l.strategy],184,413,850,23,32);this.text('敌方防御策略：'+(l.buildTowers?'根据战线建塔':'不建塔'),184,455,22,C.muted);
    if(l.wave)this.text('补兵指令：每 '+l.wave.period+' 秒，前 '+l.wave.active+' 秒补兵；休整时队列继续。',184,486,22,C.muted);
    const open=unlocked(a.progress,l.id);this.button(open?'开始挑战':'先通关前一关',184,542,426,62,()=>a.requestStartBattle({mode:'campaign',levelId:l.id}),open,false,{id:'start-level',variant:'gold',shape:'cut',icon:open?'play':'lock',disabledReason:'请先通关前一关'});
    this.button('查看本章兵种',642,542,426,62,()=>{a.codexEra=l.chapter;a.navigate('codex');},true,false,{id:'codex',variant:'outline',icon:'book'});
  }
  defense(p){
    this.overlay('基地防御','tower');this.close();const a=this.app;
    p.towers.forEach((t,i)=>{const x=178+i*313,state=a.feedback.state('battle:defense:tower:'+i);this.panel(x,185,296,355,state.alpha>0?C.goldLight:'#f0efdd');this.badge(i>=p.slots?'lock':'tower',x+32,222,19,C.tealLight);this.text('塔位 '+(i+1),x+60,222,26);
      if(i>=p.slots){this.text('尚未开放',x+16,275,23,C.muted);if(i===p.slots)this.button('开放 '+[0,200,350][i]+' 金',x+16,450,264,55,()=>a.command({type:'unlock'}),true,true,{id:'unlock:'+i,variant:'gold'});}
      else if(!t){this.text('空塔位',x+16,275,23,C.muted);[0,1].forEach(kind=>this.button(ERAS[p.era].towers[kind]+' '+Math.ceil([180,240][kind]*ERAS[p.era].cost)+'金',x+12,334+kind*81,272,60,()=>a.command({type:'build',slot:i,kind}),true,true,{id:'build:'+i+':'+kind,variant:kind?'outline':'primary',worldAssetId:'tower_age'+(p.era+1)+'_'+kind}));}
      else{this.fitText(ERAS[t.era].towers[t.kind],x+16,275,264,24);this.tag('等级 '+t.level,x+16,309,C.tealLight,C.teal,19);this.worldImage('tower_age'+(t.era+1)+'_'+t.kind,x+186,292,92,58);this.button(t.level===2?'已满级':'升级 '+Math.ceil(t.cost*0.6)+'金',x+16,366,264,55,()=>a.command({type:'upgrade',slot:i}),t.level<2,true,{id:'upgrade:'+i,variant:'gold',disabledReason:'防御塔已满级'});this.button('出售 +'+Math.floor(t.paid*0.5)+'金',x+16,445,264,55,()=>a.command({type:'sell',slot:i}),true,true,{id:'sell:'+i,variant:'outline'});}
    });this.text('面板打开时战斗继续；旧时代防御塔会保留。',184,582,22,C.muted);
  }
  pause(){const a=this.app;this.overlay('对战已暂停','pause');this.text('双方计时、收入、前摇与弹丸都已停止。',184,213,25,C.muted);this.text('本局每 5 秒和进入后台时自动保存。',184,270,24,C.muted);
    this.button('继续战斗',184,354,426,64,()=>a.continueBattle(),true,false,{id:'continue',variant:'gold',shape:'cut',icon:'play'});this.button('操作说明',642,354,426,64,()=>{a.modal='help';},true,false,{id:'help',variant:'outline',icon:'book'});this.button('投降',184,469,426,64,()=>{a.modal={confirm:'surrender'};},true,false,{id:'surrender',variant:'danger'});this.button('保存并返回首页',642,469,426,64,()=>a.saveAndReturnHome(),true,false,{id:'save-home',icon:'home'});}
  confirm(){
    const a=this.app,surrender=a.modal.confirm==='surrender',options=a.modal.options;this.overlay(surrender?'确认投降？':'覆盖未完成的对局？',surrender?'flag':'clock',surrender?C.red:C.gold);
    this.wrap(surrender?'投降后本局判负，战役不会解锁下一关。':'开始新局会替换当前续局存档。你也可以返回首页继续上次对局。',184,242,850,26,40);
    this.button('取消',184,450,426,64,()=>{a.modal=null;},true,false,{id:'cancel',variant:'outline'});this.button(surrender?'确认投降':'开始新局',642,450,426,64,()=>{a.modal=null;if(surrender)a.command({type:'surrender'});else a.startBattle(options);},true,false,{id:'confirm',variant:surrender?'danger':'gold',shape:'cut'});
  }
  cancelQueue(view){
    const a=this.app,id=a.modal.cancel,p=view.sides[0],index=p.queue.findIndex(q=>q.id===id);this.overlay('取消生产','clock');this.close();
    if(index<0){this.text('该单位已经出场或队列已发生变化。',184,253,25);return;}
    const q=p.queue[index],refund=Math.floor(q.paid*(index===0?0.75:1));this.unitPortrait(q.typeId,184,194,166,240);this.text(BY_ID[q.typeId].name+' · '+(index===0?'正在生产':'等待生产'),386,237,27);
    this.tag('返还 '+refund+' 金币',386,289,C.goldLight,C.ink,24,226);this.text(index===0?'正在生产的单位返还实付费用的 75%。':'等待生产的单位全额退款。',386,355,24,C.muted);this.text('确认时按当前队列核对；出生后不能取消。',386,407,22,C.muted);
    this.button('确认取消',184,475,884,64,()=>{a.modal=null;a.command({type:'cancel',id});},true,false,{id:'confirm-cancel',variant:'gold',shape:'cut'});
  }
  result(result){
    const a=this.app,win=result.winner===0,draw=result.winner===null,tone=draw?C.teal:win?C.gold:C.red,icon=draw?'draw':win?'shield':'close';
    this.overlay(draw?'平局':win?'战斗胜利':'战斗失败',icon,tone);this.badge(icon,241,219,43,draw?C.tealLight:win?C.goldLight:C.redLight,tone);
    this.text(result.reason,312,198,27,tone);this.text('对局 '+Math.floor(result.time/60)+'分'+Math.floor(result.time%60)+'秒',312,244,24,C.muted);
    result.stats.forEach((s,i)=>{const x=184+i*458,color=i?C.red:C.teal;this.panel(x,293,426,145);this.badge(ERA_ICONS[s.highestEra],x+27,324,17,i?C.redLight:C.tealLight,color);this.text((i?'敌方':'我方')+' · '+ERAS[s.highestEra].name,x+54,323,23);this.text('生产 '+s.produced+' · 击杀 '+s.kills,x+20,363,23,C.muted);this.text('基地 '+Math.round(s.hp/s.maxHp*100)+'%',x+20,409,23,color);this.bar(x+145,405,258,8,s.hp/s.maxHp,color);});
    this.button('重试',184,478,270,64,()=>a.retry(),true,false,{id:'retry',variant:'gold',shape:'cut',icon:'play'});this.button('返回首页',798,478,270,64,()=>a.returnHome(),true,false,{id:'home',variant:'outline',icon:'home'});
    const l=LEVEL_BY_ID[result.levelId];if(win&&l&&LEVELS[l.index+1])this.button('下一关',491,478,270,64,()=>a.nextLevel(),true,false,{id:'next',icon:'chevron'});
    else if(win&&l&&l.index===14)this.text('五章战役全部通关！',640,591,28,C.teal,'center');
  }
  help(){
    this.overlay('如何指挥军队','book');this.close();
    ['短按卡片生产，长按查看详情；A / B 切换六种兵。','队列最多 5 项，人口最多 30；取消前可核对退款。','穿甲克重甲，爆破克兵群，攻城武器擅长拆基地。','经验达标可进化，旧兵、队列、防御塔和冷却保留。','建塔保护基地；技能有 1 秒预警，确认落点后消耗冷却。','局部视图可拖动；切后台会暂停，返回需手动继续。','战役按目标判定；经典 20 分钟到时比较基地生命比例。','在线 PvP 尚未开放，单机进度只保存在本设备。'].forEach((s,i)=>{this.painter.circle(200,193+i*52,14,C.tealLight);this.text(i+1,200,193+i*52,18,C.teal,'center');this.fitText(s,231,193+i*52,860,23);});
  }
}
module.exports={Renderer};

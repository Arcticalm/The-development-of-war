'use strict';
const {ERAS,UNITS,BY_ID}=require('./data');
const ART=require('./art-map');
const {BattleAnimation}=require('./animation');
const C={paper:'#eee4ce',ink:'#283a36',muted:'#6f7568',teal:'#347b70',red:'#b9664e',gold:'#d0a34f',panel:'#faf4e6',line:'#cec4ae'};
const DAMAGE={normal:'普通',piercing:'穿甲',explosive:'爆破',siege:'攻城',energy:'能量'};
const TRAITS={base:'对基地伤害提高',splashBase:'范围爆破 / 攻城加成',haste:'附近友军攻速 +15%',shieldWall:'单体远程普攻减伤 20%',mechanical:'机械单位',charge:'首次攻击强化',heal:'治疗单个生物友军',mechanicalSplash:'机械 / 范围攻城',splash:'范围伤害',march:'附近友军移动速度 +20%',sniper:'优先攻击射程内支援兵',warmup:'架枪 0.8 秒后持续射击',heal3:'治疗最多 3 个生物友军',shield:'出场护盾为生命值的 20%',rail:'穿透最多 2 个目标',repair:'维修机械与动力装甲友军'};
class Renderer {
  constructor(app){this.app=app;this.ctx=app.ctx;this.buttons=[];this.images={};this.animation=new BattleAnimation();this.worldCamera={zoom:1,x:0,y:0};Object.keys(ART).forEach(id=>{const img=app.wx.createImage();img.onload=()=>{this.images[id]=img;};img.onerror=()=>{};img.src=ART[id].path;});}
  rect(x,y,w,h,color){const c=this.ctx;c.fillStyle=color;c.fillRect(x,y,w,h);}
  text(text,x,y,size=22,color=C.ink,align='left'){const c=this.ctx;c.fillStyle=color;c.font=`${size}px sans-serif`;c.textAlign=align;c.textBaseline='middle';c.fillText(String(text),x,y);}
  line(x,y,x2,y2,color=C.line,width=2){const c=this.ctx;c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
  button(label,x,y,w,h,action,active=true,small=false){this.rect(x,y,w,h,active?C.teal:'#b8b9aa');this.text(label,x+w/2,y+h/2,small?18:22,active?'#fff':'#4f5a50','center');if(active)this.buttons.push({x,y,w,h,action});}
  bar(x,y,w,h,value,color){this.rect(x,y,w,h,C.line);this.rect(x,y,w*Math.max(0,Math.min(1,value)),h,color);}
  draw(){const a=this.app,c=this.ctx;this.buttons=[];c.setTransform(a.dpr,0,0,a.dpr,0,0);this.rect(0,0,a.width,a.height,'#202e2a');c.translate(a.offsetX,a.offsetY);c.scale(a.scale,a.scale);this.rect(0,0,1280,720,C.paper);
    if(a.scene==='home')this.home();else this.battle();
    if(a.toastTime>0){this.rect(270,465,740,40,C.ink);this.text(a.toast,640,485,19,'#fff','center');}
  }
  home(){const a=this.app;
    this.rect(0,0,1280,12,C.teal);this.text('AGE / EVOLUTION',80,84,20,C.teal);this.text('战争进化史',80,158,58);this.text('从石棒到磁轨炮，让你的阵容跨越五个时代。',84,222,22,C.muted);
    this.rect(78,272,684,220,C.panel);this.text('经典对战 · PvE',104,307,28);this.text('公平资源  /  自动战斗  /  五时代 30 种兵',104,350,21,C.muted);
    [['easy','简单'],['normal','普通'],['hard','困难']].forEach(([id,name],i)=>this.button((a.difficulty===id?'● ':'')+name,104+i*200,390,180,54,()=>{a.difficulty=id;}));
    this.button('开始对战',78,520,330,64,()=>a.startBattle());this.button('继续上次对战',432,520,330,64,()=>a.resume(),!!a.saved);
    this.button('操作说明',78,610,210,45,()=>{a.modal='help';},true,true);this.text('战役与在线 PvP 开发中 · 当前为可玩原型',320,633,20,C.muted);
    this.rect(816,90,388,520,'#d7ddc8');this.text('五个时代 / 一条战线',1010,126,23,C.teal,'center');
    [0,1,2,3,4].forEach((era,i)=>{this.text('0'+(i+1),850,198+i*83,22,C.teal);this.text(ERAS[era].name,912,198+i*83,24);if(i<4)this.line(860,224+i*83,860,253+i*83);});
    if(a.saveUnavailable)this.text('未能读取本地存档，可直接开始新局',80,692,18,C.red);if(a.modal==='help')this.help();
  }
  portrait(d,x,y,size,side=0){const image=this.images[d.id],c=this.ctx;
    if(image){c.save();if(side){c.translate(x+size,y);c.scale(-1,1);c.drawImage(image,0,0,size,size);}else c.drawImage(image,x,y,size,size);c.restore();}
    else{this.rect(x,y,size,size,'#d8d5c3');this.text(d.support?'援':d.armor==='heavy'?'重':DAMAGE[d.type][0],x+size/2,y+size*0.4,size*0.42,side?C.red:C.teal,'center');this.text('待绘制',x+size/2,y+size*0.82,Math.max(11,size*0.18),C.muted,'center');}
  }
  battle(){const a=this.app,b=a.battle,p=b.sides[0],enemy=b.sides[1];
    this.rect(0,0,1280,142,C.panel);this.text('我方 · '+ERAS[p.era].name,28,30,25,C.teal);this.text('敌方 · '+ERAS[enemy.era].name,900,30,25,C.red);
    this.bar(28,57,326,13,p.hp/p.maxHp,C.teal);this.bar(900,57,326,13,enemy.hp/enemy.maxHp,C.red);this.text(`${Math.ceil(p.hp)} / ${p.maxHp}`,28,90,18);this.text(`${Math.ceil(enemy.hp)} / ${enemy.maxHp}`,900,90,18);
    this.text('金币 '+Math.floor(p.gold),390,30,24);this.text('人口 '+b.population(0)+' / 30',390,64,21);this.text('经验 '+Math.floor(p.xp)+(p.era<4?' / '+ERAS[p.era+1].xp:' · 已达顶峰'),390,99,20);
    const t=Math.floor(b.time);this.text(`${Math.floor(t/60).toString().padStart(2,'0')}:${(t%60).toString().padStart(2,'0')}`,751,32,25);this.button('暂停',720,66,130,48,()=>{a.paused=true;a.save();},!b.result);
    const c=this.ctx;this.animation.update(b);this.worldCamera=this.animation.camera();
    c.save();c.beginPath();c.rect(0,143,1280,347);c.clip();c.translate(640+this.worldCamera.x,414+this.worldCamera.y);c.scale(this.worldCamera.zoom,this.worldCamera.zoom);c.translate(-640,-414);
    this.landscape(p.era,b.time);this.base(0,p);this.base(1,enemy);
    b.strikes.forEach(s=>{const x=100+s.x*1.08;c.beginPath();c.arc(x,381,110,0,Math.PI*2);c.strokeStyle=s.side?C.red:C.teal;c.lineWidth=3;c.stroke();this.text('技能预警',x,255,19,s.side?C.red:C.teal,'center');});
    this.animation.fallen.forEach(u=>this.unit(u,true));
    b.units.slice().sort((u,v)=>(u.id%3)-(v.id%3)||u.id-v.id).forEach(u=>this.unit(u));
    b.effects.forEach(e=>this.effect(e));
    this.text('我方基地',94,466,18,C.ink,'center');this.text('敌方基地',1184,466,18,C.ink,'center');c.restore();this.controls(p,b);
    if(a.skillMode){this.text('点击战场选择技能落点',640,181,27,C.teal,'center');this.button('取消施放',550,216,180,40,()=>{a.skillMode=false;},true,true);}
    if(a.modal==='defense')this.defense(p);if(a.modal&&a.modal.unit)this.details(BY_ID[a.modal.unit]);
    if(a.paused&&!b.result)this.pause();if(a.modal==='help')this.help();if(b.result)this.result(b.result);
  }
  screenXToBattle(x){const camera=this.worldCamera;return(((x-640-camera.x)/camera.zoom+640)-100)/1.08;}
  landscape(era,time){
    const c=this.ctx,palettes=[['#dce2d0','#bfcbb4','#8b9b78'],['#e6dfc8','#c8c8ad','#a0a17b'],['#ddd9cc','#b7bfbd','#85958c'],['#d7e0df','#b6c5c3','#829896'],['#d3e2e1','#a7c6c4','#698f90']],colors=palettes[era];
    this.rect(-32,130,1344,360,colors[0]);
    c.save();c.globalAlpha=0.25;c.fillStyle='#fff8df';c.beginPath();c.arc(1040,203,36,0,Math.PI*2);c.fill();
    for(let i=0;i<4;i++){const x=((i*390+time*2)%1600)-160;c.beginPath();c.ellipse(x,210+i%2*26,80,10,0,0,Math.PI*2);c.fill();}c.restore();
    c.beginPath();c.moveTo(-32,352);for(let i=0;i<9;i++)c.lineTo(i*180-32,300+Math.sin(i*1.7+era)*42);c.lineTo(1312,447);c.lineTo(-32,447);c.fillStyle=colors[1];c.fill();
    c.save();c.globalAlpha=0.4;
    for(let i=0;i<13;i++){const x=i*112+Math.sin(i*2)*24,y=365+Math.sin(i)*9;if(era<2){c.fillStyle=colors[2];c.beginPath();c.moveTo(x,y-50);c.lineTo(x-22,y);c.lineTo(x+25,y);c.fill();this.rect(x-3,y,6,18,colors[2]);}else{this.rect(x,y-38-(i%3)*16,34,62,colors[2]);for(let j=0;j<3;j++)this.rect(x+7,y-26+j*13,5,5,colors[0]);}}c.restore();
    this.rect(-32,410,1344,80,colors[2]);this.rect(-32,413,1344,33,'rgba(238,228,206,0.16)');
    this.line(-32,410,1312,410,colors[1],3);
    for(let i=0;i<33;i++){const x=i*41+12,y=466+(i%3)*8;this.line(x,y,x+5+Math.sin(time*1.8+i)*2,y-7,'rgba(40,58,54,0.22)',2);}
  }
  unit(u,fallen=false){
    const d=BY_ID[u.typeId],c=this.ctx,mounted=/chariot|age1_heavy/.test(d.id),size=mounted?126:d.mechanical?110:d.pop===3?105:83;
    const x=100+u.x*1.08,ground=414+(u.id%3)*7,pose=this.animation.pose(u),dir=u.side?-1:1;
    c.save();c.globalAlpha=0.19;c.fillStyle=C.ink;c.beginPath();c.ellipse(x,ground+2,size*0.28,4,0,0,Math.PI*2);c.fill();c.restore();
    c.save();c.translate(x,ground);c.scale(dir,1);
    if(fallen){const progress=(this.animation.time-u.deathAt)/0.65;c.globalAlpha=1-progress;c.translate(progress*9,progress*7);c.rotate(progress*1.15);}
    else{c.globalAlpha=0.5+pose.spawn*0.5;c.translate(pose.lunge,-pose.bob);c.rotate(pose.tilt);}
    const image=this.images[d.id];
    if(image){
      if(!fallen&&!pose.machine&&!pose.mounted){
        const iw=image.width||200,ih=image.height||200,hip=size*0.66;
        for(let leg=0;leg<2;leg++){c.save();c.translate((leg?1:-1)*pose.stride,0);c.drawImage(image,leg*iw/2,ih*0.65,iw/2,ih*0.35,-size/2+leg*size/2,-size*0.35,size/2,size*0.35);c.restore();}
        c.drawImage(image,0,0,iw,ih*0.67,-size/2,-size,size,hip+size*0.01);
      }else c.drawImage(image,-size/2,-size,size,size);
    }else this.portrait(d,-size/2,-size,size);
    if(!fallen){
      if(pose.flash&&!d.support){c.save();c.globalAlpha=0.85;if(d.range<=70){c.beginPath();c.arc(size*0.35,-size*0.45,size*0.22,-1.4,1.1);c.strokeStyle=d.type==='energy'?'#80e9df':'#f8e5ad';c.lineWidth=4;c.stroke();}else{const color=d.type==='energy'?'#7fe9ed':'#ffe4a0';c.beginPath();c.moveTo(size*0.35,-size*0.48);c.lineTo(size*0.65,-size*0.48-5);c.lineTo(size*0.47,-size*0.48+5);c.closePath();c.fillStyle=color;c.fill();}c.restore();}
      if(pose.hurt>0){for(let i=0;i<4;i++){const a=i*1.5+0.3,r=(1-pose.hurt)*14+3;this.line(Math.cos(a)*r,-size*0.55+Math.sin(a)*r,Math.cos(a)*(r+4),-size*0.55+Math.sin(a)*(r+4),'#fff3c8',2);}}
      if(pose.healing>0||pose.supporting){c.save();c.globalAlpha=pose.healing||0.4;const rhythm=d.trait==='haste'||d.trait==='march',color=rhythm?C.gold:d.trait==='repair'?'#aee6ee':'#7ace9a';if(rhythm){c.beginPath();c.arc(size*0.1,-size*0.48,12+Math.sin(this.animation.time*9)*3,-1,1);c.strokeStyle=color;c.lineWidth=2;c.stroke();}else for(let i=0;i<3;i++){const cy=-size*0.32-((this.animation.time*22+i*16)%35);this.line(i*11-10,cy,i*11-10,cy-6,color,2);this.line(i*11-13,cy-3,i*11-7,cy-3,color,2);}c.restore();}
      if(pose.moving){c.save();c.globalAlpha=0.18;for(let i=0;i<2;i++){c.beginPath();c.arc(-size*0.22-i*8,2-i*2,2+(Math.abs(pose.step))*2,0,Math.PI*2);c.fillStyle='#ede0bf';c.fill();}c.restore();}
    }
    c.restore();
    if(!fallen){this.bar(x-size*0.32,ground-size-5,size*0.64,4,u.hp/d.hp,u.side?C.red:C.teal);if(u.shield>0){this.bar(x-size*0.32,ground-size-11,size*0.64,3,u.shield/(d.hp*0.2),'#61a9bd');c.save();c.globalAlpha=0.18+Math.sin(this.animation.time*3)*0.04;c.beginPath();c.ellipse(x,ground-size*0.46,size*0.4,size*0.5,0,0,Math.PI*2);c.strokeStyle='#7cdbed';c.lineWidth=2;c.stroke();c.restore();}}
  }
  effect(e){
    const c=this.ctx,from=100+e.from*1.08,to=100+e.to*1.08;
    if(e.blast){const p=1-e.life/0.4;c.save();c.globalAlpha=1-p;c.beginPath();c.arc(to,387,30+p*90,0,Math.PI*2);c.strokeStyle=C.gold;c.lineWidth=12*(1-p)+2;c.stroke();for(let i=0;i<8;i++){const angle=i*Math.PI/4;this.line(to+Math.cos(angle)*p*70,387+Math.sin(angle)*p*30,to+Math.cos(angle)*(p*70+14),387+Math.sin(angle)*(p*30+8),'#f6df94',3);}c.restore();}
    else{const p=Math.max(0,Math.min(1,1-e.life/0.2)),x=from+(to-from)*p,y=366-Math.sin(p*Math.PI)*14;c.save();c.globalAlpha=Math.min(1,e.life*8);this.line(x-(to-from)*0.12,y,x,y,e.side?'#eab59b':'#e7d89d',3);c.beginPath();c.arc(x,y,3,0,Math.PI*2);c.fillStyle='#fff0b7';c.fill();c.restore();}
  }
  base(side,s){const x=side?1166:46;this.rect(x,324,68,90,side?C.red:C.teal);this.rect(x-10,310,88,22,C.ink);this.rect(x+24,371,23,43,'#263a32');this.text(String(s.era+1),x+34,350,25,'#fff','center');s.towers.forEach((t,i)=>{if(t){this.rect(x-2+i*25,279,18,28,C.ink);this.rect(x-2+i*25,271,18,8,C.gold);}});}
  controls(p,b){const a=this.app;this.rect(0,495,1280,225,C.panel);this.text('生产队列 · 点击取消',24,515,17,C.muted);
    p.queue.forEach((q,i)=>{const d=BY_ID[q.typeId],x=208+i*143;this.button(d.name,x,500,134,30,()=>a.command({type:'cancel',id:q.id}),!b.result,true);if(i===0)this.bar(x,533,134,4,1-q.remaining/d.train,C.gold);});
    UNITS.filter(u=>u.era===p.era).slice(a.page*3,a.page*3+3).forEach((d,i)=>{const x=24+i*244;this.rect(x,549,230,142,'#e6e3d2');this.portrait(d,x+8,560,65);this.text(d.name,x+82,566,20);this.text(`${d.cost} 金 / ${d.pop} 人`,x+82,594,17,C.muted);
      this.button('详情',x+8,637,64,40,()=>{a.modal={unit:d.id};},!b.result,true);this.button('生产 '+d.train+'秒',x+82,628,139,49,()=>a.command({type:'train',id:d.id}),!b.result,true);
    });
    this.button(a.page?'B 组 → A 组':'A 组 → B 组',762,550,172,42,()=>{a.page=1-a.page;},!b.result,true);this.button('防御塔',762,609,172,68,()=>{a.modal='defense';a.skillMode=false;},!b.result);
    this.button(p.cooldown>0?'技能 '+Math.ceil(p.cooldown)+'秒':'技能 · 选择落点',950,550,304,55,()=>{a.skillMode=!a.skillMode;},!b.result&&p.cooldown<=0,true);
    this.button(p.era===4?'已达未来科技':'进化 → '+ERAS[p.era+1].name,950,620,304,57,()=>a.command({type:'evolve'}),!b.result&&p.era<4,true);
    this.text('出兵自动作战 · 长时间离开前请暂停 · 原型数值待验证',24,707,16,C.muted);
  }
  overlay(title){this.buttons=[];this.rect(0,0,1280,720,'rgba(20,35,30,0.76)');this.rect(215,104,850,508,C.panel);this.text(title,255,148,32);}
  close(){this.button('关闭',904,120,126,44,()=>{this.app.modal=null;},true,true);}
  details(d){this.overlay(d.name);this.close();this.portrait(d,250,205,180);this.text(`生命 ${d.hp}   伤害 ${d.damage}   射程 ${d.range}`,470,228,23);this.text(`${d.armor==='heavy'?'重甲':'轻甲'} / ${d.support?'支援':DAMAGE[d.type]} / ${d.mechanical?'机械':'生物'}`,470,277,23);this.text(`${d.cost} 金币 · ${d.pop} 人口 · ${d.train} 秒生产`,470,326,22);this.text(TRAITS[d.trait]||'自动攻击最近的敌方单位',255,442,24,C.teal);this.text('查看详情时战斗仍继续；使用暂停按钮可停止双方模拟。',255,553,20,C.muted);}
  defense(p){this.overlay('基地防御');this.close();const a=this.app;
    p.towers.forEach((t,i)=>{const x=248+i*263;this.rect(x,199,246,327,'#e3e4d5');this.text('塔位 '+(i+1),x+16,229,23);
      if(i>=p.slots){this.text('尚未开放',x+16,287,22,C.muted);if(i===p.slots)this.button('开放 '+[0,200,350][i]+' 金',x+16,431,214,52,()=>a.command({type:'unlock'}),true,true);}
      else if(!t){this.text('空塔位',x+16,283,22,C.muted);[0,1].forEach(kind=>this.button(ERAS[p.era].towers[kind]+' '+Math.ceil([180,240][kind]*ERAS[p.era].cost),x+12,337+kind*71,222,56,()=>a.command({type:'build',slot:i,kind}),true,true));}
      else{this.text(ERAS[t.era].towers[t.kind],x+16,285,22);this.text('等级 '+t.level,x+16,324,20);this.button(t.level===2?'已满级':'升级 '+Math.ceil(t.cost*0.6)+' 金',x+16,363,214,51,()=>a.command({type:'upgrade',slot:i}),t.level<2,true);this.button('出售 +'+Math.floor(t.paid*0.5),x+16,435,214,51,()=>a.command({type:'sell',slot:i}),true,true);}
    });this.text('防御面板打开时战斗继续；旧时代防御塔会保留。',255,568,20,C.muted);}
  pause(){this.overlay('对战已暂停');const a=this.app;this.text('双方计时、收入和战斗都已停止。',255,221,24,C.muted);this.text('切回前台后需手动继续；本局每 5 秒自动保存。',255,271,22,C.muted);this.button('继续战斗',255,344,355,60,()=>{a.paused=false;a.modal=null;a.lastTime=0;});this.button('操作说明',646,344,355,60,()=>{a.modal='help';});this.button('投降并返回首页',255,449,746,60,()=>{a.battle.command(0,{type:'surrender'});a.clearSave();a.paused=false;a.scene='home';a.modal=null;});}
  result(r){this.overlay(r.winner===null?'势均力敌 · 平局':r.winner===0?'胜利 · 基地突破':'本次战斗失败');this.text(r.reason,255,225,27,C.muted);this.text(`对局 ${Math.floor(r.time/60)} 分 ${Math.floor(r.time%60)} 秒 · 击败敌兵 ${this.app.battle.sides[0].kills}`,255,300,24);this.button('再战一局',255,425,355,68,()=>this.app.startBattle());this.button('返回首页',646,425,355,68,()=>{this.app.scene='home';this.app.modal=null;this.app.paused=false;});}
  help(){this.overlay('如何指挥你的军队');this.close();['1  点击“生产”出兵，先用前排保护远程；A / B 切换六种兵。','2  队列最多 5 项，人口上限 30；点击队列条目取消生产。','3  穿甲克重甲，爆破克兵群，攻城武器擅长摧毁基地。','4  金币与经验随时间增加；经验达标后点击“进化”。','5  防御塔保护基地；技能冷却结束后点击战场选择落点。','6  基地生命归零结束；20 分钟到时比较剩余生命比例。'].forEach((s,i)=>this.text(s,255,223+i*54,21,C.ink));this.text('当前为离线经典 PvE；战役、在线 PvP 与完整动画尚未开放。',255,572,19,C.red);}
}
module.exports={Renderer};

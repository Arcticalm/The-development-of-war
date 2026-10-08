'use strict';
const {Battle}=require('./battle');
const {ERAS}=require('./data');
const {LEVELS,LEVEL_BY_ID}=require('./config/modes');
const {LocalBattleSession}=require('./sessions/local');
const {StorageService,KEYS,unlocked,settleProgress}=require('./services/storage');
const {AudioService}=require('./services/audio');
const {UnavailablePvpService}=require('./services/pvp');
const {Renderer}=require('./renderer');
const SAVE_KEY=KEYS.snapshot;
let matchSequence=0;
/** 应用流程：平台事件 -> 场景/对局会话；不计算战斗伤害。 */
class GameApp {
  constructor(platform,services={}){
    this.wx=platform;this.canvas=platform.createCanvas();this.ctx=this.canvas.getContext('2d');
    this.storage=services.storage||new StorageService(platform);this.settings=this.storage.loadSettings();this.progress=this.storage.loadProgress();
    this.audio=services.audio||new AudioService(platform,this.settings);this.pvp=services.pvp||new UnavailablePvpService();
    this.session=null;this.scene='home';this.page=0;this.modal=null;this.skillMode=false;this.hidden=false;
    this.toast='';this.toastTime=0;this.difficulty='normal';this.lastTime=0;this.saveClock=0;this.chapter=0;this.codexEra=0;
    this.camera={zoom:1,x:0,y:0};this.pointer=null;this.saved=null;this.saveUnavailable=false;this.invalidSaved=false;this.settledMatch=null;
    const raw=this.storage.read(SAVE_KEY);
    const restored=Battle.restore(raw);
    if(restored&&!this.progress.settled.includes(restored.matchId))this.saved=restored.snapshot();
    else if(raw||this.storage.read('war.pve.snapshot.v1'))this.invalidSaved=true;
    this.saveUnavailable=this.storage.failed;
    this.renderer=new Renderer(this);this.resize();
    const point=e=>e.changedTouches&&e.changedTouches[0]||e.touches&&e.touches[0];
    const coords=t=>[t.clientX===undefined?t.x:t.clientX,t.clientY===undefined?t.y:t.clientY];
    platform.onTouchStart(e=>{const t=point(e);if(t){const p=coords(t);if(platform.onTouchEnd)this.touchStart(...p);else this.touch(...p);}});
    if(platform.onTouchMove)platform.onTouchMove(e=>{const t=point(e);if(t)this.touchMove(...coords(t));});
    if(platform.onTouchEnd)platform.onTouchEnd(e=>{const t=point(e);if(t)this.touchEnd(...coords(t));else this.pointer=null;});
    if(platform.onTouchCancel)platform.onTouchCancel(()=>{this.pointer=null;});
    platform.onHide(()=>{this.hidden=true;this.pointer=null;this.audio.setHidden(true);if(this.session&&!this.session.getViewState().result&&this.session.capabilities.canPause){this.session.pause();this.save();}this.lastTime=0;});
    platform.onShow(()=>{this.hidden=false;this.audio.setHidden(false);this.resize();this.lastTime=0;});
    if(platform.onWindowResize)platform.onWindowResize(()=>{this.pointer=null;this.resize();});
  }
  // 兼容已有模型测试；界面只通过 view 读取状态。
  get battle(){return this.session?this.session.model:null;}
  get view(){return this.session?this.session.getViewState():null;}
  get paused(){return !!(this.session&&this.session.paused);}
  set paused(value){if(this.session)value?this.session.pause():this.session.resume();}
  resize(){
    const info=this.wx.getWindowInfo?this.wx.getWindowInfo():this.wx.getSystemInfoSync();
    const w=info.windowWidth,h=info.windowHeight,dpr=Math.min(info.pixelRatio||1,3),safe=info.safeArea||{left:0,top:0,right:w,bottom:h};
    this.canvas.width=Math.round(w*dpr);this.canvas.height=Math.round(h*dpr);
    let left=Math.max(0,safe.left),top=Math.max(0,safe.top),right=Math.min(w,safe.right),bottom=Math.min(h,safe.bottom);
    if(this.wx.getMenuButtonBoundingClientRect){const menu=this.wx.getMenuButtonBoundingClientRect();if(menu&&menu.bottom>0)top=Math.max(top,menu.bottom+4);}
    if(right-left<100||bottom-top<100){left=0;top=0;right=w;bottom=h;}
    this.scale=Math.min((right-left)/1280,(bottom-top)/720);
    this.offsetX=left+(right-left-1280*this.scale)/2;this.offsetY=top+(bottom-top-720*this.scale)/2;this.dpr=dpr;this.width=w;this.height=h;
  }
  notify(message){this.toast=message;this.toastTime=3;}
  navigate(scene){this.scene=scene;this.modal=null;this.skillMode=false;this.pointer=null;}
  requestStartBattle(options={}){
    if(options.mode==='campaign'&&!unlocked(this.progress,options.levelId)){this.notify('请先通关前一关');return;}
    if(this.saved){this.modal={confirm:'overwrite',options};return;}
    this.startBattle(options);
  }
  startBattle(options={}){
    if(options.mode==='campaign'&&!unlocked(this.progress,options.levelId)){this.notify('请先通关前一关');return;}
    if(options.mode==='pvp'){this.navigate('pvp');return;}
    if(this.session)this.session.dispose();
    this.session=new LocalBattleSession({...options,difficulty:options.difficulty||this.difficulty,seed:Date.now()>>>0,matchId:'pve-'+Date.now()+'-'+(++matchSequence)});
    this.navigate('battle');this.page=0;this.lastTime=0;this.saveClock=0;this.camera={zoom:1,x:0,y:0};this.settledMatch=null;this.save();
  }
  resume(){
    if(!this.saved)return;
    try{if(this.session)this.session.dispose();this.session=new LocalBattleSession({snapshot:this.saved});this.navigate('battle');this.page=0;this.lastTime=0;this.camera={zoom:1,x:0,y:0};}
    catch(e){this.invalidSaved=true;this.saved=null;this.notify('本局无法恢复，请重新挑战');}
  }
  save(){
    if(!this.session||!this.session.capabilities.canSaveLocally||this.view.result)return;
    this.saved=this.session.snapshot();
    if(!this.storage.write(SAVE_KEY,this.saved)){this.saveUnavailable=true;this.notify('本地存储不可用，本局仅在内存中保留');}
  }
  clearSave(){if(!this.storage.remove(SAVE_KEY))this.saveUnavailable=true;this.saved=null;}
  continueBattle(){if(this.session){this.session.resume();this.modal=null;this.lastTime=0;}}
  pauseBattle(){if(this.session&&this.session.capabilities.canPause){this.session.pause();this.skillMode=false;this.save();}}
  command(cmd){
    if(!this.session)return;
    const response=this.session.sendCommand(cmd);
    if(response.status==='rejected')this.notify(response.message);
    else if(cmd.type==='evolve'){this.page=0;this.notify('进入'+ERAS[this.view.sides[0].era].name+'，六种兵全部开放');}
    this.consumeEvents();this.settle();return response;
  }
  consumeEvents(){
    this.session.drainEvents().forEach(e=>{
      if(['spawn','evolve','skill'].includes(e.type)&&e.side===0)this.audio.play(e.type);
      if(e.type==='result')this.audio.play(e.winner===null?'draw':e.winner===0?'win':'lose');
    });
  }
  settle(){
    const result=this.view&&this.view.result;if(!result||this.settledMatch===result.matchId)return;
    this.settledMatch=result.matchId;this.clearSave();this.modal=null;this.skillMode=false;
    if(settleProgress(this.progress,result)&&!this.storage.write(KEYS.progress,this.progress)){this.saveUnavailable=true;this.notify('通关已完成，本地记录暂未保存');}
  }
  returnHome(){if(this.session&&this.view.result){this.session.dispose();this.session=null;}this.navigate('home');}
  saveAndReturnHome(){this.pauseBattle();this.returnHome();}
  retry(){const rules=this.view.rules;this.startBattle({mode:rules.mode,levelId:rules.levelId,difficulty:rules.difficulty});}
  nextLevel(){const result=this.view.result,l=LEVEL_BY_ID[result.levelId];if(result.winner===0&&l&&LEVELS[l.index+1])this.startBattle({mode:'campaign',levelId:LEVELS[l.index+1].id});}
  changeSetting(key,value){
    this.settings={...this.settings,[key]:value};this.audio.configure(this.settings);
    if(!this.storage.write(KEYS.settings,this.settings))this.notify('设置本次有效，本地保存失败');
  }
  queueCancel(id){const p=this.view.sides[0],index=p.queue.findIndex(q=>q.id===id);if(index<0)return;this.modal={cancel:id,refund:Math.floor(p.queue[index].paid*(index===0?0.75:1))};}
  pvpAction(){this.notify(this.pvp.getAvailability().message);}
  logical(px,py){return {x:(px-this.offsetX)/this.scale,y:(py-this.offsetY)/this.scale};}
  hit(x,y){return this.renderer.buttons.slice().reverse().find(b=>x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h);}
  touch(px,py){
    if(this.hidden)return;const {x,y}=this.logical(px,py);if(x<0||x>1280||y<0||y>720)return;
    const button=this.hit(x,y);if(button){this.audio.play('click');button.action();return;}
    if(this.skillMode&&!this.paused&&!this.modal&&y>=160&&y<=490&&x>=100&&x<=1180){
      const response=this.command({type:'skill',x:this.renderer.screenXToBattle(x)});
      if(response&&response.status==='accepted')this.skillMode=false;
    }
  }
  touchStart(px,py){if(this.hidden)return;const {x,y}=this.logical(px,py);this.pointer={px,py,lastX:px,elapsed:0,button:this.hit(x,y),drag:false,long:false,battlefield:this.scene==='battle'&&!this.modal&&!this.paused&&y>=160&&y<=490};}
  touchMove(px,py){
    const p=this.pointer;if(!p)return;
    if(Math.hypot(px-p.px,py-p.py)>8){p.drag=true;
      if(!p.button&&p.battlefield&&this.camera.zoom>1){this.camera.x+=(px-p.lastX)/this.scale;const bound=540*(this.camera.zoom-1);this.camera.x=Math.max(-bound,Math.min(bound,this.camera.x));}
    }p.lastX=px;
  }
  touchEnd(px,py){const p=this.pointer;this.pointer=null;if(p&&!p.drag&&!p.long&&Math.hypot(px-p.px,py-p.py)<=8)this.touch(px,py);}
  frame(timestamp){
    const now=Number.isFinite(timestamp)?timestamp:Date.now(),elapsed=this.lastTime?Math.max(0,Math.min((now-this.lastTime)/1000,0.25)):0;this.lastTime=now;
    if(!this.hidden){
      this.toastTime=Math.max(0,this.toastTime-elapsed);
      if(this.pointer&&!this.pointer.drag&&!this.pointer.long){this.pointer.elapsed+=elapsed;if(this.pointer.elapsed>=0.5&&this.pointer.button&&this.pointer.button.longAction){this.pointer.long=true;this.pointer.button.longAction();}}
      if(this.scene==='battle'&&this.session){
        this.session.update(elapsed);this.consumeEvents();this.settle();
        if(!this.paused&&!this.view.result){this.saveClock+=elapsed;if(this.saveClock>=5){this.save();this.saveClock=0;}}
      }
      this.renderer.draw();
    }
    this.frameHandle=requestAnimationFrame(t=>this.frame(t));
  }
  start(){this.frameHandle=requestAnimationFrame(t=>this.frame(t));}
}
module.exports={GameApp,SAVE_KEY};

'use strict';
const {Battle,STEP}=require('./battle');
const {ERAS}=require('./data');
const {Renderer}=require('./renderer');
const SAVE_KEY='war.pve.snapshot.v1';
class GameApp {
  constructor(platform){
    this.wx=platform;this.canvas=platform.createCanvas();this.ctx=this.canvas.getContext('2d');
    this.scene='home';this.battle=null;this.page=0;this.modal=null;this.skillMode=false;this.paused=false;this.hidden=false;
    this.toast='';this.toastTime=0;this.difficulty='normal';this.accumulator=0;this.lastTime=0;this.saveClock=0;
    this.renderer=new Renderer(this);this.resize();this.saved=null;this.saveUnavailable=false;
    try{this.saved=Battle.restore(platform.getStorageSync(SAVE_KEY));}catch(e){this.saveUnavailable=true;}
    platform.onTouchStart(e=>{const t=e.changedTouches&&e.changedTouches[0]||e.touches&&e.touches[0];if(t)this.touch(t.clientX===undefined?t.x:t.clientX,t.clientY===undefined?t.y:t.clientY);});
    platform.onHide(()=>{this.hidden=true;if(this.battle&&!this.battle.result){this.paused=true;this.save();}this.lastTime=0;this.accumulator=0;});
    platform.onShow(()=>{this.hidden=false;this.resize();this.lastTime=0;});
    if(platform.onWindowResize)platform.onWindowResize(()=>this.resize());
  }
  resize(){
    const info=this.wx.getWindowInfo?this.wx.getWindowInfo():this.wx.getSystemInfoSync();
    const w=info.windowWidth,h=info.windowHeight,dpr=Math.min(info.pixelRatio||1,3);
    this.canvas.width=Math.round(w*dpr);this.canvas.height=Math.round(h*dpr);
    const safe=info.safeArea||{left:0,top:0,right:w,bottom:h};
    let left=Math.max(0,safe.left),top=Math.max(0,safe.top),right=Math.min(w,safe.right),bottom=Math.min(h,safe.bottom);
    // 胶囊下方布置完整 UI；触控与绘制使用同一个坐标变换。
    if(this.wx.getMenuButtonBoundingClientRect){const menu=this.wx.getMenuButtonBoundingClientRect();if(menu&&menu.bottom>0)top=Math.max(top,menu.bottom+4);}
    if(right-left<100||bottom-top<100){left=0;top=0;right=w;bottom=h;}
    this.scale=Math.min((right-left)/1280,(bottom-top)/720);
    this.offsetX=left+(right-left-1280*this.scale)/2;this.offsetY=top+(bottom-top-720*this.scale)/2;
    this.dpr=dpr;this.width=w;this.height=h;
  }
  notify(message){this.toast=message;this.toastTime=3;}
  startBattle(){this.battle=new Battle({difficulty:this.difficulty,seed:Date.now()>>>0});this.scene='battle';this.paused=false;this.modal=null;this.skillMode=false;this.page=0;this.lastTime=0;this.accumulator=0;this.save();}
  resume(){if(this.saved){this.battle=this.saved;this.saved=null;this.scene='battle';this.paused=true;this.page=0;this.lastTime=0;}}
  save(){if(!this.battle||this.battle.result)return;try{this.wx.setStorageSync(SAVE_KEY,this.battle.snapshot());this.saveUnavailable=false;}catch(e){this.saveUnavailable=true;this.notify('本地存储不可用，本局仅在内存中保留');}}
  clearSave(){try{this.wx.removeStorageSync(SAVE_KEY);}catch(e){this.saveUnavailable=true;}this.saved=null;}
  command(cmd){
    if(!this.battle||this.paused||this.battle.result)return;
    const error=this.battle.command(0,cmd);if(error)this.notify(error);
    else if(cmd.type==='evolve'){this.page=0;this.notify('进入'+ERAS[this.battle.sides[0].era].name+'，六种兵全部开放');}
    if(this.battle.result)this.clearSave();
  }
  touch(px,py){
    if(this.hidden)return;const x=(px-this.offsetX)/this.scale,y=(py-this.offsetY)/this.scale;
    if(x<0||x>1280||y<0||y>720)return;
    const button=this.renderer.buttons.slice().reverse().find(b=>x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h);
    if(button){button.action();return;}
    if(this.skillMode&&!this.paused&&!this.modal&&y>=160&&y<=490&&x>=100&&x<=1180){this.command({type:'skill',x:(x-100)/1080*1000});this.skillMode=false;}
  }
  frame(timestamp){
    const now=Number.isFinite(timestamp)?timestamp:Date.now();
    const elapsed=this.lastTime?Math.max(0,Math.min((now-this.lastTime)/1000,0.25)):0;this.lastTime=now;
    if(!this.hidden){
      this.toastTime=Math.max(0,this.toastTime-elapsed);
      if(this.scene==='battle'&&!this.paused&&this.battle&&!this.battle.result){
        this.accumulator+=elapsed;
        while(this.accumulator>=STEP){this.battle.tick(STEP);this.accumulator-=STEP;if(this.battle.result){this.clearSave();this.modal=null;this.skillMode=false;break;}}
        this.saveClock+=elapsed;if(this.saveClock>=5){this.save();this.saveClock=0;}
      }else this.accumulator=0;
      this.renderer.draw();
    }
    this.frameHandle=requestAnimationFrame(t=>this.frame(t));
  }
  start(){this.frameHandle=requestAnimationFrame(t=>this.frame(t));}
}
module.exports={GameApp,SAVE_KEY};

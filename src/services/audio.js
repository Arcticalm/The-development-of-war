'use strict';
const SOUNDS={click:'assets/audio/click.wav',confirm:'assets/audio/confirm.wav',reject:'assets/audio/reject.wav',spawn:'assets/audio/spawn.wav',evolve:'assets/audio/evolve.wav',skill:'assets/audio/skill.wav',win:'assets/audio/win.wav',lose:'assets/audio/lose.wav',draw:'assets/audio/draw.wav'};
/** 短音效平台适配；不可用或被系统拒绝时，游戏继续运行。 */
class AudioService {
  constructor(platform,settings){this.platform=platform;this.settings=settings;this.players={};this.hidden=false;this.failed=false;this.lastPlayed={};}
  configure(settings){this.settings=settings;if(!settings.sound||settings.volume===0)this.stop();Object.values(this.players).forEach(p=>{p.volume=settings.volume;});}
  play(name,time=Date.now()){
    if(this.hidden||!this.settings.sound||!this.settings.volume||!SOUNDS[name]||!this.platform.createInnerAudioContext)return;
    if(time-(this.lastPlayed[name]===undefined?-Infinity:this.lastPlayed[name])<100)return;
    try{
      let p=this.players[name];if(!p){p=this.platform.createInnerAudioContext();p.src=SOUNDS[name];if(p.onError)p.onError(()=>{this.failed=true;});this.players[name]=p;}
      p.volume=this.settings.volume;p.stop();p.play();this.lastPlayed[name]=time;
    }catch(e){this.failed=true;}
  }
  stop(){Object.values(this.players).forEach(p=>{try{p.stop();}catch(e){this.failed=true;}});}
  setHidden(hidden){this.hidden=hidden;if(hidden)this.stop();}
  dispose(){this.stop();Object.values(this.players).forEach(p=>{if(p.destroy)p.destroy();});this.players={};}
}
module.exports={AudioService,SOUNDS};

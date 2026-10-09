'use strict';
const {MOTION}=require('./theme');
/** UI 时间与逻辑时间分离；只保存有上限的短暂反馈，不保存进度。 */
class FeedbackController {
  constructor(){this.pressed=null;this.effects=[];}
  press(id){this.pressed=id;}
  cancel(){this.pressed=null;}
  clear(){this.cancel();this.effects=[];}
  add(effect){this.effects.push({...effect,age:0});if(this.effects.length>MOTION.maxEffects)this.effects.shift();}
  release(id,x,y,kind='tap'){this.cancel();this.add({id,x,y,kind,duration:kind==='tap'?MOTION.ripple:MOTION.flash,ripple:true});}
  flash(id,kind='success'){this.add({id,kind,duration:MOTION.flash,ripple:false});}
  update(dt){if(!Number.isFinite(dt)||dt<=0)return;this.effects=this.effects.filter(e=>(e.age+=Math.min(dt,0.25))<e.duration);}
  state(id){
    const effect=this.effects.slice().reverse().find(e=>e.id===id),pressed=this.pressed===id;
    let scale=pressed?MOTION.pressScale:1;
    if(!pressed&&effect&&effect.ripple&&effect.age<MOTION.rebound){const t=effect.age/MOTION.rebound;scale=1-0.03*(1-t)*Math.cos(t*Math.PI);}
    return {pressed,scale,kind:effect&&effect.kind,alpha:effect?1-effect.age/effect.duration:0};
  }
}
module.exports={FeedbackController};

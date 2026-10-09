'use strict';
const {COLORS:C,MOTION}=require('./theme');
const {UIPainter}=require('./primitives');
/** 页面共享的绘图、控件描述和反馈层。 */
class UIComponents {
  constructor(app){this.app=app;this.ctx=app.ctx;this.painter=new UIPainter(this.ctx);this.buttons=[];this.colors=C;}
  scope(){
    const a=this.app,m=a.modal;
    let layer=a.scene==='battle'&&this.resultVisible?'result':m==='help'?'help':m==='defense'?'defense':m&&m.unit?'unit:'+m.unit:m&&m.levelId?'level:'+m.levelId:m&&m.confirm?'confirm:'+m.confirm:m&&m.cancel!==undefined?'cancel:'+m.cancel:a.scene==='battle'&&a.paused?'pause':'main';
    return a.scene+':'+layer;
  }
  id(key){return this.scope()+':'+key;}
  rect(x,y,w,h,color){this.ctx.fillStyle=color;this.ctx.fillRect(x,y,w,h);}
  text(value,x,y,size=24,color=C.ink,align='left'){const c=this.ctx;c.fillStyle=color;c.font=size+'px sans-serif';c.textAlign=align;c.textBaseline='middle';c.fillText(String(value),x,y);}
  measure(value,size=24){this.ctx.font=size+'px sans-serif';const m=this.ctx.measureText(String(value));return m&&Number.isFinite(m.width)?m.width:Array.from(String(value)).reduce((n,ch)=>n+size*(ch.charCodeAt(0)>255?1:0.57),0);}
  fitText(value,x,y,width,size=24,color=C.ink,align='left'){let s=size;while(s>17&&this.measure(value,s)>width)s--;this.text(value,x,y,s,color,align);}
  wrap(value,x,y,width,size=22,height=32){let line='',row=0;for(const ch of String(value)){if(ch==='\n'||line&&this.measure(line+ch,size)>width){this.text(line,x,y+row*height,size);row++;line=ch==='\n'?'':ch;}else line+=ch;}if(line)this.text(line,x,y+row*height,size);return row+1;}
  line(x,y,x2,y2,color=C.line,width=2){const c=this.ctx;c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
  panel(x,y,w,h,fill=C.panel,radius=18){this.painter.panel(x,y,w,h,fill,radius);}
  icon(name,x,y,size=24,color=C.ink){this.painter.icon(name,x,y,size,color);}
  badge(icon,x,y,r=24,fill=C.tealLight,color=C.teal){this.painter.circle(x,y,r,fill);this.icon(icon,x,y,r*1.08,color);}
  tag(label,x,y,fill=C.tealLight,color=C.teal,size=18,width){const w=width||this.measure(label,size)+22;this.painter.shape(x,y,w,28,fill,null,'round',14);this.text(label,x+w/2,y+14,size,color,'center');return w;}
  bar(x,y,w,h,value,color){const v=Math.max(0,Math.min(1,value));this.painter.shape(x,y,w,h,C.line,null,'round',h/2);if(v>0)this.painter.shape(x,y,Math.max(h,w*v),h,color,null,'round',h/2);}
  control(spec,draw){
    const b={...spec,id:this.id(spec.id),enabled:spec.enabled!==false,shape:spec.shape||'round',radius:spec.radius===undefined?14:spec.radius};this.buttons.push(b);
    const state=this.app.feedback.state(b.id),c=this.ctx;c.save();c.translate(b.x+b.w/2,b.y+b.h/2);c.scale(state.scale,state.scale);c.translate(-b.x-b.w/2,-b.y-b.h/2);if(draw)draw(state,b);if(state.kind==='error'&&state.alpha>0)this.painter.shape(b.x,b.y,b.w,b.h,null,C.red,b.shape,b.radius);c.restore();return b;
  }
  button(label,x,y,w,h,action,active=true,small=false,options={}){
    const variant=options.variant||'primary',shape=options.shape||'round',radius=options.radius===undefined?14:options.radius;
    return this.control({id:options.id||'button@'+x+','+y,x,y,w,h,action,enabled:active,disabledReason:options.disabledReason,shape,radius,style:{variant,selected:!!options.selected}},state=>{
      let fill=variant==='gold'?C.gold:variant==='danger'?C.red:variant==='soft'?C.tealLight:variant==='outline'||variant==='ghost'?null:C.teal;
      let color=['soft','outline','ghost'].includes(variant)?C.teal:C.white,stroke=variant==='outline'?C.teal:null;
      if(options.onDark){color=C.white;stroke='#688676';}
      if(options.selected){fill=C.goldLight;color=C.ink;stroke=C.gold;}
      if(!active){fill='#e0ddce';color='#858c7b';stroke='#d3d0c0';}
      if(!['ghost','outline'].includes(variant)&&!state.pressed)this.painter.shape(x,y+3,w,h,C.shadow,null,shape,radius);
      this.painter.shape(x,y,w,h,fill,stroke,shape,radius);
      if(state.pressed)this.painter.shape(x,y,w,h,'rgba(255,255,255,0.16)',null,shape,radius);
      if(state.kind==='success')this.painter.shape(x,y,w,h,null,C.teal,shape,radius);
      if(options.icon)this.icon(options.icon,x+(options.iconOnly?w/2:26),y+h/2,options.iconOnly?26:22,color);
      if(!options.iconOnly){const center=x+w/2+(options.icon?10:0);this.fitText(label,center,y+h/2,w-(options.icon?52:16),small?20:24,color,'center');}
    });
  }
  region(x,y,w,h,action,longAction,options={}){return this.control({id:options.id||'region@'+x+','+y,x,y,w,h,action,longAction,enabled:options.enabled!==false,disabledReason:options.disabledReason,shape:options.shape||'round',radius:options.radius},options.draw);}
  tile(id,title,subtitle,icon,x,y,w,h,action,options={}){
    const shape=options.shape||'round',radius=options.radius||18;
    return this.control({id,x,y,w,h,action,shape,radius,enabled:options.enabled!==false,disabledReason:options.disabledReason},state=>{
      this.painter.shape(x,y+4,w,h,C.shadow,null,shape,radius);this.painter.shape(x,y,w,h,state.pressed?C.goldLight:options.background||C.panel,C.line,shape,radius);this.badge(icon,x+41,y+h/2,25,options.fill||C.tealLight,options.color||C.teal);
      this.fitText(title,x+81,y+h/2-13,w-126,25);this.fitText(subtitle,x+81,y+h/2+17,w-126,18,C.muted);
      this.icon(options.locked?'lock':'chevron',x+w-28,y+h/2,22,options.locked?C.muted:C.teal);
    });
  }
  heading(title,subtitle,icon='flag'){
    this.rect(0,0,1280,155,C.dark);this.painter.polygon([[0,155],[1280,155],[1280,163],[950,163],[925,155]],C.gold);
    this.badge(icon,58,69,28,'#2d5142',C.goldLight);this.text(title,104,69,39,C.white);this.fitText(subtitle,105,119,875,22,'#b9cbbb');
    this.button('返回首页',1028,48,192,55,()=>this.app.navigate('home'),true,true,{id:'home',variant:'outline',icon:'back',onDark:true});
  }
  dial(x,y,r,progress,color=C.gold){const c=this.ctx;this.painter.circle(x,y,r,C.tealLight);c.beginPath();c.arc(x,y,r-3,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.max(0,Math.min(1,progress)));c.strokeStyle=color;c.lineWidth=5;c.stroke();}
  drawFeedback(){
    const c=this.ctx;this.app.feedback.effects.forEach(e=>{
      const b=this.buttons.find(b=>b.id===e.id);if(!b||!e.ripple||e.age>=MOTION.ripple)return;
      const t=e.age/MOTION.ripple;c.save();this.painter.path(b.x,b.y,b.w,b.h,b.shape,b.radius||14);c.clip();
      c.beginPath();c.arc(e.x,e.y,12+t*Math.max(b.w,b.h),0,Math.PI*2);c.strokeStyle=e.kind==='error'?'rgba(184,100,76,'+(0.45*(1-t))+')':'rgba(242,206,116,'+(0.55*(1-t))+')';c.lineWidth=3;c.stroke();c.restore();
    });
  }
  toast(){
    const a=this.app;if(a.toastTime<=0)return;const width=Math.min(900,Math.max(340,this.measure(a.toast,22)+80)),x=(1280-width)/2,y=a.modal||a.paused?610:a.scene==='battle'?445:658;
    const color=a.toastKind==='error'?C.red:a.toastKind==='success'?C.teal:C.dark,c=this.ctx;c.save();c.globalAlpha=Math.min(1,a.toastTime/0.15);
    this.painter.shape(x,y,width,43,C.panel,color,'round',18);this.icon(a.toastKind==='error'?'info':a.toastKind==='success'?'check':'flag',x+25,y+21,22,color);this.fitText(a.toast,x+49,y+21,width-67,22,color);c.restore();
  }
}
module.exports={UIComponents};

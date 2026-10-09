'use strict';
const {COLORS:C}=require('./theme');
/** Canvas 原生组件；兼容没有 roundRect 的微信基础库。 */
class UIPainter {
  constructor(ctx){this.ctx=ctx;}
  path(x,y,w,h,shape='round',radius=14){
    const c=this.ctx,r=Math.min(radius,w/2,h/2);c.beginPath();
    if(shape==='circle'){c.arc(x+w/2,y+h/2,Math.min(w,h)/2,0,Math.PI*2);return;}
    if(shape==='flag'){
      c.moveTo(x,y);c.lineTo(x+w,y);c.lineTo(x+w-r,y+h/2);c.lineTo(x+w,y+h);c.lineTo(x,y+h);c.closePath();return;
    }
    if(shape==='cut'){
      c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.lineTo(x+w,y+r);c.lineTo(x+w,y+h-r);c.lineTo(x+w-r,y+h);c.lineTo(x,y+h);c.lineTo(x,y+r);c.closePath();return;
    }
    c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();
  }
  shape(x,y,w,h,fill,stroke=null,shape='round',radius=14){const c=this.ctx;this.path(x,y,w,h,shape,radius);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=1.5;c.stroke();}}
  panel(x,y,w,h,fill=C.panel,radius=18){this.shape(x,y+5,w,h,C.shadow,null,'round',radius);this.shape(x,y,w,h,fill,C.line,'round',radius);}
  circle(x,y,r,fill,stroke=null){this.shape(x-r,y-r,r*2,r*2,fill,stroke,'circle');}
  polygon(points,fill,stroke=null){const c=this.ctx;c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
  icon(name,x,y,size=24,color=C.ink){
    const c=this.ctx;c.save();c.translate(x-size/2,y-size/2);c.scale(size/24,size/24);c.strokeStyle=color;c.fillStyle=color;c.lineWidth=1.8;c.lineCap='round';c.lineJoin='round';
    const line=points=>{c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.stroke();};
    const ring=(px,py,r)=>{c.beginPath();c.arc(px,py,r,0,Math.PI*2);c.stroke();};
    const poly=points=>{c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.stroke();};
    if(name==='coin'){ring(12,12,9);ring(12,12,6);line([[12,7],[12,17]]);}
    else if(name==='shield'){poly([[12,2],[21,6],[19,16],[12,22],[5,16],[3,6]]);line([[8,12],[11,15],[17,8]]);}
    else if(name==='people'){ring(9,7,3);line([[2,20],[3,15],[6,12],[12,12],[15,15],[16,20]]);ring(18,8,2);line([[18,13],[21,15],[22,20]]);}
    else if(name==='clock'){ring(12,12,9);line([[12,6],[12,12],[17,14]]);}
    else if(name==='pause'){c.fillRect(6,4,4,16);c.fillRect(14,4,4,16);}
    else if(name==='play'){poly([[7,3],[21,12],[7,21]]);}
    else if(name==='flag'){line([[5,22],[5,3],[20,3],[16,8],[20,12],[5,12]]);}
    else if(name==='book'){poly([[3,4],[10,4],[12,7],[14,4],[21,4],[21,20],[14,20],[12,22],[10,20],[3,20]]);line([[12,7],[12,22]]);}
    else if(name==='gear'){ring(12,12,4);for(let i=0;i<8;i++){const a=i*Math.PI/4;line([[12+7*Math.cos(a),12+7*Math.sin(a)],[12+10*Math.cos(a),12+10*Math.sin(a)]]);}ring(12,12,7);}
    else if(name==='lock'){c.beginPath();c.arc(12,8,5,Math.PI,0);c.stroke();poly([[5,9],[19,9],[19,21],[5,21]]);ring(12,14,1);line([[12,15],[12,18]]);}
    else if(name==='swords'){line([[4,3],[19,18],[16,21]]);line([[20,3],[5,18],[8,21]]);line([[3,15],[9,21]]);line([[15,21],[21,15]]);}
    else if(name==='chevron')line([[9,5],[16,12],[9,19]]);
    else if(name==='check')line([[4,12],[10,18],[21,5]]);
    else if(name==='close'){line([[5,5],[19,19]]);line([[19,5],[5,19]]);}
    else if(name==='tower'){poly([[4,3],[8,3],[8,7],[11,7],[11,3],[15,3],[15,7],[18,7],[18,3],[22,3],[21,11],[19,11],[20,21],[6,21],[7,11],[5,11]]);}
    else if(name==='heart'){c.beginPath();c.moveTo(12,21);c.bezierCurveTo(-5,10,4,-4,12,6);c.bezierCurveTo(20,-4,29,10,12,21);c.stroke();}
    else if(name==='bolt')poly([[14,2],[5,14],[11,14],[9,22],[20,9],[14,9]]);
    else if(name==='home'){line([[2,11],[12,2],[22,11]]);poly([[5,10],[5,22],[10,22],[10,15],[15,15],[15,22],[20,22],[20,10]]);}
    else if(name==='music'){line([[8,18],[8,5],[20,2],[20,16]]);ring(5,18,3);ring(17,16,3);}
    else if(name==='eye'){c.beginPath();c.moveTo(1,12);c.quadraticCurveTo(12,-2,23,12);c.quadraticCurveTo(12,26,1,12);c.stroke();ring(12,12,4);}
    else if(name==='leaf'){c.beginPath();c.moveTo(3,21);c.quadraticCurveTo(0,3,22,2);c.quadraticCurveTo(22,22,3,21);c.stroke();line([[3,21],[16,8]]);}
    else if(name==='target'){ring(12,12,8);ring(12,12,4);line([[12,0],[12,6]]);line([[18,12],[24,12]]);line([[12,18],[12,24]]);line([[0,12],[6,12]]);}
    else if(name==='tank'){poly([[3,13],[21,13],[23,18],[20,21],[4,21],[1,18]]);poly([[7,13],[8,7],[17,7],[19,13]]);line([[15,7],[22,4]]);ring(7,17,1);ring(12,17,1);ring(17,17,1);}
    else if(name==='xp'){poly([[12,2],[15,8],[22,9],[17,14],[18,22],[12,18],[6,22],[7,14],[2,9],[9,8]]);}
    else if(name==='back')line([[10,4],[3,11],[10,18],[3,11],[21,11]]);
    else if(name==='volume'){poly([[2,9],[6,9],[12,4],[12,20],[6,15],[2,15]]);c.beginPath();c.arc(12,12,7,-0.8,0.8);c.stroke();c.beginPath();c.arc(12,12,11,-0.8,0.8);c.stroke();}
    else if(name==='minus')line([[5,12],[19,12]]);
    else if(name==='plus'){line([[5,12],[19,12]]);line([[12,5],[12,19]]);}
    else if(name==='draw'){line([[4,8],[20,8]]);line([[4,16],[20,16]]);}
    else {ring(12,12,8);line([[12,7],[12,13]]);ring(12,17,0.5);}
    c.restore();
  }
}
module.exports={UIPainter};

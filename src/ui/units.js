'use strict';
const {BY_ID}=require('../data');
/** 独立角色表现入口。文字布局不回写实体位置、生命或行为。 */
class TextUnitPresenter {
  draw(r,units){
    const groups=new Map(),dense=units.length>16;
    units.forEach(u=>{const key=dense?u.side+':'+u.typeId+':'+Math.floor(u.x/45):u.id;
      if(!groups.has(key))groups.set(key,{typeId:u.typeId,side:u.side,x:0,hp:0,shield:0,count:0,status:u.status});
      const g=groups.get(key);g.x+=u.x;g.hp+=u.hp;g.shield+=u.shield;g.count++;if(g.status!==u.status)g.status='混编';
    });
    const occupied=Array.from({length:7},()=>[]);
    [...groups.values()].map(g=>({...g,x:g.x/g.count})).sort((a,b)=>a.x-b.x||a.side-b.side).forEach(g=>{
      const d=BY_ID[g.typeId],anchor=100+g.x*1.08,label=(g.side?'敌·':'我·')+d.shortName+(g.count>1?'×'+g.count:'')+(units.length<=10?' · '+g.status:'');
      const w=Math.max(92,(r.measure?r.measure(label,19):label.length*17)+38);let chosen=null;
      for(let lane=0;lane<7;lane++)for(let offset=0;offset<=1100;offset+=w+8){
        for(const sign of offset===0?[1]:[-1,1]){
          const x=Math.max(16,Math.min(1264-w,anchor-w/2+offset*sign));
          if(occupied[lane].some(o=>x<o.end+5&&x+w>o.start-5))continue;
          const cost=Math.abs(x+w/2-anchor)+lane*8;if(!chosen||cost<chosen.cost)chosen={x,lane,cost};
        }
      }
      if(!chosen)chosen={x:Math.max(16,Math.min(1264-w,anchor-w/2)),lane:6};
      const x=chosen.x,y=224+chosen.lane*32;occupied[chosen.lane].push({start:x,end:x+w});
      r.line(anchor,460,x+w/2,y+20,'rgba(40,58,54,0.16)',1);r.unitLabel(x,y,w,label,g.side,g.hp/(d.hp*g.count),g.shield/(d.hp*0.2*g.count));
    });
  }
}
module.exports={TextUnitPresenter};

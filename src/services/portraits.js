'use strict';
const PORTRAITS=require('../config/unit-portraits');
/** Presentation-only, bounded LRU. A late load cannot resurrect an evicted entry. */
class PortraitService {
  constructor(platform,{limit=12,onChange=()=>{}}={}){
    this.platform=platform;this.limit=Math.max(1,Math.min(12,limit));this.onChange=onChange;this.cache=new Map();
  }
  get(id){
    const meta=PORTRAITS[id];if(!meta)return null;
    if(this.cache.has(id)){const entry=this.cache.get(id);this.cache.delete(id);this.cache.set(id,entry);return entry;}
    while(this.cache.size>=this.limit){const oldest=this.cache.keys().next().value,entry=this.cache.get(oldest);if(entry.image){entry.image.onload=null;entry.image.onerror=null;}this.cache.delete(oldest);}
    const entry={...meta,status:'loading',image:null};this.cache.set(id,entry);
    const complete=status=>{
      if(this.cache.get(id)!==entry)return;
      entry.status=status;
      if(entry.image){entry.image.onload=null;entry.image.onerror=null;}
      this.onChange(id,status);
    };
    try{
      const img=this.platform.createImage();entry.image=img;
      img.onload=()=>complete(img.width>0&&img.height>0?'ready':'error');
      img.onerror=()=>complete('error');
      img.src=this.platform.resolveAssetPath?this.platform.resolveAssetPath(meta.path):meta.path;
    }catch(_){complete('error');}
    return entry;
  }
}
module.exports={PortraitService};

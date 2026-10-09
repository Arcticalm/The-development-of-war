'use strict';
const PORTRAITS=require('../config/unit-portraits');
const {ImageCache}=require('./image-cache');
/** Presentation-only, bounded LRU. A late load cannot resurrect an evicted entry. */
class PortraitService extends ImageCache {
  constructor(platform,{limit=12,onChange=()=>{}}={}){
    super(platform,PORTRAITS,{limit,onChange});
  }
}
module.exports={PortraitService};

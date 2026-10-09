'use strict';
const INDEX=require('../config/world-art');
const {ImageCache}=require('./image-cache');
class WorldArtService {
  constructor(platform){this.buildings=new ImageCache(platform,INDEX.buildings);this.effects=new ImageCache(platform,INDEX.effects,{limit:9});this.backgrounds=new ImageCache(platform,INDEX.backgrounds,{limit:1});}
  get(id){return INDEX.buildings[id]?this.buildings.get(id):INDEX.backgrounds[id]?this.backgrounds.get(id):this.effects.get(id);}
}
module.exports={WorldArtService};

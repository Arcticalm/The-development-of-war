'use strict';
/** Contain the complete image, retaining transparent margins and aspect ratio. */
function containRect(width,height,x,y,w,h){
  if(!(width>0&&height>0&&w>0&&h>0))return null;
  const scale=Math.min(w/width,h/height),dw=width*scale,dh=height*scale;
  return {x:x+(w-dw)/2,y:y+(h-dh)/2,w:dw,h:dh};
}
module.exports={containRect};

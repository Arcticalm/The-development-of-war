'use strict';
// 所有界面共享色彩和尺度；不影响战斗配置版本。
const COLORS={paper:'#efe6d2',panel:'#fff8e9',ink:'#263e35',muted:'#7b8575',teal:'#356f5c',tealDark:'#244e41',tealLight:'#dfe9d8',red:'#b8644c',redLight:'#f3dfd1',gold:'#c59a45',goldLight:'#f7e5b0',line:'#d7ccb4',dark:'#193b30',shell:'#102a23',white:'#fff9eb',shadow:'rgba(31,53,40,0.12)'};
const ERA_COLORS=['#6d8153','#ac7957','#6b8390','#667855','#51948a'];
const ERA_ICONS=['leaf','shield','target','tank','bolt'];
const MOTION={pressScale:0.97,rebound:0.12,ripple:0.3,flash:0.55,maxEffects:12};
module.exports={COLORS,ERA_COLORS,ERA_ICONS,MOTION};

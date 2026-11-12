// Standalone, pure model. All coordinates are illustrative world units.
(function(root){
'use strict';
const C=Object.freeze({stockX:70,handoffX:230,rackRight:146,stageRadius:64/3,chuckHalfWidth:59.5,ldX:420,cleanX:730,workY:35,rearY:190,armFrontY:-125,armZ:143,stageZ:104,maskOnChuckZ:113,stockLevels:[54,104,154],safeZ:223,duration:110,wetStart:90,dryStart:103});
const steps=[
 [0,'Stocker 右推出料','Stocker 顶层先把 Chuck 完全向右推出至独立交接位；Traverser 保持高位等待。'],
 [6,'右侧交接位取 Chuck','推出完成后，Traverser 横移至右侧交接位，再竖直下降接合并上提 Chuck。'],
 [14,'放置 Chuck','高位沿后部轨道横移到 LD/ULD，下降放到缩至原直径 1/3 的固定圆形 Stage。'],
 [25,'LD 口承接 Mask','左右两组可变 size arm 从背面四角支撑 Mask，初始姿态 75°。'],
 [30,'翻转至水平','只有 LD/ULD arm 翻转；Mask 从 75° 缓慢转到水平。'],
 [38,'LD arm 向后送料','水平 Mask 随 arm 向后移动至 Chuck 正上方，保持悬空。'],
 [48,'Traverser 向上取 Mask','水平头下降接合后竖直向上提取；LD arm 保持送料位置。'],
 [57,'LD arm 返回原位','Mask 保持在 Traverser 高位，空载 LD arm 沿前后导轨回到 LD 口。'],
 [65,'Mask 放到 Chuck','LD arm 回位后，Traverser 在同一 X/Y 位置竖直下降，放置 Mask。'],
 [74,'组合体进入 Cleaner','Traverser 取 Chuck + Mask，提升到安全高度后沿后轨横移并下降交接。'],
 [90,'旋转清洗 / Dry','Chuck 带 Mask 同轴旋转；上方喷淋和背面 DIW 持续至最终 Dry 开始。']
];
const frames=[// t, X, Z. There is deliberately no Y keyframe.
 [0,420,223],[6,420,223],[9,230,223],[11,230,154],[11.5,230,154],[14,230,223],
 [18,420,223],[22,420,104],[23,420,104],[25,420,223],
 [48,420,223],[51,420,143],[52,420,143],[57,420,223],
 [65,420,223],[70,420,113],[71,420,113],[74,420,223],
 [76,420,104],[77,420,104],[80,420,223],[85,730,223],
 [88,730,104],[89,730,104],[90,730,223],[110,730,223]
];
const clamp=x=>Math.max(0,Math.min(1,x));const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};const lerp=(a,b,u)=>a+(b-a)*smooth(u);
function model(input){
 const t=Math.max(0,Math.min(C.duration,Number(input)||0));let k=0;while(k<frames.length-2&&t>frames[k+1][0])k++;
 const a=frames[k],b=frames[k+1],u=(t-a[0])/(b[0]-a[0]);
 const x=lerp(a[1],b[1],u),z=lerp(a[2],b[2],u);
 const armY=t<38?C.armFrontY:t<48?lerp(C.armFrontY,C.workY,(t-38)/10):t<57?C.workY:t<65?lerp(C.workY,C.armFrontY,(t-57)/8):C.armFrontY;
 const angle=75*(1-smooth((t-30)/8));
 const pusherX=t<6?lerp(C.stockX,C.handoffX,t/6):t<14?C.handoffX:t<18?lerp(C.handoffX,C.stockX,(t-14)/4):C.stockX;
 const chuckOwner=t<11.5?'stock':t<22?'traverser':t<77?'stage':t<88?'traverser':'cleaner';
 const maskOwner=t<25?'absent':t<52?'arm':t<70?'traverser':t<77?'chuck':t<88?'traverser':'cleaner';
 const chuck=chuckOwner==='stock'?{x:pusherX,y:C.workY,z:154}:chuckOwner==='stage'?{x:C.ldX,y:C.workY,z:C.stageZ}:chuckOwner==='cleaner'?{x:C.cleanX,y:C.workY,z:C.stageZ}:{x,y:C.workY,z};
 const mask=maskOwner==='absent'?null:maskOwner==='arm'?{x:C.ldX,y:armY,z:C.armZ,angle}:maskOwner==='chuck'?{x:C.ldX,y:C.workY,z:C.maskOnChuckZ,angle:0}:maskOwner==='cleaner'?{x:C.cleanX,y:C.workY,z:C.maskOnChuckZ,angle:0}:{x,y:C.workY,z:z+(chuckOwner==='traverser'?9:0),angle:0};
 const wet=t>=C.wetStart&&t<C.dryStart,dry=t>=C.dryStart;
 return {t,step:steps.reduce((i,s,j)=>t>=s[0]?j:i,0),traverser:{x,y:C.rearY,z,headY:C.workY,pitch:0,roll:0},arm:{x:C.ldX,y:armY,z:C.armZ,angle},stage:{x:C.ldX,y:C.workY,z:C.stageZ,radius:C.stageRadius},stocker:{pusherX,handoffX:C.handoffX,rackRight:C.rackRight,pushComplete:t>=6,phase:t<6?'pushing':t<11.5?'handoff-ready':t<14?'lifting':t<18?'retracting':'home'},chuckOwner,maskOwner,chuck,mask,stockCount:chuckOwner==='stock'?3:2,topSpray:wet,backDIW:wet,dry,spin:t<C.wetStart?0:(t-C.wetStart)*1.2,holderSides:['front','rear'],armSupports:4};
}
root.CleaningModel={C,steps,frames,model};if(typeof module!=='undefined')module.exports=root.CleaningModel;
})(typeof globalThis!=='undefined'?globalThis:this);

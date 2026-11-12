// Pure engineering motion model. Units and time are illustrative, not equipment parameters.
(function(root){
'use strict';
const C=Object.freeze({stockX:70,handoffX:230,rackRight:146,stageRadius:64/3,chuckHalfWidth:59.5,ldX:420,cleanX:730,workY:35,rearY:190,armFrontY:-125,armZ:143,stageZ:104,maskOnChuckZ:113,stockLevels:[54,104,154],safeZ:223,duration:156,wetStart:108,dryStart:121,cleanEnd:130,tabOffset:50.7,tabFace:52.7537,maskGripOffset:46.5});
const steps=[
 [0,'Stocker 右推出料','Stocker 顶层将 Chuck 完全向右推出至独立交接位；Traverser 在高位等待。'],
 [6,'右侧交接位取 Chuck','Traverser 到右侧交接位，前后 Grip 对准实心块，竖直下降接合后向上提取。'],
 [14,'Chuck 放到 Stage','横移至 LD/ULD，下降把 Chuck 放到直径保持 1/3 的固定圆形 Stage，再上升退出。'],
 [25,'Chuck 顺时针 90°','俯视：仅 Chuck 本体顺时针旋转 90°。Stage 顶盘、立柱与底座均保持固定。'],
 [31,'LD 口承接 Mask','左右两组 LD/ULD arm 从 Mask 背面四角支撑；初始姿态 75°。'],
 [36,'Mask 翻转至水平','LD/ULD arm 把 Mask 从 75° 翻到水平，Traverser 不负责翻转。'],
 [44,'LD arm 向后送料','水平 Mask 随 LD arm 沿前后导轨送到 Chuck 正上方，保持悬空。'],
 [54,'向上取走 Mask','Traverser 水平头下降接合 Mask，再竖直向上提起；LD arm 暂留后方。'],
 [63,'LD arm 返回原位','Mask 在 Traverser 高位保持；LD arm 空载返回前方 LD 口。'],
 [71,'Mask 放到 Chuck','LD arm 完全回位后，Traverser 竖直下降把 Mask 放到 Chuck，再升高让出转向空间。'],
 [80,'组合体逆时针 90°','俯视：Chuck 带 Mask 一起逆时针旋转 90°，前后实心块恢复到 Grip 对接方向。Stage 不动。'],
 [86,'前后 Grip 对位夹持','前 Grip 与后 Grip 分别对应 Chuck 的前后实心块，下降接合后提起组合体。没有左右 Grip。'],
 [92,'组合体送入 Cleaner','Traverser 高位横移到 Chamber，再竖直下降放置 Chuck + Mask。'],
 [102,'退出并返回 LD 等待','Traverser 已上升退出 Chamber，沿后轨返回 LD 高位。清洗期间在 LD 待机。'],
 [108,'旋转清洗 / Dry','Chuck 与 Mask 同转；上方多液体喷淋，背面 DIW 连续开启至 Dry 起点。结束时对位停转。'],
 [130,'清洗结束 · 再去取回','Cleaning 完成、Chuck 前后实心块已对位。Traverser 从 LD 出发，再去 Chamber 下降接合。'],
 [140,'清洗组合体搬回 Stage','向上提起清洗完成的组合体，横移回 LD，再下降放回固定 Stage；完成后 Grip 上升退出。']
];
const frames=[// time, X, Z. Deliberately no front/back motion keyframes.
 [0,420,223],[6,420,223],[9,230,223],[11,230,154],[11.5,230,154],[14,230,223],
 [18,420,223],[22,420,104],[23,420,104],[25,420,223],[31,420,223],
 [54,420,223],[57,420,143],[58,420,143],[63,420,223],
 [71,420,223],[76,420,113],[77,420,113],[80,420,223],[86,420,223],
 [88,420,104],[89,420,104],[92,420,223],[97,730,223],
 [100,730,104],[101,730,104],[102,730,223],[108,420,223],[130,420,223],
 [136,730,223],[139,730,104],[140,730,104],[143,730,223],
 [149,420,223],[152,420,104],[153,420,104],[156,420,223]
];
const clamp=x=>Math.max(0,Math.min(1,x));const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};const lerp=(a,b,u)=>a+(b-a)*smooth(u);
function cleaningRotation(t){
 // Smooth 2-unit spin-up/down, exact full-turn stop for the fixed front/rear grips.
 const u=Math.max(0,Math.min(22,t-C.wetStart)),omega=8*Math.PI/20;
 if(u<2)return omega*u*u/4;
 if(u<=20)return omega*(u-1);
 const d=u-20;return omega*(19+d-d*d/4);
}
function model(input){
 const t=Math.max(0,Math.min(C.duration,Number(input)||0));let k=0;while(k<frames.length-2&&t>frames[k+1][0])k++;
 const a=frames[k],b=frames[k+1],u=(t-a[0])/(b[0]-a[0]),x=lerp(a[1],b[1],u),z=lerp(a[2],b[2],u);
 const armY=t<44?C.armFrontY:t<54?lerp(C.armFrontY,C.workY,(t-44)/10):t<63?C.workY:t<71?lerp(C.workY,C.armFrontY,(t-63)/8):C.armFrontY;
 const angle=75*(1-smooth((t-36)/8));
 const pusherX=t<6?lerp(C.stockX,C.handoffX,t/6):t<14?C.handoffX:t<18?lerp(C.handoffX,C.stockX,(t-14)/4):C.stockX;
 const chuckOwner=t<11.5?'stock':t<22?'traverser':t<89?'stage':t<100?'traverser':t<140?'cleaner':t<153?'traverser':'stage';
 const maskOwner=t<31?'absent':t<58?'arm':t<76?'traverser':t<89?'chuck':t<100?'traverser':t<140?'cleaner':t<153?'traverser':'chuck';
 const chuckRotation=-Math.PI/2*smooth((t-25)/6)+Math.PI/2*smooth((t-80)/6)+cleaningRotation(t);
 const maskRotation=t<80?0:Math.PI/2*smooth((t-80)/6)+cleaningRotation(t);
 const chuck=chuckOwner==='stock'?{x:pusherX,y:C.workY,z:154}:chuckOwner==='stage'?{x:C.ldX,y:C.workY,z:C.stageZ}:chuckOwner==='cleaner'?{x:C.cleanX,y:C.workY,z:C.stageZ}:{x,y:C.workY,z};
 const mask=maskOwner==='absent'?null:maskOwner==='arm'?{x:C.ldX,y:armY,z:C.armZ,angle}:maskOwner==='chuck'?{x:C.ldX,y:C.workY,z:C.maskOnChuckZ,angle:0}:maskOwner==='cleaner'?{x:C.cleanX,y:C.workY,z:C.maskOnChuckZ,angle:0}:{x,y:C.workY,z:z+(chuckOwner==='traverser'?9:0),angle:0};
 const topSpray=t>=C.wetStart&&t<C.dryStart,backDIW=topSpray,dry=t>=C.dryStart&&t<C.cleanEnd;
 const headOffset=-9*smooth((t-45)/4)*(1-smooth((t-80)/4));
 const headZ=z+headOffset;
 const gripMode=t>=45&&t<84?'mask':'chuck';
 const clampWindow=(start,end)=>smooth((t-start)/.8)*(1-smooth((t-end)/1));
 const gripClosure=clampWindow(10.7,22)+clampWindow(57.2,76)+clampWindow(88.2,100)+clampWindow(139.2,153);
 const gripEngaged=chuckOwner==='traverser'||(maskOwner==='traverser'&&chuckOwner!=='traverser');
 const gripPoints=[-1,1].map(side=>({side:side<0?'front':'rear',x,y:C.workY+side*C.tabOffset,z:headZ+5+(1-gripClosure)*1.5}));
 const blockPoints=[-1,1].map(side=>({side:side<0?'front':'rear',x:chuck.x-side*C.tabOffset*Math.sin(chuckRotation),y:chuck.y+side*C.tabOffset*Math.cos(chuckRotation),z:chuck.z+5}));
 const phase=t<102?'loading':t<108?'returning-to-LD':t<C.cleanEnd?'LD-waiting':t<140?'return-to-chamber':t<153?'return-to-stage':'complete';
 return {t,step:steps.reduce((i,s,j)=>t>=s[0]?j:i,0),traverser:{x,y:C.rearY,z,headZ,headY:C.workY,pitch:0,roll:0},arm:{x:C.ldX,y:armY,z:C.armZ,angle},stage:{x:C.ldX,y:C.workY,z:C.stageZ,radius:C.stageRadius,rotation:0},stocker:{pusherX,handoffX:C.handoffX,rackRight:C.rackRight,pushComplete:t>=6,phase:t<6?'pushing':t<11.5?'handoff-ready':t<14?'lifting':t<18?'retracting':'home'},chuckOwner,maskOwner,chuck,mask,chuckRotation,maskRotation,stockCount:chuckOwner==='stock'?3:2,topSpray,backDIW,dry,cleaningComplete:t>=C.cleanEnd,spin:cleaningRotation(t),holderSides:['front','rear'],armSupports:4,gripMode,gripEngaged,gripClosure,gripPoints,blockPoints,phase};
}
root.CleaningModel={C,steps,frames,model};if(typeof module!=='undefined')module.exports=root.CleaningModel;
})(typeof globalThis!=='undefined'?globalThis:this);

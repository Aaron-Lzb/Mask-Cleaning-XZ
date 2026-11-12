// Pure engineering motion model. Units and time are illustrative, not equipment parameters.
(function(root){
'use strict';
const C=Object.freeze({stockX:70,handoffX:230,rackRight:146,stageRadius:64/3,chuckHalfWidth:59.5,ldX:420,cleanX:730,workY:35,rearY:190,armFrontY:-125,armZ:143,stageZ:104,chuckZScale:.5,chuckBodyZ:2.5,chuckSupportZ:4.5,maskHalfX:36.3446,maskHalfY:41.3214,maskSeatOffset:3.25,maskContactZ:5.25,maskOnChuckZ:107.25,stockLevels:[54,104,154],safeZ:223,duration:238,wetStart:108,dryStart:121,cleanEnd:130,tabOffset:50.7,tabFace:52.7537,maskGripOffset:39.3214});
const steps=[
 [0, "Stocker 出料", "顶层托架将 Chuck 向右完全推出，Traverser 在高位等待。"],
 [6, "交接位取 Chuck", "Traverser 移至右侧交接位，前后 Grip 对准实心块，下降接合后上提。"],
 [14, "Chuck 放上 Stage", "横移至 LD/ULD，将 Chuck 放到固定 Chuck\u00a0Stage，随后上提。"],
 [25, "Chuck 顺时针 90°", "俯视：Chuck 顺时针转 90°，Chuck\u00a0Stage 保持固定。"],
 [31, "LD\u00a0Arm 接片", "LD\u00a0Arm 从 Mask 背面支撑四角，以 75° 姿态接片。"],
 [36, "Mask 翻平", "LD\u00a0Arm 带 Mask 从 75° 翻至水平。"],
 [44, "LD\u00a0Arm 后移", "水平 Mask 随 LD\u00a0Arm 后移至 Chuck 正上方，保持悬空。"],
 [54, "向上取 Mask", "Traverser 下降夹持水平 Mask，再竖直上提；LD\u00a0Arm 暂留后方。"],
 [63, "空 LD\u00a0Arm 回位", "Mask 在高位等待，空载 LD\u00a0Arm 返回 LD 口。"],
 [71, "Mask 放上 Chuck", "LD\u00a0Arm 回位后，Traverser 将 Mask 放到 Chuck，再上提让位。"],
 [80, "组合体逆时针 90°", "Chuck 与 Mask 一起逆时针转 90°，使前后实心块与 Grip 对齐。"],
 [86, "Grip 夹持组合体", "前后 Grip 对准 Chuck 实心块，下降夹持后提起组合体。"],
 [92, "送入 Cleaner", "组合体在高位横移至 Cleaner，再竖直下降放置。"],
 [102, "Traverser 回位", "Traverser 上提退出 Cleaner，返回 LD/ULD 高位待机。"],
 [108, "旋转清洗与干燥", "Chuck 与 Mask 同转，上方工艺液和背面 DIW 喷淋；Dry 开始停喷，结束时对位停转。"],
 [130, "Cleaner 取回", "清洗完成且旋转停止后，Traverser 前往 Cleaner 下降接合。"],
 [140, "组合体返回 Stage", "提起清洗后的组合体，横移回 LD/ULD 并放上 Chuck\u00a0Stage，再上提退出。"],
 [156, "组合体顺时针 90°", "俯视：Chuck 与 Mask 一起顺时针转 90°，Chuck\u00a0Stage 不动。"],
 [162, "从 Chuck 提起 Mask", "Traverser 先竖直提起 Mask，为空载 LD\u00a0Arm 后移让位。"],
 [171, "空 LD\u00a0Arm 后移", "Mask 在高位等待，空载 LD\u00a0Arm 后移至 Chuck 正上方接片。"],
 [179, "Mask 放回 LD\u00a0Arm", "Traverser 将水平 Mask 放到 LD\u00a0Arm 四角支撑点，释放后上提。"],
 [189, "LD\u00a0Arm 带片回位", "LD\u00a0Arm 带水平 Mask 前移，返回 LD 口。"],
 [197, "Mask 翻回 75°", "LD\u00a0Arm 到位后带 Mask 翻至 75°，前缘下降、后缘上升；空 Chuck 同时逆时针转 90° 复位。"],
 [203, "取回空 Chuck", "Traverser 从 Chuck\u00a0Stage 夹持空 Chuck，再竖直上提。"],
 [210, "空 Chuck 送回", "空 Chuck 在高位横移至 Stocker 右侧交接位。"],
 [216, "托架伸出接料", "顶层托架向右伸出，Traverser 在高位等待托架到位。"],
 [222, "Chuck 放回托架", "Traverser 在右侧交接位下降，将 Chuck 放到托架。"],
 [227, "Grip 释放退出", "Grip 释放并上提；托架保持伸出，等待搬运头完全退出。"],
 [230, "托架回收入库", "托架带 Chuck 缩回顶层，Mask 留在 LD 口，循环结束。"]
];
const frames=[// time, X, Z. Deliberately no front/back motion keyframes.
 [0,420,223],[6,420,223],[9,230,223],[11,230,154],[11.5,230,154],[14,230,223],
 [18,420,223],[22,420,104],[23,420,104],[25,420,223],[31,420,223],
 [54,420,223],[57,420,143],[58,420,143],[63,420,223],
 [71,420,223],[76,420,107.25],[77,420,107.25],[80,420,223],[86,420,223],
 [88,420,104],[89,420,104],[92,420,223],[97,730,223],
 [100,730,104],[101,730,104],[102,730,223],[108,420,223],[130,420,223],
 [136,730,223],[139,730,104],[140,730,104],[143,730,223],
 [149,420,223],[152,420,104],[153,420,104],[156,420,223],[162,420,223],[166,420,107.25],[167,420,107.25],[171,420,223],
 [179,420,223],[183,420,143],[184,420,143],[189,420,223],[197,420,223],[203,420,223],
 [206,420,104],[207,420,104],[210,420,223],[216,230,223],[222,230,223],
 [226,230,154],[227,230,154],[230,230,223],[238,230,223]
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
 const armY=t<44?C.armFrontY:t<54?lerp(C.armFrontY,C.workY,(t-44)/10):t<63?C.workY:t<71?lerp(C.workY,C.armFrontY,(t-63)/8):t<171?C.armFrontY:t<179?lerp(C.armFrontY,C.workY,(t-171)/8):t<189?C.workY:t<197?lerp(C.workY,C.armFrontY,(t-189)/8):C.armFrontY;
 const angle=75*(1-smooth((t-36)/8))+75*smooth((t-197)/8);
 const pusherX=t<6?lerp(C.stockX,C.handoffX,t/6):t<14?C.handoffX:t<18?lerp(C.handoffX,C.stockX,(t-14)/4):t<216?C.stockX:t<222?lerp(C.stockX,C.handoffX,(t-216)/6):t<230?C.handoffX:t<238?lerp(C.handoffX,C.stockX,(t-230)/8):C.stockX;
 const chuckOwner=t<11.5?'stock':t<22?'traverser':t<89?'stage':t<100?'traverser':t<140?'cleaner':t<153?'traverser':t<207?'stage':t<227?'traverser':'stock';
 const maskOwner=t<31?'absent':t<58?'arm':t<76?'traverser':t<89?'chuck':t<100?'traverser':t<140?'cleaner':t<153?'traverser':t<167?'chuck':t<183?'traverser':'arm';
 const chuckRotation=-Math.PI/2*smooth((t-25)/6)+Math.PI/2*smooth((t-80)/6)+cleaningRotation(t)-Math.PI/2*smooth((t-156)/6)+Math.PI/2*smooth((t-197)/6);
 const maskRotation=t<80?0:Math.PI/2*smooth((t-80)/6)+cleaningRotation(t)-Math.PI/2*smooth((t-156)/6);
 const chuck=chuckOwner==='stock'?{x:pusherX,y:C.workY,z:154}:chuckOwner==='stage'?{x:C.ldX,y:C.workY,z:C.stageZ}:chuckOwner==='cleaner'?{x:C.cleanX,y:C.workY,z:C.stageZ}:{x,y:C.workY,z};
 const mask=maskOwner==='absent'?null:maskOwner==='arm'?{x:C.ldX,y:armY,z:C.armZ,angle}:maskOwner==='chuck'?{x:C.ldX,y:C.workY,z:C.maskOnChuckZ,angle:0}:maskOwner==='cleaner'?{x:C.cleanX,y:C.workY,z:C.maskOnChuckZ,angle:0}:{x,y:C.workY,z:z+(chuckOwner==='traverser'?C.maskSeatOffset:0),angle:0};
 const topSpray=t>=C.wetStart&&t<C.dryStart,backDIW=topSpray,dry=t>=C.dryStart&&t<C.cleanEnd;
 const headOffset=-C.maskSeatOffset*(smooth((t-45)/4)*(1-smooth((t-80)/4))+smooth((t-162)/4)*(1-smooth((t-189)/4)));
 const headZ=z+headOffset;
 const gripMode=(t>=45&&t<84)||(t>=162&&t<193)?'mask':'chuck';
 const clampWindow=(start,end)=>smooth((t-start)/.8)*(1-smooth((t-end)/1));
 const gripClosure=clampWindow(10.7,22)+clampWindow(57.2,76)+clampWindow(88.2,100)+clampWindow(139.2,153)+clampWindow(166.2,183)+clampWindow(206.2,227);
 const gripEngaged=chuckOwner==='traverser'||(maskOwner==='traverser'&&chuckOwner!=='traverser');
 const gripPoints=[-1,1].map(side=>({side:side<0?'front':'rear',x,y:C.workY+side*C.tabOffset,z:headZ+C.chuckBodyZ+(1-gripClosure)*1.5}));
 const blockPoints=[-1,1].map(side=>({side:side<0?'front':'rear',x:chuck.x-side*C.tabOffset*Math.sin(chuckRotation),y:chuck.y+side*C.tabOffset*Math.cos(chuckRotation),z:chuck.z+C.chuckBodyZ}));
 const phase=t<102?'loading':t<108?'returning-to-LD':t<C.cleanEnd?'LD-waiting':t<140?'return-to-chamber':t<156?'return-to-stage':t<162?'unload-rotate':t<171?'unload-lift':t<179?'arm-receive':t<189?'unload-place':t<197?'arm-return':t<203?'chuck-reindex':t<210?'empty-pick':t<216?'empty-transfer':t<222?'tray-extend':t<230?'stock-handoff':t<238?'stock-retract':'complete';
 return {t,step:steps.reduce((i,s,j)=>t>=s[0]?j:i,0),traverser:{x,y:C.rearY,z,headZ,headY:C.workY,pitch:0,roll:0},arm:{x:C.ldX,y:armY,z:C.armZ,angle},stage:{x:C.ldX,y:C.workY,z:C.stageZ,radius:C.stageRadius,rotation:0},stocker:{pusherX,handoffX:C.handoffX,rackRight:C.rackRight,pushComplete:pusherX===C.handoffX,phase:t<6?'pushing':t<11.5?'handoff-ready':t<14?'lifting':t<18?'retracting':t<216?'home':t<222?'extending-empty':t<227?'receiving':t<230?'supported':t<238?'retracting-loaded':'stored',trayOrigin:'internal',externalSupport:false},chuckOwner,maskOwner,chuck,mask,chuckRotation,maskRotation,stockCount:chuckOwner==='stock'?3:2,topSpray,backDIW,dry,cleaningComplete:t>=C.cleanEnd,spin:cleaningRotation(t),holderSides:['front','rear'],armSupports:4,gripMode,gripEngaged,gripClosure,gripPoints,blockPoints,phase};
}
root.CleaningModel={C,steps,frames,model};if(typeof module!=='undefined')module.exports=root.CleaningModel;
})(typeof globalThis!=='undefined'?globalThis:this);

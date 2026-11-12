'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const {C,model,frames}=require('./model.js');
const previous=require('./baseline-before-mask-fit/model.js');
require('./chuck-profile.js');const profile=globalThis.ChuckProfile;
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'references/Chuck.png'))).digest('hex'),profile.sourceSHA256,'Chuck reference changed');
assert.equal(C.stageRadius,64/3);
let samples=0,preserved=0;
const checkPose=(m,old)=>{
 for(let axis of ['x','y','headY','pitch','roll'])assert.equal(m.traverser[axis],old.traverser[axis]);
 for(let key of ['arm','chuckOwner','maskOwner','chuck','stockCount','chuckRotation','maskRotation','topSpray','backDIW','dry'])assert.deepEqual(m[key],old[key]);
 if(m.mask){assert.equal(m.mask.x,old.mask.x);assert.equal(m.mask.y,old.mask.y);assert.equal(m.mask.angle,old.mask.angle)}
 preserved++;
};
for(let i=0;i<=C.duration*40;i++){
 const t=i/40,m=model(t);samples++;
 assert.equal(m.traverser.y,190);assert.equal(m.traverser.headY,35);assert.equal(m.traverser.pitch,0);assert.equal(m.traverser.roll,0);
 assert.equal(m.stage.z,104);assert.equal(m.stage.radius,64/3);assert.equal(m.stage.rotation,0);assert.deepEqual(m.holderSides,['front','rear']);
 checkPose(m,previous.model(t));
 if(m.maskOwner==='traverser')assert.equal(m.mask.angle,0);
 if(m.maskOwner==='traverser'&&m.chuckOwner!=='traverser'){assert.ok(Math.abs(m.traverser.headZ+C.maskContactZ-(m.mask.z+2))<1e-8);assert.ok(Math.abs(Math.sin(m.maskRotation))<1e-8)}
 if(t>=44&&t<=54)assert.equal(m.arm.angle,0);
 if(t>=63&&t<=71){assert.equal(m.maskOwner,'traverser');assert.equal(m.traverser.z,C.safeZ)}
 if(t<6){assert.equal(m.traverser.x,420);assert.equal(m.traverser.z,C.safeZ);assert.equal(m.chuckOwner,'stock')}
 if(t>=6&&t<11.5)assert.ok(m.chuck.x-C.chuckHalfWidth>C.rackRight);
 if(t>=108&&t<=130){assert.equal(m.traverser.x,C.ldX);assert.equal(m.traverser.z,C.safeZ);assert.equal(m.chuckOwner,'cleaner')}
 if(t>=C.wetStart&&t<C.dryStart)assert.equal(m.backDIW,true);
 if(t>=C.dryStart)assert.equal(m.backDIW,false);
 if(t>=25&&t<=31){assert.equal(m.chuckOwner,'stage');assert.equal(m.gripEngaged,false)}
 if(t>=80&&t<=86){assert.equal(m.chuckOwner,'stage');assert.equal(m.maskOwner,'chuck');assert.equal(m.gripEngaged,false)}
 // Exact point matching on both solid tabs for every carried Chuck pose.
 if(m.chuckOwner==='traverser')for(let j=0;j<2;j++)for(let axis of ['x','y','z'])assert.ok(Math.abs(m.gripPoints[j][axis]-m.blockPoints[j][axis])<1e-8,`Grip mismatch ${t} ${j} ${axis}`);
 if(t>=171&&t<179){assert.equal(m.maskOwner,'traverser');assert.equal(m.traverser.z,C.safeZ)}
 if(t>=189&&t<=197){assert.equal(m.maskOwner,'arm');assert.equal(m.chuckOwner,'stage')}
 if(t>=216&&t<=222){assert.equal(m.chuckOwner,'traverser');assert.equal(m.traverser.z,C.safeZ)}
 if(t>=227){assert.equal(m.chuckOwner,'stock');assert.equal(m.chuck.x,m.stocker.pusherX);assert.equal(m.chuck.z,154)}
 assert.equal(m.stocker.externalSupport,false);assert.equal(m.stocker.trayOrigin,'internal');
 // Every nested support pair retains a positive X overlap, even at full extension.
 const d=m.stocker.pusherX-C.stockX;assert.ok(120-d/2>=40);
 if(t>=14&&t<18)assert.equal(m.chuckOwner,'traverser');
 if(t>=197&&t<=203){assert.equal(m.chuckOwner,'stage');assert.equal(m.maskOwner,'arm');assert.equal(m.gripEngaged,false)}
}
for(let i=1;i<frames.length;i++){let a=frames[i-1],b=frames[i];assert.ok(a[1]===b[1]||a[2]===b[2]);if(a[1]!==b[1])assert.equal(a[2],C.safeZ)}
for(let [name,t] of [['chuck',11.5],['chuck',22],['mask',58],['mask',76],['chuck',89],['mask',89],['chuck',100],['mask',100],['chuck',140],['mask',140],['chuck',153],['mask',153],['mask',167],['mask',183],['chuck',207],['chuck',227]]){
 let a=model(t-1e-7)[name],b=model(t)[name];for(let axis of ['x','y','z'])assert.ok(Math.abs(a[axis]-b[axis])<1e-5,`${name} jumps at ${t} ${axis}`)
}
assert.equal(model(25).chuckRotation,0);assert.equal(model(31).chuckRotation,-Math.PI/2);assert.equal(model(80).chuckRotation,-Math.PI/2);assert.equal(model(86).chuckRotation,0);assert.equal(model(86).maskRotation,Math.PI/2);
assert.equal(model(130).spin,8*Math.PI);assert.equal(model(153).chuckOwner,'stage');assert.equal(model(153).maskOwner,'chuck');
assert.equal(model(156).traverser.z,C.safeZ);assert.equal(model(156).chuck.x,C.ldX);
assert.equal(model(162).chuckRotation,8*Math.PI-Math.PI/2);assert.equal(model(162).maskRotation,8*Math.PI);
assert.equal(model(203).chuckRotation,8*Math.PI);assert.equal(model(238).stockCount,3);assert.equal(model(238).chuck.x,C.stockX);
assert.equal(model(238).maskOwner,'arm');assert.equal(model(238).arm.y,C.armFrontY);
assert.equal(model(18).stocker.pusherX,C.stockX);assert.equal(model(222).stocker.pusherX,C.handoffX);assert.equal(model(238).stocker.pusherX,C.stockX);
// Return tilt is the exact reverse of loading: translate first, then tilt with the same four backside supports.
for(let i=0;i<=320;i++){
 const t=197+i/40,m=model(t),forward=model(44-i/40);
 assert.equal(m.arm.y,C.armFrontY);assert.equal(m.maskOwner,'arm');
 assert.equal(m.mask.angle,m.arm.angle);assert.ok(Math.abs(m.arm.angle-forward.arm.angle)<1e-10);
 const a=m.arm.angle*Math.PI/180;
 assert.ok(C.armZ-C.maskHalfY*Math.sin(a)<=C.armZ); // Front/lower edge descends.
 assert.ok(C.armZ+C.maskHalfY*Math.sin(a)>=C.armZ); // Rear/upper edge rises.
 for(let x of [-C.maskHalfX+2,C.maskHalfX-2])for(let y of [-C.maskHalfY+2,C.maskHalfY-2]){
  const support=[C.ldX+x,C.armFrontY+y*Math.cos(a),C.armZ+y*Math.sin(a)];
  const r=m.maskRotation,point=[m.mask.x+x*Math.cos(r)-y*Math.cos(a)*Math.sin(r),m.mask.y+x*Math.sin(r)+y*Math.cos(a)*Math.cos(r),m.mask.z+y*Math.sin(a)];
  for(let k=0;k<3;k++)assert.ok(Math.abs(support[k]-point[k])<1e-9);
 }
}
for(let t=189;t<=197;t+=.025)assert.equal(model(t).arm.angle,0);
assert.equal(model(205).arm.angle,75);assert.equal(model(C.duration).mask.angle,75);
// Compare scanline mesh area with the source contours and test that all major holes are genuinely open.
const area=ps=>ps.reduce((a,p,i)=>{let q=ps[(i+1)%ps.length];return a+p[0]*q[1]-q[0]*p[1]},0)/2;
const surfaceArea=profile.surfaceQuads.reduce((a,p)=>a+Math.abs(area(p)),0),contourArea=Math.abs(profile.contours.reduce((a,p)=>a+area(p),0));
assert.ok(Math.abs(surfaceArea-contourArea)<.1);
const pointInside=(x,y,ps)=>{let inside=false;for(let i=0,j=ps.length-1;i<ps.length;j=i++){let a=ps[i],b=ps[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside}return inside};
for(let [x,y] of [...profile.holes,profile.centerHole])assert.ok(!profile.surfaceQuads.some(q=>pointInside(x,y,q)),'Reference hole was filled');
const points=profile.contours.flat(),xs=points.map(p=>p[0]);assert.equal(Math.max(...xs)-Math.min(...xs),119);
assert.equal(profile.supportPoints.length,8); // Eight arms/pad groups explicitly confirmed by user.
// The seated Mask is centered inside the eight cylindrical Pin sidewalls, not perched above them.
for(let [px,py] of profile.supportPoints){
 const dx=Math.max(0,Math.abs(px)-C.maskHalfY),dy=Math.max(0,Math.abs(py)-C.maskHalfX);
 assert.ok(Math.hypot(dx,dy)-1.1>=.59999,'Mask overlaps locating Pin');
}
assert.ok(Math.abs(C.maskHalfY-(43.0214-1.1-.6))<1e-9);
assert.ok(Math.abs(C.maskHalfX-(38.0446-1.1-.6))<1e-9);
assert.equal(C.maskSeatOffset,(5+1.5)*C.chuckZScale);assert.equal(C.maskOnChuckZ,C.stageZ+C.maskSeatOffset);
// LD upright inner faces clear the Chuck full swept radius; moving arms remain above its top.
assert.ok(C.maskHalfX+28-C.chuckHalfWidth>4);
assert.ok(C.armZ-14>C.stageZ+C.chuckSupportZ);
assert.equal(C.maskGripOffset,C.maskHalfY-2);
for(let i=0;i<=C.duration*40;i++){
 const m=model(i/40);
 if(m.maskOwner==='arm'){
  assert.equal(m.mask.angle,m.arm.angle);assert.equal(m.mask.y,m.arm.y);
  for(let sx of [-1,1])for(let sy of [-1,1]){
   const px=sx*(C.maskHalfX-2),py=sy*(C.maskHalfY-2);
   assert.ok(Math.abs(px)+2<=C.maskHalfX);assert.ok(Math.abs(py)+2<=C.maskHalfY);
  }
 }
 if(m.maskOwner==='chuck'||m.maskOwner==='cleaner'||(m.maskOwner==='traverser'&&m.chuckOwner==='traverser')){
  assert.equal(m.mask.x,m.chuck.x);assert.equal(m.mask.y,m.chuck.y);
  assert.ok(Math.abs(m.mask.z-m.chuck.z-C.maskSeatOffset)<1e-8);
  assert.ok(Math.abs(Math.cos(m.maskRotation-m.chuckRotation))<1e-8);
 }
}
// Contact footprints lie on actual unperforated protrusions in the traced plate.
for(let side of [-1,1])for(let x of [-6,0,6])for(let dy of [-1.5,0,1.5])assert.ok(profile.surfaceQuads.some(q=>pointInside(x,side*C.tabOffset+dy,q)),'Grip contact outside solid tab');
assert.equal(C.chuckZScale,.5);assert.equal(C.chuckBodyZ,2.5);assert.equal(C.chuckSupportZ,4.5);
console.log(`PASS: ${samples} samples; ${preserved} preserved poses; preserved loading/cleaning; fixed Stage; strict inverse Mask unloading; empty Chuck reindex; internal tray out/in; complete restock; XZ-only; 16 continuous handoffs; exact front/rear grip contacts.`);

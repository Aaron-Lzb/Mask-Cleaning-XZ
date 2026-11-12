'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const {C,model,frames}=require('./model.js');
const previous=require('./baseline-before-return/model.js');
require('./chuck-profile.js');const profile=globalThis.ChuckProfile;
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'../Chuck.png'))).digest('hex'),profile.sourceSHA256,'Chuck reference changed');
assert.equal(C.stageRadius,64/3);
let samples=0,preserved=0;
const checkPose=(m,old)=>{
 for(let axis of ['x','y','z','headY','pitch','roll'])assert.equal(m.traverser[axis],old.traverser[axis]);
 for(let key of ['arm','chuckOwner','maskOwner','chuck','mask','stockCount'])assert.deepEqual(m[key],old[key]);
 preserved++;
};
for(let i=0;i<=C.duration*40;i++){
 const t=i/40,m=model(t);samples++;
 assert.equal(m.traverser.y,190);assert.equal(m.traverser.headY,35);assert.equal(m.traverser.pitch,0);assert.equal(m.traverser.roll,0);
 assert.equal(m.stage.z,104);assert.equal(m.stage.radius,64/3);assert.equal(m.stage.rotation,0);assert.deepEqual(m.holderSides,['front','rear']);
 if(t<25)checkPose(m,previous.model(t));
 if(t>=31&&t<80)checkPose(m,previous.model(t-6));
 if(t>=86&&t<102)checkPose(m,previous.model(t-12));
 if(t>=108&&t<=128){let old=previous.model(t-18);assert.equal(m.topSpray,old.topSpray);assert.equal(m.backDIW,old.backDIW)}
 if(m.maskOwner==='traverser')assert.equal(m.mask.angle,0);
 if(m.maskOwner==='traverser'&&m.chuckOwner!=='traverser'){assert.ok(Math.abs(m.traverser.headZ+11-(m.mask.z+2))<1e-8);assert.equal(m.maskRotation,0)}
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
 if(t>=C.cleanEnd)assert.ok(Math.abs(Math.sin(m.chuckRotation))<1e-8);
}
for(let i=1;i<frames.length;i++){let a=frames[i-1],b=frames[i];assert.ok(a[1]===b[1]||a[2]===b[2]);if(a[1]!==b[1])assert.equal(a[2],C.safeZ)}
for(let [name,t] of [['chuck',11.5],['chuck',22],['mask',58],['mask',76],['chuck',89],['mask',89],['chuck',100],['mask',100],['chuck',140],['mask',140],['chuck',153],['mask',153]]){
 let a=model(t-1e-7)[name],b=model(t)[name];for(let axis of ['x','y','z'])assert.ok(Math.abs(a[axis]-b[axis])<1e-5,`${name} jumps at ${t} ${axis}`)
}
assert.equal(model(25).chuckRotation,0);assert.equal(model(31).chuckRotation,-Math.PI/2);assert.equal(model(80).chuckRotation,-Math.PI/2);assert.equal(model(86).chuckRotation,0);assert.equal(model(86).maskRotation,Math.PI/2);
assert.equal(model(130).spin,8*Math.PI);assert.equal(model(153).chuckOwner,'stage');assert.equal(model(153).maskOwner,'chuck');
assert.equal(model(156).traverser.z,C.safeZ);assert.equal(model(156).chuck.x,C.ldX);
// Compare scanline mesh area with the source contours and test that all major holes are genuinely open.
const area=ps=>ps.reduce((a,p,i)=>{let q=ps[(i+1)%ps.length];return a+p[0]*q[1]-q[0]*p[1]},0)/2;
const surfaceArea=profile.surfaceQuads.reduce((a,p)=>a+Math.abs(area(p)),0),contourArea=Math.abs(profile.contours.reduce((a,p)=>a+area(p),0));
assert.ok(Math.abs(surfaceArea-contourArea)<.1);
const pointInside=(x,y,ps)=>{let inside=false;for(let i=0,j=ps.length-1;i<ps.length;j=i++){let a=ps[i],b=ps[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside}return inside};
for(let [x,y] of [...profile.holes,profile.centerHole])assert.ok(!profile.surfaceQuads.some(q=>pointInside(x,y,q)),'Reference hole was filled');
const points=profile.contours.flat(),xs=points.map(p=>p[0]);assert.equal(Math.max(...xs)-Math.min(...xs),119);
assert.equal(profile.supportPoints.length,8); // Eight arms/pad groups explicitly confirmed by user.
// Contact footprints lie on actual unperforated protrusions in the traced plate.
for(let side of [-1,1])for(let x of [-4,0,4])for(let dy of [-1.5,0,1.5])assert.ok(profile.surfaceQuads.some(q=>pointInside(x,side*C.tabOffset+dy,q)),'Grip contact outside solid tab');
console.log(`PASS: ${samples} samples; ${preserved} preserved poses; CW/CCW90; fixed Stage; LD waiting; indexed stop; complete return; XZ-only; 12 continuous handoffs; exact front/rear grip contacts.`);

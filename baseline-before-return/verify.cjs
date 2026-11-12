'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const {C,model,frames}=require('./model.js');
const previous=require('./baseline-before-stock-fix/model.js');
require('./chuck-profile.js');const profile=globalThis.ChuckProfile;
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'../Chuck.png'))).digest('hex'),profile.sourceSHA256,'Geometry must match the supplied updated Chuck reference');
assert.equal(C.stageRadius/previous.model(30).stage.radius,1/3);
let samples=0,unchanged=0;
const preserved=['traverser','arm','chuckOwner','maskOwner','chuck','mask','topSpray','backDIW','dry','spin','holderSides','armSupports'];
for(let i=0;i<=4400;i++){
 const t=i/40,m=model(t);samples++;
 assert.equal(m.traverser.y,190);assert.equal(m.traverser.headY,35);assert.equal(m.traverser.pitch,0);assert.equal(m.traverser.roll,0);
 assert.equal(m.stage.z,104);assert.equal(m.stage.radius,64/3);assert.deepEqual(m.holderSides,['front','rear']);assert.equal(m.armSupports,4);
 if(m.maskOwner==='traverser')assert.equal(m.mask.angle,0);
 if(t>=38&&t<=48)assert.equal(m.arm.angle,0);
 if(t>=52&&t<57)assert.equal(m.arm.y,35);
 if(t>=57&&t<=65){assert.equal(m.maskOwner,'traverser');assert.equal(m.traverser.z,223)}
 if(t>=90&&t<103)assert.equal(m.backDIW,true);
 if(t>=103)assert.equal(m.backDIW,false);
 // Trav only approaches the handoff after the Chuck has completely cleared the rack.
 if(t<6){assert.equal(m.traverser.x,420);assert.equal(m.traverser.z,C.safeZ);assert.equal(m.chuckOwner,'stock');assert.equal(m.chuck.z,154)}
 if(t>=6&&t<11.5){assert.equal(m.chuck.x,C.handoffX);assert.ok(m.chuck.x-C.chuckHalfWidth>C.rackRight);assert.equal(m.chuckOwner,'stock')}
 if(t<14&&m.traverser.z<C.safeZ)assert.equal(m.traverser.x,C.handoffX);
 // Every accepted downstream pose and process signal is unchanged at the same time.
 if(t>=25){const p=previous.model(t);for(let key of preserved)assert.deepEqual(m[key],p[key],`${key} changed at ${t}`);for(let axis of ['x','y','z'])assert.equal(m.stage[axis],p.stage[axis]);unchanged++}
}
for(let i=1;i<frames.length;i++){let a=frames[i-1],b=frames[i];assert.ok(a[1]===b[1]||a[2]===b[2]);if(a[1]!==b[1])assert.equal(a[2],C.safeZ)}
for(let [name,t] of [['chuck',11.5],['chuck',22],['mask',52],['mask',70],['chuck',77],['mask',77],['chuck',88],['mask',88]]){
 let a=model(t-1e-7)[name],b=model(t)[name];for(let axis of ['x','y','z'])assert.ok(Math.abs(a[axis]-b[axis])<1e-5,`${name} jumps at ${t} ${axis}`)
}
assert.equal(model(0).stockCount,3);assert.equal(model(11.5).stockCount,2);assert.equal(model(6).stocker.pusherX,230);assert.equal(model(18).stocker.pusherX,70);
assert.equal(model(11.5).chuck.x,230);assert.equal(model(11.5).traverser.z,154);
// Compare scanline mesh area with the source contours and test that all major holes are genuinely open.
const area=ps=>ps.reduce((a,p,i)=>{let q=ps[(i+1)%ps.length];return a+p[0]*q[1]-q[0]*p[1]},0)/2;
const surfaceArea=profile.surfaceQuads.reduce((a,p)=>a+Math.abs(area(p)),0),contourArea=Math.abs(profile.contours.reduce((a,p)=>a+area(p),0));
assert.ok(Math.abs(surfaceArea-contourArea)<.1);
const pointInside=(x,y,ps)=>{let inside=false;for(let i=0,j=ps.length-1;i<ps.length;j=i++){let a=ps[i],b=ps[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside}return inside};
for(let [x,y] of [...profile.holes,profile.centerHole])assert.ok(!profile.surfaceQuads.some(q=>pointInside(x,y,q)),'Reference hole was filled');
const points=profile.contours.flat(),xs=points.map(p=>p[0]);assert.equal(Math.max(...xs)-Math.min(...xs),119);
assert.equal(profile.supportPoints.length,8); // Eight arms/pad groups explicitly confirmed by user.
console.log(`PASS: ${samples} samples; ${unchanged} downstream poses equal prior version; Stage diameter 1/3; right push before handoff; XZ-only Traverser; continuous handoffs; ${profile.holes.length+1} real reference holes; Chuck width unchanged at119.`);

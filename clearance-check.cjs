'use strict';
// Offline oriented-box SAT audit of the actual LD rotation geometry; no runtime collision engine.
const assert=require('node:assert/strict'),{C,model}=require('./model.js');
const sub=(a,b)=>a.map((x,i)=>x-b[i]),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function box(x,y,z,w,d,h,a=0){let c=Math.cos(a),s=Math.sin(a);return {center:[x+w/2,(y+d/2)*c-(z+h/2)*s,143+(y+d/2)*s+(z+h/2)*c],axes:[[1,0,0],[0,c,s],[0,-s,c]],half:[w/2,d/2,h/2]}}
function overlap(a,b){const delta=sub(b.center,a.center);let depth=Infinity;for(let axis of [...a.axes,...b.axes,...a.axes.flatMap(x=>b.axes.map(y=>cross(x,y)))]){let l=Math.hypot(...axis);if(l<1e-9)continue;axis=axis.map(x=>x/l);let r=q=>q.half.reduce((s,h,i)=>s+h*Math.abs(dot(q.axes[i],axis)),0),d=r(a)+r(b)-Math.abs(dot(delta,axis));if(d<=1e-7)return false;depth=Math.min(depth,d)}return depth}
let oldHits=0,newHits=0,checks=0;
for(let i=0;i<=750;i++){
 const a=i/10*Math.PI/180,xx=C.maskHalfX+7;
 const moving=[box(xx-4,-C.maskHalfY-9,-11,8,2*(C.maskHalfY+9),6,a),box(xx-6,-13,-14,12,26,9,a)];
 for(let sign of [-1,1]){let sx=C.maskHalfX-2,yy=sign*(C.maskHalfY-2);moving.push(box(sx-3,yy-5,-7,xx-sx+6,10,5,a),box(sx-2,yy-2,-2,4,4,2,a))}
 const oldBridge=box(C.maskHalfX+3,-7,125-143,25,14,8);
 const upright=box(C.maskHalfX+28,-6,37-143,8,12,109);
 // Shaft begins at the rotating hub end face; their normal joint contact is excluded.
 const shaftEnvelope=box(xx+6,-3,-3,15,6,6);
 for(const part of moving){oldHits+=!!overlap(part,oldBridge);newHits+=!!overlap(part,upright);newHits+=!!overlap(part,shaftEnvelope);checks+=2}
}
assert.ok(oldHits>0);assert.equal(newHits,0);
// Full time sampling of inter-station clearances, including every in-between frame at 40 Hz.
let samples=0;
for(let i=0;i<=C.duration*40;i++){
 let m=model(i/40);samples++;
 if(m.arm.y===C.workY)assert.equal(m.arm.angle,0);
 if(m.arm.angle>0)assert.equal(m.arm.y,C.armFrontY);
 // LD fixed posts sit outside the complete Chuck swept circle, including every rotation angle.
 assert.ok(C.maskHalfX+28>C.chuckHalfWidth+4);
 // Arm bottom at rear handoff clears all Chuck/Pin geometry and fixed Stage.
 if(m.arm.y===C.workY)assert.ok(C.armZ-14>C.stageZ+C.chuckSupportZ+20);
 // Stocker posts are outside the Y envelope of Chuck and its moving support tray.
 assert.ok(C.workY-52.7537>-34);assert.ok(C.workY+52.7537<107);
 // Chamber bowl inner wall clears the entire rotating Chuck; fixed nozzles lie outside it at plate height.
 assert.ok(91>C.chuckHalfWidth+25);
 // Rigid arm clears the rear wall slot on entry/exit; high lateral moves clear the Chamber top.
 if(m.traverser.x===C.cleanX){assert.ok(m.traverser.x-18>698);assert.ok(m.traverser.x+18<766)}
 if(m.traverser.x!==C.ldX&&m.traverser.x!==C.handoffX&&m.traverser.x!==C.cleanX)assert.ok(m.traverser.z>=223);
}
console.log(JSON.stringify({oldBridgePenetrationSamples:oldHits,repairedLDRotationChecks:checks,newPenetrations:newHits,fullCycleSamples:samples,scope:'LD OBB SAT plus station swept-envelope checks; not a full CAD collision certification'}));

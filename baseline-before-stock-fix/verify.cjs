'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const base=JSON.parse(fs.readFileSync(path.join(__dirname,'visual-baseline.json'),'utf8'));
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'model.js'))).digest('hex'),base.model_sha256,'Validated kinematic model must remain byte-identical');const {C,model,frames}=require('./model.js');
let samples=0;
for(let t=0;t<=110;t+=.025){let m=model(t);samples++;
 assert.equal(m.traverser.y,190);assert.equal(m.traverser.headY,35);assert.equal(m.traverser.pitch,0);assert.equal(m.traverser.roll,0);assert.equal(m.stage.z,104);assert.equal(m.stage.radius,64);assert.deepEqual(m.holderSides,['front','rear']);assert.equal(m.armSupports,4);
 if(m.maskOwner==='traverser')assert.equal(m.mask.angle,0);
 if(t>=38&&t<=48)assert.equal(m.arm.angle,0);
 if(t>=52&&t<57)assert.equal(m.arm.y,35);
 if(t>=57&&t<=65){assert.equal(m.maskOwner,'traverser');assert.equal(m.traverser.z,223)}
 if(t>=90&&t<103)assert.equal(m.backDIW,true);
 if(t>=103)assert.equal(m.backDIW,false);
 if(m.maskOwner==='arm'&&m.arm.y===35)assert.equal(m.mask.z-C.maskOnChuckZ,30);
 assert.equal(Object.keys(m).includes('stageLift'),false);
}
// Each motion interval changes at most X or Z, never both or Y.
for(let i=1;i<frames.length;i++){let a=frames[i-1],b=frames[i];assert.ok(a[1]===b[1]||a[2]===b[2]);if(a[1]!==b[1])assert.equal(a[2],C.safeZ)}
// No teleport on ownership handoff. Ignore intentional initial Mask load at25.
let handoffs=[['chuck',5],['chuck',22],['mask',52],['mask',70],['chuck',77],['mask',77],['chuck',88],['mask',88]];
for(let [name,t] of handoffs){let a=model(t-1e-7)[name],b=model(t)[name];for(let axis of ['x','y','z'])assert.ok(Math.abs(a[axis]-b[axis])<1e-5,`${name} jumps at ${t} ${axis}`)}
assert.equal(model(0).stockCount,3);assert.equal(model(5).stockCount,2);assert.equal(model(30).arm.angle,75);assert.equal(model(38).arm.angle,0);assert.equal(model(48).arm.y,35);assert.equal(model(65).arm.y,-125);assert.equal(model(70).mask.z,113);assert.equal(model(103).dry,true);assert.equal(model(103).backDIW,false);
console.log(`PASS: model baseline SHA-256 unchanged; ${samples} model samples; constant Traverser Y; fixed circular Stage; transfer order; continuous handoffs; wet/Dry boundary.`);

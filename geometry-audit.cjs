// Offline audit: instrument actual scene primitive calls; no collision code ships in the animation.
const fs=require('fs'),vm=require('vm');
const {C,model}=require('./model.js');
const sub=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit=a=>a.map(v=>v/Math.hypot(...a));
let records=[],mode='fixed',counts={},sourceLines=[];
function capture(kind,args,start,end){
 const stack=new Error().stack.split('\n').filter(s=>s.includes('scene.js:'));
 if(stack.some(s=>s.includes('buildChuckMesh')))return;
 const caller=stack[1]||stack[0],line=caller.match(/scene.js:(\d+)/)?.[1];
 if(kind==='rawBox'&&!caller.includes('mask ('))return;
 if(kind==='rawBox'&&args[2]!==0)return;
 const key=mode+':'+line,idx=counts[key]=(counts[key]||0)+1;
 records.push({kind,args,start,end,id:key+':'+idx,line,code:sourceLines[Number(line)-1]?.trim()});
}
const context={CleaningModel:{C},window:{},capture,console};vm.createContext(context);
vm.runInContext(fs.readFileSync('chuck-profile.js','utf8'),context);
let source=fs.readFileSync(process.env.AUDIT_SCENE||'scene.js','utf8');
source=source.slice(0,source.indexOf("const canvas=document"));
// Wrap primitives at their call boundary. Box's internal rawBox is deliberately not counted twice.
source+=`\nwindow.audit={fixed,moving,getFaces:()=>target};})();`;
for(const name of ['box','rawBox','cylinder','rod','chuck']){
 source=source.replace('function '+name+'(', 'function original_'+name+'(');
 const insert=`function ${name}(...args){const start=target.length;original_${name}(...args);capture('${name}',args,start,target.length);}\n`;
 source=source.replace('function original_'+name+'(',insert+'function original_'+name+'(');
}
sourceLines=source.split('\n');vm.runInContext(source,context,{filename:'scene.js'});
const fixed=records.map(r=>make(r,context.window.audit.fixed));
function make(r,faces){
 const f=faces.slice(r.start,r.end);const points=f.flatMap(x=>x.points);
 if(!points.length)return null;
 let axes;
 if(r.kind==='box'||r.kind==='rawBox'){
  let [x,y,z,w,d,h,c,tr=p=>p]=r.args;const a=tr([x,y,z]);axes=[[w,0,0],[0,d,0],[0,0,h]].map(v=>unit(sub(tr([x+v[0],y+v[1],z+v[2]]),a)));
 }else if(r.kind==='chuck'){
 const a=r.args[3]||0;axes=[[Math.cos(a),Math.sin(a),0],[-Math.sin(a),Math.cos(a),0],[0,0,1]];
 }else if(r.kind==='rod'){
  const dir=unit(sub(r.args[1],r.args[0])),u=unit(cross(Math.abs(dir[2])>.9?[0,1,0]:[0,0,1],dir));axes=[dir,u,cross(dir,u)];
 }else axes=[[1,0,0],[0,1,0],[0,0,1]];
 const ranges=axes.map(a=>{const p=points.map(v=>dot(a,v));return [Math.min(...p),Math.max(...p)]});
 const center=[0,0,0];ranges.forEach((r,i)=>axes[i].forEach((v,j)=>center[j]+=v*(r[0]+r[1])/2));
 const aabb=[0,1,2].map(i=>[Math.min(...points.map(p=>p[i])),Math.max(...points.map(p=>p[i]))]);
 return {...r,faces:f,center,axes,half:ranges.map(r=>(r[1]-r[0])/2),aabb};
}
function overlap(a,b){
 if(a.aabb.some((r,i)=>r[1]<=b.aabb[i][0]+1e-5||b.aabb[i][1]<=r[0]+1e-5))return 0;
 const delta=sub(b.center,a.center);let depth=Infinity;
 for(let axis of [...a.axes,...b.axes,...a.axes.flatMap(x=>b.axes.map(y=>cross(x,y)))]){
  if(Math.hypot(...axis)<1e-7)continue;axis=unit(axis);
  let radius=q=>q.half.reduce((s,h,i)=>s+h*Math.abs(dot(q.axes[i],axis)),0),d=radius(a)+radius(b)-Math.abs(dot(delta,axis));if(d<=1e-5)return 0;depth=Math.min(depth,d);
 }return depth;
}

// Confirm a Chuck broad-phase candidate against each convex plate strip, hub sector and pin.
// Unlike a solid disk approximation this preserves the actual perforations.
function convexHit(points,axes,edges,b){
 const all=[...axes,...b.axes,...edges.flatMap(e=>b.axes.map(a=>cross(e,a)))];
 for(let a of all){if(Math.hypot(...a)<1e-8)continue;a=unit(a);const ps=points.map(p=>dot(p,a)),c=dot(b.center,a),r=b.half.reduce((s,h,i)=>s+h*Math.abs(dot(b.axes[i],a)),0);if(Math.max(...ps)<=c-r+1e-5||Math.min(...ps)>=c+r-1e-5)return false;}return true;
}
function chuckHit(a,b){
 const [x,y,z,angle=0]=a.args,ca=Math.cos(angle),sa=Math.sin(angle),tr=([u,v,w])=>[x+u*ca-v*sa,y+u*sa+v*ca,z+w];
 for(const quad of context.ChuckProfile.surfaceQuads){
  const ps=quad.map(p=>tr([...p,0])),top=quad.map(p=>tr([...p,C.chuckBodyZ])),points=[...ps,...top];
  if([0,1,2].some(i=>Math.max(...points.map(p=>p[i]))<=b.aabb[i][0]+1e-5||Math.min(...points.map(p=>p[i]))>=b.aabb[i][1]-1e-5))continue;
  const edges=ps.map((p,i)=>sub(ps[(i+1)%4],p));edges.push([0,0,1]);
  if(convexHit(points,[[0,0,1],...edges.map(e=>cross(e,[0,0,1]))],edges,b))return true;
 }
 // Convex extrusion SAT for the true 16-sided pins and 72-segment annular hub.
 const prism=(loop,lo,hi)=>{
  const ps=loop.map(p=>tr([...p,lo])),top=loop.map(p=>tr([...p,hi])),points=[...ps,...top];
  if([0,1,2].some(i=>Math.max(...points.map(p=>p[i]))<=b.aabb[i][0]+1e-5||Math.min(...points.map(p=>p[i]))>=b.aabb[i][1]-1e-5))return false;
  const edges=ps.map((p,i)=>sub(ps[(i+1)%ps.length],p));edges.push([0,0,1]);
  return convexHit(points,[[0,0,1],...edges.map(e=>cross(e,[0,0,1]))],edges,b);
 };
 for(const [px,py] of context.ChuckProfile.supportPoints){
  const loop=Array.from({length:16},(_,i)=>[px+1.1*Math.cos(i*Math.PI/8),py+1.1*Math.sin(i*Math.PI/8)]);
  if(prism(loop,C.chuckBodyZ,C.chuckSupportZ))return true;
 }
 const [hx,hy,hr]=context.ChuckProfile.centerHole;
 for(let i=0;i<72;i++){
  const a=i*Math.PI/36,c=(i+1)*Math.PI/36,p=(r,t)=>[hx+r*Math.cos(t),hy+r*Math.sin(t)];
  if(prism([p(hr+.15,a),p(10,a),p(10,c),p(hr+.15,c)],C.chuckBodyZ,C.maskSeatOffset))return true;
 }return false;
}

const findings=new Map();
const dt=Number(process.env.AUDIT_DT||.25);let samples=0;
for(let sample=0;sample<=Math.round(C.duration/dt);sample++){
 const t=sample*dt;
 records=[];counts={};mode='moving';const faces=context.window.audit.moving(model(t));
 const parts=records.map(r=>make(r,faces)).filter(Boolean),others=[...fixed.filter(Boolean),...parts];samples++;
 for(let i=0;i<parts.length;i++)for(let j=0;j<fixed.length+i;j++){
  const a=parts[i],b=others[j];if(!b)continue;const d=overlap(a,b);if(!d)continue;if(a.kind==='chuck'&&!chuckHit(a,b))continue;if(b.kind==='chuck'&&!chuckHit(b,a))continue;
  const key=[a.id,b.id].sort().join(' / ');let v=findings.get(key);
  if(!v)findings.set(key,v={key,a:a.code,b:b.code,start:t,end:t,max:0,at:t,count:0});v.end=t;v.count++;if(d>v.max){v.max=d;v.at=t;}
 }
}
console.log(JSON.stringify({samples,dt,scope:'Actual box/cylinder/rod calls, OBB broad/narrow phase; cylinder bounds conservative; Chuck plate candidates confirmed against actual perforated strips; assembled joints require classification',findings:[...findings.values()].sort((a,b)=>b.max-a.max)},null,2));

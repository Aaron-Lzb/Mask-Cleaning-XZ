(function(){
'use strict';
const {C}=CleaningModel;
const colors={
 base:'#e1ebf1',frame:'#c4d6df',metal:'#e8eff2',chuck:'#c2d9e7',arm:'#b3d3e7',mask:'#c2eef5',head:'#72bee9',
 water:'#419fd7',dark:'#839eae',pad:'#7fa6bc',white:'#f7fafc',edge:'#9dbccf',blue:'#278bc8',sky:'#b7e3fa',
 zoneStock:'#dcecf7',zoneLD:'#dbeef4',zoneClean:'#e3f3f6',bowl:'#c8dce6',inside:'#dfedf3',orange:'#efb46c',green:'#87c9ad',
 film:'#a5dfed',glass:'#c0e7f4',arrow:'#329dd8',shadow:'#6c92a8'
};
const hex=h=>h.match(/\w\w/g).map(x=>parseInt(x,16)/255);
const sub=(a,b)=>a.map((x,i)=>x-b[i]);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0);
const norm=v=>{let l=Math.hypot(...v)||1;return v.map(x=>x/l)};
const add=(a,b)=>a.map((x,i)=>x+b[i]);
const mult=(v,s)=>v.map(x=>x*s);
let target=[];
function polygon(points,color,alpha=1,normals=null){
 const normal=norm(cross(sub(points[1],points[0]),sub(points[2],points[0])));
 target.push({points,color,normal,alpha,normals});
}
function rawBox(x,y,z,w,d,h,col='metal',tr=p=>p){
 const v=[[x,y,z],[x+w,y,z],[x+w,y+d,z],[x,y+d,z],[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]].map(tr);
 for(let f of [[0,3,2,1],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]])polygon(f.map(i=>v[i]),col);
}
// Small true bevels preserve the original outer bounds and all contact planes.
function box(x,y,z,w,d,h,col='metal',tr=p=>p){
 const b=Math.min(.65,w/8,d/8,h/4);
 if(Math.min(w,d,h)<2.5){rawBox(x,y,z,w,d,h,col,tr);return}
 const corner=(inset,zz)=>[[x+inset+b,y+inset,zz],[x+w-inset-b,y+inset,zz],[x+w-inset,y+inset+b,zz],[x+w-inset,y+d-inset-b,zz],[x+w-inset-b,y+d-inset,zz],[x+inset+b,y+d-inset,zz],[x+inset,y+d-inset-b,zz],[x+inset,y+inset+b,zz]].map(tr);
 const rings=[corner(b,z),corner(0,z+b),corner(0,z+h-b),corner(b,z+h)];
 polygon([...rings[0]].reverse(),col);polygon(rings[3],col);
 for(let k=0;k<3;k++)for(let i=0;i<8;i++)polygon([rings[k][i],rings[k][(i+1)%8],rings[k+1][(i+1)%8],rings[k+1][i]],col);
}
function cylinder(x,y,z,r,h,col='metal',n=48,tr=p=>p){
 let low=[],high=[],ns=[];let origin=tr([0,0,0]);
 for(let i=0;i<n;i++){let a=i*2*Math.PI/n;low.push(tr([x+r*Math.cos(a),y+r*Math.sin(a),z]));high.push(tr([x+r*Math.cos(a),y+r*Math.sin(a),z+h]));ns.push(norm(sub(tr([Math.cos(a),Math.sin(a),0]),origin)))}
 polygon([...low].reverse(),col);polygon(high,col);
 for(let i=0;i<n;i++){let j=(i+1)%n;polygon([low[i],low[j],high[j],high[i]],col,1,[ns[i],ns[j],ns[j],ns[i]])}
}
function beam(x,y,z,length,width,height,angle,col='metal',tr=p=>p){let a=Math.cos(angle),b=Math.sin(angle);box(0,-width/2,0,length,width,height,col,([xx,yy,zz])=>tr([x+xx*a-yy*b,y+xx*b+yy*a,z+zz]))}
function rod(a,b,r,col='metal',n=16){
 const dir=norm(sub(b,a)),u=norm(cross(Math.abs(dir[2])>.9?[0,1,0]:[0,0,1],dir)),v=cross(dir,u);let lo=[],hi=[],ns=[];
 for(let i=0;i<n;i++){let theta=2*Math.PI*i/n,nn=add(mult(u,Math.cos(theta)),mult(v,Math.sin(theta)));ns.push(nn);lo.push(add(a,mult(nn,r)));hi.push(add(b,mult(nn,r)))}
 polygon([...lo].reverse(),col);polygon(hi,col);for(let i=0;i<n;i++){let j=(i+1)%n;polygon([lo[i],lo[j],hi[j],hi[i]],col,1,[ns[i],ns[j],ns[j],ns[i]])}
}
function annulus(x,y,z,inner,outer,h,col='metal',start=0,end=Math.PI*2,n=72){
 for(let i=0;i<n;i++){let a=start+(end-start)*i/n,b=start+(end-start)*(i+1)/n;const p=(r,theta,zz)=>[x+r*Math.cos(theta),y+r*Math.sin(theta),zz];
 polygon([p(inner,a,z+h),p(outer,a,z+h),p(outer,b,z+h),p(inner,b,z+h)],col);
 polygon([p(outer,a,z),p(outer,b,z),p(outer,b,z+h),p(outer,a,z+h)],col,1,[[Math.cos(a),Math.sin(a),0],[Math.cos(b),Math.sin(b),0],[Math.cos(b),Math.sin(b),0],[Math.cos(a),Math.sin(a),0]]);
 polygon([p(inner,b,z),p(inner,a,z),p(inner,a,z+h),p(inner,b,z+h)],col,1,[[-Math.cos(b),-Math.sin(b),0],[-Math.cos(a),-Math.sin(a),0],[-Math.cos(a),-Math.sin(a),0],[-Math.cos(b),-Math.sin(b),0]]);
 }
 if(end-start<6.28)for(let a of [start,end])polygon([[x+inner*Math.cos(a),y+inner*Math.sin(a),z],[x+outer*Math.cos(a),y+outer*Math.sin(a),z],[x+outer*Math.cos(a),y+outer*Math.sin(a),z+h],[x+inner*Math.cos(a),y+inner*Math.sin(a),z+h]],col);
}
// One canonical extruded plate from the updated photo, reused at every location.
// 8 connection arms are explicitly confirmed by the user; all large openings are true holes.
let chuckMesh=null;
function buildChuckMesh(){
 const saved=target;target=[];
 for(let quad of ChuckProfile.surfaceQuads){
  const top=quad.map(([x,y])=>[x,y,5]),bottom=[...quad].reverse().map(([x,y])=>[x,y,0]);
  target.push({points:top,color:'chuck',normal:[0,0,1],alpha:1,normals:null});
  target.push({points:bottom,color:'chuck',normal:[0,0,-1],alpha:1,normals:null});
 }
 for(let loop of ChuckProfile.contours)for(let i=0;i<loop.length;i++){
  const p=loop[i],q=loop[(i+1)%loop.length];
  target.push({points:[[q[0],q[1],0],[p[0],p[1],0],[p[0],p[1],5],[q[0],q[1],5]],color:'chuck',normal:norm([p[1]-q[1],q[0]-p[0],0]),alpha:1,normals:null});
 }
 const hub=ChuckProfile.centerHole;
 if(hub.length)annulus(hub[0],hub[1],5,hub[2]+.15,10,1.5,'metal');
 for(let [x,y] of ChuckProfile.supportPoints)cylinder(x,y,5,1.1,4,'pad',16);
 const mesh=target;target=saved;return mesh;
}
function chuck(x,y,z,rot=0){
 if(!chuckMesh)chuckMesh=buildChuckMesh();
 const ca=Math.cos(rot),sa=Math.sin(rot),rotate=([a,b,c])=>[a*ca-b*sa,a*sa+b*ca,c];
 for(let f of chuckMesh)target.push({...f,points:f.points.map(p=>add(rotate(p),[x,y,z])),normal:rotate(f.normal),normals:f.normals?f.normals.map(rotate):null});
}
function mask(x,y,z,rot=0,angle=0){
 let ar=angle*Math.PI/180;
 const tr=([a,b,c])=>{let yy=b*Math.cos(ar)-c*Math.sin(ar),zz=b*Math.sin(ar)+c*Math.cos(ar);return [x+a*Math.cos(rot)-yy*Math.sin(rot),y+a*Math.sin(rot)+yy*Math.cos(rot),z+zz]};
 rawBox(-52,-48,0,104,96,2,'mask',tr);
 // Thin polished edge and corner fiducials; no added mechanical parts.
 for(let yy of [-48,47.5])rawBox(-52,yy,2.02,104,.5,.12,'sky',tr);
 for(let xx of [-52,51.5])rawBox(xx,-48,2.02,.5,96,.12,'sky',tr);
 for(let x0 of [-49,42])rawBox(x0,-45,2.04,7,1,.12,'blue',tr);
}
function bowl(){
 // Hollow annular collection cup, open front sector for viewing backside rinse.
 const profile=[[92,33],[103,68],[107,82],[103,82],[99,68],[87,41]];
 const start=-50*Math.PI/180,end=230*Math.PI/180,n=84;
 for(let j=0;j<profile.length;j++)for(let i=0;i<n;i++){
  let k=(j+1)%profile.length,a=start+(end-start)*i/n,b=start+(end-start)*(i+1)/n;
  let [r0,z0]=profile[j],[r1,z1]=profile[k];
  const p=(r,t,z)=>[730+r*Math.cos(t),35+r*Math.sin(t),z];
  const nn=t=>norm([Math.cos(t)*(z1-z0),Math.sin(t)*(z1-z0),r0-r1]);
  polygon([p(r0,a,z0),p(r0,b,z0),p(r1,b,z1),p(r1,a,z1)],j<3?'bowl':'inside',1,[nn(a),nn(b),nn(b),nn(a)]);
 }
 for(let a of [start,end])polygon(profile.map(([r,z])=>[730+r*Math.cos(a),35+r*Math.sin(a),z]),'edge');
 annulus(730,35,33,21,91,6,'inside');
 annulus(730,35,81,102.5,108,2,'metal',start,end,84);
 annulus(730,35,39.2,26,80,.5,'bowl');
}
const nozzles=[
 {tip:[638,0,182],hit:[703,8,115.3],color:'orange',radius:17},
 {tip:[822,0,182],hit:[753,8,115.3],color:'water',radius:19},
 {tip:[822,77,182],hit:[750,59,115.3],color:'green',radius:17}
];
function makeStatic(){target=[];
 for(let [index,[x,w]] of [[-55,369],[324,212],[546,344]].entries()){
  box(x,-203,0,w,438,15,'white');box(x+4,-197,15.1,w-8,424,.7,['zoneStock','zoneLD','zoneClean'][index]);
  box(x,-203,15,w,6,10,'metal');box(x+14,-203.4,5,38,.5,5,'sky');
  for(let xx of [x+17,x+w-29]){cylinder(xx,-178,-10,7,10,'dark',24);cylinder(xx,210,-10,7,10,'dark',24)}
 }
 for(let x of [-55,314,536,890]){box(x,225,15,7,7,275,'frame');box(x,-200,15,7,7,29,'frame')}
 for(let [x,w] of [[-55,369],[324,212],[546,344]])box(x,225,283,w,7,7,'metal');
 for(let y of [180,201]){box(-47,y,272,930,7,9,'metal');rawBox(-47,y+2,281,930,2,.6,'sky')}
 for(let x of [-47,875])box(x,176,269,8,40,18,'dark');
 for(let x of [-5,141])for(let y of [-39,107])box(x,y,15,5,5,177,'frame');
 // Each tier owns an internally mounted telescoping support. No outside posts or fixed handoff rack.
 for(let level of C.stockLevels){
  for(let y of [-15,83]){box(8,y-5,level-15,124,10,5,'frame');rawBox(8,y-2,level-9.9,124,4,.6,'sky')}
  box(8,-20,level-20,8,108,5,'metal');
  if(level!==154) supportTray(C.stockX,level);
 }
 // Two lower stored Chucks remain static; only the selected upper Chuck is transported.
 chuck(C.stockX,35,54);chuck(C.stockX,35,104);
 // Same fixed round Stage and exact seating plane as accepted model.
 cylinder(420,35,15,48,11,'base');cylinder(420,35,26,20,65,'metal');cylinder(420,35,91,C.stageRadius,13,'metal');
 annulus(420,35,100,C.stageRadius-.5,C.stageRadius,1,'sky');
 for(let x of [342,490]){box(x,-184,15,8,242,9,'base');box(x+2,-184,24,4,242,3,'metal');for(let y of [-184,51])box(x-2,y,16,12,7,14,'frame')}
 // Cleaner plinth and enclosure. Front/roof stay cut away; rear slot clears rigid boom.
 box(569,-115,15,291,288,12,'white');
 box(575,-111,27,279,5,15,'metal');box(585,-111.2,31,62,.5,7,'sky');
 box(576,159,27,276,8,58,'white');
 box(576,159,85,122,8,121,'white');box(766,159,85,86,8,121,'white');
 for(let x of [579,844])for(let y of [-97,151])box(x,y,27,6,7,184,'metal');
 for(let x of [579,844])box(x,-97,211,6,255,6,'metal');
 // Rear upper cross member omitted over access slot. No roof across vertical Mask path.
 box(579,151,206,119,7,7,'metal');box(766,151,206,84,7,7,'metal');
 polygon([[850,-88,48],[850,150,48],[850,150,205],[850,-88,205]],'glass',.13);
 // Lower side skirt defines Chamber volume without hiding collection cup.
 box(848,-94,27,4,246,20,'white');
 bowl();
 cylinder(730,35,39,25,13,'metal');cylinder(730,35,52,17.5,52,'metal');
 annulus(730,35,96,17.5,21,5,'edge');
 // Side-fed overhead liquids: the complete vertical XZ handoff volume stays free.
 for(let [i,n] of nozzles.entries()){
  const side=i===0?609:848, yy=n.tip[1],tip=n.tip,base=[side,yy,198],bend=[tip[0]+(i===0?-11:11),yy,198];
  rod([side,yy,34],base,3.5,'metal',20);rod(base,bend,3.2,'metal',20);rod(bend,tip,4.3,'metal',24);
  const dir=norm(sub(n.hit,tip));rod(add(tip,mult(dir,-4)),add(tip,mult(dir,-.4)),5,n.color,24);
  rod(tip,add(tip,mult(dir,1.8)),2.6,'dark',16);
  cylinder(side,yy,29,9,5,'metal',24);
 }
 // Front cutaway exposes upward backside DIW jets, separate from top sprays.
 rod([691,-24,66],[769,-24,66],3,'water',20);
 for(let x of [702,758]){rod([x,-24,66],[x,-24,79],3,'metal',20);cylinder(x,-24,77.5,3.6,2,'water',20)}
 return target;
}
const fixed=makeStatic();
function supportTray(px,level){
 const d=px-C.stockX;
 for(let y of [-15,83]){
  // Nested channels remain overlapped while their free ends extend with the tray.
  box(12+d/2,y-4,level-10,120,8,3,'metal');
  box(12+d,y-3,level-7,120,6,3,'head');
  box(px-61,y-4,level-4,122,8,4,'metal');
 }
 box(px-6,-12,level-4,12,96,3,'metal');
 for(let side of [-1,1])rawBox(px+side*39-5,-16,level-.7,10,6,.7,'pad');
}
function moving(m){target=[];
 chuck(m.chuck.x,m.chuck.y,m.chuck.z,m.chuckRotation);
 supportTray(m.stocker.pusherX,154);
 for(let side of [-1,1]){let x=side<0?342:490;box(x-3,m.arm.y-23,27,14,46,10,'metal');box(x,m.arm.y-6,37,8,12,93,'frame');box(side<0?350:476,m.arm.y-7,125,14,14,8,'metal')}
 const rad=m.arm.angle*Math.PI/180,tr=([x,y,z])=>[420+x,m.arm.y+y*Math.cos(rad)-z*Math.sin(rad),143+y*Math.sin(rad)+z*Math.cos(rad)];
 for(let side of [-1,1]){let xx=side*59;box(xx-4,-57,-11,8,114,6,'arm',tr);box(xx-6,-13,-14,12,26,9,'metal',tr);for(let sign of [-1,1]){let yy=sign*48;box(side<0?xx:49,yy-5,-7,10,10,5,'arm',tr);box(side*52-3,yy-3,-2,6,6,2,'pad',tr)}}
 // Reference-based slender twin-rail arm. No part has a Y travel axis.
 const x=m.traverser.x,z=m.traverser.headZ,gap=(1-m.gripClosure)*1.5;
 box(x-22,176,281,44,42,13,'head');rawBox(x-17,176,293.8,34,42,.4,'sky');
 for(let xx of [x-12,x+7])box(xx,184,z+39,5,12,281-z-39,'metal');
 for(let xx of [x-10,x+5]){box(xx,-34,z+34,5,230,6,'metal');rawBox(xx,-34,z+40.05,5,230,.45,'sky')}
 for(let yy of [-30,35,100,160])box(x-12,yy-6,z+31,24,12,3,'frame');
 // Shallow connector/cylinder housings belong to the long arm, not extra holders.
 box(x-6,126,z+40.5,12,43,4,'white');box(x-8,152,z+44.5,16,10,5,'metal');
 for(let side of [-1,1]){
  const anchor=35+side*65,block=35+side*C.tabOffset,maskY=35+side*C.maskGripOffset;
  box(x-15,anchor-8,z+29,30,16,6,'metal');
  box(x-6,anchor-4,z+6,12,8,23,'metal');
  const lo=Math.min(anchor,block),length=Math.abs(block-anchor);
  box(x-5,lo,z+5+gap,10,length,1.5,'head');
  // Z-only top contact seats precisely on the reference's unperforated protruding block.
  box(x-4,block-1.5,z+5+gap,8,3,1.2,m.gripEngaged?'blue':'pad');
  const outer=35+side*(C.tabFace+1.25);
  box(x-5,outer-1.25,z,10,2.5,6.5,'metal');
  // Fixed inner contact stair supports both Mask-only and Chuck+Mask handling.
  box(x-4,Math.min(anchor,maskY),z+11+gap,8,Math.abs(maskY-anchor),1.2,'metal');
  box(x-3,maskY-1,z+11+gap,6,2,1,'pad');
 }
 if(m.mask)mask(m.mask.x,m.mask.y,m.mask.z,m.maskRotation,m.mask.angle);

 return target;
}
function droplet(p,dir,col,alpha,width=.65,length=2.1){
 const u=norm(cross(dir,[0,1,0])),v=norm(cross(dir,u));
 const a=add(p,mult(dir,length)),b=add(p,mult(dir,-length*.45));
 polygon([a,add(p,mult(u,width)),b,add(p,mult(u,-width))],col,alpha);
 polygon([a,add(p,mult(v,width)),b,add(p,mult(v,-width))],col,alpha*.75);
}
function fan(source,hit,radius,col,t,rate,alpha){
 const axis=sub(hit,source),dir=norm(axis),N=20;
 // Oblique conical volume, with a horizontal footprint on the physical surface.
 for(let i=0;i<N;i++){let a=2*Math.PI*i/N,b=2*Math.PI*(i+1)/N;polygon([source,[hit[0]+radius*Math.cos(a),hit[1]+radius*Math.sin(a),hit[2]],[hit[0]+radius*Math.cos(b),hit[1]+radius*Math.sin(b),hit[2]]],col,.11*alpha)}
 for(let i=0;i<25;i++){
  const u=(t*rate+i*.61803398875)%1,a=i*2.399963,r=radius*Math.sqrt((i*.754877666)%1)*u;
  const p=add(add(source,mult(axis,u)),[r*Math.cos(a),r*Math.sin(a),0]);
  const envelope=Math.sin(Math.PI*u)**.45;
  droplet(p,dir,col,alpha*envelope*.78,.60+(i%3)*.1,1.3+(i%4)*.14);
 }
}
function arcArrow(cx,cy,z,r,a,length,opacity){
 for(let i=0;i<32;i++){
  let aa=a+length*i/32,bb=a+length*(i+1)/32;
  polygon([[cx+(r-1)*Math.cos(aa),cy+(r-1)*Math.sin(aa),z],[cx+(r+1)*Math.cos(aa),cy+(r+1)*Math.sin(aa),z],[cx+(r+1)*Math.cos(bb),cy+(r+1)*Math.sin(bb),z],[cx+(r-1)*Math.cos(bb),cy+(r-1)*Math.sin(bb),z]],'arrow',opacity);
 }
 let end=a+length,p=[cx+r*Math.cos(end),cy+r*Math.sin(end),z],tangent=[-Math.sin(end)*Math.sign(length),Math.cos(end)*Math.sign(length),0],radial=[Math.cos(end),Math.sin(end),0];
 polygon([add(p,mult(tangent,5)),add(add(p,mult(tangent,-4)),mult(radial,4)),add(add(p,mult(tangent,-4)),mult(radial,-4))],'arrow',opacity);
}
function spray(m){target=[];
 if((m.t>=25&&m.t<=31)||(m.t>=156&&m.t<=162)){arcArrow(420,35,114,74,2.9,-1.7,.85)}
 if((m.t>=80&&m.t<=86)||(m.t>=197&&m.t<=203)){arcArrow(420,35,117,74,.25,1.7,.85)}
 if(m.chuckOwner==='cleaner'&&m.t>=C.wetStart&&m.t<C.cleanEnd){let a=Math.min(1,(m.t-C.wetStart)/.45);arcArrow(730,35,116,83,.25,1.12,a*.8);arcArrow(730,35,116,83,Math.PI+.25,1.12,a*.8)}
 if(!m.topSpray&&!m.backDIW)return target;
 // No visual residual after Dry starts. DIW remains logically ON for the entire wet phase.
 const amp=Math.max(0,Math.min(1,(m.t-C.wetStart)/.45,(C.dryStart-m.t)/.18));
 for(let n of nozzles)fan(n.tip,n.hit,n.radius,n.color,m.t,1.25,amp);
 for(let x of [702,758])fan([x,-24,79],[x,10,112.7],11,'water',m.t,1.8,amp);
 // A thin clear film sits on the rotating top surface; radial traces remain inside Mask edges.
 const rot=m.maskRotation,tr=([x,y,z])=>[730+x*Math.cos(rot)-y*Math.sin(rot),35+x*Math.sin(rot)+y*Math.cos(rot),z];
 polygon([tr([-50,-46,115.12]),tr([50,-46,115.12]),tr([50,46,115.12]),tr([-50,46,115.12])],'film',.15*amp);
 for(let i=0;i<16;i++){
  const angle=i*2.399963,u=(m.t*.72+i*.381966)%1,r=6+u*35,rr=r+2;
  const p=tr([r*Math.cos(angle),r*Math.sin(angle),115.3]);
  const q=tr([rr*Math.cos(angle+.02),rr*Math.sin(angle+.02),115.3]);
  polygon([p,q,add(q,[.5,.5,0]),add(p,[.5,.5,0])],'water',Math.sin(Math.PI*u)*.25*amp);
 }
 return target;
}
const canvas=document.getElementById('machine');
const ctx=canvas.getContext('webgl',{antialias:true,preserveDrawingBuffer:true,alpha:true});let fallback=null;
let program,buffer,posLoc,colorLoc,normalLoc,viewLoc;
if(ctx){
 const shader=(type,src)=>{let s=ctx.createShader(type);ctx.shaderSource(s,src);ctx.compileShader(s);if(!ctx.getShaderParameter(s,ctx.COMPILE_STATUS))throw new Error(ctx.getShaderInfoLog(s));return s};
 program=ctx.createProgram();
 ctx.attachShader(program,shader(ctx.VERTEX_SHADER,'attribute vec3 p;attribute vec4 c;attribute vec3 n;varying vec4 v;varying vec3 normal;void main(){gl_Position=vec4(p,1.);v=c;normal=n;}'));
 ctx.attachShader(program,shader(ctx.FRAGMENT_SHADER,`precision mediump float;
 varying vec4 v;varying vec3 normal;uniform vec3 eye;
 void main(){vec3 n=normalize(normal);vec3 l=normalize(vec3(-.35,-.45,1.));float lambert=max(0.,dot(n,l));float diffuse=.80+.20*lambert;float spec=pow(max(0.,dot(n,normalize(l+eye))),40.);vec3 color=v.rgb*diffuse+vec3(.045*spec);gl_FragColor=vec4(min(color,vec3(1.)),v.a);}`));
 ctx.linkProgram(program);if(!ctx.getProgramParameter(program,ctx.LINK_STATUS))throw new Error('Renderer linking failed');
 ctx.useProgram(program);buffer=ctx.createBuffer();posLoc=ctx.getAttribLocation(program,'p');colorLoc=ctx.getAttribLocation(program,'c');normalLoc=ctx.getAttribLocation(program,'n');viewLoc=ctx.getUniformLocation(program,'eye');
}else{fallback=document.createElement('canvas');canvas.replaceWith(fallback);fallback.id='machine';fallback.setAttribute('aria-label',canvas.getAttribute('aria-label'));fallback.setAttribute('role','img');document.getElementById('rendernote').textContent='兼容投影模式（无 WebGL）'}
function camera(view){if(view==='grip')return {r:[0,1,0],u:[0,0,1],v:[1,0,0]};if(view==='top')return {r:[1,0,0],u:[0,1,0],v:[0,0,1]};let a=(view==='front'?0:view==='cleaner'?20:15)*Math.PI/180,e=(view==='front'?22:view==='cleaner'?23:32)*Math.PI/180;return {r:[Math.cos(a),Math.sin(a),0],u:[-Math.sin(a)*Math.sin(e),Math.cos(a)*Math.sin(e),Math.cos(e)],v:[Math.sin(a)*Math.cos(e),-Math.cos(a)*Math.cos(e),Math.sin(e)]}}
let fixedCache=null;
function render(m,view='iso',light=true){
 const surface=fallback||canvas,rect=surface.getBoundingClientRect(),dpr=Math.min(devicePixelRatio,1.5);
 const w=Math.round(rect.width*dpr),h=Math.round(rect.height*dpr);if(surface.width!==w||surface.height!==h){surface.width=w;surface.height=h}
 const cam=camera(view),gripView=view==='grip',close=view==='cleaner',focusX=m.traverser.x,center=gripView?[focusX,80,171]:close?[730,40,149]:[415,15,128];
 let corners=[];for(let x of (gripView?[focusX-66,focusX+66]:close?[568,867]:[-80,910]))for(let y of (gripView?[-45,218]:close?[-115,235]:[-205,239]))for(let z of (gripView?[83,298]:[-10,298]))corners.push(sub([x,y,z],center));
 const xs=corners.map(p=>dot(p,cam.r)),ys=corners.map(p=>dot(p,cam.u));
 const minx=Math.min(...xs),maxx=Math.max(...xs),miny=Math.min(...ys),maxy=Math.max(...ys),scale=Math.min(w/(maxx-minx),h/(maxy-miny))*.91,cx=(minx+maxx)/2,cy=(miny+maxy)/2;
 const project=p=>{let q=sub(p,center);return [(dot(q,cam.r)-cx)*scale*2/w,(dot(q,cam.u)-cy)*scale*2/h,-dot(q,cam.v)/1400]};
 const inView=f=>gripView?f.points.every(p=>p[0]>=focusX-66&&p[0]<=focusX+66&&p[1]>=-45&&p[1]<=218):!close||Math.max(...f.points.map(p=>p[0]))>=568;
 const allDynamic=moving(m).filter(inView),water=spray(m),opaque=fixed.filter(f=>f.alpha===1&&inView(f)),movingOpaque=allDynamic.filter(f=>f.alpha===1);
 const translucent=[...fixed.filter(f=>f.alpha<1&&inView(f)),...water].sort((a,b)=>a.points.reduce((s,p)=>s+dot(p,cam.v),0)/a.points.length-b.points.reduce((s,p)=>s+dot(p,cam.v),0)/b.points.length);
 const tint=f=>{let c=hex(colors[f.color].slice(1));if(!light)c=c.map((v,i)=>Math.min(1,v+(i===2?.012:0)));return [...c,f.alpha]};
 if(ctx){
  ctx.viewport(0,0,w,h);ctx.clearColor(0,0,0,0);ctx.clear(ctx.COLOR_BUFFER_BIT|ctx.DEPTH_BUFFER_BIT);ctx.useProgram(program);ctx.uniform3fv(viewLoc,cam.v);ctx.enable(ctx.DEPTH_TEST);ctx.depthFunc(ctx.LEQUAL);ctx.disable(ctx.CULL_FACE);ctx.bindBuffer(ctx.ARRAY_BUFFER,buffer);
  for(let attr of [posLoc,colorLoc,normalLoc])ctx.enableVertexAttribArray(attr);
  ctx.vertexAttribPointer(posLoc,3,ctx.FLOAT,false,40,0);ctx.vertexAttribPointer(colorLoc,4,ctx.FLOAT,false,40,12);ctx.vertexAttribPointer(normalLoc,3,ctx.FLOAT,false,40,28);
  const pack=fs=>{let data=[];for(let f of fs){let c=tint(f);for(let i=1;i<f.points.length-1;i++)for(let j of [0,i,i+1])data.push(...project(f.points[j]),...c,...(f.normals?f.normals[j]:f.normal))}return new Float32Array(data)};
  const cacheKey=`${view}:${w}:${h}:${light}:${gripView?focusX:0}`;if(!fixedCache||fixedCache.key!==cacheKey)fixedCache={key:cacheKey,data:pack(opaque)};
  const batch=data=>{ctx.bufferData(ctx.ARRAY_BUFFER,data,ctx.DYNAMIC_DRAW);ctx.drawArrays(ctx.TRIANGLES,0,data.length/10)};
  ctx.depthMask(true);ctx.disable(ctx.BLEND);batch(fixedCache.data);batch(pack(movingOpaque));ctx.enable(ctx.BLEND);ctx.blendFuncSeparate(ctx.SRC_ALPHA,ctx.ONE_MINUS_SRC_ALPHA,ctx.ONE,ctx.ONE_MINUS_SRC_ALPHA);ctx.depthMask(false);batch(pack(translucent));ctx.depthMask(true);
 }else{
  const g=fallback.getContext('2d');g.clearRect(0,0,w,h);
  const fs=[...fixed.filter(inView),...allDynamic,...water].map(f=>({...f,d:f.points.reduce((a,p)=>a+project(p)[2],0)/f.points.length})).sort((a,b)=>b.d-a.d);
  for(let f of fs){let c=tint(f),shade=.8+.2*Math.max(0,dot(f.normal,norm([-.35,-.45,1])));g.beginPath();f.points.forEach((p,i)=>{let [x,y]=project(p);i?g.lineTo((x+1)*w/2,(1-y)*h/2):g.moveTo((x+1)*w/2,(1-y)*h/2)});g.closePath();g.fillStyle=`rgba(${c.slice(0,3).map(v=>Math.round(v*255*shade)).join(',')},${c[3]})`;g.fill()}
 }
 return {faces:fixed.length+allDynamic.length,webgl:!!ctx,glError:ctx?ctx.getError():0,visualVersion:5};
}
window.CleaningScene={render,colors,nozzles};
})();

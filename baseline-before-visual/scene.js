(function(){
'use strict';
const {C}=CleaningModel;
const colors={base:'#344950',frame:'#778f97',metal:'#b4c5ca',chuck:'#d8e2e1',arm:'#ccb99b',mask:'#8adbd8',head:'#72b9a9',water:'#58bddb',dark:'#26383f',pad:'#849b9d'};
const hex=h=>h.match(/\w\w/g).map(x=>parseInt(x,16)/255);
const sub=(a,b)=>a.map((x,i)=>x-b[i]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0),norm=v=>{let l=Math.hypot(...v);return v.map(x=>x/l)};
let target=[];function polygon(points,color,alpha=1){let normal=norm(cross(sub(points[1],points[0]),sub(points[2],points[0])));target.push({points,color,normal,alpha})}
function box(x,y,z,w,d,h,col='metal',tr=p=>p){const v=[[x,y,z],[x+w,y,z],[x+w,y+d,z],[x,y+d,z],[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]].map(tr);for(let f of [[0,3,2,1],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]])polygon(f.map(i=>v[i]),col)}
function cylinder(x,y,z,r,h,col='metal',n=32,tr=p=>p){let low=[],high=[];for(let i=0;i<n;i++){let a=i*2*Math.PI/n;low.push(tr([x+r*Math.cos(a),y+r*Math.sin(a),z]));high.push(tr([x+r*Math.cos(a),y+r*Math.sin(a),z+h]))}polygon([...low].reverse(),col);polygon(high,col);for(let i=0;i<n;i++)polygon([low[i],low[(i+1)%n],high[(i+1)%n],high[i]],col)}
function beam(x,y,z,length,width,height,angle,col='metal',tr=p=>p){let a=Math.cos(angle),b=Math.sin(angle);box(0,-width/2,0,length,width,height,col,([xx,yy,zz])=>tr([x+xx*a-yy*b,y+xx*b+yy*a,z+zz]))}
function chuck(x,y,z,rot=0){cylinder(x,y,z,14,5,'chuck');cylinder(x,y,z+5,7,2,'metal');for(let i=0;i<6;i++){let a=rot+i*Math.PI/3;beam(x+10*Math.cos(a),y+10*Math.sin(a),z,46,10,5,a,'chuck');let ex=x+56*Math.cos(a),ey=y+56*Math.sin(a);cylinder(ex,ey,z+5,3.5,4,'pad',12)}}
function mask(x,y,z,rot=0,angle=0){let ar=angle*Math.PI/180;const tr=([a,b,c])=>{let yy=b*Math.cos(ar)-c*Math.sin(ar),zz=b*Math.sin(ar)+c*Math.cos(ar);return [x+a*Math.cos(rot)-yy*Math.sin(rot),y+a*Math.sin(rot)+yy*Math.cos(rot),z+zz]};box(-52,-48,0,104,96,2,'mask',tr); // back surface is the plane z=0
// Tiny corner marks identify rotation without inventing a patterned mask.
for(let x0 of [-49,42])box(x0,-45,2.05,7,2,.15,'pad',tr)}
function makeStatic(){target=[];
for(let [x,w] of [[24,236],[270,266],[546,344]]){box(x,-203,0,w,438,15,'base');box(x,-203,15,w,6,10,'frame');for(let xx of [x+17,x+w-29]){cylinder(xx,-178,-10,7,10,'dark',16);cylinder(xx,210,-10,7,10,'dark',16)}}
for(let x of [24,260,536,890]){box(x,225,15,7,7,275,'frame');box(x,-200,15,7,7,29,'frame')}
for(let [x,w] of [[24,236],[270,266],[546,344]])box(x,225,283,w,7,7,'frame');
for(let y of [180,201]){box(32,y,272,851,7,9,'metal');box(32,y+2,281,851,2,2,'pad')}
for(let x of [32,875])box(x,176,269,8,40,18,'dark');
// Only three storage tiers; open from above for XZ pickup.
for(let x of [65,211])for(let y of [-39,107])box(x,y,15,5,5,177,'frame');
for(let z of [50,100,150])for(let x of [66,188]){box(x,-30,z,28,133,4,'metal');box(x,-30,z-7,28,7,7,'frame');box(x,96,z-7,28,7,7,'frame')}
// Fixed circular Stage. No moving or rectangular top.
cylinder(420,35,15,48,11,'base');cylinder(420,35,26,20,65,'frame');cylinder(420,35,91,64,13,'metal');
// LD Y rails belong to LD only, completely separate from Traverser.
for(let x of [342,490]){box(x,-184,15,8,242,9,'base');box(x+2,-184,24,4,242,3,'metal');for(let y of [-184,51])box(x-2,y,16,12,7,14,'frame')}
// Chamber cutaway: roof/front removed. No enclosure obstructs handoff.
box(569,-115,15,291,288,12,'base');box(569,163,27,291,6,172,'frame');box(855,85,27,5,78,160,'frame');
cylinder(730,35,27,97,8,'frame');cylinder(730,35,35,18,69,'metal');
// Three simplified stationary process-liquid sources, offset from hand motion.
for(let [x,y] of [[638,0],[822,0],[822,77]]){box(x-4,y-4,31,8,8,151,'frame');box(x-6,y-6,182,12,12,8,'metal');cylinder(x,y,178,4,4,'water',12)}
// Backside DIW manifold terminates under the back surface, outside the spindle.
box(692,-24,60,76,9,7,'water');for(let x of [702,758])cylinder(x,-24,67,3,12,'water',12);
return target}
const fixed=makeStatic();
function moving(m,size=1){target=[];
// Stocker lower tiers persist. Top Chuck has one continuous owner.
chuck(140,35,54);chuck(140,35,104);
chuck(m.chuck.x,m.chuck.y,m.chuck.z,m.chuckOwner==='cleaner'?m.spin:0);
// Y-only LD arm carriage; both sides share one rigid translation/hinge.
for(let side of [-1,1]){let x=side<0?342:490;box(x-3,m.arm.y-23,27,14,46,10,'metal');box(x,m.arm.y-6,37,8,12,93,'frame');box(side<0?350:476,m.arm.y-7,125,14,14,8,'metal')}
const rad=m.arm.angle*Math.PI/180,tr=([x,y,z])=>[420+x,m.arm.y+y*Math.cos(rad)-z*Math.sin(rad),143+y*Math.sin(rad)+z*Math.cos(rad)];
// Two adjustable arm assemblies: outer rail and sliding inner member.
for(let side of [-1,1]){let xx=side*(52*size+7);box(xx-4,-57*size,-11,8,114*size,6,'arm',tr);box(xx-6,-13,-14,12,26,9,'metal',tr);for(let sign of [-1,1]){let yy=sign*48*size;box(side<0?xx:52*size-3,yy-5,-7,10,10,5,'arm',tr);box(side*52*size-3,yy-3,-2,6,6,2,'pad',tr)}}
// Fixed-offset hand: all these points translate only in X/Z, never Y.
let x=m.traverser.x,z=m.traverser.z;
box(x-22,176,281,44,42,13,'head');
for(let xx of [x-12,x+7])box(xx,184,z+37,5,12,281-z-37,'metal');
box(x-10,-33,z+33,20,229,9,'head'); // rigid, constant Y length
for(let yy of [-33,103]){box(x-63,yy-4,z+29,126,8,9,'head');for(let xx of [x-31,x+26]){box(xx,yy-4,z+1,5,8,28,'head');box(xx,yy<35?yy:83,z,5,20,3,'metal')}}
if(m.mask)mask(m.mask.x,m.mask.y,m.mask.z,m.maskOwner==='cleaner'?m.spin:0,m.mask.angle);
return target}
function spray(m){target=[];if(!m.topSpray&&!m.backDIW)return target;
// Gentle ramps inside wet period; zero at Dry start. Logical DIW remains ON throughout wet.
let amp=Math.min(1,(m.t-90)/.4,(103-m.t)/.25);amp=Math.max(0,amp);
for(let [nx,ny,tx,ty] of [[638,0,700,10],[822,0,755,10],[822,77,752,58]]){
 polygon([[nx,ny,179],[tx-12,ty-8,116],[tx+12,ty+8,116]],'water',.20*amp);
 for(let i=0;i<9;i++){let u=(m.t*1.3+i/9)%1;let xx=nx+(tx-nx)*u+(i%3-1)*u*6,yy=ny+(ty-ny)*u;cylinder(xx,yy,179-63*u,.85,2,'water',6)}
}
for(let x of [702,758]){polygon([[x,-24,79],[x-8,10,112],[x+8,10,112]],'water',.35*amp);for(let i=0;i<10;i++){let u=(m.t*1.9+i/10)%1;cylinder(x+(i%3-1)*u*5,-24+34*u,79+33*u,.9,2,'water',6)}}
return target}
const canvas=document.getElementById('machine'),ctx=canvas.getContext('webgl',{antialias:true,preserveDrawingBuffer:true,alpha:true});let fallback=null;
let program,buffer,posLoc,colorLoc;
if(ctx){
 const shader=(type,src)=>{let s=ctx.createShader(type);ctx.shaderSource(s,src);ctx.compileShader(s);if(!ctx.getShaderParameter(s,ctx.COMPILE_STATUS))throw new Error(ctx.getShaderInfoLog(s));return s};
 program=ctx.createProgram();ctx.attachShader(program,shader(ctx.VERTEX_SHADER,'attribute vec3 p;attribute vec4 c;varying vec4 v;void main(){gl_Position=vec4(p,1.);v=c;}'));ctx.attachShader(program,shader(ctx.FRAGMENT_SHADER,'precision mediump float;varying vec4 v;void main(){gl_FragColor=v;}'));ctx.linkProgram(program);if(!ctx.getProgramParameter(program,ctx.LINK_STATUS))throw new Error('Renderer linking failed');ctx.useProgram(program);buffer=ctx.createBuffer();posLoc=ctx.getAttribLocation(program,'p');colorLoc=ctx.getAttribLocation(program,'c');
}else{fallback=document.createElement('canvas');canvas.replaceWith(fallback);fallback.id='machine';fallback.setAttribute('aria-label',canvas.getAttribute('aria-label'));fallback.setAttribute('role','img');document.getElementById('rendernote').textContent='兼容投影模式（无 WebGL）'}
function camera(view){if(view==='top')return {r:[1,0,0],u:[0,1,0],v:[0,0,1]};let a=(view==='front'?0:15)*Math.PI/180,e=(view==='front'?24:35)*Math.PI/180;return {r:[Math.cos(a),Math.sin(a),0],u:[-Math.sin(a)*Math.sin(e),Math.cos(a)*Math.sin(e),Math.cos(e)],v:[Math.sin(a)*Math.cos(e),-Math.cos(a)*Math.cos(e),Math.sin(e)]}}
function render(m,view='iso',light=false){let surface=fallback||canvas;let rect=surface.getBoundingClientRect(),w=Math.round(rect.width*Math.min(devicePixelRatio,1.5)),h=Math.round(rect.height*Math.min(devicePixelRatio,1.5));if(surface.width!==w||surface.height!==h){surface.width=w;surface.height=h}let cam=camera(view),center=[455,15,128];let corners=[];for(let x of [0,910])for(let y of [-205,239])for(let z of [-10,298])corners.push(sub([x,y,z],center));let xs=corners.map(p=>dot(p,cam.r)),ys=corners.map(p=>dot(p,cam.u));let minx=Math.min(...xs),maxx=Math.max(...xs),miny=Math.min(...ys),maxy=Math.max(...ys),scale=Math.min(w/(maxx-minx),h/(maxy-miny))*.91;let cx=(minx+maxx)/2,cy=(miny+maxy)/2;const project=p=>{let q=sub(p,center);return [(dot(q,cam.r)-cx)*scale*2/w,(dot(q,cam.u)-cy)*scale*2/h,-dot(q,cam.v)/1400]};
 let all=[...fixed,...moving(m)],water=spray(m);let lightDir=norm([-.3,-.4,1]);
 const tint=f=>{let c=hex(colors[f.color].slice(1));let sh=.57+.43*Math.max(0,dot(f.normal,lightDir));if(f.color==='mask')sh=.87+.13*Math.max(0,dot(f.normal,lightDir));return [...c.map(v=>v*sh),f.alpha]};
 if(ctx){ctx.viewport(0,0,w,h);ctx.clearColor(0,0,0,0);ctx.clear(ctx.COLOR_BUFFER_BIT|ctx.DEPTH_BUFFER_BIT);ctx.enable(ctx.DEPTH_TEST);ctx.depthFunc(ctx.LEQUAL);ctx.disable(ctx.CULL_FACE);ctx.bindBuffer(ctx.ARRAY_BUFFER,buffer);ctx.enableVertexAttribArray(posLoc);ctx.enableVertexAttribArray(colorLoc);ctx.vertexAttribPointer(posLoc,3,ctx.FLOAT,false,28,0);ctx.vertexAttribPointer(colorLoc,4,ctx.FLOAT,false,28,12);
 const batch=fs=>{let data=[];for(let f of fs){let c=tint(f);for(let i=1;i<f.points.length-1;i++)for(let p of [f.points[0],f.points[i],f.points[i+1]])data.push(...project(p),...c)}ctx.bufferData(ctx.ARRAY_BUFFER,new Float32Array(data),ctx.DYNAMIC_DRAW);ctx.drawArrays(ctx.TRIANGLES,0,data.length/7)};
 ctx.depthMask(true);ctx.disable(ctx.BLEND);batch(all);ctx.enable(ctx.BLEND);ctx.blendFunc(ctx.SRC_ALPHA,ctx.ONE_MINUS_SRC_ALPHA);ctx.depthMask(false);batch(water);ctx.depthMask(true);
 }else{let g=fallback.getContext('2d');g.clearRect(0,0,w,h);let fs=[...all,...water].map(f=>({...f,d:f.points.reduce((a,p)=>a+project(p)[2],0)/f.points.length})).sort((a,b)=>b.d-a.d);for(let f of fs){let c=tint(f);g.beginPath();f.points.forEach((p,i)=>{let [x,y]=project(p);i?g.lineTo((x+1)*w/2,(1-y)*h/2):g.moveTo((x+1)*w/2,(1-y)*h/2)});g.closePath();g.fillStyle=`rgba(${c.slice(0,3).map(v=>Math.round(v*255)).join(',')},${c[3]})`;g.fill()}}
 return {faces:all.length,webgl:!!ctx,glError:ctx?ctx.getError():0};
}
window.CleaningScene={render,colors};
})();

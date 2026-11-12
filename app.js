(function(){
'use strict';
const $=id=>document.getElementById(id),{C,steps,model}=CleaningModel;
let time=0,playing=false,view='iso',light=true,last=0,raf=0,onScreen=true,renderInfo={},graphicsFailed=false;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
$('steps').innerHTML=steps.map((s,i)=>`<button data-step="${i}"><span>${String(i+1).padStart(2,'0')}</span>${s[1]}</button>`).join('');
function showRenderFailure(){
 if(graphicsFailed)return;
 graphicsFailed=true;playing=false;if(raf)cancelAnimationFrame(raf);raf=0;
 $('renderFailure').hidden=false;$('rendernote').textContent='绘图中断';
 document.querySelectorAll('.toolbar button,.toolbar input,.toolbar select,[data-step]').forEach(el=>el.disabled=true);
 $('reload').focus({preventScroll:true});
}
function draw(){let m=model(time);renderInfo=CleaningScene.render(m,view,light);if(renderInfo.contextLost)showRenderFailure();$('seek').value=time;$('percent').textContent=`${Math.round(time/C.duration*100)}%`;$('play').textContent=playing?'暂停':'播放';$('stepTitle').textContent=`${String(m.step+1).padStart(2,'0')} · ${steps[m.step][1]}`;$('description').textContent=steps[m.step][2];
$('armAngle').textContent=`${m.arm.angle.toFixed(0)}°`;$('armPos').textContent=m.arm.y===C.armFrontY?'LD 口':m.arm.y===C.workY?'Chuck 上方':(time<54||(time>=171&&time<179))?'后移中':'前移中';$('loadOwner').textContent=({absent:'未装载',arm:'LD\u00a0Arm',traverser:'Traverser',chuck:'Chuck',cleaner:'Cleaner'})[m.maskOwner];$('topFlow').textContent=m.topSpray?'开启':'关闭';$('diw').textContent=m.backDIW?'开启':'关闭';$('cleanState').textContent=m.phase==='complete'?'循环完成':m.dry?'Dry（干燥）':m.topSpray?'湿洗中':'';
 const deg=m.chuckRotation*180/Math.PI;
 $('chuckDirection').textContent=time<31?`${deg.toFixed(0)}°`:time<80?'−90°':time<86?`逆时针复位 · ${deg.toFixed(0)}°`:time<C.wetStart?'前后块已对位':time<C.cleanEnd?'旋转中':time<156?'前后块已对位':time<162?'顺时针 90°':time<197?'−90°':time<203?'逆时针复位':'前后块已对位';
 $('gripState').textContent=m.gripEngaged?(m.gripMode==='mask'?'夹持 Mask':'夹持 Chuck'):'松开';
;$('diw').classList.toggle('on',m.backDIW);$('topFlow').classList.toggle('on',m.topSpray);document.querySelectorAll('[data-step]').forEach(b=>{let active=+b.dataset.step===m.step;b.classList.toggle('active',active);b.setAttribute('aria-current',active?'step':'false')});$('station').textContent=m.traverser.x===C.handoffX?'Stocker 交接位':m.traverser.x===C.stockX?'Stocker':m.traverser.x===420?'LD/ULD':m.traverser.x===730?'Cleaner':'横移中';$('stageHeight').textContent='圆形固定';$('viewText').textContent=({iso:'斜视 · 剖视',front:'正视',top:'俯视 · 后方在上',cleaner:'Cleaner 特写',grip:'Grip 侧视 · 左前 / 右后'})[view];}
function schedule(){if(!graphicsFailed&&!raf&&playing&&onScreen&&!document.hidden){last=0;raf=requestAnimationFrame(tick)}}
function tick(now){raf=0;if(graphicsFailed||!playing||!onScreen||document.hidden)return;let dt=last?Math.min((now-last)/1000,.06):0;last=now;time=Math.min(C.duration,time+dt*+$('speed').value);if(time>=C.duration)playing=false;draw();if(playing)raf=requestAnimationFrame(tick)}
function pause(){playing=false;if(raf)cancelAnimationFrame(raf);raf=0;draw()}
function seek(t){if(graphicsFailed)return;time=Math.max(0,Math.min(C.duration,+t||0));pause()}
$('play').onclick=()=>{if(playing)pause();else{if(time>=C.duration)time=0;playing=true;draw();schedule()}};$('restart').onclick=()=>{time=0;playing=!reduced.matches;draw();schedule()};$('seek').oninput=e=>seek(e.target.value);$('steps').onclick=e=>{let b=e.target.closest('[data-step]');if(b)seek(steps[+b.dataset.step][0])};$('view').onchange=e=>{view=e.target.value;draw()};$('theme').onclick=()=>{light=!light;document.body.classList.toggle('light',light);draw()};
document.addEventListener('keydown',e=>{if(graphicsFailed||e.defaultPrevented||e.target.closest('button,input,select,textarea,[contenteditable]'))return;if(e.code==='Space'){e.preventDefault();$('play').click()}if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();let i=model(time).step;seek(steps[Math.max(0,Math.min(steps.length-1,i+(e.key==='ArrowRight'?1:-1)))][0])}if(e.key==='Home'){e.preventDefault();seek(0)}});
$('machine').addEventListener('webglcontextlost',()=>{showRenderFailure();draw()});$('reload').onclick=()=>location.reload();
new ResizeObserver(()=>draw()).observe($('machine'));new IntersectionObserver(es=>{onScreen=es.at(-1).isIntersecting;if(onScreen)schedule()}).observe($('machine'));document.addEventListener('visibilitychange',()=>{if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0}else schedule()});reduced.addEventListener('change',()=>{if(reduced.matches)pause()});
window.cleaning={model,seek,get time(){return time},get playing(){return playing},get info(){return renderInfo},setView(v){view=v;$('view').value=v;draw()},state:()=>model(time)};draw();
})();

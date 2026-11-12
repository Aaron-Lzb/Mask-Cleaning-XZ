"""Derive a simplified, perforated extruded profile from the supplied Chuck.png.
Image stays read-only. World width stays 119 units, the previous full outer span (including support pads).
"""
from pathlib import Path
from PIL import Image,ImageFilter
import numpy as np
import json,hashlib,math
ROOT=Path(__file__).resolve().parent
source=ROOT/'references'/'Chuck.png'
im=Image.open(source).convert('L');im.thumbnail((720,720));im=im.filter(ImageFilter.MedianFilter(3))
a=np.array(im)>100
h,w=a.shape
# Fill only tiny etched marks; preserve major holes/cutouts from the actual reference.
seen=np.zeros_like(a);removed=0;holes=[]
for yy in range(h):
 for xx in range(w):
  if a[yy,xx] or seen[yy,xx]:continue
  todo=[(xx,yy)];seen[yy,xx]=True;points=[];border=False
  while todo:
   x,y=todo.pop();points.append((x,y));border|=x==0 or y==0 or x==w-1 or y==h-1
   for dx,dy in [(1,0),(-1,0),(0,1),(0,-1)]:
    u,v=x+dx,y+dy
    if 0<=u<w and 0<=v<h and not a[v,u] and not seen[v,u]:seen[v,u]=True;todo.append((u,v))
  if not border:
   if len(points)<22:
    for x,y in points:a[y,x]=True
    removed+=1
   else:holes.append(points)
# Exposed cell edges, consistently directed around white material.
edges={}
for y,x in zip(*np.where(a)):
 for ok,p,q in [(y==0 or not a[y-1,x],(x,y),(x+1,y)),(x==w-1 or not a[y,x+1],(x+1,y),(x+1,y+1)),(y==h-1 or not a[y+1,x],(x+1,y+1),(x,y+1)),(x==0 or not a[y,x-1],(x,y+1),(x,y))]:
  if ok:edges.setdefault(p,[]).append(q)
loops=[]
while edges:
 start=next(iter(edges));p=start;loop=[]
 while True:
  loop.append(p);qs=edges[p];q=qs.pop()
  if not qs:del edges[p]
  p=q
  if p==start:break
 loops.append(loop)
def area(ps):return sum(p[0]*q[1]-q[0]*p[1] for p,q in zip(ps,ps[1:]+ps[:1]))/2
def rdp(ps,eps):
 if len(ps)<3:return ps
 p=np.array(ps[0],float);q=np.array(ps[-1],float);v=q-p;length=np.linalg.norm(v)
 distances=[abs(v[0]*(k[1]-p[1])-v[1]*(k[0]-p[0]))/length if length else np.linalg.norm(np.array(k)-p) for k in ps]
 i=int(np.argmax(distances))
 if distances[i]>eps:return rdp(ps[:i+1],eps)[:-1]+rdp(ps[i:],eps)
 return [ps[0],ps[-1]]
# Simplify at less than one world unit; retain holes as true openings.
ys,xs=np.where(a);scale=119/(xs.max()+1-xs.min());cx=(xs.min()+xs.max()+1)/2;cy=(ys.min()+ys.max()+1)/2
clean=[]
for ps in loops:
 if abs(area(ps))<22:continue
 half=len(ps)//2
 simple=rdp(ps[:half+1],1.1)+rdp(ps[half:]+[ps[0]],1.1)[1:-1]
 clean.append([[round((x-cx)*scale,4),round((cy-y)*scale,4)] for x,y in simple])
# Scanline trapezoid decomposition handles a multiply-connected plate exactly,
# including the central hole and large inter-arm openings, without an external library.
segments=[(p,q) for loop in clean for p,q in zip(loop,loop[1:]+loop[:1]) if p[1]!=q[1]]
levels=sorted(set(p[1] for loop in clean for p in loop));quads=[]
for y0,y1 in zip(levels,levels[1:]):
 mid=(y0+y1)/2
 active=[(p,q) for p,q in segments if min(p[1],q[1])<mid<max(p[1],q[1])]
 def xat(p,q,y):return p[0]+(q[0]-p[0])*(y-p[1])/(q[1]-p[1])
 active.sort(key=lambda pq:xat(*pq,mid))
 assert len(active)%2==0
 for left,right in zip(active[::2],active[1::2]):
  quad=[[xat(*left,y0),y0],[xat(*right,y0),y0],[xat(*right,y1),y1],[xat(*left,y1),y1]]
  if abs(area(quad))>1e-5:quads.append([[round(x,4),round(y,4)] for x,y in quad])
# Major holes are candidates for small physical support buttons near the outer lobes.
centers=[]
for pts in holes:
 if len(pts)>350:continue
 x,y=np.array(pts).mean(axis=0);r=math.sqrt(len(pts)/math.pi)*scale
 centers.append([round((x-cx)*scale,4),round((cy-y)*scale,4),round(r,4)])
eroded=np.array(Image.fromarray((a*255).astype('uint8')).filter(ImageFilter.MinFilter(13)))>0
py,px=np.where(eroded)
wx=(px+.5-cx)*scale;wy=(cy-py-.5)*scale
supports=[]
for angle in [20,56,124,160,200,236,304,340]:
 theta=math.radians(angle);target_x=46*math.cos(theta);target_y=46*math.sin(theta)
 i=int(np.argmin((wx-target_x)**2+(wy-target_y)**2))
 supports.append([round(float(wx[i]),4),round(float(wy[i]),4)])
hub=[]
for pts in holes:
 x,y=np.array(pts).mean(axis=0);xx=(x-cx)*scale;yy=(cy-y)*scale
 if math.hypot(xx,yy)<5:hub=[round(xx,4),round(yy,4),round(math.sqrt(len(pts)/math.pi)*scale,4)]
data={'source':'references/Chuck.png','sourceSHA256':hashlib.sha256(source.read_bytes()).hexdigest(),'width':119,'height':round((ys.max()+1-ys.min())*scale,4),'contours':clean,'surfaceQuads':quads,'holes':centers,'supportPoints':supports,'centerHole':hub,'ignoredEtchedMarks':removed}
(ROOT/'chuck-profile.js').write_text('/* Derived from the supplied reference, with real through-holes. */\nglobalThis.ChuckProfile='+json.dumps(data,separators=(',',':'))+';\n')
print(json.dumps({'loops':len(clean),'vertices':sum(map(len,clean)),'surfaceQuads':len(quads),'majorSmallHoles':len(centers),'outerWidth':119,'outerHeight':data['height'],'centerHole':hub}))

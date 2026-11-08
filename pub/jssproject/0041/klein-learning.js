/* Loop evidence in the observed covering plane, including Klein reflections. */
(function(root){'use strict';
function start(s){return s.kleinLearning??=( {path:[point(s)],counts:new Map(),last:s.steps} );}
function point(s){return {id:s.id,x:s.x,y:s.y,frame:[...s.frame]};}
function observe(s){const r=start(s);if(r.last===s.steps)return;if(s.features?.last){r.path=[point(s)];if(s.features.last.kind!=='wand')r.counts.clear();r.relocations=(r.relocations||0)+1;r.last=s.steps;return;}if(s.steps!==r.last+1){r.path=[point(s)];r.last=s.steps;return;}r.last=s.steps;const p=point(s),i=r.path.findIndex(a=>a.id===p.id);if(i<0){r.path.push(p);return;}const a=r.path[i],dx=p.x-a.x,dy=p.y-a.y,{width,height}=s.world.layouts[0],flip=a.frame[0]!==p.frame[0];r.path=r.path.slice(0,i);r.path.push(p);let key,axis,offset=0;
if(Math.abs(dx)===width&&flip){axis='x';offset=a.y+p.y;key='x:'+offset;}else if(dx===0&&Math.abs(dy)===height&&!flip){axis='y';key='y';}else return;
const prev=r.counts.get(key);r.counts.set(key,{axis,offset,count:(prev?.count||0)+1});}
function knowledge(s){const threshold=s.loopThreshold??3;return [...start(s).counts.values()].map(p=>({...p,learned:threshold>0&&p.count>=threshold}));}
// Search in the lifted view, so a reflected return is distinct from an ordinary return.
function plan(s){if(s.loopThreshold===0)return null;const known=knowledge(s),axis=['x','y'].find(axis=>!known.some(p=>p.axis===axis&&p.learned));if(!axis)return null;if(s.features?.warps.size&&s.id!==s.world.start){const P=typeof module==='object'?require('./exploration-solver.js'):globalThis.ExplorationSolver;return P.connected({...s,world:{...s.world,exit:s.world.start}}); }const {width,height}=s.world.layouts[0],dirs=[[0,-1],[1,0],[0,1],[-1,0]],key=p=>[p.id,p.x,p.y,p.frame.join(',')].join(':'),origin={id:s.id,x:0,y:0,frame:[...s.frame]},q=[origin],parents=new Map([[key(origin),null]]);let finish=null;
for(let i=0;i<q.length&&q.length<=250000;i++){const a=q[i],k=key(a);if(a.id===s.id&&(axis==='x'?Math.abs(a.x)===width&&a.frame[0]!==s.frame[0]:a.x===0&&Math.abs(a.y)===height&&a.frame[0]===s.frame[0])){finish=k;break;}for(let d=0;d<4;d++){const e=s.world.edges.get(a.id+':'+d);if(!e||s.features?.warps.has(e.to))continue;const [dx,dy]=dirs[a.frame.indexOf(d)],p={id:e.to,x:a.x+dx,y:a.y+dy,frame:a.frame.map(v=>e.transform[v])};if(Math.abs(p.x)>2*width||Math.abs(p.y)>2*height)continue;const n=key(p);if(parents.has(n))continue;parents.set(n,[k,d]);q.push(p);}}
if(finish===null)throw Error(`${axis==='x'?'左右の反転':'上下'}周回路を見つけられませんでした。探索記録を保持して停止します。`);const path=[];for(let p=parents.get(finish);p;p=parents.get(p[0]))path.push(p[1]);return path.reverse();}
// Fill the same rectangular memory window as the other explorers. A known
// cell may have several visible copies; choosing only its nearest copy cuts
// off the corners of the map. Only learned deck transformations are allowed.
function memory(s,chart,radius=9){
 const records=[...chart.cells.values()],k=knowledge(s),horizontal=k.find(p=>p.axis==='x'&&p.learned),vertical=k.some(p=>p.axis==='y'&&p.learned);
 const direct=()=>records.map(p=>({...p,x:p.x-s.x,y:p.y-s.y}));
 if(s.atlasComplete){
  const S=typeof module==='object'?require('./connection-space.js'):globalThis.ConnectionSpace,w=s.world,{width,height}=w.layouts[0],here=S.position(w,s.id),right=S.directions[s.frame[1]],down=S.directions[s.frame[2]],out=new Map(),mod=(a,n)=>((a%n)+n)%n;
  for(let y=-radius;y<=radius;y++)for(let x=-radius;x<=radius;x++){
   const wx=here.x+x*right[0]+y*down[0],wy=here.y+x*right[1]+y*down[1],flip=Math.abs(Math.floor(wx/width))%2===1;
   const id=mod(flip?(w.shiftY??0)-wy:wy,height)*width+mod(wx,width),frame=flip?s.frame.map(d=>[2,1,0,3][d]):[...s.frame];
   out.set(x+','+y,{id,x,y,wall:!w.cells[id],frame});
  }
  // Preserve the observed underpass lane and local presentation at known cells.
  for(const p of direct())if(p.id>=0)out.set(p.x+','+p.y,p);
  return [...out.values()];
 }

 if(s.foldLoops===false||(!horizontal&&!vertical))return direct();
 const {width,height}=s.world.layouts[0],out=new Map();
 // Keep every directly recorded tile at its existing screen position, even
 // outside the repetition window. Learning only fills previously blank slots.
 for(const p of direct())out.set(p.x+','+p.y,{...p,d:0});
 for(const p of records){
  const minA=horizontal?Math.ceil((s.x-radius-p.x)/width):0,maxA=horizontal?Math.floor((s.x+radius-p.x)/width):0;
  for(let a=minA;a<=maxA;a++){
   const flip=Math.abs(a)%2===1,x=p.x+a*width-s.x,baseY=flip?horizontal.offset-p.y:p.y;
   if(Math.abs(x)>radius)continue;
   const minB=vertical?Math.ceil((s.y-radius-baseY)/height):0,maxB=vertical?Math.floor((s.y+radius-baseY)/height):0;
   for(let b=minB;b<=maxB;b++){
    const y=baseY+b*height-s.y;if(Math.abs(y)>radius)continue;
    const key=x+','+y,d=(p.x-s.x-x)**2+(p.y-s.y-y)**2,old=out.get(key);
    if(!old||d<old.d)out.set(key,{...p,x,y,d,frame:flip&&p.frame?[p.frame[2],p.frame[1],p.frame[0],p.frame[3]]:p.frame});
   }
  }
 }
 return [...out.values()];
}
// Counts belong to a registered chart. Rejoining restores evidence, never
// adds duplicate laps. Reflection axes are transformed with the chart itself.
function mergeLearning(saved,chart,transform={signY:1,ty:0}){
 const target=chart.loopCounts??=new Map();
 for(const p of saved.loopCounts?.values()||[]){
  const offset=p.axis==='x'?transform.signY*p.offset+2*transform.ty:0,key=p.axis==='x'?'x:'+offset:'y';
  if((target.get(key)?.count||0)<p.count)target.set(key,{...p,offset});
 }
}
function attach(book){book.onMerge=(saved,chart,t)=>{if(t.right[1]===0&&t.down[0]===0)mergeLearning(saved,chart,{signY:t.down[1],ty:t.ty});};return book;}
function sync(s,book){const chart=book.charts[book.active];if(!chart)return;const r=start(s);mergeLearning({loopCounts:r.counts},chart);for(const [key,p]of chart.loopCounts)if((r.counts.get(key)?.count||0)<p.count)r.counts.set(key,{...p});}
// Align archived charts from observed numbered landmarks, never from true IDs.
function matchMaps(book){
 let merged=0,again=true;const dirs=[[0,-1],[1,0],[0,1],[-1,0]];
 while(again){again=false;const chart=book.charts[book.active];if(!chart)break;
  const current=[...chart.cells.values()];
  for(const saved of [...book.charts]){if(saved===chart)continue;
   const candidates=new Map();
   for(const now of current.filter(p=>p.mark&&p.frame))for(const old of [...saved.cells.values()].filter(p=>p.mark===now.mark&&p.frame)){
    const change=old.frame.map(d=>now.frame.indexOf(d)),right=dirs[change[1]],down=dirs[change[2]];
    const tx=now.x-old.x*right[0]-old.y*down[0],ty=now.y-old.x*right[1]-old.y*down[1],key=[...change,tx,ty].join(':');if(candidates.has(key))continue;
    const cells=new Map();let conflict=false,overlap=0;
    for(const p of saved.cells.values()){
     const x=tx+p.x*right[0]+p.y*down[0],y=ty+p.x*right[1]+p.y*down[1],q=chart.cells.get(x+','+y);
     if(q){if((q.wall!==p.wall&&!(q.underpassProjection&&p.underpassProjection))||(q.mark&&p.mark&&q.mark!==p.mark)){conflict=true;break;}overlap++;}
     cells.set(x+','+y,{...p,x,y,frame:p.frame?[0,1,2,3].map(d=>p.frame[change.indexOf(d)]):undefined});
    }
    if(!conflict)candidates.set(key,{cells,overlap,right,down,ty});
   }
   const ranked=[...candidates.values()].sort((a,b)=>b.overlap-a.overlap);
   if(!ranked.length||(ranked[1]&&ranked[0].overlap===ranked[1].overlap))continue;
   for(const [key,p]of ranked[0].cells)if(!chart.cells.has(key))chart.cells.set(key,p);
   const chosen=ranked[0];if(chosen.right[1]===0&&chosen.down[0]===0)mergeLearning(saved,chart,{signY:chosen.down[1],ty:chosen.ty});
   book.charts.splice(book.charts.indexOf(saved),1);book.active=book.charts.indexOf(chart);merged++;again=true;break;
  }
 }
 book.markMatches=(book.markMatches||0)+merged;return {merged,remaining:Math.max(0,book.charts.length-1)};
}
const api={start,observe,knowledge,memory,plan,matchMaps,attach,sync};if(typeof module==='object')module.exports=api;else root.KleinLearning=api;
})(globalThis);

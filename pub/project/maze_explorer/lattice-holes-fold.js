/* Display-only quotient of recorded cells by the learned integer subgroup. */
(function(root){
'use strict';
const S=typeof module==='object'?require('./connection-space.js'):root.ConnectionSpace;
const R=typeof module==='object'?require('./lattice-holes-loops.js'):root.SkewLoops;
const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b)[a,b]=[b,a%b];return a;};
const det=(a,b)=>a[0]*b[1]-a[1]*b[0],mod=(n,m)=>((n%m)+m)%m;
function quotient(vectors){
 if(!vectors.length)return p=>p.join(',');
 let index=0;for(let i=0;i<vectors.length;i++)for(let j=0;j<i;j++)index=gcd(index,det(vectors[i],vectors[j]));
 // In rank two, the gcd of all minors is the index. Testing all determinant
 // residues retains sublattices, unlike replacing two independent vectors by Z².
 if(index)return p=>vectors.map(v=>mod(det(v,p),index)).join(',');
 const first=vectors[0],scale=gcd(...first);let unit=first.map(n=>n/scale);
 if(unit[0]<0||(!unit[0]&&unit[1]<0))unit=unit.map(n=>-n);
 const axis=unit[0]?0:1,step=vectors.reduce((g,v)=>gcd(g,v[axis]/unit[axis]),0),v=unit.map(n=>n*step);
 return p=>{const q=Math.floor(p[axis]/v[axis]);return `${p[0]-q*v[0]},${p[1]-q*v[1]}`;};
}
function memory(state,chart,radius=9){
 const cells=chart?.cells??new Map(),w=state.world,sheet=S.groundSheet(w,state.id),l=w.lattice;
 const direct=()=>{const visible=[];for(const p of cells.values()){const x=p.x-state.x,y=p.y-state.y;if(Math.abs(x)<=radius&&Math.abs(y)<=radius)visible.push({...p,x,y});}return visible;};
 // Once every floor has been observed, the finished atlas retains the entire
 // current sheet, including walls, independently of local visibility and laps.
 if(state.atlasComplete){
  const here=S.position(w,state.id),right=S.directions[state.frame[1]],down=S.directions[state.frame[2]],result=[];
  // Use the actual fundamental domain. Single-shift enclosures use a rectangle,
  // while skew holes and dual-shift enclosures use a parallelogram. Both share
  // the same period equivalence, but not the same canonical rectangle formula.
  const key=quotient([l.a,l.b]),records=new Map();
  for(const id of w.domain){if(w.holes.has(id)||S.groundSheet(w,id)!==sheet)continue;const p=S.position(w,id);records.set(key([p.x-here.x,p.y-here.y]),id);}
  for(let y=-radius;y<=radius;y++)for(let x=-radius;x<=radius;x++){
   const id=records.get(key([x*right[0]+y*down[0],x*right[1]+y*down[1]]));if(id===undefined)continue;
   result.push({id,x,y,wall:!w.cells[id],frame:[...state.frame]});
  }return result;
 }
 if(state.foldLoops===false)return direct();
 const learned=R.knowledge(state).filter(p=>p.learned&&p.sheet===sheet);
 if(!learned.length)return direct();
 const vectors=learned.map(p=>[p.a*l.a[0]+p.b*l.b[0],p.a*l.a[1]+p.b*l.b[1]]),key=quotient(vectors);
 const right=S.directions[state.frame[1]],down=S.directions[state.frame[2]],world=(x,y)=>[x*right[0]+y*down[0],x*right[1]+y*down[1]],records=new Map(),fixed=[];
 const sheetCache=new Map();
 const ground=id=>{if(!sheetCache.has(id))sheetCache.set(id,S.groundSheet(w,id));return sheetCache.get(id);};
 for(const p of cells.values()){const x=p.x-state.x,y=p.y-state.y;
  if(p.id<0||ground(p.id)!==sheet){if(Math.abs(x)<=radius&&Math.abs(y)<=radius)fixed.push({...p,x,y});continue;}
  const k=key(world(x,y)),distance=x*x+y*y,old=records.get(k);
  if(!old||distance<old.distance)records.set(k,{p,distance});
 }
 const anchored=new Map(direct().map(p=>[p.x+','+p.y,p]));
 const result=[];for(let y=-radius;y<=radius;y++)for(let x=-radius;x<=radius;x++){
  const existing=anchored.get(x+','+y);if(existing){result.push(existing);continue;}
  const record=records.get(key(world(x,y)));if(record)result.push({...record.p,x,y});
 }
 return result.concat(fixed);
}
const api={memory,quotient};if(typeof module==='object')module.exports=api;else root.SkewFold=api;
})(globalThis);

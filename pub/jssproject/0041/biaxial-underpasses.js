/* Reuse the established underpass generator, preserving independent lane nodes. */
(function(root){'use strict';
const K=typeof module==='object'?require('./klein-biaxial.js'):root.KleinBiaxial,S=typeof module==='object'?require('./connection-space.js'):root.ConnectionSpace,E=typeof module==='object'?require('./biaxial-exploration.js'):root.BiaxialExploration;
function add(w,count=2,shape='mixed'){
 if(!Number.isInteger(count)||count<0||count>6||!['straight','corners','mixed'].includes(shape))throw Error('Invalid underpass settings');
 if(!count)return w;
 const area=w.width*w.height,edges=new Map();for(const [key,e]of w.edges){const id=Number(key.split(':')[0]);if(w.cells[id]&&w.cells[e.to])edges.set(key,{to:e.to,transform:e.t});}
 let source={width:w.width,height:w.height,seed:w.seed,mode:'freeMaze',sheets:1,layouts:[{width:w.width,height:w.height,offset:0}],cells:w.cells.slice(),edges,candidates:new Map(edges),start:w.start,exit:w.exit,stairs:new Set(),crossings:new Set(),underpassReach:2,wallStyle:'grid',guaranteedLoops:Object.values(E.cycles(w)).filter(Boolean)};
 source=S.addFloorUnderpasses(source,count);if(shape!=='straight')S.bendUnderpasses(source,shape);
 const cells=Array.from(source.cells),complete=new Map(),positions=new Map(),blocked=[];
 // Every floor has four view edges. A forbidden turn leads to a wall image,
 // never into the other lane occupying the same drawn coordinate.
 for(let id=0;id<source.cells.length;id++){const base=id%area;
  if(!cells[id]&&id>=area)continue;
  for(let d=0;d<4;d++){const key=id+':'+d,e=source.edges.get(key),original=w.edges.get(base+':'+d);
   if(e){complete.set(key,{to:e.to,t:e.transform});continue;}
   if(cells[id]&&source.cells[original.to]){const alias=cells.length;cells.push(0);positions.set(alias,original.to);blocked.push(alias);complete.set(key,{to:alias,t:original.t});}
   else complete.set(key,{to:original.to,t:original.t});
  }
 }
 for(const id of blocked)for(let d=0;d<4;d++)complete.set(id+':'+d,w.edges.get(positions.get(id)+':'+d));
 return {...w,cells:Uint8Array.from(cells),edges:complete,positions,passages:source.passages,underpassGraph:source,underpassCount:count,underpassShape:shape};
}
function symbol(w,id,frame){return w.underpassGraph?S.underpassSymbol(w.underpassGraph,id,frame):'';}
const api={add,symbol};if(typeof module==='object')module.exports=api;else root.BiaxialUnderpasses=api;
})(globalThis);

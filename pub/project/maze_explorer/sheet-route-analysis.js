/* Inspect actual passage edges, including underpass lanes, rather than screen distance. */
(function(root){
 'use strict';
 const S=typeof module==='object'?require('./connection-space.js'):root.ConnectionSpace;
 function analyze(world){
  const sheet=id=>S.groundSheet(world,id),floors=[...world.cells.keys()].filter(id=>world.cells[id]);
  function walk(start,allowed=()=>true){
   const seen=new Map(),q=[];
   if(allowed(start)){seen.set(start,null);q.push(start);}
   for(let i=0;i<q.length;i++)for(let d=0;d<4;d++){
    const e=world.edges.get(`${q[i]}:${d}`);
    if(e&&world.cells[e.to]&&allowed(e.to)&&!seen.has(e.to)){seen.set(e.to,q[i]);q.push(e.to);}
   }
   return seen;
  }
  const owners=new Map(),regions=[];
  for(const id of floors)if(!owners.has(id)){
   const ids=[...walk(id,n=>sheet(n)===sheet(id)).keys()],number=regions.length;
   ids.forEach(n=>owners.set(n,number));regions.push({sheet:sheet(id),ids});
  }
  const reachable=walk(world.start),without=Array.from({length:world.sheets},(_,s)=>walk(world.start,id=>sheet(id)!==s));
  const startRegion=owners.get(world.start),exitRegion=owners.get(world.exit);
  const dependencies=regions.map((r,index)=>({
   sheet:r.sheet,region:index,floors:r.ids.length,
   requiredSheets:without.flatMap((visited,s)=>s!==sheet(world.start)&&s!==r.sheet&&r.ids.some(id=>reachable.has(id)&&!visited.has(id))?[s]:[])
  }));
  const route=[];if(reachable.has(world.exit)){
   for(let id=world.exit;id!==null;id=reachable.get(id))route.push(sheet(id));
   route.reverse();
  }
  const sheetRoute=route.filter((s,i)=>i===0||s!==route[i-1]);
  return {allConnected:reachable.size===floors.length,exitReachable:reachable.has(world.exit),
   regions:dependencies,regionsPerSheet:Array.from({length:world.sheets},(_,s)=>regions.filter(r=>r.sheet===s).length),
   startRegion,exitRegion,sheetRoute,
   returnRequired:sheet(world.start)===sheet(world.exit)&&startRegion!==exitRegion,
   requiredForExit:dependencies[exitRegion]?.requiredSheets??[],
   tripleReturnCandidates:dependencies.filter(r=>r.sheet===sheet(world.start)&&r.region!==startRegion&&r.requiredSheets.length===world.sheets-1).map(r=>r.region)};
 }
 const api={analyze};if(typeof module==='object')module.exports=api;else root.SheetRouteAnalysis=api;
})(typeof globalThis==='object'?globalThis:this);

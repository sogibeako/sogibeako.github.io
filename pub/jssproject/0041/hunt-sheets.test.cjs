const a=require('node:assert/strict'),L=require('./lattice-holes.js'),S=require('./connection-space.js'),F=require('./sheet-features.js'),G=require('./exploration-generation.js'),Save=require('./lattice-holes-save.js');
let cases=0;
for(const wallStyle of ['dense','grid'])for(const [shiftX,shiftY] of [[0,0],[2,0],[0,-2],[2,-2]])for(const periodWidth of [12,16,24])for(let seed=0;seed<4;seed++){
 const s=L.create({maze:true,growth:'hunt',wallStyle,shiftX,shiftY,periodWidth,periodHeight:16,seed:'hunt-'+seed,underpasses:2,underpassShape:'mixed',holeRimWalls:true});
 const seen=new Set([s.id]),q=[s.id];for(const n of q)for(let d=0;d<4;d++){const e=s.world.edges.get(n+':'+d);if(e&&!seen.has(e.to)){seen.add(e.to);q.push(e.to);}}
 a.equal(seen.size,s.world.cells.reduce((n,v)=>n+v,0));a(seen.has(s.world.exit));a.equal(s.world.guaranteedLoops.length,4);for(const route of s.world.guaranteedLoops){let id=route.start;for(const d of route.directions){const edge=s.world.edges.get(id+':'+d);a(edge);id=edge.to;}a.equal(id,route.start);}
 const book={charts:[],active:-1};S.observeWalkingMap(s,book);Save.decode(Save.encode({state:s,book,journey:{number:1,steps:0},controls:{}}));cases++;
}
console.log(cases+' Hunt & Kill worlds: all floors reachable, four winding routes, save round trip');

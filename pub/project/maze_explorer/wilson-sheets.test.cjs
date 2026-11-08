const a=require('node:assert/strict'),L=require('./lattice-holes.js'),S=require('./connection-space.js'),F=require('./sheet-features.js'),G=require('./exploration-generation.js'),Save=require('./lattice-holes-save.js');
let cases=0;
for(const wallStyle of ['grid'])for(const [shiftX,shiftY] of [[0,0],[2,0],[0,-2],[2,-2]])for(const periodWidth of [12,16,24])for(let seed=0;seed<4;seed++){
 const s=L.create({maze:true,growth:'wilson',wallStyle,shiftX,shiftY,periodWidth,periodHeight:16,seed:'wilson-'+seed,underpasses:2,underpassShape:'mixed',holeRimWalls:true});
 const seen=new Set([s.id]),q=[s.id];for(const n of q)for(let d=0;d<4;d++){const e=s.world.edges.get(n+':'+d);if(e&&!seen.has(e.to)){seen.add(e.to);q.push(e.to);}}
 a.equal(seen.size,s.world.cells.reduce((n,v)=>n+v,0));a(seen.has(s.world.exit));a.equal(s.world.guaranteedLoops.length,4);for(const route of s.world.guaranteedLoops){let id=route.start;for(const d of route.directions){const edge=s.world.edges.get(id+':'+d);a(edge);id=edge.to;}a.equal(id,route.start);}
 const book={charts:[],active:-1};S.observeWalkingMap(s,book);Save.decode(Save.encode({state:s,book,journey:{number:1,steps:0},controls:{}}));cases++;
}
console.log(cases+' Wilson worlds: all floors reachable, four winding routes, save round trip');

a.throws(()=>L.create({maze:true,growth:'wilson',wallStyle:'dense'}),/アトリエ/);
const pools={main:['dfs'],skew:['wilson']};for(let i=0;i<30;i++)a.equal(G.choose('skew',{wallStyle:'dense'},true,'w'+i,pools,undefined,undefined,'none',undefined,undefined,{enabled:true,pool:['dense','grid']}).wallStyle,'grid');
a.throws(()=>G.choose('skew',{},true,'w',pools,undefined,undefined,'none',undefined,undefined,{enabled:true,pool:['dense']}),/アトリエ/);

const O=require('./lattice-holes-options.js');for(let i=0;i<100;i++){let r=i+1;const rng=()=>((r=Math.imul(r,1664525)+1013904223>>>0)/4294967296);const o=O.randomize({wallStyle:'grid',growth:'wilson'},{enabled:true,growth:true,wall:true},rng);if(o.growth==='wilson')a.equal(o.wallStyle,'grid');}
const opts={maze:true,growth:'wilson',wallStyle:'grid',seed:'deterministic',periodWidth:20,periodHeight:16,shiftX:-2,shiftY:4};a.deepEqual(L.create(opts).world.cells,L.create(opts).world.cells);

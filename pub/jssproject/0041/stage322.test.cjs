const a=require('node:assert/strict'),L=require('./lattice-holes.js'),S=require('./connection-space.js'),F=require('./sheet-features.js'),G=require('./exploration-generation.js'),Save=require('./lattice-holes-save.js');
let cases=0;
for(const wallStyle of ['dense','grid'])for(const [shiftX,shiftY] of [[0,0],[2,0],[0,-2],[2,-2]])for(const periodWidth of [12,16,24])for(let seed=0;seed<4;seed++){
 const s=L.create({maze:true,growth:'rooms',wallStyle,shiftX,shiftY,periodWidth,periodHeight:16,seed:'rooms-'+seed,underpasses:2,underpassShape:'mixed',holeRimWalls:true});
 const seen=new Set([s.id]),q=[s.id];for(const n of q)for(let d=0;d<4;d++){const e=s.world.edges.get(n+':'+d);if(e&&!seen.has(e.to)){seen.add(e.to);q.push(e.to);}}
 a.equal(seen.size,s.world.cells.reduce((n,v)=>n+v,0));a(seen.has(s.world.exit));a.equal(s.world.guaranteedLoops.length,4);
 const book={charts:[],active:-1};S.observeWalkingMap(s,book);Save.decode(Save.encode({state:s,book,journey:{number:1,steps:0},controls:{}}));cases++;
}
for(const style of ['dense','grid'])a.equal(G.choose('skew',{wallStyle:'dense'},false,'style',undefined,undefined,undefined,'none',undefined,undefined,{enabled:true,pool:[style]}).wallStyle,style);
a.throws(()=>G.validateStyles({enabled:true,pool:[]}));
let leaps=0;for(let i=0;i<1000;i++){const cells=new Uint8Array(20).fill(1),edges=new Map();for(let n=0;n<20;n++){if(n)edges.set(n+':2',{to:n-1});if(n<19)edges.set(n+':0',{to:n+1});}const state={world:{cells,edges,exit:19,seed:'contact-'+i},id:5,steps:1,last:{},features:{options:{birdLeap:true},warps:new Map(),key:null,door:null,hasKey:false,bird:5,cooldown:0}};F.afterMove(state);a.notEqual(state.id,5);if(state.features.bird!==5){leaps++;a.notEqual(state.id,state.features.bird);a.notEqual(state.features.bird,19);}}
a(leaps>200&&leaps<300,leaps);console.log(cases+' room worlds connected and saved; bird leaps '+leaps+'/1000; style pools passed');

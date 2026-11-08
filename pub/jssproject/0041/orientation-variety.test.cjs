const assert=require('node:assert/strict'),O=require('./orientation.js'),S=require('./orientation-save.js'),M=require('./core.js');
const snap=s=>JSON.stringify(s,(_,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v);
function route(w){const q=[[w.start,[]]],seen=new Set([w.start]);for(const [id,path] of q){if(id===w.exit)return path;for(const d of Object.keys(M.DIRS)){
 const e=M.transition(w,{world_position:id},d);if(!e)continue;const to=w.warps.get(e.to)??e.to;
 if(!seen.has(to)){seen.add(to);q.push([to,[...path,d]]);}
}}throw Error('unreachable');}
for(const layout of ['division','rooms'])for(const [size,[width,height]] of Object.entries({small:[21,17],standard:[31,23],large:[41,29]}))for(const warpStyle of ['pair','oneway','cycle3','cycle4']){
 const s=O.create('mixed',{layout,size,warpStyle,warpCount:4,seed:'variety-76'}),w=s.game.world;
 assert.equal(w.width,width);assert.equal(w.height,height);assert.equal(w.validation.warp.canExit,w.validation.floors);
 for(const d of route(w)){const local=O.direction(O.apply(O.inverse(s.frame),...M.DIRS[d]));assert.ok(O.move(s,local));}
 assert.ok(s.game.won);assert.equal(snap(S.decode(S.encode(s))),snap(s));
 const next=O.nextMaze(s);assert.notEqual(next.config.layout,layout);assert.notEqual(next.config.size,size);assert.equal(next.config.stage,2);
}
const old=JSON.parse(S.encode(O.create('right',{layout:'dfs'})));delete old.config.size;
 assert.equal(S.decode(JSON.stringify(old)).config.size,'standard');
old.config.size='huge';assert.throws(()=>S.decode(JSON.stringify(old)));
assert.throws(()=>O.create('right',{size:'__proto__'}));
console.log('PASS: 24 new generator/size/warp combinations, subjective route to exit, connectivity, exact save restoration, next-floor size/generator changes, legacy dimensions and invalid-size rejection.');

const a=require('node:assert/strict'),A=require('./triple-warp-arrows.js'),S=require('./connection-space.js'),P=require('./crossing-autowalk.js');
const s=S.create('tripleMaze',{ruleMode:'warp',dimensions:[[20,20],[24,20],[20,20]],seed:'arrows',growth:'dfs'}),from=[...s.features.warps.keys()][0],to=s.features.warps.get(from);
a.deepEqual(A.records(s),[]);for(const d of P.route(s,()=>false,from))a(S.move(s,d));a(A.records(s).some(r=>r.from===from&&r.to===to));
const snap={state:s,journey:{number:1,steps:0},journeyMap:{cells:new Map()},regionBook:{records:new Map(),owners:new Map(),nextNumber:1},atlasMemory:new Set(),walkingBook:{charts:[],active:-1},controls:{}};
a.deepEqual(A.records(S.decodeSave(S.encodeSave(snap)).snapshot.state),A.records(s));
s.features.warpTraversed=[from];const tiles=[{id:from,x:0,y:0},{id:to,x:100,y:0}];a.equal(A.curves(s,tiles).length,1);a.equal(A.curves(s,tiles.slice(0,1)).length,0);a.equal(A.curves(s,[...tiles,{id:99,x:100,y:0,wall:true}]).length,0);a.equal(A.curves(s,[...tiles,{id:to,x:500,y:0}])[0].b.x,100);
s.features.warpTraversed=[from,to];a.equal(A.curves(s,tiles).length,2);a.equal(A.endpoints(s).size,2);let strokes=0,saves=0;const ctx={save(){saves++},restore(){saves--},beginPath(){},moveTo(){},lineTo(){},quadraticCurveTo(){},stroke(){strokes++}};a.equal(A.draw(ctx,s,tiles,24),2);a.equal(strokes,4);a.equal(saves,0);
console.log('Triple warp arrows: actual directed traversal, no hidden endpoints, reverse pair, nearest folded image, wall occlusion, canvas drawing and save restoration.');

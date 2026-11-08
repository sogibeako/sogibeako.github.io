const assert=require('node:assert/strict'),H=require('./lattice-holes.js'),S=require('./connection-space.js'),Save=require('./lattice-holes-save.js'),O=require('./lattice-holes-options.js');
const preset={maze:true,periodSize:20,growth:'growing',wallStyle:'grid',shiftX:2,shiftY:-2,seed:'return-test-2',holeRimWalls:true,returnPocket:true};
let tested=0,failed=0;
for(const growth of ['walls','dfs','prim','growing'])for(const underpasses of [0,3])for(let seed=0;seed<10;seed++){
 let st;try{st=H.create({...preset,growth,seed:'return-test-'+seed,underpasses,underpassShape:'mixed'});}catch(e){assert.match(e.message,/出口ポケット/);failed++;continue;}
 assert(H.verifyReturnPocket(st.world));assert.equal(O.applied(st.world,'next').returnPocket,true);
 for(const r of st.world.guaranteedLoops){let at=r.start;for(const d of r.directions){const e=st.world.edges.get(`${at}:${d}`);assert(e);at=e.to;}assert.equal(at,r.start);}
 const q=[st.id],parents=new Map([[st.id,null]]);for(const id of q)for(let d=0;d<4;d++){const e=st.world.edges.get(`${id}:${d}`);if(e&&!parents.has(e.to)){parents.set(e.to,{id,d});q.push(e.to);}}
 const path=[];for(let id=st.world.exit;id!==st.world.start;){const p=parents.get(id);assert(p);path.unshift(p.d);id=p.id;}
 let swaps=0,sheet=0;for(const d of path){S.move(st,st.frame.indexOf(d));const next=S.groundSheet(st.world,st.id);if(next!==sheet){swaps++;sheet=next;}}
 assert.equal(st.id,st.world.exit);assert.equal(sheet,0);assert(swaps>=2);
 const restored=Save.decode(Save.encode({state:st,book:{charts:[],active:-1},journey:{number:1,steps:0},controls:{}})).snapshot.state;assert(H.verifyReturnPocket(restored.world));assert.equal(restored.id,restored.world.exit);tested++;
}
assert(tested>=10);assert(failed>0);const st=H.create(preset);assert(H.verifyReturnPocket(st.world));const normal=H.create({...preset,returnPocket:false});assert.equal(S.groundSheet(normal.world,normal.world.exit),1);
console.log(`${tested} return-pocket worlds verified and walked A→B→A, with save round trips and winding loops; ${failed} unavailable layouts safely rejected; preset verified.`);

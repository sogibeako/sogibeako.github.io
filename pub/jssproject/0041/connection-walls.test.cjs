const assert=require('node:assert/strict'),S=require('./connection-space.js');
const frames=[];for(let r=0;r<4;r++){frames.push([0,1,2,3].map(d=>(d+r)%4));frames.push([0,3,2,1].map(d=>(d+r)%4));}
let checked=0;
for(const mode of Object.keys(S.names)){
 const state=S.create(mode,{walls:true}),w=state.world;
 assert(w.cells.some(c=>!c),`${mode}: obstacles`);
 const reachable=new Set([w.start]),queue=[w.start];for(const id of queue)for(let d=0;d<4;d++){const e=w.edges.get(`${id}:${d}`);if(e&&!reachable.has(e.to)){reachable.add(e.to);queue.push(e.to);}}
 assert.equal(reachable.size,w.cells.reduce((a,b)=>a+b,0),`${mode}: all floors remain connected`);
 for(let id=0;id<w.cells.length;id++)if(w.cells[id])for(const frame of frames){
  Object.assign(state,{id,frame});const before=JSON.stringify(state),view=S.nearestView(state);assert.equal(JSON.stringify(state),before);
  for(let d=0;d<4;d++){
   const [x,y]=S.directions[d],tile=view.find(p=>p.x===x&&p.y===y),edge=w.edges.get(`${id}:${frame[d]}`);
   assert(tile,`${mode}: adjacent cell visible`);assert.equal(tile.wall,!edge,`${mode} ${id} ${frame} ${d}: adjacent wall agrees with movement`);
   const copy={...state,frame:[...frame],history:[...state.history]};assert.equal(S.move(copy,d),Boolean(edge));
   if(edge)assert.equal(copy.id,tile.id);else assert.equal(JSON.stringify(copy),before);
   checked++;
  }
 }
}
// A wall blocks forward expansion; the void boundary is also a wall.
const p=S.create('plane',{walls:true});p.id=17;
assert(S.nearestView(p,2).find(t=>t.x===1&&t.y===0).wall);
assert(!S.nearestView(p,2).some(t=>t.x===2&&t.y===0));
p.id=0;assert(S.nearestView(p).find(t=>t.x===0&&t.y===-1).wall);
console.log(`Wall previews: ${checked} adjacent moves checked across ${Object.keys(S.names).length} spaces and 8 frames; connectivity, blocked expansion, and purity passed`);

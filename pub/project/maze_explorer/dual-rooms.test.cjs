const assert=require('node:assert/strict'),M=require('./core.js');
let cases=0,reduced=0,small=0,wrapped=0;
for(const [width,height] of [[8,8],[8,100],[100,8],[30,22],[100,100]])
for(const roomCount of [2,8,24]) for(const [shiftX,shiftY] of [[2,2],[-2,2],[2,-2],[width-2,height-2]])
for(const seed of ['rooms','部屋']) {
  const options={topology:'torus',algorithm:'rooms',width,height,shiftX,shiftY,roomCount,seed};
  const w=M.generate(options),extra=M.generate({...options,loops:30});
  assert.deepEqual(w,M.generate(options));assert.deepEqual(w.rooms,extra.rooms);
  assert.deepEqual(w.connections,extra.connections.filter(e=>e.kind!=='extra'));
  assert.ok(w.rooms.length>=1&&w.rooms.length<=roomCount);
  if(w.rooms.length<roomCount)reduced++;
  const occupied=new Set(),roomIds=[];
  for(const r of w.rooms) {
    assert.ok(r.w>=2&&r.h>=2&&r.w<=9&&r.h<=9);if(r.w<3||r.h<3)small++;
    const ids=new Set();
    for(let dy=0;dy<r.h;dy++)for(let dx=0;dx<r.w;dx++) {
      const id=M.periodicId(w,r.x+dx,r.y+dy);
      assert.ok(w.domain[id]);assert.equal(w.cells[id],1);assert.ok(!occupied.has(id));assert.ok(!ids.has(id));ids.add(id);
      if(id!==(r.y+dy)*w.width+r.x+dx)wrapped++;
    }
    assert.ok(ids.has(r.cy*w.width+r.cx));roomIds.push(ids);for(const id of ids)occupied.add(id);
  }
  // Room interiors do not touch each other even across either periodic seam.
  for(let i=0;i<roomIds.length;i++)for(const id of roomIds[i])for(const [dx,dy] of Object.values(M.DIRS)) {
    const n=M.periodicId(w,id%w.width+dx,Math.floor(id/w.width)+dy);
    for(let j=i+1;j<roomIds.length;j++)assert.ok(!roomIds[j].has(n));
  }
  for(const e of w.connections) {
    assert.equal(e.path[0],w.rooms[e.a].cy*w.width+w.rooms[e.a].cx);
    assert.equal(e.path.at(-1),w.rooms[e.b].cy*w.width+w.rooms[e.b].cx);
    for(let i=1;i<e.path.length;i++)assert.ok(Object.keys(M.DIRS).some(d=>M.transition(w,{world_position:e.path[i-1]},d)?.to===e.path[i]));
  }
  w.cells.forEach((floor,id)=>{if(floor)assert.equal(extra.cells[id],1);if(!w.domain[id])assert.equal(floor,0);});
  assert.equal(w.validation.topology.index,1);assert.equal(w.validation.reachable,w.validation.floors);
  cases++;
}
assert.ok(reduced&&small&&wrapped);
console.log(`PASS: ${cases} dual-shift BSP worlds; nonoverlapping rooms, seam separation, corridor continuity, reproducibility, stable base layout (${reduced} reduced counts, ${small} small rooms, ${wrapped} wrapped room cells).`);

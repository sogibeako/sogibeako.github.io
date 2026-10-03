const assert=require('node:assert/strict'),M=require('./core.js');
let cases=0;
for(const [width,height] of [[8,8],[30,22],[100,100]])
for(const shifts of [null,[0,0],[0,2],[-2,0],[2,2],[-2,2],[width-2,height-2]])
for(const roomCount of [2,8,24]) for(const roomPlacement of ['bsp','scatter','grid']) {
  const base={algorithm:'rooms',roomPlacement,width:width+!shifts,height:height+!shifts,topology:shifts?'torus':'plane',shiftX:shifts?.[0]||0,shiftY:shifts?.[1]||0,seed:'room-styles',roomCount};
  const layout=M.generate(base).rooms;
  for(const connectionStyle of ['tree','chain','ring','hub']) {
    const options={...base,connectionStyle},w=M.generate(options),extra=M.generate({...options,loops:30});
    assert.deepEqual(w,M.generate(options));assert.deepEqual(w.rooms,layout);
    assert.deepEqual(w.connections,extra.connections.filter(e=>e.kind!=='extra'));
    if(roomPlacement!=='bsp') {
      const owners=new Map();
      for(const r of w.rooms) {
        assert.ok(r.w >= (w.lattice?2:3) && r.h >= (w.lattice?2:3));
        for(let y=0;y<r.h;y++)for(let x=0;x<r.w;x++) {
          const id=M.periodicId(w,r.x+x,r.y+y);
          assert.ok(!owners.has(id),'rooms must not overlap or identify with themselves');
          owners.set(id,r.id);assert.equal(w.cells[id],1);
          if(!shifts)assert.ok(id%w.width>0 && id%w.width<w.width-1 && Math.floor(id/w.width)>0 && Math.floor(id/w.width)<w.height-1);
        }
      }
      for(const [id,owner] of owners)for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++) {
        const other=owners.get(M.periodicId(w,id%w.width+dx,Math.floor(id/w.width)+dy));
        assert.ok(other===undefined||other===owner,'rooms must have a separator even at seams');
      }
    }
    const tree=w.connections.filter(e=>e.kind==='tree'),n=w.rooms.length;
    assert.equal(tree.length,n-1);
    const reached=new Set([0]);
    for(let i=0;i<n;i++)for(const e of tree)if(reached.has(e.a)||reached.has(e.b)){reached.add(e.a);reached.add(e.b);}
    assert.equal(reached.size,n);
    if(connectionStyle==='hub')assert.ok(tree.every(e=>e.a===0));
    if(['chain','ring'].includes(connectionStyle))assert.ok(tree.every(e=>e.b===e.a+1));
    const rings=w.connections.filter(e=>e.kind==='ring');
    assert.equal(rings.length,connectionStyle==='ring'&&n>=3?1:0);
    if(rings.length){assert.equal(rings[0].a,0);assert.equal(rings[0].b,n-1);}
    for(const e of w.connections){
      assert.equal(e.path[0],w.rooms[e.a].cy*w.width+w.rooms[e.a].cx);
      assert.equal(e.path.at(-1),w.rooms[e.b].cy*w.width+w.rooms[e.b].cx);
      for(let i=1;i<e.path.length;i++)assert.ok(Object.keys(M.DIRS).some(d=>M.transition(w,{world_position:e.path[i-1]},d)?.to===e.path[i]));
    }
    assert.equal(w.validation.reachable,w.validation.floors);
    if(shifts)assert.equal(w.validation.topology.index,1);
    w.cells.forEach((v,i)=>{if(v)assert.equal(extra.cells[i],1);});
    cases++;
  }
}
assert.throws(()=>M.generate({algorithm:'rooms',connectionStyle:'invalid'}),/つなぎ方/);
console.log(`PASS: ${cases} room connection plans; layout stability, connectivity, ring/hub structure, corridor continuity, full winding lattice, reproducibility.`);

assert.throws(()=>M.generate({algorithm:'rooms',roomPlacement:'invalid'}),/配置方式/);

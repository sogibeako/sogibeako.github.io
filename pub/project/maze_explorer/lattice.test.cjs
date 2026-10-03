const assert=require('node:assert/strict'),L=require('./lattice.js');
const key=p=>`${p.x},${p.y}`;
let cases=0;
for(const [width,height] of [[8,8],[8,24],[24,8],[24,24]])
for(const shiftX of [-width+2,-2,0,2,width-2]) for(const shiftY of [-height+2,-2,0,2,height-2]) {
  const w=L.create({width,height,shiftX,shiftY}), cells=L.cells(w), ids=new Set(cells.map(key));
  assert.equal(ids.size,w.determinant);assert.equal(cells.length,w.determinant);
  for(const p of cells){
    const c=L.canonical(w,p.x,p.y);assert.equal(key(c),key(p));assert.equal(c.a,0);assert.equal(c.b,0);
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const n=L.canonical(w,p.x+dx,p.y+dy);assert.ok(ids.has(key(n)));
      assert.equal(key(L.canonical(w,n.x-dx,n.y-dy)),key(p),'inverse movement');
    }
    const right=L.canonical(w,p.x+1,p.y),down=L.canonical(w,p.x,p.y+1);
    assert.equal(key(L.canonical(w,right.x,right.y+1)),key(L.canonical(w,down.x+1,down.y)),'corner order commutes');
  }
  const seen=new Set([key(cells[0])]),queue=[cells[0]];
  for(let i=0;i<queue.length;i++) for(const [dx,dy] of [[1,0],[0,1]]) {
    const n=L.canonical(w,queue[i].x+dx,queue[i].y+dy);if(!seen.has(key(n))){seen.add(key(n));queue.push(n);}
  }
  assert.equal(seen.size,w.determinant,'all representatives reachable');
  for(const [x,y] of [[0,0],[-51,39],[101,-200]]) for(const [a,b] of [[-3,2],[1,1],[0,-2]]) {
    const p=L.canonical(w,x,y),q=L.canonical(w,x+a*w.a[0]+b*w.b[0],y+a*w.a[1]+b*w.b[1]);assert.equal(key(p),key(q));
    // Independent integer-lattice membership via inverse matrix numerators.
    const dx=x-p.x,dy=y-p.y;
    assert.equal(Math.abs((height*dx+shiftX*dy)%w.determinant),0);
    assert.equal(Math.abs((shiftY*dx+width*dy)%w.determinant),0);
  }
  cases++;
}
assert.equal(L.cells(L.create()).length,60);
assert.equal(L.cells(L.create({shiftX:-2})).length,68);
assert.equal(L.cells(L.create({shiftX:0})).length,64);
for(const options of [{width:0},{shiftX:8},{shiftY:1},{shiftX:NaN},{height:25}])assert.throws(()=>L.create(options));
console.log(`PASS: ${cases} double-shift lattices; representative counts, periodic equivalence, inverse moves, commuting corners and connectivity.`);

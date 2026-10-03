const assert=require('node:assert/strict'),M=require('./core.js');
let cases=0;
for(const [width,height] of [[9,101],[101,9],[9,9],[31,23],[101,101]])
for(const seed of ['grid','格子','other'])for(const roomCount of [2,8,24]) {
 const w=M.generate({width,height,algorithm:'rooms',roomPlacement:'grid',roomCount,seed});
 const g=w.roomGrid,slots=new Set();
 assert.equal(g.slots,g.columns*g.rows);assert.equal(g.selected,Math.min(roomCount,g.slots));
 assert.equal(w.rooms.length,g.selected);
 for(const r of w.rooms){
  // Locate the containing district using its independently enumerated bounds.
  let found=-1;
  for(let y=0;y<g.rows;y++)for(let x=0;x<g.columns;x++){
   const left=1+Math.floor((width-1)*x/g.columns),top=1+Math.floor((height-1)*y/g.rows);
   const right=Math.floor((width-1)*(x+1)/g.columns),bottom=Math.floor((height-1)*(y+1)/g.rows);
   if(r.x>=left&&r.y>=top&&r.x+r.w<=right&&r.y+r.h<=bottom)found=y*g.columns+x;
  }
  assert.ok(found>=0);assert.ok(!slots.has(found));slots.add(found);
 }
 if(width===31&&height===23&&roomCount===8)assert.ok(g.slots>w.rooms.length,'room for empty districts');
 cases++;
}
console.log(`PASS: ${cases} grid layouts; district containment, unique occupancy, empty districts, thin and small maps.`);

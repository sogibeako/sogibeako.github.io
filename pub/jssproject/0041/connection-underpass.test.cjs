const assert=require('node:assert/strict'),S=require('./connection-space.js');
for(const [id,expected] of [[22,'#.#\n#.#\n#.#'],[58,'#.#\n#.#\n#.#'],[38,'###\n...\n###'],[42,'###\n...\n###']]){
 const s=S.create('underpass');s.id=id;const here=S.position(s.world,id),view=S.nearestView(s,6),rows=[];
 for(let y=3;y<=5;y++){let row='';for(let x=3;x<=5;x++){const p=view.find(p=>p.x===x-here.x&&p.y===y-here.y);assert(p,`visible ${id} ${x},${y}`);row+=p.wall?'#':'.';}rows.push(row);}
 assert.equal(rows.join('\n'),expected);
}
const vertical=S.create('underpass');assert(S.move(vertical,2));assert(S.move(vertical,2));assert.equal(vertical.id,vertical.world.vertical);assert(!S.move(vertical,1));assert(!S.move(vertical,3));assert(S.move(vertical,2));assert.equal(vertical.id,49);assert(S.move(vertical,0));assert(S.move(vertical,0));assert.equal(vertical.id,31);
const horizontal=S.create('underpass');horizontal.id=38;assert(S.move(horizontal,1));assert(S.move(horizontal,1));assert.equal(horizontal.id,horizontal.world.horizontal);assert(!S.move(horizontal,0));assert(!S.move(horizontal,2));assert(S.move(horizontal,1));assert.equal(horizontal.id,41);
for(const [id,axis] of [[11,'vertical'],[19,'horizontal'],[10,'horizontal']]){const s=S.create('underpass');s.id=id;assert.equal(S.underpassAxis(s),axis);}
assert.notEqual(vertical.world.vertical,vertical.world.horizontal);
assert.deepEqual(S.position(vertical.world,vertical.world.vertical),{sheet:1,x:4,y:4});
console.log('Underpass: four 3x3 views, no turning, shared-ground exits, distinct centre cells and nearest-entrance choice passed');

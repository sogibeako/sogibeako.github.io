const a=require('node:assert/strict'),M=require('./core.js'),E=require('./wand-engine.js'),O=require('./main-oob.js');
for(let d=0;d<4;d++){
 const width=8,height=8,cells=new Uint8Array(64).fill(1),x=d===1?7:d===3?0:3,y=d===0?0:d===2?7:3,start=y*8+x,back=(d+2)%4,near=E.next({width,height,wrap:true},start,back),wall=E.next({width,height,wrap:true},near,back);cells[wall]=0;
 const g=M.createGame({width,height,cells,start,exit:18,seed:'oob-'+d,topology:'torus',birdMode:true,validation:{floors:63}});M.enableWands(g);g.bird.position=20;g.bird.cooldown=999;g.wildlife.pets=[];g.wands.held=['push'];g.wands.items=[];g.wands.reflectors=[{from:near,d:back,id:wall,boundary:true}];M.placeMarker(g);
 const marks=[...g.markers],loops=JSON.stringify(g.cognition.loopProgress),memory=[...g.cognition.memory_nodes.keys()],normal=g.player.world_position;
 const preview=M.previewWand(g,'push',back);a.equal(preview.oob,d);a(!g.wands.oob);a(M.castWand(g,'push',back));a.equal(g.wands.oob.direction,d);a.equal(g.player.world_position,normal);a.deepEqual([...g.markers],marks);a.equal(JSON.stringify(g.cognition.loopProgress),loops);a(memory.every(k=>g.cognition.memory_nodes.has(k)));a.equal(M.castWand(g,'push',back),false);
 // The entrance is immediately west of the emergency exit in each room.
 a(M.move(g,'right'));a(M.returnOob(g));a(!O.active(g));a([...g.cognition.visible_cells].some(k=>g.cognition.memory_nodes.get(k)?.world_id===g.player.world_position),'return destination visible immediately');a(g.world.cells[g.player.world_position]);a.deepEqual([...g.markers],marks);a.equal(JSON.stringify(g.cognition.loopProgress),loops);
 // Walking at the mirror is a failed move with a bounce log and no turn consumed.
 g.player.world_position=near;const turn=g.turns;a.equal(M.move(g,Object.keys(M.DIRS)[back]),false);a.equal(g.turns,turn);a.equal(g.wands.events.at(-1).text,'＊ぼよよん＊');
}
// First-step-only escape: reflection is necessary and blocked/occupied seams stay normal.
for(const reflected of [false,true]){const w={width:5,height:1,cells:['.','.','.','.','#'],wrap:true,escape:(id,d)=>id===0&&d===3?3:null,reflect:reflected?(id,d)=>id===1&&d===1?{id:2}:null:undefined,step:(id,d)=>d===1?(id===1?null:id+1):id===0?3:id-1};const actors=[{key:'@',id:0}];const shot=E.cast(w,actors,'@',1,'push');a.equal(shot.oob,reflected?3:undefined);}
console.log('All four main-torus OOB rooms, reflected first-step escape, map/marks/loops retention, safe return and bounce logs passed');

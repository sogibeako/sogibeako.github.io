const assert=require('node:assert/strict'),Q=require('./quarter-turn-maze.js'),S=require('./connection-space.js'),M=require('./quarter-turn-memory.js'),W=require('./maze-wildlife.js');
let outside=0,beyond=0;
for(const mode of ['doubleTwist','quarterCW','quarterCCW','cwTwist','ccwTwist']){
 const state=Q.create(mode,12,'completion'),memory=M.create();memory.complete=true;
 const chart=M.compose(memory,state,S.nearestView(state,6,null,true));
 const far=chart.find(t=>t.revealed&&!t.wall&&t.id!==state.id&&t.seams>0);assert.ok(far,mode);
 W.ensure(state,W.graph(state));state.wildlife.pets=[{kind:'d',id:far.id}];
 assert.equal(W.projectedGlyph(state,far,false,false),null);
 assert.equal(W.projectedGlyph(state,far,true,false),'d');outside++;
 for(const tile of chart.filter(t=>!t.wall&&t.id===far.id)){assert.equal(W.projectedGlyph(state,tile,true,false),'d');if(tile.seams)beyond++;}
 const calls=[],ctx={fillRect(){calls.push(this.fillStyle)}};
 assert.ok(W.paint(ctx,state,far.id,'d',0,0,24,true));assert.equal(calls.at(-1),'#e9aac5');assert.equal(ctx.fillStyle,'#111');
 state.wildlife.pets[0].id=state.id;assert.equal(W.projectedGlyph(state,far,true,false),null);
 state.features={bird:far.id};assert.equal(W.projectedGlyph(state,far,true,false),'V');assert.equal(W.projectedGlyph(state,far,false,false),null);assert.equal(W.projectedGlyph(state,{...far,remembered:false},false,false),'V');assert.ok(W.paint(ctx,state,far.id,'V',0,0,24,true));assert.equal(calls.at(-1),'#e9aac5');
 assert.equal(W.paint(ctx,state,state.id,'@',0,0,24,true),false);
}
console.log({outside,beyond,completedPets:true,noStaleAnimals:true,boundaryPalette:true,playerPriority:true});

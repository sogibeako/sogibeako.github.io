/* Independent open-space trials; never mutate the player's exploration. */
(function(root){
'use strict';
const K=typeof module==='object'?require('./klein-space.js'):root.MazeKlein;
function compare(mode='order'){
 if(!['order','inverse'].includes(mode))throw Error('Unknown comparison');
 const world=K.rasterize(K.generate('klein-comparison','open'));
 const routes=[{label:'右24歩 → 下20歩',legs:[['E',24],['S',20]]},mode==='order'?{label:'下20歩 → 右24歩',legs:[['S',20],['E',24]]}:{label:'上20歩 → 右24歩',legs:[['N',20],['E',24]]}];
 const results=routes.map(route=>{
  const state=K.create(world);
  for(const [direction,count] of route.legs)for(let i=0;i<count;i++)if(!K.move(state,direction,true))throw Error('Comparison route blocked');
  return {label:route.label,id:state.id,column:state.id%world.width+1,row:Math.floor(state.id/world.width)+1,flipped:state.flipped,x:state.x,y:state.y,steps:state.steps,path:K.pathSummary(state)};
 });
 const [a,b]=results;
 return {results,sameCell:a.id===b.id,sameFrame:a.flipped===b.flipped,sameLift:a.x===b.x&&a.y===b.y&&a.flipped===b.flipped};
}
function roundTrip(mode='reverse'){
 if(!['reverse','repeat'].includes(mode))throw Error('Unknown replay mode');
 const state=K.create(K.rasterize(K.generate('klein-round-trip','open'))),frames=[];
 const snapshot=(direction='')=>({step:state.steps,id:state.id,x:state.x,y:state.y,flipped:state.flipped,direction,seam:state.last?.seam||'',path:K.pathSummary(state),interval:state.returnIntervals.length?{...state.returnIntervals.at(-1)}:null});
 frames.push(snapshot());
 // Subjective controls: repeat the same true-world circuit or retrace it.
 const legs=mode==='repeat'?[['E',24],['N',2],['E',24],['S',2]]:[['E',24],['N',2],['S',2],['W',24]];
 for(const [direction,count] of legs)for(let i=0;i<count;i++){
  if(!K.move(state,direction))throw Error('Round trip blocked');frames.push(snapshot(direction));
 }
 return frames;
}
const api={compare,roundTrip};if(typeof module==='object')module.exports=api;else root.MazeKleinComparison=api;
})(typeof globalThis==='object'?globalThis:this);

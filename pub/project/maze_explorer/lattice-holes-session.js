/* DOM-free exploration operations for the skew-hole experiment. */
(function(root){
'use strict';
const S=typeof module==='object'?require('./connection-space.js'):root.ConnectionSpace;
const R=typeof module==='object'?require('./lattice-holes-loops.js'):root.SkewLoops;
function observe(state,book){
 const view=S.nearestView(state,4);
 const observation=S.observeWalkingMap(state,book,view);
 return {view,knowledge:R.knowledge(state),chart:observation.chart,switched:observation.switched};
}
function step(state,book,direction,truth=false){
 R.start(state);
 const moved=S.move(state,direction,truth);
 const loop=moved?R.observe(state,S.groundSheet(state.world,state.id)):null;
 const learned=loop&&loop.count===(state.loopThreshold??3)?loop:null;
 return {...observe(state,book),moved,loop,learned};
}
// Accept an already generated state: generation failure cannot replace the current session.
function begin(next,previous,continuing=false){
 next.foldLoops=previous.state.foldLoops!==false;next.loopThreshold=previous.state.loopThreshold??3;
 return {state:next,book:{charts:[],active:-1},truth:continuing?false:previous.truth,
  journey:continuing?{number:previous.journey.number+1,steps:previous.journey.steps+previous.state.steps}:{number:1,steps:0}};
}
const api={observe,step,begin};if(typeof module==='object')module.exports=api;else root.SkewSession=api;
})(globalThis);

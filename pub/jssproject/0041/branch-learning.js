/* Count completed circuits in physical coordinates, not seam crossings. */
(function(root){'use strict';
const P=typeof module==='object'?require('./crossing-autowalk.js'):root.CrossingAutowalk;
function init(state){return state.branchLearning??=( {turn:0,laps:0,anchors:new Map([[state.id%(state.world.size**2),0]])} );}
function moved(state,from,d){const l=init(state);if(['warp','teleport','wand'].includes(state.last?.kind)){l.anchors=new Map([[state.id%(state.world.size**2),l.turn]]);return;}const e=state.world.edges.get(from+':'+d);if(e?.kind==='branch')l.turn+=d===2?-1:1;const key=state.id%(state.world.size**2),prior=l.anchors.get(key);if(prior!==undefined&&prior!==l.turn){l.laps=Math.min(3,l.laps+Math.abs(l.turn-prior));l.anchors=new Map([[key,l.turn]]);}else if(prior===undefined)l.anchors.set(key,l.turn);}
function pending(state){return Math.max(0,3-init(state).laps);}
function route(state){if(!pending(state))return null;const w=state.world,area=w.size*w.size,here=state.id,sheet=Math.floor(here/area)%w.sheets,anchor=sheet*area+w.start;
 const approach=P.route(state,id=>id===anchor);if(approach===null)return null;return [...approach,...w.branchLoops[sheet]];}
const api={init,moved,pending,route};if(typeof module==='object')module.exports=api;else root.BranchLearning=api;
})(globalThis);

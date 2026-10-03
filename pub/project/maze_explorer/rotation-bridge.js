/* Main-game adapter: storage coordinates stay stable; charts are compared in their recorded frames. */
(function(root){
'use strict';
const M=typeof module==='object'?require('./core.js'):root.MazeCore;
const O=typeof module==='object'?require('./orientation.js'):root.MazeOrientation;
function project(frame,x,y){return O.apply(O.inverse(frame||O.identity()),x,y);}
function nodesInFrame(nodes,frame){return new Map([...nodes.values()].map(n=>{const [x,y]=project(frame,n.x,n.y);return [`${x},${y}`,{...n,x,y}];}));}
function match(game,apply=false){
 const c=game.cognition,f=game.viewFrame;
 const adapter={history:[],chart:{nodes:nodesInFrame(c.memory_nodes,f),matches:new Set(c.matchedArchives)},archives:c.archives.map(a=>({nodes:nodesInFrame(a.nodes,a.viewFrame),matches:new Set(a.sources||[])}))};
 const result=O.matchAll(adapter).matched;
 if(apply&&result.length){
  c.memory_nodes=new Map([...adapter.chart.nodes.values()].map(n=>{const [x,y]=O.apply(f,n.x,n.y);return [`C${x},${y}`,{...n,x,y}];}));
  c.matchedArchives=adapter.chart.matches;
 }
 return result;
}
function enable(game,mode){
 if(mode==='none')return;
 if(!['right','left','half','mirror','mixed'].includes(mode)||(game.world.topology&&game.world.topology!=='plane')||!game.world.warps?.size||!['pair','oneway','cycle3','cycle4'].includes(game.world.warpStyle||'pair'))throw Error('回転・反転ワープは平面ワープで利用できます。');
 const frames=new Map(),groups=game.world.warpGroups||[[...game.world.warps.keys()]];
 groups.forEach((pads,i)=>{const t=O.transforms[mode==='mixed'?['right','mirror','left','half'][i%4]:mode];pads.forEach((pad,j)=>{if(game.world.warps.has(pad))frames.set(pad,(game.world.warpStyle||'pair')==='pair'&&j===1?O.inverse(t):t);});});
 game.world.rotatingWarp=mode;game.viewFrame=O.identity();game.rotationMatcher=match;
 game.afterWarp=(from)=>{const t=frames.get(from);game.viewFrame=O.compose(t,game.viewFrame);game.player.direction=O.direction(O.apply(t,...M.DIRS[game.player.direction]));};
 game.cognition.memory_nodes=new Map([...game.cognition.memory_nodes.values()].map(n=>[`C${n.x},${n.y}`,n]));
 game.player.perceived_position=`C${game.player.perceived_x},${game.player.perceived_y}`;M.observe(game);
}
function input(game,direction,truth){return truth||!game.viewFrame?direction:O.direction(O.apply(game.viewFrame,...M.DIRS[direction]));}
const api={enable,input,project,match};if(typeof module==='object')module.exports=api;else root.MazeRotationBridge=api;
})(typeof globalThis!=='undefined'?globalThis:this);

const a=require('node:assert/strict'),P=require('./oob-walk.js');
const g={world:{topology:'torus',width:3,height:3,warps:new Map([[1,2]]),puzzle:{locks:[]}},player:{world_position:0,keys:[]},wands:{held:['push'],items:[]},birds:[],wildlife:{pets:[]}};
const M={DIRS:{up:[0,-1],right:[1,0],down:[0,1],left:[-1,0]},wildlifeAdapter:s=>({player:s.player.world_position}),ruleTransition:(w,p,d)=>p.world_position===0&&d==='right'?{to:1}:null,previewWand:s=>({target:'@',oob:s.player.world_position===2&&!s.birds.length?1:null})};
a.deepEqual(P.plan(g,M),{path:['right']},'navigate to actual warp landing');
g.player.world_position=2;g.birds=[{position:1}];a.deepEqual(P.plan(g,M),{wait:true,blocked:true});g.birds=[];a.equal(P.plan(g,M).cast,0);
g.player.world_position=0;g.wands.held=[];g.world.warps.clear();g.world.puzzle.locks=[{key:1,keyId:'A',door:2}];a.deepEqual(P.plan(g,M),{path:['right']},'collect a reachable key before rejecting locked areas');g.player.keys=['A'];a.equal(P.plan(g,M),null);
console.log('Main planner: warp destination, temporary obstruction, cleared shot, key fallback passed');

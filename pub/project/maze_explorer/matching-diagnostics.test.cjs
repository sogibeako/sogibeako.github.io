const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),M=require('./core.js');
const n=(id,x,feature='')=>({world_id:id,x,y:2,terrain:1,feature});
const chart=(nodes,width)=>new Map(nodes.map(n=>['C'+(n.y*width+n.x),n]));
function make(live,saved){const g=M.createGame(M.createWarpDemo());g.cognition.memory_nodes=chart(live,g.world.width);g.cognition.archives=saved.map(nodes=>({nodes:chart(nodes,g.world.width)}));return g;}
const snapshot=g=>JSON.stringify(g,(_,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v);
function inspect(g,reasons,matches=[]){const before=snapshot(g),result=M.inspectRecordedMatching(g);assert.deepEqual(result,{matches,reasons});assert.equal(snapshot(g),before);assert.deepEqual(result.matches,M.matchRecordedMaps(g));return result;}
const g=make([n(20,0,'1')],[[n(22,4,'2')],[n(20,10,'1'),n(22,12,'2')],[n(25,4)]]);
inspect(g,['ready','ready','no-common'],[1,0]);M.matchRecordedMaps(g,true);inspect(g,['matched','matched','no-common']);
inspect(make([n(20,0,'1')],[[n(20,10,'1'),n(20,12,'1')]]),['ambiguous']);
inspect(make([n(20,0,'1'),n(22,2,'2')],[[n(20,10,'1'),n(22,15,'2')]]),['offset']);
inspect(make([n(20,0,'1'),n(21,1)],[[n(20,10,'1'),n(22,11)]]),['terrain']);
const warp=make([n(20,0,'0')],[[n(20,10,'0')]]);warp.warpArrows=[{from:20,to:21,status:'hypothesis'}];inspect(warp,['no-common']);warp.warpArrows[0].status='confirmed';inspect(warp,['ready'],[0]);warp.warpArrows=[];inspect(warp,['no-common']);
const rotated=make([n(20,0,'1')],[[n(20,10,'1')],[n(22,12,'2')]]);rotated.rotationMatcher=()=>[0];inspect(rotated,['ready','orientation'],[0]);
const disabled=make([],[[n(20,0)]]);disabled.world.separateMaps=false;inspect(disabled,['disabled']);
const src=fs.readFileSync(__dirname+'/app.js','utf8'),ctx={};vm.runInNewContext(src.slice(src.indexOf('function recordedMatchExplanation('),src.indexOf('function renderArchive(')),ctx);
for(const reason of ['ready','matched','no-common','ambiguous','offset','terrain','orientation','disabled'])assert(ctx.recordedMatchExplanation(reason).length>10);
console.log('PASS: chain-aware diagnostics match existing decisions, stay read-only, distinguish missing/ambiguous/conflicting anchors and terrain, respect confirmed-only evidence and rotation uncertainty.');

// Exercise the real orientation adapter, not only the fallback matcher.
const R=require('./rotation-bridge.js');
function rotatedFixture(live,archives){
 const g=M.createGame(M.createWarpDemo());R.enable(g,'right');
 g.cognition.memory_nodes=new Map(live.map(n=>[`C${n.x},${n.y}`,n]));
 g.cognition.archives=archives.map(nodes=>({nodes:new Map(nodes.map(n=>[`C${n.x},${n.y}`,n])),viewFrame:[1,0,0,1]}));
 return g;
}
const anchor={world_id:20,x:0,y:0,feature:'1',terrain:1};
inspect(rotatedFixture([anchor],[[anchor]]),['orientation-multiple']);
inspect(rotatedFixture([anchor],[[{...anchor,feature:''}]]),['no-common']);
inspect(rotatedFixture([anchor],[[anchor,{...anchor,x:2}]]),['orientation-anchors']);
inspect(rotatedFixture([anchor],[[{...anchor,terrain:0}]]),['orientation-conflict']);
const unique=[anchor,{world_id:21,x:2,y:0,feature:'2',terrain:1},{world_id:22,x:0,y:3,feature:'3',terrain:1}];
const bridge=rotatedFixture(unique,[[{world_id:23,x:4,y:4,feature:'4',terrain:1}],[...unique,{world_id:23,x:4,y:4,feature:'4',terrain:1}]]);
// The bridge gives the first archive a common landmark, but not a unique orientation.
inspect(bridge,['orientation-multiple','ready'],[1]);
M.matchRecordedMaps(bridge,true);inspect(bridge,['orientation-multiple','matched']);
for(const reason of ['orientation-multiple','orientation-anchors','orientation-conflict'])assert(ctx.recordedMatchExplanation(reason).length>10);
console.log('PASS: real rotation adapter distinguishes symmetry, absent/duplicated anchors and incompatible observations; bridge evidence updates the final reason without applying the preview.');

// Originals included in an integrated chart share its current/predicted connection.
const inherited=make([n(20,0,'1')],[[n(25,6)],[],[n(20,10,'1'),n(25,16)],[n(30,8)]]);
inherited.cognition.archives[1].sources=[0];inherited.cognition.archives[2].sources=[1];
inspect(inherited,['ready','ready','ready','no-common'],[2]);
M.matchRecordedMaps(inherited,true);
inspect(inherited,['matched','matched','matched','no-common']);
assert.deepEqual([...inherited.cognition.matchedArchives],[2],'diagnosis must not insert inherited sources into saved state');
const linkedCount=M.archiveGroups(inherited).filter(group=>group.live).flatMap(group=>group.members).length;
assert.equal(M.inspectRecordedMatching(inherited).reasons.filter(r=>r==='matched').length,linkedCount);
// Knowing an old source does not prove the position of a later snapshot.
inherited.cognition.matchedArchives=new Set([0]);inherited.cognition.memory_nodes=chart([],inherited.world.width);
inspect(inherited,['matched','no-common','no-common','no-common']);
// Invalid forward source links must not make unobserved later records connected.
inherited.cognition.archives[0].sources=[3,999,-1];
inspect(inherited,['matched','no-common','no-common','no-common']);
console.log('PASS: nested source originals share ready/matched status with their container, counts agree with atlas groups, no reverse/forward inference and no save-state changes.');

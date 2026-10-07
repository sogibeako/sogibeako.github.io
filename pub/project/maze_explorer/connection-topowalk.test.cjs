const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),S=require('./connection-space.js');
const source=fs.readFileSync(path.join(__dirname,'../../jssproject/0015_topowalk.htm'),'utf8');
const section=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
const context=vm.createContext({});
vm.runInContext(`const DIRS=['N','E','S','W']; const DIR_DELTAS={N:{dx:0,dy:-1},E:{dx:1,dy:0},S:{dx:0,dy:1},W:{dx:-1,dy:0}}; ${section('function rotateDir(', 'function makeNodeId(')} ${section('class QuarterTurnTopology {','class WorldNode {')} ${section('class TwistedLoopTopology {','class PlaneTopology {')} globalThis.original={cw:new QuarterTurnTopology({turn:'clockwise',twist:true}),ccw:new QuarterTurnTopology({turn:'counterclockwise',twist:true}),double:new TwistedLoopTopology({twistX:true,twistY:true})};`,context);
for(const [mode,name] of [['cwTwist','cw'],['ccwTwist','ccw'],['doubleTwist','double']]){
 const w=S.generate(mode),original=context.original[name];
 for(let id=0;id<64;id++)if(w.cells[id])for(let d=0;d<4;d++){
  const expected=original.resolveStep(id%8,Math.floor(id/8),['N','E','S','W'][d],original.initialState(),8,8),actual=w.candidates.get(`${id}:${d}`);
  assert.equal(actual.to,expected.y*8+expected.x);
  const t=expected.topoState,frame=[0,1,2,3].map(n=>name==='double'?(t.flipX&&n%2?(4-n)%4:t.flipY&&n%2===0?(2-n+4)%4:n):(n+t.rot)%4);
  assert.deepEqual(actual.transform,frame);assert.equal(w.edges.has(`${id}:${d}`),Boolean(w.cells[actual.to]));
 }
}
// Near floor vs distant wall, and same-distance wall priority.
const edge=to=>({to,transform:[0,1,2,3]}),candidates=new Map([['0:0',edge(1)],['0:1',edge(2)],['1:1',edge(3)],['3:2',edge(4)]]);
let s={id:0,frame:[0,1,2,3],world:{cells:[1,1,1,1,0],candidates,edges:candidates}};
assert.equal(S.candidateView(s).find(p=>p.x===1&&p.y===0).wall,true);
assert.equal(S.nearestView(s).find(p=>p.x===1&&p.y===0).wall,false);
s={...s,world:{...s.world,cells:[1,1,1,0,1],candidates:new Map([['0:0',edge(1)],['0:1',edge(2)],['1:1',edge(3)],['2:0',edge(4)]])}};
assert.equal(S.nearestView(s).find(p=>p.x===1&&p.y===-1).wall,true);
assert.throws(()=>S.nearestView(s,100));
for(const mode of ['chaos','double','cwTwist','ccwTwist','doubleTwist']){
 const p=S.create(mode),before=JSON.stringify(p);const a=S.nearestView(p);assert.equal(JSON.stringify(p),before);assert.deepEqual(S.nearestView(p),a);assert(a.some(c=>c.x===0&&c.y===0&&c.selfCandidate&&!c.wall));
}
console.log('Topowalk original classes: all twist destinations and frames match; nearest floor and equal-distance wall priority passed');

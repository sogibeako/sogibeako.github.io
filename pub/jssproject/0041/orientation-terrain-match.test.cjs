const assert=require('node:assert/strict'),O=require('./orientation.js'),M=require('./core.js');
const chart=nodes=>({nodes:new Map(nodes.map(n=>[`${n.x},${n.y}`,n]))});
const snap=s=>JSON.stringify(s,(_,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v);
const w=O.create('right',{layout:'dfs',warpCount:2,seed:'walk-o26cwzv2'}).game.world;
let checked=0,ready=0,rotation=O.identity();
for(let r=0;r<4;r++){
 for(const mirror of [false,true])for(const pad of w.warps.keys()){
  const transform=mirror?O.compose(rotation,O.transforms.mirror):rotation,raw=[];
  const px=pad%w.width,py=Math.floor(pad/w.width);
  const observers=[pad],seen=new Set(observers);
  for(let step=0;step<observers.length;step++)for(const d of Object.keys(M.DIRS)){
   const e=M.transition(w,{world_position:observers[step]},d);
   if(e&&!seen.has(e.to)&&Math.abs(e.to%w.width-px)+Math.abs(Math.floor(e.to/w.width)-py)<=8){seen.add(e.to);observers.push(e.to);}
  }
  const observed=new Set();
  for(const origin of observers)for(let dy=-5;dy<=5;dy++)for(let dx=-5;dx<=5;dx++){
   const wx=origin%w.width+dx,wy=Math.floor(origin/w.width)+dy,id=wy*w.width+wx;
   if(wx<0||wy<0||wx>=w.width||wy>=w.height||dx*dx+dy*dy>25||!M.lineOfSight(w,origin,id))continue;
   observed.add(id);
  }
  for(const id of observed){const x=id%w.width-px,y=Math.floor(id/w.width)-py;raw.push({x,y,terrain:w.cells[id],feature:'',seenAt:1});}
  const anchor=raw.find(n=>{const id=(py+n.y)*w.width+px+n.x;return n.terrain&&!w.warps.has(id)&&id!==w.start&&id!==w.exit;});assert.ok(anchor);anchor.feature='1';
  const s=O.create();s.archives=[chart(raw)];s.chart.nodes=chart(raw.map(n=>{const [x,y]=O.apply(transform,n.x,n.y);return {...n,x:x+11,y:y-9};})).nodes;
  const before=snap(s),result=O.inspectMatch(s,0);assert.equal(snap(s),before);assert.notEqual(result.status,'conflict');checked++;
  if(result.status==='ready'){
   ready++;const expected=snap(s.chart.nodes);O.matchArchive(s,0);assert.equal(snap(s.chart.nodes),expected);
  }
 }
 rotation=O.compose(O.transforms.right,rotation);
}
assert.ok(ready>0);console.log(`PASS: reported seed, ${ready}/${checked} one-landmark rotated/reflected observation patches uniquely matched; remaining symmetry withheld, immutable reads and exact merge.`);
// Symmetric terrain cannot manufacture orientation evidence.
const s=O.create(),raw=[{x:0,y:0,terrain:1,feature:'1'},...[[1,0],[-1,0],[0,1],[0,-1]].map(([x,y])=>({x,y,terrain:0,feature:''}))];
s.archives=[chart(raw)];s.chart.nodes=chart(raw).nodes;assert.equal(O.inspectMatch(s,0).candidates.length,8);
s.archives[0].nodes.get('0,0').feature='';assert.equal(O.inspectMatch(s,0).status,'no-landmarks');
console.log('PASS: symmetric observations remain ambiguous; shape alone does not invent a shared landmark.');

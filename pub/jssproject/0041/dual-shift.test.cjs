const assert=require('node:assert/strict'),M=require('./core.js');
const mod=(n,d)=>(n%d+d)%d, gcd=(a,b)=>b?gcd(b,a%b):a;
const inverse={up:'down',down:'up',left:'right',right:'left'};
let cases=0;
for(const algorithm of ['wilson','rooms','dfs','prim','growing','kruskal','hunt'])
for(const [width,height] of [[8,8],[16,10],[8,24],[24,8]])
for(const [shiftX,shiftY] of [[2,2],[-2,2],[2,-2],[-2,-2],[width-2,height-2]]) {
  const options={topology:'torus',algorithm,width,height,shiftX,shiftY,seed:'二方向',loopLearning:true,learningLaps:3};
  const w=M.generate(options),D=width*height-shiftX*shiftY;
  assert.deepEqual(w,M.generate(options));assert.equal(w.domain.reduce((a,b)=>a+b,0),D);
  // Independent residue classes from the adjugate matrix, no canonicalization.
  const residue=(x,y)=>`${mod(height*x+shiftX*y,D)},${mod(shiftY*x+width*y,D)}`;
  const ids=new Map();
  for(let id=0;id<w.cells.length;id++) {
    if(!w.domain[id]) {assert.equal(w.cells[id],0);continue;}
    const key=residue(id%w.width,Math.floor(id/w.width));assert.ok(!ids.has(key));ids.set(key,id);
  }
  const lifts=new Map([[w.start,[0,0]]]),queue=[w.start],parent=new Map(),cycles=new Map();
  for(let i=0;i<queue.length;i++) {
    const from=queue[i],x=from%w.width,y=Math.floor(from/w.width),[lx,ly]=lifts.get(from);
    for(const [dir,[dx,dy]] of Object.entries(M.DIRS)) {
      const expected=ids.get(residue(x+dx,y+dy)),edge=M.transition(w,{world_position:from,orientation:1,sheet:0},dir);
      assert.notEqual(expected,undefined);assert.equal(M.periodicId(w,x+dx,y+dy),expected);
      if(!w.cells[expected]){assert.equal(edge,null);continue;}
      assert.equal(edge.to,expected);assert.equal(edge.direction,dir);assert.equal(edge.orientation,1);
      assert.equal(M.transition(w,{world_position:expected},inverse[dir]).to,from);
      if(!lifts.has(expected)){lifts.set(expected,[lx+dx,ly+dy]);parent.set(expected,[from,dir]);queue.push(expected);}
      else {
        const [px,py]=lifts.get(expected),ux=lx+dx-px,uy=ly+dy-py;
        const a=(height*ux+shiftX*uy)/D,b=(shiftY*ux+width*uy)/D;
        assert.ok(Number.isInteger(a)&&Number.isInteger(b));if(a||b)cycles.set(`${a},${b}`,[a,b]);
      }
    }
  }
  assert.equal(lifts.size,w.validation.floors);
  let index=0;for(const [a,b] of cycles.values())for(const [c,d] of cycles.values())index=gcd(index,Math.abs(a*d-b*c));
  assert.equal(index,1);
  const path=[];for(let id=w.exit;id!==w.start;){const [from,dir]=parent.get(id);path.unshift(dir);id=from;}
  const game=M.createGame(w);
  for(const dir of path){assert.ok(M.move(game,dir));assert.equal(M.periodicId(w,game.player.perceived_x,game.player.perceived_y),game.player.world_position);}
  assert.ok(game.won);
  for(const n of game.cognition.memory_nodes.values())assert.equal(M.periodicId(w,n.x,n.y),n.world_id);
  const extra=M.generate({...options,loops:30});w.cells.forEach((v,i)=>{if(v)assert.equal(extra.cells[i],1);});
  cases++;
}
for(const [shiftX,shiftY] of [[2,2],[-2,2],[2,-2],[-2,-2],[6,6]]) {
  const w=M.createTorusDemo({shiftX,shiftY,loopLearning:true,learningLaps:3});
  const g=M.createGame(w),start=g.player.world_position;
  const walk=(dir,n)=>{for(let i=0;i<n;i++)assert.ok(M.move(g,dir));};
  for(let lap=0;lap<3;lap++){walk('right',8);walk(shiftY>0?'up':'down',Math.abs(shiftY));assert.equal(g.player.world_position,start);}
  assert.ok(g.cognition.known_loops.has('x'));assert.ok(!g.cognition.known_loops.has('y'));
  assert.deepEqual(M.cognitivePosition(g,0,0),M.cognitivePosition(g,8,-shiftY));
  assert.notDeepEqual(M.cognitivePosition(g,0,0),M.cognitivePosition(g,-shiftX,8));
  const optic=M.createGame({...w,selfVision:true});
  for(let a=-12;a<=12;a++)for(let b=-12;b<=12;b++) {
    const [dx,dy]=M.deckVector(w,a,b);if(!(a||b)||Math.hypot(dx,dy)>12)continue;
    assert.ok(optic.cognition.self_images.some(n=>n.winding[0]===a&&n.winding[1]===b));
  }
  assert.ok(M.knowledgeSummary(optic).complete);
  for(const image of optic.cognition.self_images) {
    assert.equal(M.periodicId(w,image.x,image.y),optic.player.world_position);
    const segments=M.selfRaySegments(optic,image,'truth');
    for(const s of segments){assert.ok(s.from.x>=-.5&&s.from.x<=w.width-.5);assert.ok(s.from.y>=-.5&&s.from.y<=w.height-.5);}
  }
  assert.equal(M.knowledgeSummary(M.createGame(w)).rank,0);
}
console.log(`PASS: ${cases} dual-shift mazes; independent residue graph, area, complete winding lattice, inverse moves, playthrough, memory, partial learning, self-images and rays.`);

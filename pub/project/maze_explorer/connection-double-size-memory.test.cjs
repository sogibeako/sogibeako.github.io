const assert=require('node:assert/strict'),S=require('./connection-space.js');
for(const dimensions of [[[8,8],[10,12]],[[12,16],[20,10]],[[24,24],[16,20]]])for(const growth of ['walls','dfs','prim','growing'])for(const holeSize of [1,Math.min(...dimensions.flat())-4]){
 const opts={dimensions,growth,holeSize,seed:'sizes'},st=S.create('doubleMaze',opts),w=st.world;
 assert.deepEqual(w.layouts.map(l=>[l.width,l.height]),dimensions);assert.equal(w.holes.size,2*holeSize*holeSize);
 const queue=[w.start],parents=new Map([[w.start,null]]);for(const id of queue)for(let d=0;d<4;d++){const e=w.edges.get(`${id}:${d}`);if(e&&!parents.has(e.to)){parents.set(e.to,[id,d]);queue.push(e.to);}}
 assert.equal(queue.length,w.cells.reduce((a,b)=>a+b,0));assert(parents.has(w.exit));
 for(const {sheet,horizontal,vertical} of w.guaranteedLoops)for(const path of [horizontal,vertical]){let id=path.start;for(const d of path.directions){id=w.edges.get(`${id}:${d}`).to;assert.equal(S.position(w,id).sheet,sheet);}assert.equal(id,path.start);}
 const book={charts:[],active:-1},memory=new Set();S.observeWalkingMap(st,book);S.observeAtlas(st,memory);const first=book.charts[0],remembered=new Map(first.cells),initial=new Set(memory),path=[];
 for(let id=w.exit;id!==w.start;){const [from,d]=parents.get(id);path.unshift(d);id=from;}
 for(const d of path){assert(S.move(st,st.frame.indexOf(d)));S.observeWalkingMap(st,book);S.observeAtlas(st,memory);}
 assert.equal(S.position(w,st.id).sheet,1);assert(book.charts.includes(first));for(const key of remembered.keys())assert(first.cells.has(key));for(const id of initial)assert(memory.has(id));
}
assert.throws(()=>S.generate('doubleMaze',{dimensions:[[8,8],[10,10]],holeSize:5}));
console.log('24 variable-size worlds: smallest/largest holes, mixed sheet sizes, connectivity, loops and retained pre-transfer memories passed.');

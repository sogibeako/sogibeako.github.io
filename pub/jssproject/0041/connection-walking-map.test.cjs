const assert=require('node:assert/strict'),S=require('./connection-space.js');
const st=S.create('crossing'),book={charts:[],active:-1},route=[1,1,1,1,2,2,2,3,3,3,0,0,0,0,0,3,3,2,2,1];
S.observeWalkingMap(st,book);
for(let lap=0;lap<4;lap++){for(const d of route){assert(S.move(st,d));const snapshot=book.charts.map(c=>new Map(c.cells));const o=S.observeWalkingMap(st,book);for(let i=0;i<snapshot.length;i++)for(const [key,p] of snapshot[i])assert.equal(book.charts[i].cells.get(key).signature,p.signature);assert(o.chart.cells.has(`${st.x},${st.y}`));}assert.equal(book.charts.length,2);assert.equal(book.active,0);}
const before=JSON.stringify(st),sizes=book.charts.map(c=>c.cells.size);S.observeWalkingMap(st,book);assert.equal(JSON.stringify(st),before);assert.deepEqual(book.charts.map(c=>c.cells.size),sizes);
assert(book.charts.some(c=>[...c.cells.values()].some(p=>!p.wall&&p.id===27)));assert(book.charts.some(c=>[...c.cells.values()].some(p=>!p.wall&&p.id===91)));
const fresh=S.observeWalkingMap(S.create('crossing'));assert.equal(fresh.book.charts.length,1);
console.log('Walking charts: two charts after crossing circuit, reuse over four laps, conflict preserves old observations, persistent memory and fresh reset passed');

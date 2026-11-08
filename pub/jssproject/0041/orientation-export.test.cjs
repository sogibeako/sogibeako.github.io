const assert=require('node:assert/strict'),O=require('./orientation.js'),S=require('./orientation-save.js');
for(const layout of ['demo','dfs','prim','division','rooms'])for(const warpInvisible of [false,true]){
 const s=O.create('mixed',{layout,warpInvisible,warpStyle:'cycle3',seed:'text-export',size:'small'});
 const before=S.encode(s),report=O.exportMapReport(s),w=s.game.world;
 const lines=report.split('\n'),start=lines.indexOf('')+1,rows=lines.slice(start,start+w.height);
 assert.equal(rows.length,w.height);assert(rows.every(r=>r.length===w.width));assert.equal(rows.join('').split('@').length-1,1);
 if(warpInvisible)assert(!rows.join('').includes('O'));
 assert.equal(S.encode(s),before);assert(report.includes('text-export'));
}
const s=O.create();for(const d of ['down','down','right','right'])O.move(s,d);
const before=S.encode(s);assert(O.exportMapReport(s).includes('転移1回'));assert.equal(S.encode(s),before);
console.log('PASS: 10 export configurations; dimensions, player, hidden warps, metadata and state preservation after rotation.');

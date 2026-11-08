const assert=require('node:assert/strict'),K=require('./klein-biaxial.js'),E=require('./biaxial-exploration.js'),U=require('./biaxial-underpasses.js'),R=require('./biaxial-rules.js');
let count=0;
for(const algorithm of ['dfs','prim','atelier-dfs','atelier-prim','atelier-kruskal','atelier-rooms','atelier-eller'])for(const [sx,sy] of [[3,2],[-5,5],[0,0]]){
 const w=U.add(K.maze(K.create('free',sx,sy,{width:24,height:20}),algorithm,'keys-'+count++),3,'mixed'),s=R.create(w,'keys'),original=w.cells.slice();let p={id:w.start,frame:[2,1,0,3]},steps=0;
 assert(!R.allowed(s,w.exit));assert.equal(R.glyph(s,w.exit),'+');assert.equal(R.glyph(s,s.features.key),'a');
 const path=E.path(R.navigation(w,s),p,q=>q.id===R.target(w,s));assert(path&&path.length);
 for(const d of path){p=K.step(w,p,d);assert(R.allowed(s,p.id));R.afterMove(s,p,++steps);}
 assert(s.features.hasKey);assert(R.allowed(s,w.exit));assert.equal(R.glyph(s,s.features.key),null);
 for(const d of E.path(R.navigation(w,s),p,q=>q.id===w.exit)){p=K.step(w,p,d);R.afterMove(s,p,++steps);}assert.equal(p.id,w.exit);assert.deepEqual(w.cells,original);
 assert.equal(R.create(w,'keys').features.key,s.features.key);assert(!R.create(w,'keys').features.hasKey);
}
console.log(count+' key/door worlds: key reachable before door, reflected walking, underpasses, unlock, exit and immutable geometry passed.');

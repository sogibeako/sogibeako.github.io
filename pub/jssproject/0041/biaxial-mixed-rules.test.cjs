const assert=require('node:assert/strict'),K=require('./klein-biaxial.js'),U=require('./biaxial-underpasses.js'),R=require('./biaxial-rules.js');
let cases=0;
for(const algorithm of ['dfs','atelier-prim','atelier-rooms'])for(const mode of ['keysWarp','birdsKeys','birdsWarp','mixed']){
 const w=U.add(K.maze(K.create('free',-3,2,{width:24,height:20}),algorithm,'mixed-check-'+mode),3,'mixed'),s=R.create(w,mode),f=s.features;
 for(const id of f.warps.keys())assert.notEqual(id%13,0);if(f.key!==null)assert.notEqual(f.key%13,0);
 let p={id:w.start,frame:[2,1,0,3]},steps=0;
 while(p.id!==w.exit&&steps<5000){const path=R.path(w,s,p,q=>q.id===R.target(w,s));assert(path?.length);const q=K.step(w,p,path[0]);assert(R.allowed(s,q.id));p=R.afterMove(s,q,++steps);assert(w.cells[p.id]);if(f.bird!==null){assert(R.allowed(s,f.bird));assert(!f.warps.has(f.bird));assert.notEqual(f.bird,w.exit);}}
 assert.equal(p.id,w.exit,algorithm+' '+mode);if(f.options.keys)assert(f.hasKey);
 if(f.options.birds&&f.warps.size){const fresh=R.create(w,mode),from=[...fresh.features.warps.keys()][0];fresh.features.cooldown=4;const landed=R.afterMove(fresh,{id:from,frame:[2,1,0,3]},1);assert.equal(landed.id,fresh.features.warps.get(from));assert.equal(fresh.features.last.kind,'warp');}
 if(f.options.keys){const fresh=R.create(w,mode);if(fresh.features.options.birds)fresh.features.cooldown=4;R.afterMove(fresh,{id:fresh.features.key,frame:[0,1,2,3]},1);assert(fresh.features.hasKey);}
 cases++;
}
console.log(cases+' combined-rule worlds: automatic exit, pickup, locked-door and warp bird exclusions, landmarks and warp event preservation passed.');

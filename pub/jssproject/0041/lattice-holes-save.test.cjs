const assert=require('node:assert/strict'),H=require('./lattice-holes.js'),S=require('./connection-space.js'),Save=require('./lattice-holes-save.js');let count=0;
for(const growth of ['walls','dfs','prim','growing'])for(const wallStyle of ['dense','grid'])for(const underpassShape of ['straight','mixed','corners']){
 const state=H.create({maze:true,periodSize:20,underpasses:2,growth,wallStyle,underpassShape,seed:'save-'+count}),book={charts:[],active:-1};
 const q=[state.id],parents=new Map([[state.id,null]]);for(const n of q)for(let d=0;d<4;d++){const e=state.world.edges.get(`${n}:${d}`);if(e&&!parents.has(e.to)){parents.set(e.to,[n,d]);q.push(e.to);}}
 const path=[];for(let n=state.world.exit;parents.get(n);){const [p,d]=parents.get(n);path.unshift(d);n=p;}for(const d of path){S.observeWalkingMap(state,book);S.move(state,state.frame.indexOf(d));}S.observeWalkingMap(state,book);
 const snapshot={state,book,journey:{number:3,steps:456},controls:{seed:{value:'pending seed',checked:false}}},text=Save.encode(snapshot),loaded=Save.decode(text).snapshot;
 assert.deepEqual(loaded,snapshot);for(let i=0;i<12;i++){const choices=[0,1,2,3].filter(d=>state.world.edges.has(`${state.id}:${state.frame[d]}`)),d=choices[i%choices.length];S.move(state,d);S.move(loaded.state,d);assert.deepEqual(S.nearestView(state),S.nearestView(loaded.state));}
 assert.throws(()=>Save.decode(text.replace('"version":1','"version":2')));assert.throws(()=>Save.decode(Save.encode({...snapshot,state:{...state,id:-1}})));count++;
}
console.log(`${count} skew snapshots: exact world/player/maps/counters roundtrip after hole traversal, identical resumed views, invalid-data rejection passed.`);

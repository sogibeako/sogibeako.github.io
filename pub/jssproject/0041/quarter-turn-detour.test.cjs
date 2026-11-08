const a=require('node:assert/strict'),Q=require('./quarter-turn-maze.js'),Save=require('./quarter-turn-save.js');let cuts=0,already=0,skipped=0;
function reach(w,reverse=false,normal=false){const adj=Array.from(w.cells,()=>[]);for(const [key,e]of w.edges){if(normal&&e.kind!=='normal')continue;const id=+key.split(':')[0];adj[reverse?e.to:id].push(reverse?id:e.to);}const q=[w.start],seen=new Set(q);for(const id of q)for(const n of adj[id])if(!seen.has(n)){seen.add(n);q.push(n);}return seen;}
for(const mode of ['doubleTwist','quarterCW','quarterCCW','cwTwist','ccwTwist'])for(const algorithm of ['legacy','dfs','prim','rooms','division'])for(const i of [0,1]){
 const options={mode,size:12,seed:'detour-'+i,algorithm,seamRoutes:2,seamDetour:true,boundaryLinks:!!i,terrain:'maze'},p=Q.create(mode,12,options.seed,options),w=p.world,base=Q.generate(mode,12,options.seed,{...options,seamDetour:false});
 const floors=w.cells.reduce((a,b)=>a+b,0);a.equal(reach(w).size,floors);a.equal(reach(w,true).size,floors);a.equal(w.exit,base.exit);
 a.equal(w.seamDetour.required,!reach(w,false,true).has(w.exit));
 if(w.seamDetour.blocked!==null){cuts++;a(base.cells[w.seamDetour.blocked]);a.equal(w.cells[w.seamDetour.blocked],0);a(w.seamDetour.required);a.equal(base.cells.reduce((a,b)=>a+b,0),floors+1);}else{a.deepEqual(w.cells,base.cells);w.seamDetour.required?already++:skipped++;}
 for(const r of w.seamRoutes)for(const id of [r.from,...r.path])a(w.cells[id]);
 for(const sign of [-1,1])for(let rot=0;rot<4;rot++)a(Q.seesSelf(w,w.selfEncounter,[0,1,2,3].map(d=>(sign*d+rot+4)%4)));
 const settings={render:'hybrid',truth:false,continuous:false,autoMode:'explore',autoSpeed:'250',completed:0,totalSteps:0};a.deepEqual(Save.decode(Save.encode(options,[],p,settings)).state.world.cells,w.cells);
}
a(cuts>0);a(skipped>0);console.log({cases:50,cuts,already,skipped});

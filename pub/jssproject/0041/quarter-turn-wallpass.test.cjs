const a=require('node:assert/strict'),Q=require('./quarter-turn-maze.js'),S=require('./connection-space.js'),M=require('./quarter-turn-memory.js'),Save=require('./quarter-turn-save.js');let seams=0,walls=0;
for(const mode of ['doubleTwist','quarterCW','quarterCCW','cwTwist','ccwTwist'])for(const terrain of ['maze','fixed']){
 const o={mode,terrain,size:12,seed:'ghost',boundaryLinks:false},p=terrain==='maze'?Q.create(mode,12,o.seed):S.create(mode),original=[...p.world.cells],m=M.create(),actions=[];
 const observe=()=>M.observe(m,p,S.nearestView(p,6,null,true));observe();a(Q.toggleWallPass(p));actions.push('ghost');
 for(let i=0;i<80;i++){const truth=i%2===0,d=i%7<4?1:0,wd=truth?d:p.frame[d],local=p.frame.indexOf(wd),e=Q.wallEdge(p.world,p.id,wd),frame=p.frame.map(d=>e.transform[d]);a(Q.move(p,d,truth));actions.push(local);a.equal(p.id,e.to);a.deepEqual(p.frame,frame);observe();if(e.kind!=='normal')seams++;if(!p.world.cells[p.id]){walls++;a.equal(Q.toggleWallPass(p),false);a(p.wallPass);a(!m.visited.has(p.id));}}
 a.deepEqual([...p.world.cells],original);
 const prefs={render:'tiles',truth:false,continuous:false,autoMode:'explore',autoSpeed:'250',completed:0,totalSteps:0};
 const text=Save.encode(o,actions,p,prefs),restored=Save.decode(text);a.equal(JSON.parse(text).version,2);a.deepEqual(restored.state,p);a.deepEqual(restored.memory,m);a.equal(p.steps,80);
 if(p.world.cells[p.id]){a(Q.toggleWallPass(p));a.equal(p.wallPass,false);}
 const fresh=terrain==='maze'?Q.create(mode,12,o.seed):S.create(mode);a(!fresh.wallPass);
}
a(walls>0);a(seams>0);console.log({runs:10,walls,seams,saveReplay:true,unchangedWalls:true});

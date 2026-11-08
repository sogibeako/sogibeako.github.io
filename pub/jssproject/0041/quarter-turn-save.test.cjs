const a=require('node:assert/strict'),Q=require('./quarter-turn-maze.js'),S=require('./connection-space.js'),M=require('./quarter-turn-memory.js'),Save=require('./quarter-turn-save.js');
let cases=0;
for(const mode of ['doubleTwist','quarterCW','quarterCCW','cwTwist','ccwTwist'])for(const terrain of ['maze','fixed']){
 const options={mode,terrain,size:12,seed:'save-check',boundaryLinks:true},p=terrain==='maze'?Q.create(mode,12,options.seed,options):S.create(mode),memory=M.create(),moves=[];
 const observe=()=>M.observe(memory,p,S.nearestView(p,6,null,true));observe();
 for(let i=0;i<160;i++){const choices=[0,1,2,3].filter(d=>p.world.edges.has(p.id+':'+p.frame[d])),d=choices[(i*17+Math.floor(i/4))%choices.length];a(S.move(p,d));moves.push(d);observe();}
 const settings={render:'ascii',truth:true,continuous:true,autoMode:'explore',autoSpeed:'20',completed:4,totalSteps:1234};
 const text=Save.encode(options,moves,p,settings),restored=Save.decode(text);
 a.deepEqual(restored.state,p);a.deepEqual(restored.memory,memory);a.deepEqual(restored.settings,settings);a.deepEqual(restored.moves,moves);
 const bad=JSON.parse(text);bad.position.id=-1;a.throws(()=>Save.decode(JSON.stringify(bad)));bad.position.id=p.id;bad.moves[0]=9;a.throws(()=>Save.decode(JSON.stringify(bad)));
 const badStamp=JSON.parse(text);badStamp.stamp='bad';a.throws(()=>Save.decode(JSON.stringify(badStamp)));
 cases++;
}
a.throws(()=>Save.decode('{}'));a.throws(()=>Save.decode('x'.repeat(200001)));
console.log(cases+' replay round trips: positions, rotations, walking memory, marks, options and counters match; malformed data rejected.');

const a=require('node:assert/strict'),C=require('./exploration-course.js'),B=require('./exploration-bundle.js'),Q=require('./quarter-turn-maze.js'),S=require('./quarter-turn-save.js');
(async()=>{const pool=['plane','doubleTwist','quarter','quarterTwist'];const course={enabled:true,completed:0,steps:0,order:'sequence',pool};
for(let i=0;i<pool.length;i++){const mode=pool[i],n=C.advance(course,mode==='plane'?'main':mode,{exit:true,steps:7,topology:'plane'});a.equal(n.mode,pool[(i+1)%pool.length]==='plane'?'main':pool[(i+1)%pool.length]);a.equal(n.course.completed,1);a.equal(C.advance({...course,order:'random'},'main',{exit:true,steps:0},()=>i/4).mode,mode==='plane'?'main':mode);}
for(const [family,mode]of [['doubleTwist','doubleTwist'],['quarter','quarterCCW'],['quarterTwist','cwTwist']]){
 const options={mode,terrain:'maze',size:12,seed:'bundle-quarter',boundaryLinks:true,floorUnderpasses:2},state=Q.create(mode,12,options.seed,options),moves=[];
 for(let i=0;i<30;i++){const d=[0,1,2,3].find(d=>state.world.edges.has(state.id+':'+state.frame[d]));a(Q.move(state,d));moves.push(d);}
 const quarter=S.encode(options,moves,state,{render:'hybrid',truth:false,continuous:true,autoMode:'explore',autoSpeed:'20',completed:0,totalSteps:0});
 const text=B.encode('main','skew',family,course,'enclosure',undefined,'klein',undefined,undefined,undefined,undefined,quarter);a.equal(B.unpack(text).version,8);
 let applied;const stub={prepare:x=>x,apply(){}},adapters={main:stub,skew:stub,enclosure:stub,klein:stub,quarter:{prepare:S.decode,apply:x=>applied=x}};
 const prepared=await B.prepare(text,adapters);B.apply(prepared,adapters,prepared);a.equal(applied.state.id,state.id);a.deepEqual(applied.state.frame,state.frame);a.deepEqual(applied.state.wildlife,state.wildlife);
 const bad=JSON.parse(text);bad.active=family==='quarter'?'doubleTwist':'quarter';a.throws(()=>B.unpack(JSON.stringify(bad)));
}
console.log('Three course families, sequence/random selection, v8 native replay and family validation passed');})();

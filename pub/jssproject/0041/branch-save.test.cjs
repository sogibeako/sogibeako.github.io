const a=require('node:assert/strict'),B=require('./branch-maze.js'),S=require('./connection-space.js'),M=require('./branch-memory.js'),P=require('./crossing-autowalk.js'),Save=require('./branch-save.js');
for(const complete of [false,true]){
 const options={size:20,sheets:3,route:'random',pillar:'random',direction:'random',algorithm:'prim',wallStyle:'grid',underpasses:2,underpassShape:'mixed',density:.45,seed:'save-branch'},state=B.create(options),memory=new Map(),known=new Set([state.id]),moves=[];M.observe(state,memory);
 for(let n=0;n<(complete?5000:60);n++){const path=P.explore(state,known);if(!path)break;a(S.move(state,path[0]));moves.push(path[0]);known.add(state.id);M.observe(state,memory);}
 const data=Save.pack(options,moves,state,{truth:true,render:'ascii',speed:20,policy:'explore'},{completed:7,totalSteps:1000+moves.length,stageCleared:false}),loaded=Save.restore(JSON.parse(JSON.stringify(data)));
 a.equal(loaded.state.id,state.id);a.equal(loaded.state.steps,state.steps);a.deepEqual(loaded.known,known);a.deepEqual([...loaded.memory],[...memory]);a.equal(!!loaded.memory.complete,complete);a.deepEqual(loaded.view,data.view);a.deepEqual(loaded.counters,data.counters);
 for(const bad of [{...data,fingerprint:'wrong'},{...data,moves:[9]},{...data,options:{...options,size:1000}},{...data,format:'other'}])a.throws(()=>Save.restore(bad));
}
console.log('Partial/full exploration restored with terrain, lanes, memories, view and counters; invalid data rejected.');

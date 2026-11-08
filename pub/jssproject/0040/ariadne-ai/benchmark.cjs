// node ariadne-ai/benchmark.cjs [runs=3] [depth=2] [maxTurns=300] [firstSeed=42]
const AI=require('./ai.js');
const [runs=3,depth=2,limit=300,first=42]=process.argv.slice(2).map(Number);
if(![runs,depth,limit,first].every(Number.isInteger)||runs<1||runs>100||depth<1||depth>3||limit<1||limit>1500)throw Error('runs 1–100, depth 1–3, maxTurns 1–1500, firstSeed integer');
for(let i=0;i<runs;i++){const seed=(first+i)>>>0,g=AI.create(seed),memory=new Map(),start=Date.now();while(!g.ended&&g.turn<limit){const choice=AI.decide(g,{depth,memory});const key=g.floor+':'+g.player;memory.set(key,(memory.get(key)||0)+1);AI.apply(g,choice.action);}console.log(JSON.stringify({seed,depth,floor:g.floor,score:g.score,turn:g.turn,result:g.won?'escaped':g.dead?'dead':'turn-limit',elapsedMs:Date.now()-start}));}

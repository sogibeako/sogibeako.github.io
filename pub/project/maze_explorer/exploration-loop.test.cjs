const a=require('node:assert/strict'),P=require('./exploration-solver.js'),C=require('./core.js'),L=require('./lattice-holes.js'),S=require('./connection-space.js'),Loops=require('./lattice-holes-loops.js');
for(const shifts of [[0,0],[2,0],[0,-2],[2,4]]){
 const g=C.createGame(C.generate({seed:'auto-loop',width:16,height:18,topology:'torus',shiftX:shifts[0],shiftY:shifts[1],loopLearning:true,learningLaps:3}));
 for(let n=0;n<15;n++){const path=P.mainLoop(g,C);if(!path)break;for(const d of path){if(g.won)C.continueExploring(g);a(C.move(g,d));}}
 a(g.cognition.known_loops.has('x'));a(g.cognition.known_loops.has('y'));a.equal(P.mainLoop(g,C),null);
 const st=L.create({maze:true,seed:'loop-'+shifts,periodSize:16,shiftX:shifts[0],shiftY:shifts[1],underpasses:4,underpassShape:'mixed',holeRimWalls:true});Loops.start(st);
 for(let n=0;n<30;n++){const path=P.connectedLoop(st,S,Loops);if(!path)break;for(const d of path){a(S.move(st,st.frame.indexOf(d)));Loops.observe(st,S.groundSheet(st.world,st.id));}}
 a.equal(P.connectedLoop(st,S,Loops),null);a.equal(Loops.knowledge(st).filter(p=>p.learned&&((p.a===1&&p.b===0)||(p.a===0&&p.b===1))).length,4);
}
console.log('Four shift configurations: both main torus axes and both axes on each of two sheets learned through actual three-lap walks.');

const H=require('./return-enclosure.js');
for(const [shiftX,shiftY]of [[0,0],[2,0],[0,-4],[4,-2]]){
 const st=H.create('horizontal-'+shiftX,{horizontalLoops:true,shiftX,shiftY,layout:'random',underpasses:4});Loops.start(st);
 for(let n=0;n<25;n++){const path=P.connectedLoop(st,S,Loops);if(!path)break;for(const d of path){a(S.move(st,st.frame.indexOf(d)));Loops.observe(st,S.groundSheet(st.world,st.id));}}
 a.equal(P.connectedLoop(st,S,Loops),null);a.equal(st.world.horizontalRoutes.length,2);
}
console.log('Enclosure: both axes on both sheets learned for four shift configurations, preserving the A-B-A enclosure.');

const a=require('node:assert/strict'),P=require('./exploration-solver.js'),C=require('./core.js'),H=require('./return-enclosure.js'),L=require('./lattice-holes.js'),S=require('./connection-space.js');
let count=0;
for(let i=0;i<8;i++)for(const options of [{width:21,height:17,keyDoor:true,keyCount:2},{width:24,height:28,topology:'torus',shiftX:4,shiftY:-2}]){
 const g=C.createGame(C.generate({...options,seed:'auto-'+i}));let path=P.main(g,C);a(path.length);C.move(g,path.shift());const before=JSON.stringify(g.player);path=P.main(g,C);a.equal(JSON.stringify(g.player),before);for(const d of path)a(C.move(g,d));a.equal(g.player.world_position,g.world.exit);count++;
}
for(let i=0;i<8;i++)for(const st of [H.create('auto-'+i,{shiftX:6,shiftY:-4,layout:'random',underpasses:6}),L.create({maze:true,seed:'auto-'+i,periodSize:20,shiftX:2,shiftY:4,underpasses:3,holeRimWalls:true})]){
 const path=P.connected(st),before=st.id;a(path.length);a.equal(st.id,before);for(const d of path)a(S.move(st,st.frame.indexOf(d)));a.equal(st.id,st.world.exit);a.deepEqual(P.connected(st),[]);count++;
}
a(P.main(C.createGame(C.generate({birdMode:true})),C).length);
console.log(count+' actual exit walks: keys, shifted tori, sheet transitions, underpasses; planning preserves state.');

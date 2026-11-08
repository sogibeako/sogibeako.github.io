const a=require('node:assert/strict'),B=require('./branch-maze.js'),U=require('./branch-underpasses.js'),S=require('./connection-space.js'),P=require('./crossing-autowalk.js'),M=require('./branch-memory.js');let bends=0;
for(const shape of ['corners','mixed'])for(let i=0;i<6;i++){
 const s=B.create({size:20,sheets:3,algorithm:['dfs','prim','growing'][i%3],wallStyle:'grid',pillar:'random',route:'random',direction:['left','right','both'][i%3],seed:'bend-'+i,underpasses:2,underpassShape:shape}),w=s.world,known=new Set([s.id]),memory=new Map();a(U.valid(w));
 for(const p of w.passages||[])if(p.arms){bends++;for(const id of [p.horizontal,p.vertical]){const camera={...s,id};a('┌┐└┘'.includes(S.underpassSymbol(w,id)));a.equal(U.appearance(camera,p.horizontal).id,id);for(let d=0;d<4;d++){const neighbor=p.horizontal+[ -20,1,20,-1 ][d];a.equal(U.appearance(camera,neighbor).wall,!w.edges.has(id+':'+d));}}}
 for(let n=0;n<7000;n++){M.observe(s,memory);const route=P.explore(s,known);if(!route)break;a(S.move(s,route[0]));known.add(s.id);}a.equal(known.size,w.branchStats.floors);M.observe(s,memory);a(memory.complete);for(const d of P.route(s,id=>id===w.exit))a(S.move(s,d));a.equal(s.id,w.exit);
}
a(bends>0);console.log('12 mixed/corner layouts, '+bends+' bends: symbols, blocked turns, viewpoint walls, full memory and exits.');

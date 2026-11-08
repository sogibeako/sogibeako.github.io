const a=require('node:assert/strict'),B=require('./branch-maze.js'),U=require('./branch-underpasses.js'),S=require('./connection-space.js'),P=require('./crossing-autowalk.js'),M=require('./branch-memory.js');let placed=0;
for(let i=0;i<12;i++){
 const s=B.create({size:20,sheets:3,algorithm:['dfs','prim','growing'][i%3],wallStyle:i%4===0?'dense':'grid',pillar:'random',route:'random',direction:['left','right','both'][i%3],seed:'pass-'+i,underpasses:2}),w=s.world,known=new Set([s.id]),memory=new Map();a(U.valid(w));
 for(const p of w.passages||[]){placed++;a(!w.edges.has(p.horizontal+':0'));a(!w.edges.has(p.vertical+':1'));a.equal(S.underpassSymbol(w,p.horizontal),'ー');a.equal(S.underpassSymbol(w,p.vertical),'｜');
  const camera={...s,id:p.vertical};a.equal(U.appearance(camera,p.horizontal).id,p.vertical);a(U.appearance(camera,p.horizontal+1).wall);a(!U.appearance(camera,p.horizontal-20).wall);
 }
 for(let n=0;n<7000;n++){M.observe(s,memory);const route=P.explore(s,known);if(!route)break;a(S.move(s,route[0]));known.add(s.id);}a.equal(known.size,w.branchStats.floors);M.observe(s,memory);a(memory.complete);for(const d of P.route(s,id=>id===w.exit))a(S.move(s,d));a.equal(s.id,w.exit);
}
a(placed>10);console.log('12 layouts, '+placed+' underpasses: separate lanes, viewpoint walls, winding, full exploration/memory and exit.');

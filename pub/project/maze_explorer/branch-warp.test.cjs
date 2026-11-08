const a=require('node:assert/strict'),B=require('./branch-maze.js'),S=require('./connection-space.js'),P=require('./crossing-autowalk.js'),L=require('./branch-learning.js'),Save=require('./branch-save.js');
let count=0,minDistance=Infinity,warpCount=0;
for(const sheets of [2,3])for(const direction of ['left','right','both'])for(const algorithm of ['walls','dfs','prim','growing'])for(const wallStyle of ['dense','grid']){
 const options={sheets,direction,algorithm,wallStyle,size:12,route:'return',pillar:'grown',underpasses:2,underpassShape:'mixed',density:.45,seed:'branch-keys-'+count,ruleMode:'warpKeys'};
 const s=B.create(options),f=s.features,moves=[],known=new Set([s.id]);L.init(s);
 a(f&&f.key!==f.door);a.equal(f.door,s.world.exit);
 const plain=B.create({...options,ruleMode:'plain'});a.deepEqual(s.world.cells,plain.world.cells);a.deepEqual(s.world.edges,plain.world.edges);a.equal(s.world.exit,plain.world.exit);
 const locked={...s,id:f.door};const edge=[...s.world.edges].find(([key,e])=>e.to===f.door);a(edge);locked.id=Number(edge[0].split(':')[0]);a.equal(S.move(locked,Number(edge[0].split(':')[1])),false);
 const step=d=>{const from=s.id,wd=s.frame[d];a(S.move(s,d));L.moved(s,from,wd);moves.push(d);known.add(s.id);B.afterMove(s,known);};
 a(B.mark(s));const keyRoute=P.route(s,id=>id===f.key);a(keyRoute?.length);keyRoute.forEach(step);a(f.hasKey);
 const distance=P.route(s,id=>id===f.door).length;minDistance=Math.min(minDistance,distance);a(distance>=8);
 const restored=Save.restore(Save.pack(options,moves,s,{truth:false,render:'hybrid',speed:10,policy:'explore'},{completed:0,totalSteps:moves.length,stageCleared:false}));a(restored.state.features.hasKey);a.deepEqual(restored.state.features.marks,s.features.marks);a.deepEqual(restored.state.features.warpTraversed,s.features.warpTraversed);a.equal(restored.state.id,s.id);a.equal(restored.state.features.key,f.key);
 let path;while((path=P.explore(s,known))!==null){a(path.length);path.forEach(step);a(moves.length<20000);}
 a.equal(P.warpPending(s).length,0);a.equal(known.size,P.targets(s).size);let circuits=0;while(L.pending(s)){const path=L.route(s);a(path?.length);path.forEach(step);a(++circuits<7);}
 P.route(s,id=>id===s.world.exit).forEach(step);a.equal(s.id,s.world.exit);count++;warpCount+=f.warps.size/2;
}
console.log(`${count} generation cases, ${warpCount} warp pairs: unchanged terrain, locked door, reachable distant key (minimum ${minDistance} steps), save replay, all floors and circuit learning passed.`);

for(const size of [8,16,20])for(const sheets of [2,3]){const s=B.create({size,sheets,seed:'warp-only-'+size,ruleMode:'warp',underpasses:2});L.init(s);const seen=new Set([s.id]);let steps=0,path;while((path=P.explore(s,seen))!==null){a(path.length);for(const d of path){const from=s.id,wd=s.frame[d],laps=L.init(s).laps;a(S.move(s,d));L.moved(s,from,wd);if(s.last.kind==='warp')a.equal(L.init(s).laps,laps);seen.add(s.id);B.afterMove(s,seen);a(++steps<20000);}}a.equal(P.warpPending(s).length,0);a.equal(seen.size,P.targets(s).size);}
console.log('Warp-only mode: 8/16/20 sizes, 2/3 sheets, all floors/warps, no false circuit credit on teleport passed.');

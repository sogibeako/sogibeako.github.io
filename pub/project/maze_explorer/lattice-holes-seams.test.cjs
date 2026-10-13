const assert=require('node:assert/strict'),fs=require('node:fs'),H=require('./lattice-holes.js'),S=require('./connection-space.js'),Save=require('./lattice-holes-save.js');
let cases=0;
for(const growth of ['walls','dfs','prim','growing'])for(const wallStyle of ['dense','grid'])for(const shift of [[2,2],[-4,2],[2,-4],[0,0]]){
 const st=H.create({maze:true,growth,wallStyle,shiftX:shift[0],shiftY:shift[1],periodSize:24,underpasses:6,underpassShape:'mixed',holeRimWalls:true,seed:'seams-'+cases}),w=st.world;
 for(const [key,e] of w.candidates)if(e.kind==='normal'&&w.domain.has(Number(key.split(':')[0])))assert(w.domain.has(e.to),'normal candidate stays in skew domain');
 for(const [key,e] of w.edges){const [from,d]=key.split(':').map(Number);assert.equal(w.edges.get(`${e.to}:${e.transform[(d+2)%4]}`)?.to,from);}
 assert.equal(S.repairSkewSeams(w),0);cases++;
}
const state=H.create({maze:true,growth:'dfs',wallStyle:'dense',periodSize:24,underpasses:6,underpassShape:'straight',seed:'skew-vp0mef4c'}),w=state.world;
assert.equal(w.candidates.get('1295:2').to,699);assert.equal(w.edges.get('1295:2').to,699);
// Emulate the old endpoint rewrite, then verify version-1 migration is idempotent.
w.candidates.set('1295:2',{to:1321,transform:[0,1,2,3],kind:'normal'});w.edges.delete('1295:2');
const snapshot={state,book:{charts:[],active:-1},journey:{number:1,steps:0},controls:{}};
const migrated=Save.decode(Save.encode(snapshot));assert.equal(migrated.repairedSeams,1);assert.equal(migrated.snapshot.state.world.edges.get('1295:2').to,699);assert.equal(Save.decode(Save.encode(migrated.snapshot)).repairedSeams,undefined);
if(process.argv[2]){
 const original=fs.readFileSync(process.argv[2],'utf8'),raw=JSON.parse(original).snapshot,data=Save.decode(original),s=data.snapshot;
 assert.equal(data.repairedSeams,1);assert.equal(s.state.id,raw.state.id);assert.equal(s.state.steps,raw.state.steps);assert.deepEqual(s.journey,raw.journey);
 const oldFloorIds=new Set(raw.book.charts.flatMap(c=>c.cells.data.map(([,p])=>p).filter(p=>!p.wall&&!p.underpassProjection).map(p=>p.id))),newFloorIds=new Set(s.book.charts.flatMap(c=>[...c.cells.values()].filter(p=>!p.wall).map(p=>p.id)));for(const id of oldFloorIds)assert(newFloorIds.has(id));
 const chart=s.book.charts[s.book.active];assert(chart.cells.size>1900);
 for(const d of [3,1,3,3,1,1]){S.move(s.state,d);S.observeWalkingMap(s.state,s.book);assert.equal(s.book.charts[s.book.active],chart);}
 console.log(`Reported save: repaired ${data.repairedSeams} seam, active chart ${chart.cells.size} records, ordinary explored floors and progress retained, repeated underpass approach no split.`);
}
console.log(`${cases} generated worlds: no off-domain normal candidates; reported seed endpoint correct; old-save repair and second load passed.`);

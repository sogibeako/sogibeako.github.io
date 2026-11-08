const a=require('node:assert/strict'),H=require('./lattice-holes.js'),G=require('./graph-wands.js'),O=require('./graph-oob.js'),Save=require('./lattice-holes-save.js'),Session=require('./lattice-holes-session.js');globalThis.GraphWands=G;
let hits=0,kinds=new Set();
for(const [sx,sy]of [[0,0],[2,0],[0,-2],[2,-2]]){
 const base=H.create({maze:true,periodSize:16,shiftX:sx,shiftY:sy,seed:'oob-graph',underpasses:2,features:{birds:true}});G.init(base);
 for(const type of ['normal','throat']){
 let done=false;
 for(const [key,e]of base.world.edges){const [id,d]=key.split(':').map(Number);if(e.kind!==type||!O.boundary(base,id,d,e))continue;const back=(d+2)%4,inside=base.world.edges.get(id+':'+back);if(!inside||inside.kind!=='normal'||inside.to===e.to)continue;
 const s=structuredClone(base);s.id=id;s.features.bird=null;s.features.warps.clear();s.features.door=null;s.wands.held=['push'];s.wands.items=[];s.wildlife={...s.wildlife,pets:[{kind:'d',id:inside.to,mode:'wander',left:0}]};
 const book={charts:[],active:-1};Session.observe(s,book);const knowledge=JSON.stringify(book);G.preview(s,'push',back);a(!s.wands.oob);G.cast(s,'push',back);if(!s.wands.oob)continue;a.equal(s.wands.oob.direction,d);a.equal(s.id,id);a.equal(JSON.stringify(book),knowledge);a(!G.cast(s,'push',back));
 const snap={state:s,book,journey:{number:1,steps:0},controls:{}};const restored=Save.decode(Save.encode(snap)).snapshot;a.deepEqual(restored.state.wands,s.wands);a(O.move(s,1));a(G.returnOob(s));a(!s.wands.oob);Session.observe(s,book);a(s.world.cells[s.id]);
 restored.state.wands.oob.direction=9;a.throws(()=>Save.decode(Save.encode(restored)));done=true;hits++;kinds.add(type);break;}
 a(done,'need '+type+' reflection for '+sx+','+sy);
 }
}
console.log({hits,kinds:[...kinds],shifts:true,previewReadOnly:true,saveAndReturn:true});

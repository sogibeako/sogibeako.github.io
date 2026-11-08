const assert=require('node:assert/strict'),S=require('./connection-space.js'),P=require('./crossing-autowalk.js'),F=require('./sheet-features.js');
const snapshot=state=>({state,journey:{number:1,steps:0},journeyMap:{cells:new Map()},regionBook:{records:new Map(),owners:new Map(),nextNumber:1},atlasMemory:new Set(),walkingBook:{charts:[],active:-1},controls:{}});
let count=0;
for(const growth of ['dfs','prim','growing','walls','kruskal','hunt','wilson','rooms'])for(const tripleRoute of ['chain','return'])for(const [shiftX,shiftY]of [[0,0],[2,-2]]){
 const s=S.create('tripleMaze',{ruleMode:'keys',growth,tripleRoute,returnShape:'irregular',wallStyle:'grid',dimensions:[[20,20],[24,20],[20,20]],holeSize:3,holeRimWalls:true,floorUnderpasses:2,underpassShape:'mixed',shiftX,shiftY,seed:'keys-'+count});
 const keyToDoor=P.route({...s,id:s.features.key,features:{...s.features,hasKey:true}},id=>id===s.world.exit);assert(keyToDoor&&keyToDoor.length>=8,'key should be at least eight actual steps from door');
 assert(s.features&&!s.features.hasKey);assert.equal(F.glyph(s,s.features.key),'a');assert.equal(F.glyph(s,s.features.door),'+');assert(!F.allowed(s,s.world.exit));
 const locked=S.decodeSave(S.encodeSave(snapshot(s))).snapshot.state;assert(!locked.features.hasKey);assert.equal(locked.features.key,s.features.key);
 const fast=P.route(s,id=>id===s.world.exit);assert(fast?.length);const visited=new Set([s.id]);
 for(const d of fast){assert(S.move(s,d));visited.add(s.id);if(s.id===s.world.exit)assert(s.features.hasKey);}
 assert(s.features.hasKey&&visited.has(s.features.key));assert.equal(s.id,s.world.exit);
 const unlocked=S.decodeSave(S.encodeSave(snapshot(s))).snapshot.state;assert(unlocked.features.hasKey);assert(F.allowed(unlocked,unlocked.world.exit));
 const targets=P.targets(s);while(visited.size<targets.size){const path=P.route(s,id=>!visited.has(id));assert(path?.length);for(const d of path){assert(S.move(s,d));visited.add(s.id);}}
 for(const d of P.route(s,id=>id===s.world.exit))assert(S.move(s,d));assert.equal(s.id,s.world.exit);
 assert.equal(S.randomTripleOptions('next',s.world,{}).ruleMode,'keys');count++;
}
const corrupt=snapshot(S.create('tripleMaze',{ruleMode:'keys'}));corrupt.state.features.key=-1;assert.throws(()=>S.decodeSave(S.encodeSave(corrupt)),/保存/);
console.log(count+' triple key mazes: locked exit, key-first goal routing, all floors, return layouts, biaxial shifts and locked/unlocked saves passed.');

const G=require('./exploration-generation.js'),C=require('./exploration-course.js');
const base={growth:'rooms',wallStyle:'grid',dimensions:[[20,20],[24,20],[20,20]],holeSize:3,holePlacement:'center',holeRimWalls:true,floorUnderpasses:2,underpassShape:'mixed',shiftX:2,shiftY:-2,ruleMode:'keys'},rules={enabled:true,pool:['plain','keys','warp','birds']},drawn=new Set();
for(let i=0;i<16;i++){
 const input={...base,tripleRoute:i%2?'return':'chain'},copy=structuredClone(input),seed='course-keys-'+i,course={rules,randomTripleRoute:false};
 const o=G.chooseTriple(input,seed,course);assert.deepEqual(o,G.chooseTriple(input,seed,course));assert.deepEqual(input,copy);assert(['plain','keys','warp','warpHidden','birds'].includes(o.ruleMode));drawn.add(o.ruleMode==='warpHidden'?'warp':o.ruleMode);
 const state=S.create('tripleMaze',o);assert.equal(!!state.features?.options.keys,o.ruleMode==='keys');
 for(let n=0;n<5000&&state.id!==state.world.exit;n++){const path=P.route(state,id=>id===state.world.exit);assert(path?.length);assert(S.move(state,path[0]));}assert.equal(state.id,state.world.exit);
 if(o.ruleMode==='keys')assert(state.features.hasKey);
}
assert.equal(drawn.size,4);
for(const ruleMode of ['plain','keys','warp','birds']){
 assert.equal(G.chooseTriple({...base,ruleMode},'off',{rules:{enabled:false,pool:['warp']}}).ruleMode,ruleMode);
 const picked=G.chooseTriple(base,'single',{rules:{enabled:true,pool:[ruleMode]}}).ruleMode;assert.equal(picked==='warpHidden'?'warp':picked,ruleMode);
}
assert.throws(()=>G.chooseTriple(base,'unsupported',{rules:{enabled:true,pool:[]}}));
assert.equal(G.chooseTriple(base,'birds-return',{forceTripleReturn:true,rules:{enabled:true,pool:['birds']}}).ruleMode,'birds');
assert.equal(G.chooseTriple(base,'default-random',{order:'random'}).ruleMode,G.chooseTriple(base,'default-random',{rules}).ruleMode);
console.log('Triple shared rules: 16 playable draws, four supported rules, single-candidate selection, OFF preservation, deterministic filtering and unsupported-candidate errors passed.');

const assert=require('node:assert/strict'),M=require('./core.js'),J=require('./main-journey.js'),C=require('./main-checkpoint.js'),S=require('./main-session.js');
let generated=0;
for(const size of ['small','standard','large'])for(const course of ['plain','variety','torus','keys','birds']){
 const original=J.start({width:9,height:9,seed:'original'});original.journey.size=size;
 let g=J.begin(original,'size-start-'+size+'-'+course,course);
 assert.equal(g.world.width,{small:15,standard:21,large:33}[size]);assert.equal(g.journey.size,size);
 for(let i=0;i<8;i++){
  const torus=g.world.topology==='torus',o=g.generationOptions;
  const min={small:12,standard:20,large:32}[size],max={small:19,standard:31,large:41}[size];assert(o.width>=min&&o.width<=max);
  const h=S.attach(g);S.act(h,'wait');const text=S.encode(h,course),r=S.decode(text).game;assert.equal(S.encode(r,course),text);assert.equal(C.decode(C.encode(h,course)).game.journey.size,size);
  S.markExport(h,course);assert(S.info(h,course).current);h.journey.size=size==='small'?'large':'small';assert(!S.info(h,course).current);h.journey.size=size;
  g.player.world_position=g.world.exit;g.won=true;g=J.next(g,'size-'+size+'-'+course+'-'+i,course);generated++;
 }
}
const g=J.start({width:9,height:9,seed:'same-size'});g.journey.size='large';g.won=true;g.player.world_position=g.world.exit;assert.equal(J.next(g,'unchanged','same').world.width,9);
const bad=JSON.parse(C.encode(g,'same'));bad.journey.size='invalid';assert.throws(()=>C.decode(JSON.stringify(bad)));
console.log(`PASS: ${generated} course generations across 3 sizes / 5 courses, session and entrance round trips, changed-size status, same-course dimensions, invalid size rejection.`);

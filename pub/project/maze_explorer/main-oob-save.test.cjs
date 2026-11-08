const a=require('node:assert/strict'),M=require('./core.js'),J=require('./main-journey.js'),S=require('./main-session.js');let found=false;
function walk(g,target){const n=M.wildlifeAdapter(g),q=[n.player],p=new Map([[n.player,null]]);for(const id of q){if(target(id)){let t=id,d;while(p.get(t)){[t,d]=p.get(t);}return d??4;}for(const e of n.edges(id))if(!p.has(e.to)){p.set(e.to,[id,e.dir]);q.push(e.to);}}return 4;}
for(let seed=0;seed<40&&!found;seed++){
 const g=S.attach(J.start({width:16,height:16,topology:'torus',birdMode:true,seed:'oob-live-'+seed}));S.act(g,'wands');
 for(let t=0;t<500&&!g.wands.held.includes('push');t++){if(g.won)S.act(g,'continue');const d=walk(g,id=>g.wands.items.some(i=>i.spell==='push'&&i.id===id));S.act(g,d===4?'wait':'move',...(d===4?[]:[Object.keys(M.DIRS)[d]]));}
 if(!g.wands.held.includes('push'))continue;
 for(let t=0;t<500&&!g.wands.oob;t++){
  if(g.won)S.act(g,'continue');let shot=-1;for(let d=0;d<4;d++)if(M.previewWand(g,'push',d).oob!=null){shot=d;break;}
  if(shot>=0){S.act(g,'cast','push',shot);break;}
  const old=g.player.world_position;let goal=null;
  for(let id=0;id<g.world.cells.length&&goal===null;id++)if(g.world.cells[id]){g.player.world_position=id;for(let d=0;d<4;d++)if(M.previewWand(g,'push',d).oob!=null){goal=id;break;}}g.player.world_position=old;
  if(goal===null)break;const d=walk(g,id=>id===goal);S.act(g,d===4?'wait':'move',...(d===4?[]:[Object.keys(M.DIRS)[d]]));
 }
 if(!g.wands.oob)continue;
 const text=S.encode(g,'birds');require('node:fs').writeFileSync(require('node:path').join(require('node:os').tmpdir(),'maze-oob-check.json'),text);const r=S.decode(text).game;a.deepEqual(r.wands,g.wands);a.deepEqual(r.cognition,g.cognition);
 for(const h of [g,r]){S.act(h,'move','right');S.act(h,'oobReturn');}a(!g.wands.oob);a.equal(S.encode(g,'birds'),S.encode(r,'birds'));console.log('Legitimate pickup/walk/cast OOB, save in OOB and return replay passed:',g.world.seed);found=true;
}
a(found,'Need a generated, reachable reflection/OOB route');

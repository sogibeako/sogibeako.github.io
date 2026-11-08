const a=require('node:assert/strict'),M=require('./core.js'),J=require('./main-journey.js'),S=require('./main-session.js'),P=require('./oob-walk.js');
let success=0,skips=0,pickup=0;
for(let seed=0;seed<30;seed++){
 const g=S.attach(J.start({width:16,height:16,topology:'torus',birdMode:true,seed:'oob-live-'+seed}));S.act(g,'wands');
 for(let t=0;t<500;t++){
  if(g.wands.oob){success++;const r=S.decode(S.encode(g,'birds')).game;a.deepEqual(r.wands,g.wands);break;}
  if(g.wands.frozen){S.act(g,'wait');continue;}
  const before=JSON.stringify(g),choice=P.plan(g,M);a.equal(JSON.stringify(g),before,'planning must not mutate');
  if(!choice){skips++;break;}if(!g.wands.held.includes('push'))pickup++;
  if(g.won)S.act(g,'continue');
  if(choice.cast!==undefined)S.act(g,'cast','push',choice.cast);else if(choice.path?.length)S.act(g,'move',choice.path[0]);else S.act(g,'wait');
 }
}
a(success>0);a(skips>0);a(pickup>0);
const plane=M.createGame(M.generate({width:17,height:17,seed:'not-oob'}));a.equal(P.plan(plane,M),null);
console.log({success,skips,pickup,readOnlyPlanning:true,savedOob:true});

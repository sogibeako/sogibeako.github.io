/* Main bird-course inventory. State is replayable; all navigation uses the host maze. */
(function(root){'use strict';
const animators=new WeakMap(),pending=new WeakMap(),tails=new WeakMap(),draining=new WeakSet();
function animate(s,path,apply){const show=animators.get(s);if(!show){apply();return;}let done=false;const commit=()=>{if(done)return;done=true;commit.done=true;pending.get(s)?.delete(commit);apply();drain(s);};if(!pending.has(s))pending.set(s,new Set());pending.get(s).add(commit);show(path,commit);}
function drain(s){if(draining.has(s))return;draining.add(s);try{const q=tails.get(s);while(!pending.get(s)?.size&&q?.length)q.shift()();}finally{draining.delete(s);}}
function after(s,fn){if(pending.get(s)?.size){if(!tails.has(s))tails.set(s,[]);if(draining.has(s))tails.get(s).unshift(fn);else tails.get(s).push(fn);}else fn();}
function flush(s){while(pending.get(s)?.size)for(const commit of [...pending.get(s)])commit();drain(s);}
function setAnimator(s,show){animators.set(s,show);}

const R=typeof module==='object'?require('./reflecting-walls.js'):root.ReflectingWalls;
const E=typeof module==='object'?require('./wand-engine.js'):root.WandEngine;
const O=typeof module==='object'?require('./main-oob.js'):root.MainOob;
const effects=new WeakMap();
const spells=['freeze','push','swap','pull'];
function log(g,text){g.wands.events.push({turn:g.turns,text});if(g.wands.events.length>100)g.wands.events.shift();g.wands.revision++;}
function init(g,nav){
 if(g.wands||!g.world.birdMode||!['plane','torus'].includes(g.world.topology||'plane'))return false;
 const s=g.wands={reflectors:R?.main(g.world,nav)||[],items:[],held:[],frozen:0,birds:g.birds.map(()=>({held:[],frozen:0,nextCast:0})),events:[],revision:0,shots:0};
 const queue=[g.world.start],seen=new Set(queue),eligible=[];
 for(const id of queue){if(id!==g.world.start&&id!==g.world.exit&&!g.world.warps?.has(id)&&!(g.world.puzzle?.locks||[]).some(l=>l.key===id||l.door===id)&&!g.birds.some(b=>b.position===id))eligible.push(id);for(let d=0;d<4;d++){const n=nav.step(id,d);if(n!==null&&!seen.has(n)){seen.add(n);queue.push(n);}}}
 const rng=nav.random(g.world.seed+':wands');
 if(eligible.length)s.items.push({id:eligible.splice(Math.min(2,eligible.length-1),1)[0],spell:'freeze'});
 for(let i=1;i<8&&eligible.length;i++){const n=Math.floor(rng()*eligible.length);s.items.push({id:eligible.splice(n,1)[0],spell:spells[i%4]});}
 log(g,'床の / は杖です。Shift+Z または zap → 1〜4 → 矢印 → Enterで発射、Escで取消。');return true;
}
function pickup(g,id,owner,label){const s=g.wands;if(!s)return;const i=s.items.findIndex(v=>v.id===id);if(i<0)return;const [item]=s.items.splice(i,1);if(!owner.held.includes(item.spell))owner.held.push(item.spell);log(g,label+' が '+E.names[item.spell]+'の杖 / を拾いました。');}
function actors(g){return [{key:'@',id:g.player.world_position,frozen:g.wands.frozen},...g.birds.map((b,i)=>({key:'B'+i,id:b.position,frozen:g.wands.birds[i].frozen})).filter((a,i)=>!g.birds[i].oob),...(g.wildlife?.pets||[]).map(p=>({key:p.kind,id:p.id}))];}
function preview(g,nav,spell,d){return E.cast({width:g.world.width,height:g.world.height,cells:Array.from(g.world.cells,v=>v?'.':'#'),step:nav.step,seam:(id,d)=>nav.escape?.(id,d)!=null,reflect:(id,d)=>R?.face(g,id,d),escape:nav.escape},actors(g),'@',d,spell);}
function fire(g,nav,key,spell,d){
 const all=actors(g),before=all.map(a=>a.id),cells=Array.from(g.world.cells,v=>v?'.':'#');
 const result=E.cast({width:g.world.width,height:g.world.height,cells,step:nav.step,seam:(id,d)=>nav.escape?.(id,d)!=null,reflect:(id,d)=>R?.face(g,id,d),escape:nav.escape},all,key,d,spell);
 for(let i=0;i<all.length;i++){const actor=all[i];if(actor.key==='@'){if(actor.id!==before[i])nav.relocate(actor.id);g.wands.frozen=actor.frozen||0;}
 else if(actor.key.startsWith('B')){const n=Number(actor.key.slice(1));g.birds[n].position=actor.id;g.birds[n].previous=null;g.wands.birds[n].frozen=actor.frozen||0;}}
 if(result.oob!=null)O.enter(g,result.target,result.oob);
 if(result.target){const owner=result.target==='@'?g.wands:g.wands.birds[Number(result.target.slice(1))];if(owner&&spell==='freeze')owner.frozenAt=g.turns;}
 effects.set(g,{moved:all.some((a,i)=>a.id!==before[i])});
 g.wands.lastShot={number:++g.wands.shots,turn:g.turns,source:key,path:result.path.map(({seam,...p})=>p)};
 log(g,(key==='@'?'@':g.birds[Number(key.slice(1))].symbol)+' が '+E.names[spell]+'を発射。'+result.message.replace(/B(\d+)/g,(_,i)=>g.birds[Number(i)].symbol));
 for(const point of result.path)if(point.tail)log(g,(point.tail==='c'?'猫 f':'犬 d')+' が尻尾で魔法弾を跳ね返しました。');
 pickup(g,g.player.world_position,g.wands,'@');g.birds.forEach((b,i)=>{if(!b.oob)pickup(g,b.position,g.wands.birds[i],b.symbol);});return true;
}
function bird(g,nav,b){
 const s=g.wands;if(!s||b.oob||O.active(g))return !!b.oob||O.active(g);const i=g.birds.indexOf(b),owner=s.birds[i];
 if(owner.frozen){if(owner.frozenAt!==g.turns)owner.frozen--;return true;}
 pickup(g,b.position,owner,b.symbol);
 if(g.turns%2||b.cooldown>0)return false;
 if(owner.held.length&&g.turns>=owner.nextCast){
  let shot=null;const all=actors(g);
  for(let d=0;d<4;d++){let id=b.position;const seen=new Set([id]);for(let distance=1;distance<=g.world.cells.length;distance++){id=nav.step(id,d);if(id===null||seen.has(id))break;seen.add(id);const a=all.find(a=>a.id===id);if(a){if(['@','c','d'].includes(a.key)&&(!shot||distance<shot.distance))shot={d,distance};break;}}}
  if(shot&&g.birdRandom()<.5){owner.nextCast=g.turns+10;const spell=owner.held[(g.turns+i)%owner.held.length],key='B'+i;const path=E.cast({width:g.world.width,height:g.world.height,cells:Array.from(g.world.cells,v=>v?'.':'#'),step:nav.step,seam:(id,d)=>nav.escape?.(id,d)!=null,reflect:(id,d)=>R?.face(g,id,d),escape:nav.escape},actors(g),key,shot.d,spell).path;animate(g,path,()=>fire(g,nav,key,spell,shot.d));return true;}
 }
 if(s.items.length&&g.birdRandom()<.75){
  const queue=[b.position],parents=new Map([[b.position,null]]);let target=null;
  for(const id of queue){if(s.items.some(v=>v.id===id)){target=id;break;}for(let d=0;d<4;d++){const n=nav.step(id,d);if(n!==null&&!parents.has(n)&&n!==g.player.world_position&&!g.birds.some(other=>other!==b&&other.position===n)){parents.set(n,id);queue.push(n);}}}
  if(target!==null){while(parents.get(target)!==null&&parents.get(target)!==b.position)target=parents.get(target);b.previous=b.position;b.position=target;pickup(g,b.position,owner,b.symbol);return true;}
 }
 return false;
}
const api={after,setAnimator,flush,shotMoved:g=>!!effects.get(g)?.moved,init,pickup,preview,fire,bird,spells,names:E.names};if(typeof module==='object')module.exports=api;else root.MainWands=api;
})(globalThis);

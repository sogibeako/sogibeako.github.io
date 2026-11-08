/* Wands on a directed, sheet-aware graph. No learning or memory is erased. */
(function(root){'use strict';
const animators=new WeakMap(),pending=new WeakMap(),tails=new WeakMap(),draining=new WeakSet();
function animate(s,path,apply){const show=animators.get(s);if(!show){apply();return;}let done=false;const commit=()=>{if(done)return;done=true;commit.done=true;pending.get(s)?.delete(commit);apply();drain(s);};if(!pending.has(s))pending.set(s,new Set());pending.get(s).add(commit);show(path,commit);}
function drain(s){if(draining.has(s))return;draining.add(s);try{const q=tails.get(s);while(!pending.get(s)?.size&&q?.length)q.shift()();}finally{draining.delete(s);}}
function after(s,fn){if(pending.get(s)?.size){if(!tails.has(s))tails.set(s,[]);if(draining.has(s))tails.get(s).unshift(fn);else tails.get(s).push(fn);}else fn();}
function flush(s){while(pending.get(s)?.size)for(const commit of [...pending.get(s)])commit();drain(s);}
function setAnimator(s,show){animators.set(s,show);}

const O=typeof module==='object'?require('./graph-oob.js'):root.GraphOob;
const R=typeof module==='object'?require('./reflecting-walls.js'):root.ReflectingWalls;
const spells=['freeze','push','swap','pull'],names={freeze:'金縛り',push:'吹き飛ばし',swap:'場所替え',pull:'引き寄せ'},dirs=[[0,-1],[1,0],[0,1],[-1,0]];
function supported(s){return !!s.features?.options.birds&&(s.world.mode==='crossingMaze'||s.world.branchMaze||['doubleTwist','quarterCW','quarterCCW','cwTwist','ccwTwist'].includes(s.world.mode)||s.world.mode==='kleinMaze'||s.world.wandTopology==='biaxial'||s.world.mode==='tripleMaze'||s.world.mode==='double'&&!!s.world.lattice);}
function log(s,text){s.wands.events.push({turn:s.steps,text});if(s.wands.events.length>100)s.wands.events.shift();}
function edge(s,id,d){const e=s.world.edges.get(id+':'+d);return e&&s.world.cells[e.to]&&(e.to!==s.features.door||s.features.hasKey)?e:null;}
function init(s){if(s.wands||!supported(s))return;const f=s.features,ids=[...s.world.cells.keys()].filter(id=>s.world.cells[id]&&(s.world.wandTopology!=='biaxial'||id%13!==0)&&(!s.world.quarterBirds||id%(s.world.size+1)!==0)&&![s.id,s.world.exit,f.key,f.door,f.bird].includes(id)&&!f.warps.has(id));let h=2166136261;for(const c of s.world.seed)h=Math.imul(h^c.charCodeAt(0),16777619);const rand=()=>{h=(Math.imul(h,1664525)+1013904223)>>>0;return h;};s.wands={reflectors:R?.graph(s.world)||[],items:[],held:[],frozen:0,bird:{held:[],frozen:0,nextCast:0},events:[]};for(let i=0;i<8&&ids.length;i++)s.wands.items.push({id:ids.splice(rand()%ids.length,1)[0],spell:spells[i%4]});log(s,'杖 /：Shift+Z または zap → 1〜4 → 方向 → Enter。Escで取消。');}
function pickup(s,id,owner,label){const i=s.wands.items.findIndex(p=>p.id===id);if(i<0)return;const p=s.wands.items.splice(i,1)[0];if(!owner.held.includes(p.spell))owner.held.push(p.spell);log(s,label+' が '+names[p.spell]+'の杖 / を拾いました。');}
function actorAt(s,id){if(id===s.id)return '@';if(id===s.features.bird)return 'V';return s.wildlife?.pets?.find(p=>p.id===id)?.kind;}
// Move the player's chart origin along a real path, without observing intermediate tiles.
function relocate(s,to){if(s.id===to)return;const queue=[{id:s.id,frame:s.frame,x:s.x,y:s.y}],seen=new Set([s.id]);for(const p of queue){if(p.id===to){const from=s.id;s.id=to;s.features.last={kind:'wand',from,to};s.frame=p.frame;s.x=p.x;s.y=p.y;s.last={from,to,kind:'wand',worldDirection:4,localDirection:4,changed:true};if(s.loopExperience){s.loopExperience.path=[];s.loopExperience.lastStep=s.steps;}if(s.tripleLoops){s.tripleLoops.points=new Map();}return;}for(let d=0;d<4;d++){const e=edge(s,p.id,d);if(!e||seen.has(e.to))continue;seen.add(e.to);const [dx,dy]=dirs[p.frame.indexOf(d)];queue.push({id:e.to,frame:p.frame.map(k=>e.transform[k]),x:p.x+dx,y:p.y+dy});}}throw Error('杖の移動先に接続できません。');}
function fire(s,source,spell,d,path=[]){s.features.last={kind:'wand',from:s.id,to:s.id};const origin=source==='@'?s.id:s.features.bird;let id=origin,dir=d,reflections=0,distance=0,anchor=origin;const seen=new Set();
 for(let n=0;n<s.world.cells.length*24;n++){
  const key=id+':'+dir+':'+reflections;if(seen.has(key))break;seen.add(key);const e=edge(s,id,dir);if(!e){const mirror=R?.face(s,id,dir);if(!mirror)break;path.push({id:mirror.id,reflection:true});log(s,'ピンクの反射壁が魔法弾を跳ね返しました。');if(++reflections>5)break;dir=(dir+2)%4;anchor=mirror.id;distance=1;}else{id=e.to;dir=e.transform[dir];distance++;path.push({id,seam:!!e.kind&&/boundary|wrap|throat|seam|stairs/.test(e.kind)});}const target=actorAt(s,id);if(!target)continue;
  if(['c','d'].includes(target)){path[path.length-1].tail=target;log(s,(target==='c'?'猫 f':'犬 d')+' が尻尾で魔法弾を跳ね返しました。');if(++reflections>5)break;dir=(dir+2)%4;anchor=id;distance=0;continue;}
  if(spell==='freeze'){const owner=target==='@'?s.wands:s.wands.bird;owner.frozen=5;owner.frozenAt=s.steps;}
  if(spell==='push'&&reflections){const e=edge(s,id,dir);if(O?.boundary(s,id,dir,e)&&(e.to===id||!actorAt(s,e.to))){O.enter(s,target,dir);return path;}}
  let to=id;
  if(spell==='swap'&&source!==target){const old=s.id;relocate(s,s.features.bird);s.features.bird=old;}
  if(spell==='push'||spell==='pull'){
   let moveDir=spell==='pull'?(dir+2)%4:dir;const walked=new Set([to]);const count=spell==='push'?s.world.cells.length:target===source&&!reflections?1:Math.max(0,distance-1);
   for(let k=0;k<count;k++){const next=edge(s,to,moveDir);if(spell==='push'&&next&&['c','d'].includes(actorAt(s,next.to))){log(s,(actorAt(s,next.to)==='c'?'猫 f は':'犬 d は')+(target==='@'?'あなた':'鳥人間 V')+(actorAt(s,next.to)==='c'?'を猫パンチで叩き落としました。':'を空中でキャッチして吠えています！'));break;}if(!next||walked.has(next.to)||actorAt(s,next.to)||spell==='pull'&&next.to===anchor)break;walked.add(next.to);to=next.to;moveDir=next.transform[moveDir];}
   if(target==='@')relocate(s,to);else s.features.bird=to;
  }
  log(s,source+' の '+names[spell]+'が '+target+' に命中しました。');return path;
 }
 log(s,source+' の '+names[spell]+'の魔法弾が消えました。');return path;
}
function bird(s){if(s.wands?.oob)return true;if(!s.wands)return false;const w=s.wands,b=w.bird;pickup(s,s.id,w,'@');if(s.features.bird==null)return false;pickup(s,s.features.bird,b,'V');if(b.frozen){if(b.frozenAt!==s.steps)b.frozen--;return true;}if(s.steps%2||s.features.cooldown)return false;
 let chance=2166136261;for(const c of s.world.seed+'|'+s.steps+'|'+s.features.bird)chance=Math.imul(chance^c.charCodeAt(0),16777619);chance>>>=0;
 if(s.steps>=b.nextCast&&b.held.length&&chance%100<50)for(let d=0;d<4;d++){let id=s.features.bird,dir=d;const seen=new Set();for(let k=0;k<s.world.cells.length*4;k++){const key=id+':'+dir;if(seen.has(key))break;seen.add(key);const e=edge(s,id,dir);if(!e)break;id=e.to;dir=e.transform[dir];const a=actorAt(s,id);if(a){if(['@','c','d'].includes(a)){b.nextCast=s.steps+10;const spell=b.held[s.steps%b.held.length];animate(s,preview(s,spell,d,'V'),()=>fire(s,'V',spell,d));return true;}break;}}}
 if(w.items.length&&chance%4!==0){const q=[s.features.bird],prev=new Map([[s.features.bird,null]]);for(const id of q){if(w.items.some(p=>p.id===id)){let next=id;while(prev.get(next)!==null&&prev.get(next)!==s.features.bird)next=prev.get(next);s.features.bird=next;pickup(s,next,b,'V');return true;}for(let d=0;d<4;d++){const e=edge(s,id,d);if(e&&!prev.has(e.to)&&e.to!==s.id&&e.to!==s.world.exit&&!s.features.warps.has(e.to)){prev.set(e.to,id);q.push(e.to);}}}}return false;
}
function cast(s,spell,d){init(s);if(s.wands?.oob)return false;if(!s.wands?.held.includes(spell)||!Number.isInteger(d)||d<0||d>3)return false;const from=s.id;s.steps++;s.features.last=null;if(s.wands.frozen)s.wands.frozen--;else fire(s,'@',spell,d);bird(s);after(s,()=>{s.last={from,to:s.id,kind:'wand',worldDirection:4,localDirection:4,changed:from!==s.id};s.history.push({x:s.x,y:s.y,id:s.id});if(s.history.length>1000)s.history.shift();});return true;}
function validate(s){const w=s.wands;if(!w)return;if(w.reflectors!==undefined&&(!Array.isArray(w.reflectors)||w.reflectors.length>s.world.cells.length*4||w.reflectors.some(p=>!p||!Number.isInteger(p.from)||!s.world.cells[p.from]||!Number.isInteger(p.id)||p.id<0||p.id>=s.world.cells.length||s.world.cells[p.id]||!Number.isInteger(p.d)||p.d<0||p.d>3||s.world.edges.has(p.from+':'+p.d))))throw Error('反射壁の保存内容が不正です。');const floor=id=>Number.isInteger(id)&&!!s.world.cells[id],held=a=>Array.isArray(a)&&a.length<=4&&new Set(a).size===a.length&&a.every(x=>spells.includes(x)),frozen=n=>Number.isInteger(n)&&n>=0&&n<=5;if(!supported(s)||!Array.isArray(w.items)||w.items.length>8||w.items.some(p=>!floor(p.id)||!spells.includes(p.spell))||!held(w.held)||!frozen(w.frozen)||!w.bird||!held(w.bird.held)||!frozen(w.bird.frozen)||!Number.isSafeInteger(w.bird.nextCast)||w.bird.nextCast<0||!Array.isArray(w.events)||w.events.length>100||w.events.some(e=>!Number.isSafeInteger(e.turn)||typeof e.text!=='string'||e.text.length>500))throw Error('杖の保存内容が不正です。');}
function preview(s,spell,d,source='@'){if(source==='@'&&(!s.wands?.held.includes(spell)||s.wands.frozen))return [];const copy={...s,frame:[...s.frame],features:{...s.features},wildlife:s.wildlife?structuredClone(s.wildlife):undefined,wands:structuredClone(s.wands),loopExperience:undefined,tripleLoops:undefined};return fire(copy,source,spell,d);}

// Read-only hidden OOB planner. Paths are physical directions; callers convert only the next step.
function oobProbe(s,id,d){const copy={...s,id,frame:[...s.frame],features:{...s.features},wildlife:s.wildlife?structuredClone(s.wildlife):undefined,wands:structuredClone(s.wands),loopExperience:undefined,tripleLoops:undefined};copy.wands.held=['push'];fire(copy,'@','push',d);return copy.wands.oob?.direction;}
function planOob(s){
 if(s.wands?.oob)return {done:true};if(!s.wands||!O?.supported(s))return null;
 const q=[s.id],parents=new Map([[s.id,null]]),f=s.features;
 for(const id of q)for(let d=0;d<4;d++){const e=edge(s,id,d);if(!e||e.to===f.bird)continue;const to=f.warps.get(e.to)??e.to;if(to===f.bird||parents.has(to))continue;parents.set(to,[id,d]);q.push(to);}
 const path=id=>{const out=[];while(parents.get(id)){const [from,d]=parents.get(id);out.push(d);id=from;}return out.reverse();};
 const held=s.wands.held.includes('push'),item=q.find(id=>s.wands.items.some(i=>i.id===id&&i.spell==='push'));
 const key=()=>!f.hasKey&&f.key!=null&&parents.has(f.key)&&f.key!==s.id?{path:path(f.key)}:null;
 if(!held&&item===undefined)return key();
 let target,shot;
 for(const id of q){if(id===f.bird||s.wildlife?.pets.some(p=>p.id===id))continue;if(![0,1,2,3].some(d=>O.boundary(s,id,d,edge(s,id,d))))continue;
 for(let d=0;d<4;d++)if(oobProbe(s,id,d)!==undefined){target=id;shot=d;break;}if(target!==undefined)break;}
 if(target===undefined)return key();
 if(!held){const ds=path(item);return ds.length?{path:ds}:{wait:true};}
 const ds=path(target);return ds.length?{path:ds}:{cast:shot};
}
const api={planOob,oobProbe,returnOob:s=>O.home(s,edge,relocate),after,setAnimator,flush,preview,init,supported,cast,bird,validate,spells,names};if(typeof module==='object')module.exports=api;else root.GraphWands=api;
})(globalThis);

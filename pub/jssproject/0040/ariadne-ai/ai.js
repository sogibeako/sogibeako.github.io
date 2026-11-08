(function(root){
'use strict';
const Game=typeof module!=='undefined'?require('../ariadne-graph-escape/engine.js').Game:root.AriadneGame;
const policies=new WeakMap(),exitIntent=new WeakMap(),cycleRoutes=new WeakMap(),goldRoutes=new WeakMap();
const names=['金縛り','吹き飛ばし','場所替え','身代わり'];
function rng(seed){return ()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);}
function create(seed){return new Game(rng(seed>>>0),rng((seed^0xface)>>>0));}
function clone(g,seed){const data={};for(const [k,v] of Object.entries(g))if(typeof v!=='function')data[k]=v;const h=Object.assign(Object.create(Game.prototype),structuredClone(data));h.random=rng(seed);h.flavorRandom=rng(seed^0xbeef);h.logs=[];h.sounds=[];h.log=()=>{};h.sound=()=>{};h.flavor=()=>{};if(h.criticalScenario)stress(h);return h;}
function target(g,deep){return g.mapKind==='fork'&&deep&&g.emblem?g.door:g.exit;}
function actions(g,deep=false){if(g.ended)return [];if(g.playerFrozen)return [{kind:'wait'}];const result=[{kind:'wait'},...g.nodes[g.player].links.map(to=>({kind:'move',to}))];if(g.player===target(g,deep))result.unshift({kind:'descend'});if(g.charges.some(n=>n>0))g.shotPaths().forEach((path,index)=>{if(!path.slice(1).some(n=>g.enemyAt(n)))return;g.charges.forEach((n,type)=>{if(n>0)result.push({kind:'wand',type,to:path.at(-1),index});});});return result;}
function apply(g,a){g.aim=null;if(a.kind==='wait')g.wait();else if(a.kind==='move')g.move(a.to);else if(a.kind==='descend')g.descend();else{g.equip(a.type);g.shotIndex=a.index;g.fire(a.to);}g.takeSounds();}
function label(g,a){if(a.kind==='wait')return '待機';if(a.kind==='descend')return g.mapKind==='fork'?(g.player===g.exit?'帰還する':'扉の先へ'):'階段を降りる';if(a.kind==='wand')return `${names[a.type]} → ノード ${a.to+1}`;return `${g.enemyAt(a.to)?'攻撃':'移動'} → ノード ${a.to+1}`;}
// Estimate the effort to OPEN a route, not just its geometric distance.
// Frozen enemies still occupy their node. Immortals require a detour or a wand.
function routeCost(g,goal){const costs=g.nodes.map(()=>Infinity),done=new Set();costs[g.player]=0;for(let i=0;i<g.nodes.length;i++){let at=-1;for(const n of g.nodes)if(!done.has(n.id)&&(at<0||costs[n.id]<costs[at]))at=n.id;if(at<0||!Number.isFinite(costs[at]))break;if(at===goal)return costs[at];done.add(at);for(const to of g.nodes[at].links){const e=g.enemyAt(to);const obstacle=!e?0:e.underworld&&!e.decoy?0:e.immortal?30:e.phantom?1:1+12*e.hp/g.swordBase;costs[to]=Math.min(costs[to],costs[at]+1+obstacle);}}return 1000;}
function combatProgress(g,base){return base.enemies.reduce((sum,e)=>{if(e.immortal||e.phantom||e.decoy||e.quantum)return sum;const now=g.enemies.find(x=>x.id===e.id);return sum+Math.max(0,e.hp-(now?.hp??0));},0);}
// This override exists only on simulation copies. One direct hit is promoted
// to maximum critical damage; other attacks and the real game are untouched.
function stress(g){g.criticalScenario=true;g.enemyDamage=function(e,critical=false,againstPlayer=false){if(againstPlayer&&!e.phantom&&!this.criticalUsed){this.criticalUsed=true;return Math.floor(((e.mega?89:69)+(e.hero?this.heroBonus():0))*(e.damageScale??1)*(this.emblem?1.2:1));}return Game.prototype.enemyDamage.call(this,e,critical,againstPlayer);};}
function threat(g){const active=g.enemies.filter(e=>!e.frozen&&!e.decoy&&!e.phantom&&!e.skip);const adjacent=active.filter(e=>g.nodes[g.player].links.includes(e.pos));const normal=adjacent.reduce((sum,e)=>sum+g.enemyNormalMax(e),0);const critical=adjacent.reduce((max,e)=>Math.max(max,Math.floor(((e.mega?89:69)+(e.hero?g.heroBonus():0))*(e.damageScale??1)*(g.emblem?1.2:1))-g.enemyNormalMax(e)),0);return {active,adjacent,burst:normal+critical};}
function policy(g,previous){const danger=threat(g),dist=g.distances(g.player);const safe=!danger.active.some(e=>dist[e.pos]<=2||e.mage&&e.wand?.charges>0);const same=previous?.floor===g.floor;
 if(g.mapKind==='fork'||g.player===g.exit)return {mode:'escape',floor:g.floor,text:'脱出：出口・分かれ道へ進む'};
 if(safe&&g.hp<g.maxHp*(same&&previous.mode==='recover'?.9:.65))return {mode:'recover',floor:g.floor,text:'回復：敵の接近を監視しながらHP90%まで回復'};
 if(danger.adjacent.length&&g.hp<=danger.burst)return {mode:'escape',floor:g.floor,text:'退避：痛恨と同時攻撃に備え、距離や杖で安全を確保'};
 const retained=same&&previous.mode==='fight'?g.enemies.find(e=>e.id===previous.enemyId):null;
 const enemy=retained&&!retained.decoy&&!retained.immortal&&dist[retained.pos]<=2?retained:g.enemies.find(e=>!e.decoy&&!e.immortal&&!e.phantom&&dist[e.pos]===1&&(!e.frozen||e.pos===g.exit));
 if(enemy)return {mode:'fight',floor:g.floor,enemyId:enemy.id,text:'戦闘：'+g.enemyName(enemy)+'を倒し、道と安全を確保'};
 return {mode:'escape',floor:g.floor,text:'脱出：安全な経路で次の階を目指す'};
}
// Ignore logs, turn counters and player HP in the board identity. Healing
// clears the history; enemy damage, charges and status changes are real progress.
function boardKey(g){return JSON.stringify([g.floor,g.player,g.maxHp,g.level,g.charges,g.playerFrozen,g.freezeGrace,g.confused,g.nodes.map(n=>n.links),[...g.enemies].sort((a,b)=>a.id-b.id),[...g.items].sort((a,b)=>a[0]-b[0]),[...g.visited].sort((a,b)=>a-b)]);}
function observe(g,memory){let record=memory.get('$boards');if(!record||record.floor!==g.floor){record={floor:g.floor,hp:g.hp,turn:null,counts:new Map()};memory.set('$boards',record);}if(record.turn===g.turn)return;if(g.hp>record.hp)record.counts.clear();const key=boardKey(g);record.counts.set(key,(record.counts.get(key)||0)+1);record.hp=g.hp;record.turn=g.turn;}
function repeatPenalty(g,memory){const record=memory.get('$boards');if(!record||record.floor!==g.floor||g.hp>record.hp)return 0;const count=(record.counts.get(boardKey(g))||0)+(record.turn===g.turn?0:1);return Math.min(20,Math.max(0,count-3)*2);}
// Only use a guaranteed static route: full health, no acting enemies/statuses,
// and no timed underworld arrivals. Keep the intent until the floor changes.
function safeExitAction(g,memory,deep){if(g.ended||g.hp<g.maxHp||g.playerFrozen||g.confused>0||g.floor>=40||g.enemies.some(e=>!e.frozen)){exitIntent.delete(g);return null;}const goal=target(g,deep),old=exitIntent.get(g);if(!(old?.floor===g.floor&&old.goal===goal)&&repeatPenalty(g,memory)<2)return null;
 const queue=[[g.player]],seen=new Set([g.player]);let path;for(const p of queue){const at=p.at(-1);if(at===goal){path=p;break;}for(const n of g.nodes[at].links)if(!seen.has(n)&&!g.enemyAt(n)){seen.add(n);queue.push([...p,n]);}}
 if(!path){exitIntent.delete(g);return null;}exitIntent.set(g,{floor:g.floor,goal});return path.length===1?{kind:'descend'}:{kind:'move',to:path[1]};}
// Escape a repeated movement cycle using deterministic melee movement only.
// Spellcasters, decoys and special movement need probabilistic planning instead.
function cycleAction(g,memory,deep){if(g.ended||g.hp<g.maxHp||g.playerFrozen||g.confused||g.floor>=40||g.enemies.some(e=>e.decoy||e.mage||e.quantum||e.builder||e.underworld)){cycleRoutes.delete(g);return null;}
 const goal=target(g,deep);let intent=cycleRoutes.get(g);if(intent?.floor!==g.floor||intent?.goal!==goal){cycleRoutes.delete(g);intent=null;}
 const advance=(state,to)=>{if(!state.nodes[state.player].links.includes(to)||state.enemyAt(to))return null;const h=clone(state,421);apply(h,{kind:'move',to});return !h.dead&&h.floor===state.floor&&h.hp>=state.hp?h:null;};
 if(intent){while(intent.path[0]===g.player)intent.path.shift();if(intent.path.length&&advance(g,intent.path[0]))return {kind:'move',to:intent.path[0]};cycleRoutes.delete(g);}
 if(repeatPenalty(g,memory)<6)return null;
 const remaining=state=>{const queue=[[state.player,0]],seen=new Set([state.player]);for(const [at,d]of queue){if(at===goal)return d;for(const n of state.nodes[at].links)if(!seen.has(n)&&!state.enemyAt(n)?.frozen){seen.add(n);queue.push([n,d+1]);}}return Infinity;};
 const initial=remaining(g);if(!Number.isFinite(initial))return null;let beam=[{state:g,path:[]}],best=null;const seen=new Set([boardKey(g)]);
 for(let depth=0;depth<8;depth++){const next=[];for(const branch of beam)for(const to of branch.state.nodes[branch.state.player].links){const h=advance(branch.state,to);if(!h)continue;const key=boardKey(h);if(seen.has(key))continue;seen.add(key);const d=remaining(h),candidate={state:h,path:[...branch.path,to],distance:d};next.push(candidate);if(d<initial&&(!best||d<best.distance||d===best.distance&&candidate.path.length<best.path.length))best=candidate;}
 next.sort((a,b)=>a.distance-b.distance||repeatPenalty(a.state,memory)-repeatPenalty(b.state,memory));beam=next.slice(0,12);if(!beam.length||best?.distance===0)break;}
 if(!best)return null;cycleRoutes.set(g,{floor:g.floor,goal,path:best.path});return {kind:'move',to:best.path[0]};}
// Gold is an intermediate walking goal, never a reason to spend a wand or attack.
// Only deterministic movement is eligible; validate the pickup AND onward exit route.
function goldAmount(item){return item?[item,...(item.stack||[])].reduce((sum,x)=>sum+(x.kind==='gold'?x.value:0),0):0;}
function freePath(g,start,goal){const queue=[[start]],seen=new Set([start]);for(const path of queue){const at=path.at(-1);if(at===goal)return path;for(const to of g.nodes[at].links)if(!seen.has(to)&&!g.enemyAt(to)){seen.add(to);queue.push([...path,to]);}}return null;}
function goldAction(g,deep,plan,memory){
 let record=goldRoutes.get(g);if(record?.floor!==g.floor){record={floor:g.floor,budget:8,intent:null};goldRoutes.set(g,record);}
 const goal=target(g,deep);
 if(g.ended||g.mapKind==='fork'||g.player===goal||g.playerFrozen||g.confused||g.floor>=40||plan.mode==='fight'||threat(g).adjacent.length||g.enemies.some(e=>e.decoy||!e.frozen&&(e.mage||e.quantum||e.builder||e.underworld))){record.intent=null;return null;}
 const walk=(state,path)=>{const h=clone(state,811);h.floorDamaged=false;for(const to of path.slice(1)){if(h.enemyAt(to)||!h.nodes[h.player].links.includes(to))return null;apply(h,{kind:'move',to});if(h.ended||h.floor!==state.floor||h.floorDamaged||h.player!==to||h.playerFrozen||h.confused)return null;}return h;};
 const viable=path=>{const h=walk(g,path);if(!h)return false;const onward=freePath(h,h.player,goal);return !!onward&&!!walk(h,onward);};
 let intent=record.intent;
 if(intent){while(intent.path.length>1&&intent.path[1]===g.player)intent.path.shift();if(intent.goal===goal&&goldAmount(g.items.get(intent.node))>0&&intent.path[0]===g.player&&intent.path.length>1&&viable(intent.path))return {kind:'move',to:intent.path[1],gold:intent.amount};record.intent=null;}
 // Leave repeated boards to the existing escape guards instead of starting new detours.
 if(repeatPenalty(g,memory)>=2)return null;
 const direct=freePath(g,g.player,goal);if(!direct)return null;
 const candidates=[];for(const [node,item]of g.items){const amount=goldAmount(item);if(amount<=0||node===g.player)continue;const path=freePath(g,g.player,node),onward=freePath(g,node,goal);if(!path||!onward||path.length>7)continue;const extra=Math.max(0,path.length+onward.length-direct.length-1);if(extra>4||extra>record.budget)continue;const merit=Math.min(amount,200)/(1+extra+0.25*(path.length-1));candidates.push({node,path,amount,extra,merit});}
 candidates.sort((a,b)=>b.merit-a.merit||a.node-b.node);
 for(const candidate of candidates)if(viable(candidate.path)){record.budget-=candidate.extra;record.intent={...candidate,goal};return {kind:'move',to:candidate.path[1],gold:candidate.amount};}
 return null;
}
function value(g,base,deep,memory,plan){if(g.dead)return -10000;if(g.won)return 20000;if(g.floor>base.floor)return 1000+(g.floor-base.floor)*100+g.hp;const distance=routeCost(g,target(g,deep));const danger=g.enemies.filter(e=>!e.frozen&&!e.decoy&&!e.phantom&&g.nodes[g.player].links.includes(e.pos)).length;const recovering=plan.mode==='recover',focus=plan.mode==='fight'?base.enemies.find(e=>e.id===plan.enemyId):null;const focused=focus?Math.max(0,focus.hp-(g.enemies.find(e=>e.id===focus.id)?.hp??0)):0;return (g.hp-base.hp)*(recovering?6:2.5)+focused*.5+combatProgress(g,base)+(g.score-base.score)*.035+(g.level-base.level)*70+(g.charges.reduce((a,b)=>a+b,0)-base.charges.reduce((a,b)=>a+b,0))*12-distance*(recovering?1:9)-danger*12+(g.visited.size-base.visited.size)*3-(g.turn-base.turn)*(recovering?.2:3)-repeatPenalty(g,memory)+g.enemies.filter(e=>e.frozen||e.decoy).length*9;}
function decide(g,{depth=2,samples=3,deep=false,memory=new Map(),learnedValue=null,beamWidth=2}={}){
 if(g.ended)return null;observe(g,memory);depth=Math.max(1,Math.min(3,depth));samples=Math.max(1,Math.min(5,samples));beamWidth=Math.max(1,Math.min(4,Math.floor(beamWidth)||1));let simulations=0;const plan=policy(g,policies.get(g));policies.set(g,plan);
 const assess=h=>value(h,g,deep,memory,plan)+(!h.ended&&h.floor===g.floor&&learnedValue?Math.max(-120,Math.min(120,learnedValue(h))):0);
 const ranked=actions(g,deep).map(action=>{const outcomes=[];for(let sample=0;sample<=samples;sample++){
  let state=clone(g,7919*(sample+1)+g.turn*31);if(sample===samples)stress(state);apply(state,action);simulations++;let score=assess(state);
  let beam=[{state,score}];
  for(let d=1;d<depth;d++){
   const expanded=[];for(const branch of beam){if(branch.state.ended||branch.state.floor!==g.floor){expanded.push(branch);continue;}
    for(const next of actions(branch.state,deep)){const h=clone(branch.state,104729*(sample+1)+d*3571+g.turn);apply(h,next);simulations++;expanded.push({state:h,score:branch.score*.35+assess(h)*.65});}}
   expanded.sort((a,b)=>b.score-a.score);const seen=new Set();beam=[];for(const branch of expanded){const key=boardKey(branch.state)+':'+branch.state.hp+':'+branch.state.regen;if(seen.has(key))continue;seen.add(key);beam.push(branch);if(beam.length===beamWidth)break;}if(!beam.length)break;
  }
  if(beam.length){state=beam[0].state;score=beam[0].score;}
  outcomes.push({score,hp:state.hp,dead:state.dead});}
 const normal=outcomes.slice(0,samples),critical=outcomes.at(-1),average=normal.reduce((n,x)=>n+x.score,0)/samples,worst=Math.min(...normal.map(x=>x.score));return {action,label:label(g,action),value:(average*.8+worst*.2)*.84+critical.score*.16,meanHp:normal.reduce((n,x)=>n+x.hp,0)/samples,deaths:normal.filter(x=>x.dead).length,criticalHp:critical.hp,criticalDeath:critical.dead};}).sort((a,b)=>b.value-a.value);
 const safe=safeExitAction(g,memory,deep),cycle=safe?null:cycleAction(g,memory,deep),gold=safe||cycle?null:goldAction(g,deep,plan,memory),override=safe||cycle||gold;const preferred=override?ranked.findIndex(r=>r.action.kind===override.kind&&r.action.to===override.to):-1;if(preferred>0)ranked.unshift(...ranked.splice(preferred,1));
 return {action:ranked[0].action,ranked,simulations,plan,samples,beamWidth,safeExit:!!safe,cycleEscape:!!cycle,goldPickup:!!gold,reason:`${safe?'安全な出口経路を確認：停滞を終えて階段へ進みます。 ':cycle?'往復を検出：敵の移動を試算した無傷の迂回経路を継続します。 ':gold?`安全なゴールド回収：$${gold.gold}を途中の目標にし、回収後の出口経路も確認。 `:''}${learnedValue?'学習モデル併用 ／ ':''}${plan.text}。${depth}手先・候補列${beamWidth}本・通常${samples}試算＋最大痛恨1回の危険シナリオ。生存、HP、敵を倒して道を開く進捗、出口までの障害、杖の残量を比較し、平均評価と悪い結果の両方を重視。同じ盤面の反復減点：${repeatPenalty(g,memory)}。`};
}
const api={rng,create,clone,actions,apply,decide,label,policy,stress,threat,boardKey,observe,repeatPenalty,safeExitAction,cycleAction,goldAction};root.AriadneAI=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);

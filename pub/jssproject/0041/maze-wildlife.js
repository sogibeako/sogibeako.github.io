/* Wildlife with directional greeting and actor/pet exchange. State is JSON-safe; navigation belongs to each world. */
(function(root){'use strict';
const Dialogue=typeof module==='object'?require('./wildlife-dialogue.js'):root.WildlifeDialogue;
const floorCache=new WeakMap();
function floors(w){if(!floorCache.has(w))floorCache.set(w,Array.from(w.cells.keys()).filter(id=>w.cells[id]));return floorCache.get(w);}
function random(s){s.rng=(Math.imul(s.rng,1664525)+1013904223)>>>0;return s.rng/4294967296;}
function ensure(host,a){if(host.wildlife)return host.wildlife;let h=2166136261;for(const c of String(a.seed)+'|wildlife')h=Math.imul(h^c.charCodeAt(0),16777619);const s=host.wildlife={rng:h>>>0,turn:0,pets:[],food:[],event:''};const pool=a.floors.filter(id=>id!==a.player&&!a.birds().some(b=>b.id===id)&&!a.special(id));for(const kind of ['d','c']){if(!pool.length)break;const i=Math.floor(random(s)*pool.length);s.pets.push({kind,id:pool.splice(i,1)[0],previous:null,mode:'wander',left:0});}s.actorPositions=[a.player,...a.birds().map(b=>b.id)];return s;}
function distances(a,start,limit=8){const m=new Map([[start,0]]),q=[start];for(const id of q){if(m.get(id)>=limit)continue;for(const e of a.edges(id))if(!m.has(e.to)){m.set(e.to,m.get(id)+1);q.push(e.to);}}return m;}
// Trace straight rays in the transported local frame, including across seams.
function sees(a,from,to){if(from===to)return true;for(let d=0;d<4;d++){let id=from,dir=d;for(let n=0;n<6;n++){const e=a.edges(id).find(e=>e.dir===dir);if(!e)break;id=e.to;dir=(e.transform||[0,1,2,3])[dir];if(id===to)return true;}}return false;}
function birdThreat(host,a,id){const cat=host.wildlife?.pets.find(p=>p.kind==='c');return !!cat&&cat.mode!=='sleep'&&sees(a,cat.id,id);}
function status(host){const s=host.wildlife;if(!s)return '';const names={wander:'散歩',sleep:'睡眠',eat:'食事',chase:'鳥人間を追跡',flee:'退避',food:'食料へ',leap:'転移',playChase:'追いかけっこ・追う',playFlee:'追いかけっこ・逃げる',invite:'猫を遊びに誘う'};return s.pets.map(p=>(p.kind==='d'?'犬 d':'猫 f')+'：'+(names[p.mode]||'散歩')+(p.kind==='c'&&p.phase?'（'+({active:'散歩の時間',drowsy:'うとうと',deep:'熟睡'}[p.phase]||'')+'）':'')+(p.mode==='eat'?' 残り'+p.left+'ターン':'')).join(' ／ ')+(s.event?' ／ '+s.event:'');}
function contactLog(s,text){(s.log??=[]).push({turn:s.turn,text});if(s.log.length>100)s.log.shift();}
// Actors enter a pet's cell; only the pet moves to the actor's departure cell.
function settleActors(host,a){const s=ensure(host,a),actors=[a.player,...a.birds().map(b=>b.id)],old=s.actorPositions||actors;
 for(let i=0;i<actors.length;i++){const pet=s.pets.find(p=>p.id===actors[i]);if(!pet)continue;
  const free=id=>a.floors.includes(id)&&!actors.includes(id)&&!s.pets.some(p=>p!==pet&&p.id===id);
  let to=old[i];if(!free(to)){const q=[pet.id],seen=new Set(q);to=null;for(const id of q){if(free(id)){to=id;break;}for(const e of a.edges(id))if(!seen.has(e.to)){seen.add(e.to);q.push(e.to);}}}
  if(to!=null){pet.previous=pet.id;pet.id=to;pet.contactTurn=s.turn;contactLog(s,i===0?'あなたは'+(pet.kind==='c'?'猫 f':'犬 d')+' を撫でながらすれ違いました。':'鳥人間 V は'+(pet.kind==='c'?'猫 f':'犬 d')+' と場所を交換しました。');}
 }s.actorPositions=actors;
}
function enter(host,a,from,to){const s=ensure(host,a);s.actorPositions??=[from,...a.birds().map(b=>b.id)];s.actorPositions[0]=from;settleActors(host,{...a,player:to});}
function tick(host,a){const s=ensure(host,a);s.turn++;s.event='';settleActors(host,a);const before=new Map(s.pets.map(p=>[p.kind,p.mode+':'+p.phase])),dialogueBefore=new Map(s.pets.map(p=>[p.kind,{id:p.id,mode:p.mode,phase:p.phase}]));
 if(s.turn%12===0&&s.food.length<3){const pool=a.floors.filter(id=>!a.special(id)&&id!==a.player&&!s.food.some(f=>f.id===id)&&!s.pets.some(p=>p.id===id));if(pool.length)s.food.push({id:pool[Math.floor(random(s)*pool.length)]});}
 function movePet(p,to){if(to===a.player){contactLog(s,p.kind==='c'?'猫 f はあなたの足元に頭をこすりつけました。':'犬 d はあなたにじゃれつきました。');return false;}if(a.birds().some(b=>b.id===to)){if(p.kind==='d')teleport(p);else contactLog(s,'猫 f は鳥人間 V に唸りました。');return false;}if(s.pets.some(other=>other!==p&&other.id===to))return false;p.previous=p.id;p.id=to;return true;}
 const cat=s.pets.find(p=>p.kind==='c'),dog=s.pets.find(p=>p.kind==='d');
 function flee(id,threat){const m=distances(a,threat,12),edges=a.edges(id);edges.sort((x,y)=>(m.get(y.to)??99)-(m.get(x.to)??99));return edges[0]?.to??id;}
 if(cat&&cat.mode!=='sleep'){for(const bird of a.birds())if(sees(a,cat.id,bird.id)){a.moveBird(bird,flee(bird.id,cat.id));s.event='猫が鳥人間に唸っています';}}
 if(cat){
  if(!cat.phase&&cat.mode==='sleep'){cat.phase='deep';cat.phaseLeft=Math.max(1,cat.left)+1;}
  if(!cat.phase||--cat.phaseLeft<=0){cat.phase=cat.phase==='active'?'drowsy':cat.phase==='drowsy'?'deep':'active';cat.phaseLeft=cat.phase==='active'?70+Math.floor(random(s)*71):cat.phase==='drowsy'?30+Math.floor(random(s)*31):50+Math.floor(random(s)*51);if(cat.phase==='deep'&&cat.mode!=='eat'){cat.mode='sleep';cat.left=cat.phaseLeft;}else if(cat.phase==='active'&&cat.mode==='sleep'){cat.mode='wander';cat.left=0;}}
 }
 if(s.playCooldown>0)s.playCooldown--;
 if(s.play&&(--s.play.left<=0||!cat||!dog||cat.mode==='eat'||cat.mode==='sleep'||s.food.some(f=>f.id===dog.id)||a.birds().some(b=>sees(a,dog.id,b.id)))){s.play=null;s.playCooldown=35;}
 if(!s.play&&!s.playCooldown&&dog&&cat&&cat.phase!=='deep'&&cat.mode!=='sleep'&&cat.mode!=='eat'&&dog.mode!=='eat'&&sees(a,dog.id,cat.id)&&random(s)<.16){s.play={left:18+Math.floor(random(s)*19),mutual:random(s)<.55};s.event=s.play.mutual?'猫が誘いに応じて、犬と追いかけっこを始めました':'犬が猫を遊びに誘っています';}
 for(const pet of s.pets){
  if(pet.contactTurn===s.turn||pet.contactTurn===s.turn-1){delete pet.contactTurn;continue;}
  if(pet===dog&&cat?.mode==='eat'&&sees(a,cat.id,dog.id)&&distances(a,cat.id,3).has(dog.id)){movePet(pet,a.warp(flee(pet.id,cat.id)));pet.mode='flee';pet.left=2;s.event='食事中の猫が犬を追い払いました';continue;}
  const food=s.food.find(f=>f.id===pet.id);
  if(food){if(pet.mode!=='eat'){pet.mode='eat';pet.left=5;}pet.left--;if(pet.left===0){s.food.splice(s.food.indexOf(food),1);pet.mode='wander';}continue;}
  if(pet.kind==='c'&&pet.phase==='deep'&&pet.mode!=='sleep'){pet.mode='sleep';pet.left=pet.phaseLeft;}
  if(pet.mode==='sleep'&&pet.left>0){pet.left--;continue;}
  const birds=a.birds(),target=pet.kind==='d'?birds.find(b=>sees(a,pet.id,b.id)):null;
  if(pet.kind==='d'&&target?.id===pet.id){teleport(pet);continue;}
  let choices=a.edges(pet.id);if(!choices.length)continue;
  const meal=s.food.find(f=>sees(a,pet.id,f.id));let towards=target?.id??meal?.id;
  if(pet.kind==='c'&&!meal&&!s.play&&pet.phase==='drowsy'&&random(s)<.32){pet.mode='sleep';pet.left=3+Math.floor(random(s)*5);continue;}
  if(s.play&&!target&&!meal&&(pet===dog||s.play.mutual)){
   const other=pet===dog?cat:dog,chaser=Math.floor(s.play.left/6)%2===0?dog:cat;
   const chasing=pet===chaser;pet.mode=chasing?'playChase':s.play.mutual?'playFlee':'invite';
   if(chasing){const ranked=choices.map(e=>({e,d:distances(a,e.to,12).get(other.id)??99}));ranked.sort((a,b)=>a.d-b.d);movePet(pet,a.warp(ranked[0].e.to));}
   else {movePet(pet,a.warp(flee(pet.id,other.id)));}
   continue;
  }
  if(pet.kind==='d'&&!target&&sees(a,pet.id,a.player)&&(pet.left>0||random(s)<.2)){pet.mode='flee';pet.left=Math.max(0,pet.left-1);const next=flee(pet.id,a.player);movePet(pet,a.warp(next));}
  else {if(towards!=null){const ranked=choices.map(e=>({e,d:distances(a,e.to,12).get(towards)??99}));const best=Math.min(...ranked.map(x=>x.d));choices=ranked.filter(x=>x.d===best).map(x=>x.e);pet.mode=target?'chase':'food';}else {pet.mode='wander';const onward=choices.filter(e=>e.to!==pet.previous);if(onward.length)choices=onward;if(random(s)<.15)continue;}const next=choices[Math.floor(random(s)*choices.length)].to;movePet(pet,a.warp(next));}
  if(pet.kind==='d'&&a.birds().some(b=>b.id===pet.id))teleport(pet);
 }
 function teleport(pet){const pool=a.floors.filter(id=>id!==pet.id&&id!==a.player&&!a.birds().some(b=>b.id===id)&&!s.pets.some(p=>p!==pet&&p.id===id)&&!a.special(id));if(pool.length){pet.id=pool[Math.floor(random(s)*pool.length)];pet.mode='leap';pet.previous=null;s.event='犬が鳥人間に触れて転移しました';}}
 settleActors(host,a);
 const entries=s.log??=[];
 if(s.event)entries.push({turn:s.turn,text:s.event});
 for(const pet of s.pets)if(before.get(pet.kind)!==pet.mode+':'+pet.phase)entries.push({turn:s.turn,text:status({wildlife:{pets:[pet]}})});
 Dialogue?.update(s,a,dialogueBefore,sees);
 if(entries.length>100)entries.splice(0,entries.length-100);
 if(typeof root.dispatchEvent==='function'&&typeof root.CustomEvent==='function'){
  const detail={source:root,seed:String(a.seed??''),turn:s.turn,status:status(host),entries:entries.slice()};
  root.dispatchEvent(new root.CustomEvent('maze-wildlife-update',{detail}));
  try{if(root.parent&&root.parent!==root)root.parent.dispatchEvent(new root.parent.CustomEvent('maze-wildlife-update',{detail}));}catch(_){}
 }
 return s;
}
function petSymbol(kind){return kind==='c'?'f':kind;}
function glyph(host,a,id,visible=true){const s=ensure(host,a);return visible?(petSymbol(s.pets.find(p=>p.id===id)?.kind)||(s.food.some(f=>f.id===id)?'%':null)):null;}
function graph(state){const w=state.world,f=state.features;return {seed:w.seed,player:state.id,floors:floors(w),special:id=>id===w.start||id===w.exit||id===f?.door||id===f?.key||f?.warps?.has(id),edges:id=>[0,1,2,3].flatMap(dir=>{const e=w.edges.get(id+':'+dir);return e&&w.cells[e.to]&&!(e.to===f?.door&&!f.hasKey)?[{to:e.to,dir,kind:e.kind,transform:e.transform||e.t}]:[];}),warp:id=>f?.warps?.get(id)??id,birds:()=>f?.bird!=null?[{id:f.bird}]:[],moveBird:(b,id)=>{f.bird=id;}};}
// Shared live-actor palette. Identify the actor, not a similarly named key/mark.
const palette=Object.freeze({d:Object.freeze({ink:'#ffd39b',tile:'#59452b'}),c:Object.freeze({ink:'#b7dbff',tile:'#2b465f'}),bird:Object.freeze({ink:'#ffb1c5',tile:'#563044'})});
function paint(ctx,host,id,glyph,x,y,size,beyond=false){
 if(glyph==='#'){const R=typeof module==='object'?require('./reflecting-walls.js'):root.ReflectingWalls;if(R?.paint(ctx,host,id,x,y,size))return true;}
 if(glyph==='@'||id===(host.player?.world_position??host.id))return false;
 const pet=host.wildlife?.pets.find(p=>p.id===id&&petSymbol(p.kind)===glyph);
 const bird=(host.features?.bird===id&&glyph==='V')||host.birds?.some(b=>b.position===id&&(b.symbol||'V')===glyph);
 const actor=pet?palette[pet.kind]:bird?palette.bird:null;if(!actor)return false;const color=beyond?{ink:'#111',tile:'#e9aac5'}:actor;
 ctx.fillStyle=color.tile;ctx.fillRect(x-size/2,y-size/2,size-(size>8?1:0),size-(size>8?1:0));ctx.fillStyle=color.ink;return true;
}
function projectedGlyph(state,t,complete=false,truth=false){if(t.wall)return null;const visible=truth||!t.remembered;return api.graphGlyph(state,t.id,visible||complete)||((visible||complete)&&state.features?.bird===t.id?'V':null);}
const api={enter,settleActors,projectedGlyph,palette,paint,status,birdThreat,floors,ensure,tick,glyph,sees,graph,graphTick:s=>tick(s,graph(s)),graphGlyph:(s,id,bright=true)=>glyph(s,graph(s),id,bright||!!s.atlasComplete)};if(typeof module==='object')module.exports=api;else root.MazeWildlife=api;
})(globalThis);

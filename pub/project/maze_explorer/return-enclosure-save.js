(function(root){'use strict';
const H=typeof module==='object'?require('./return-enclosure.js'):root.ReturnEnclosure,S=typeof module==='object'?require('./connection-space.js'):root.ConnectionSpace,R=typeof module==='object'?require('./lattice-holes-loops.js'):root.SkewLoops;
function stamp(w){let h=2166136261;const text=JSON.stringify([[...w.cells],[...w.edges],w.start,w.exit]);for(const c of text)h=Math.imul(h^c.charCodeAt(0),16777619);return (h>>>0).toString(16);}
// New wand games store an exact snapshot; legacy walking replays remain readable.
const G=typeof module==='object'?require('./graph-wands.js'):root.GraphWands;
const fields=['wildlife','id','frame','x','y','steps','history','last','features','wands','markEvents','annotations','loopExperience','loopThreshold','foldLoops','verticalCrossings','seenFloors','atlasComplete','markPeriods','replayMoves','wandInterrupted'];
function snapshot(state,completed,book){
 G.flush(state);if(!book)throw Error('地図の記憶を含めて保存してください。');
 const player=Object.fromEntries(fields.filter(k=>state[k]!==undefined).map(k=>[k,state[k]]));
 return JSON.stringify({format:'return-enclosure-snapshot',version:1,seed:state.world.seed,options:state.world.generationOptions,stamp:stamp(state.world),state:player,book,completed},(_,v)=>v instanceof Map?{snapshotType:'Map',values:[...v]}:v instanceof Set?{snapshotType:'Set',values:[...v]}:v);
}
function restoreSnapshot(data){
 const fail=()=>{throw Error('作例3の保存内容が不正です。');},int=Number.isSafeInteger;
 if(data.version!==1||typeof data.seed!=='string'||data.seed.length>10000||!data.options||!int(data.completed)||data.completed<0)fail();
 const state=H.create(data.seed,data.options),w=state.world;if(stamp(w)!==data.stamp)throw Error('生成方式の変更によりこの保存を再現できません。');
 const v=data.state,book=data.book,cell=n=>int(n)&&n>=0&&n<w.cells.length,floor=n=>cell(n)&&!!w.cells[n],frame=f=>Array.isArray(f)&&f.length===4&&new Set(f).size===4&&f.every(n=>int(n)&&n>=0&&n<4);
 if(!v||!floor(v.id)||!frame(v.frame)||![v.x,v.y,v.steps].every(int)||v.steps<0||!Array.isArray(v.history)||v.history.length>1000||v.history.some(p=>!floor(p.id)||![p.x,p.y].every(int)))fail();
 if(![0,3,5].includes(v.loopThreshold)||typeof v.foldLoops!=='boolean'||!Array.isArray(v.verticalCrossings)||v.verticalCrossings.length!==2||v.verticalCrossings.some(n=>!int(n)||n<0))fail();
 if(!Array.isArray(v.replayMoves)||v.replayMoves.length>200000||v.replayMoves.some(n=>!int(n)||n<0||n>4))fail();
 if(v.last&&(!floor(v.last.from)||!floor(v.last.to)||!int(v.last.worldDirection)||v.last.worldDirection<0||v.last.worldDirection>4))fail();
 if(!book||!Array.isArray(book.charts)||book.charts.length>20000||!int(book.active)||book.active< -1||book.active>=book.charts.length)fail();
 for(const c of book.charts){if(!int(c.number)||c.number<1||!(c.cells instanceof Map))fail();for(const [key,p]of c.cells)if(!p||![p.x,p.y].every(int)||key!==`${p.x},${p.y}`||p.id!==-1&&!cell(p.id)||p.frame&&!frame(p.frame))fail();}
 if(v.seenFloors!==undefined&&(!(v.seenFloors instanceof Set)||[...v.seenFloors].some(n=>!floor(n))))fail();
 if(v.atlasComplete!==undefined&&(typeof v.atlasComplete!=='boolean'||v.atlasComplete&&v.seenFloors?.size!==w.cells.reduce((n,v)=>n+v,0)))fail();
 if(v.wildlife){const a=v.wildlife;if(!int(a.rng)||a.rng<0||a.rng>4294967295||!int(a.turn)||a.turn<0||!Array.isArray(a.pets)||a.pets.length>2||a.pets.some(p=>!['c','d'].includes(p.kind)||!floor(p.id)||p.previous!=null&&!floor(p.previous)||typeof p.mode!=='string'||!int(p.left))||!Array.isArray(a.food)||a.food.length>3||a.food.some(p=>!floor(p.id)))fail();}
 if(v.loopExperience){const r=v.loopExperience;if(!(r.counts instanceof Map)||!Array.isArray(r.path)||r.path.length>w.cells.length||!int(r.lastStep)||r.lastStep<0||r.lastStep>v.steps)fail();for(const [k,n]of r.counts){const parts=String(k).split(':').map(Number);if(parts.length!==3||!parts.every(int)||![0,1].includes(parts[0])||!parts[1]&&!parts[2]||!int(n)||n<1)fail();}for(const p of r.path)if(!floor(p.id)||![p.x,p.y].every(int)||typeof p.frame!=='string'||!frame(p.frame.split(',').map(Number)))fail();}
 if(v.markPeriods!==undefined&&(!Array.isArray(v.markPeriods)||v.markPeriods.length>10000||v.markPeriods.some(p=>![0,1].includes(p.sheet)||![p.a,p.b].every(int)||!p.a&&!p.b||! /^[1-9]$/.test(p.mark))))fail();
 if(v.markEvents!==undefined&&(!Array.isArray(v.markEvents)||v.markEvents.length>9||v.markEvents.some(e=>!int(e.step)||e.step<0||e.step>v.steps||!floor(e.id))))fail();
 for(const k of fields)if(v[k]!==undefined)state[k]=v[k];
 (typeof module==='object'?require('./sheet-features.js'):root.SheetFeatures).validate(state);
 (typeof module==='object'?require('./sheet-annotations.js'):root.SheetAnnotations).validate(state);
 (typeof module==='object'?require('./graph-oob.js'):root.GraphOob).validate(state);
 return {state,book,completed:data.completed,options:data.options};
}
function encode(state,completed,book){if(state.wands)return snapshot(state,completed,book);if(!Array.isArray(state.replayMoves)||state.replayMoves.length!==state.steps||state.steps>20000)throw Error('この保存は2万歩以内の探索に対応しています。');const w=state.world;return JSON.stringify({format:'return-enclosure-replay',version:1,seed:w.seed,options:w.generationOptions||{verticalLoops:w.verticalLoops,shiftX:w.lattice.shiftX,underpasses:w.floorUnderpasses||0},markEvents:state.markEvents||[],annotations:state.annotations,marks:[...(state.features?.marks||[])],stamp:stamp(w),moves:state.replayMoves,threshold:state.loopThreshold??3,fold:state.foldLoops!==false,completed});}
function parse(text){if(typeof text!=='string'||text.length>20000000)throw Error('保存データは20MB以内にしてください。');const d=JSON.parse(text,(_,v)=>{if(!v||!['Map','Set'].includes(v.snapshotType))return v;if(!Array.isArray(v.values))throw Error('保存データの内容が不正です。');return v.snapshotType==='Map'?new Map(v.values):new Set(v.values);});if(d.format==='return-enclosure-snapshot'){if(d.version!==1)throw Error('未対応の保存形式です。');return d;}if(d.format!=='return-enclosure-replay'||d.version!==1||typeof d.seed!=='string'||d.seed.length>10000||typeof d.stamp!=='string'||!d.options||![0,1,3].includes(d.options.verticalLoops)||![-6,-4,-2,0,2,4,6].includes(d.options.shiftX)||![0,1,2,3,4,5,6].includes(d.options.underpasses)||!Array.isArray(d.moves)||d.moves.length>20000||d.moves.some(n=>!Number.isInteger(n)||n<0||n>4)||![0,3,5].includes(d.threshold)||typeof d.fold!=='boolean'||!Number.isSafeInteger(d.completed)||d.completed<0)throw Error('作例3の保存データではないか、内容が不正です。');return d;}
async function decode(text){const d=parse(text);if(d.format==='return-enclosure-snapshot')return restoreSnapshot(d);const state=H.create(d.seed,d.options),book={charts:[],active:-1};if(stamp(state.world)!==d.stamp)throw Error('生成方式の変更によりこの保存を再現できません。現在の探索は保持します。');state.loopThreshold=d.threshold;state.foldLoops=d.fold;state.verticalCrossings=[0,0];state.replayMoves=[];
const events=d.markEvents||[];if(!Array.isArray(events)||events.length>9||events.some((e,i)=>!Number.isSafeInteger(e.step)||e.step<0||e.step>d.moves.length||i&&e.step<events[i-1].step))throw Error('目印の履歴が不正です。');
let eventIndex=0;const applyMarks=()=>{while(events[eventIndex]?.step===state.steps){const e=events[eventIndex++];if(e.id!==state.id)throw Error('目印の位置を再現できません。');(typeof module==='object'?require('./sheet-features.js'):root.SheetFeatures).mark(state);}};
applyMarks();S.observeWalkingMap(state,book);
for(let i=0;i<d.moves.length;i++){const direction=d.moves[i],before=S.position(state.world,state.id);R.start(state);if(!S.move(state,direction,true))throw Error('保存された経路を再現できません。');R.observe(state,S.groundSheet(state.world,state.id));state.replayMoves.push(direction);const after=S.position(state.world,state.id);if(state.last.kind==='normal'&&before.sheet===after.sheet&&H.crossedVertical(state.world,before,after,state.last.worldDirection))state.verticalCrossings[before.sheet]++;applyMarks();S.observeWalkingMap(state,book);if(i%100===99)await new Promise(resolve=>setTimeout(resolve,0));}
if(d.marks!==undefined){if(!Array.isArray(d.marks)||d.marks.length>9)throw Error('目印が不正です。');const F=typeof module==='object'?require('./sheet-features.js'):root.SheetFeatures;if(d.marks.length&&!state.features)F.mark(state);if(state.features){state.features.marks=new Map(d.marks);F.validate(state);}}
if(d.annotations!==undefined){state.annotations=d.annotations;(typeof module==='object'?require('./sheet-annotations.js'):root.SheetAnnotations).validate(state);}
return {state,book,completed:d.completed,options:d.options};}
const api={encode,parse,decode};if(typeof module==='object')module.exports=api;else root.ReturnEnclosureSave=api;
})(globalThis);

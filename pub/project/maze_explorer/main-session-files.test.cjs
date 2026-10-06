const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const S=require('./main-session.js'),J=require('./main-journey.js');
const nodes=new Map();function $(id){if(!nodes.has(id))nodes.set(id,{value:'',files:[],textContent:'',handlers:{},addEventListener(type,fn){this.handlers[type]=fn;}});return nodes.get(id);}
let game=S.attach(J.start({width:21,height:17,seed:'session-file',birdMode:true,separateMaps:true}));S.act(game,'wait');
$('journeyCourse').value='birds';const text=S.encode(game,'birds');let loaded=0,clicked=0,revoked=0,blob,filename;
const context={$: $,MazeSession:S,game,applyJourneySettings:()=>{},newWorld:(_,g)=>{context.game=g;loaded++;},canvas:{focus(){},scrollIntoView(){}},Blob,URL:{createObjectURL(b){blob=b;return 'blob:test';},revokeObjectURL(){revoked++;}},document:{querySelectorAll:()=>[],body:{append(){}},createElement(){return{click(){clicked++;filename=this.download;},remove(){}};}},setTimeout:fn=>fn()};
const source=fs.readFileSync(__dirname+'/app.js','utf8');vm.runInNewContext(source.slice(source.indexOf('let sessionReadVersion=0')),context);
const fire=(id,type)=>$(id).handlers[type]();
const select=file=>{$('sessionFile').files=[file];return fire('sessionFile','change');};
const file=t=>({size:Buffer.byteLength(t),text:async()=>t});
(async()=>{
 const idleStatus=$('sessionStatus').textContent;fire('sessionCancel','click');assert.equal($('sessionStatus').textContent,idleStatus);
 await select(file('\uFEFF'+text));assert.equal($('sessionText').value,text);assert.equal(loaded,0);assert($('sessionCancel').disabled);assert.match($('sessionStatus').textContent,/1行動目/);
 await fire('sessionImport','click');assert.equal(loaded,1);assert.equal(S.encode(context.game,'birds'),text);
 for(const f of [file('bad'),file(JSON.stringify({format:'maze-entrance-checkpoint'})),{size:6000001,text(){throw Error('should not read');}}, {size:1,text:async()=>{throw Error('read failure');}}]){await select(f);assert.equal($('sessionText').value,text);assert.equal(loaded,1);assert.match($('sessionStatus').textContent,/読み込めません/);}
 for(const cancel of ['input','export','download','import','selection']){
  let resolve;const pending=select({size:1,text:()=>new Promise(r=>resolve=r)});
  if(cancel==='input'){$('sessionText').value='edited';fire('sessionText','input');}
  if(cancel==='export')fire('sessionExport','click');
  if(cancel==='download')fire('sessionDownload','click');
  if(cancel==='import'){$('sessionText').value=text;await fire('sessionImport','click');}
  if(cancel==='selection')await select(file(text));
  const before=$('sessionText').value,status=$('sessionStatus').textContent;resolve('invalid old read');await pending;
  assert.equal($('sessionText').value,before);assert.equal($('sessionStatus').textContent,status);
 }
 // A pending replay must not overwrite newly played exploration or a cancelled request.
 for(const change of ['play','cancel','return']){
  const real=context.MazeSession;let finish;
  context.MazeSession={...S,decodeAsync:()=>new Promise(resolve=>finish=resolve)};
  $('sessionText').value=text;const oldGame=context.game,oldLoaded=loaded,pending=fire('sessionImport','click');
  if(change==='play')S.act(context.game,'wait');else if(change==='return')fire('sessionReturn','click');else fire('sessionCancel','click');
  finish(S.decode(text));await pending;assert.equal(loaded,oldLoaded);assert.equal(context.game,oldGame);
  context.MazeSession=real;
 }
 fire('sessionDownload','click');assert.equal(await blob.text(),S.encode(context.game,'birds'));assert.equal(filename,`maze-session-1-${context.game.turns}.json`);assert.equal(clicked,revoked);
 console.log('PASS: actual session UI handlers: BOM file, explicit restore, invalid/oversize/read failure preservation, five stale-read cancellations, current-state download and URL cleanup.');
})().catch(e=>{console.error(e);process.exitCode=1;});

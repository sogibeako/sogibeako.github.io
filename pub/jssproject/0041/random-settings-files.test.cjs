const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),R=require('./random-journey.js');
const nodes=new Map();function $(id){if(!nodes.has(id))nodes.set(id,{value:'',files:[],textContent:'',handlers:{},addEventListener(t,f){this.handlers[t]=f;}});return nodes.get(id);}
let blob,filename,clicked=0,revoked=0;
const game={journey:{random:R.validate(R.defaults)}},before=JSON.stringify(game);
const context={$,game,MazeRandomJourney:R,Blob,URL:{createObjectURL(b){blob=b;return 'blob:test';},revokeObjectURL(){revoked++;}},setTimeout:fn=>fn(),document:{body:{append(){}},createElement(){return{click(){filename=this.download;clicked++;},remove(){}};}}};
const src=fs.readFileSync(__dirname+'/app.js','utf8');vm.runInNewContext(src.slice(src.indexOf('let randomSettingsReadVersion=0;')),context);
const fire=(id,type)=>$(id).handlers[type]();const select=async f=>{$('randomSettingsFile').files=[f];await fire('randomSettingsFile','change');};const file=text=>({size:Buffer.byteLength(text),text:async()=>text});
(async()=>{
 const text=R.exportSettings({...R.defaults,rules:['plain']});await select(file('\uFEFF'+text));assert.deepEqual(R.importSettings($('randomSettingsText').value).rules,['plain']);assert.equal(JSON.stringify(game),before);
 const valid=$('randomSettingsText').value;
 for(const f of [file('bad'),file('null'),{size:30001,text(){throw Error('should not read');}},{size:1,text:async()=>{throw Error('read failed');}}]){await select(f);assert.equal($('randomSettingsText').value,valid);assert.match($('randomSettingsRecordStatus').textContent,/読み込めません/);}
 for(const action of ['input','export','download','selection']){
  let finish;const pending=select({size:1,text:()=>new Promise(r=>finish=r)});
  if(action==='input'){$('randomSettingsText').value='manual';fire('randomSettingsText','input');}
  if(action==='export')fire('randomSettingsExport','click');
  if(action==='download')fire('randomSettingsDownload','click');
  if(action==='selection')await select(file(text));
  const last=$('randomSettingsText').value,status=$('randomSettingsRecordStatus').textContent;finish('invalid stale read');await pending;assert.equal($('randomSettingsText').value,last);assert.equal($('randomSettingsRecordStatus').textContent,status);
 }
 fire('randomSettingsDownload','click');assert.equal(filename,'maze-random-settings.json');assert.deepEqual(R.importSettings(await blob.text()),game.journey.random);assert.equal(clicked,revoked);assert.equal(JSON.stringify(game),before);
 console.log('PASS: actual settings file handlers: BOM, validation failures preserve text, four stale-read races, exported payload/filename/URL cleanup; game unchanged.');
})().catch(e=>{console.error(e);process.exitCode=1;});

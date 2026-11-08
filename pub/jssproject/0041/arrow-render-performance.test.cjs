const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(__dirname+'/app.js','utf8');
const helpers=source.slice(source.indexOf('function arrowLineDistance('),source.indexOf('function drawWarpAnnotations('));
const draw=source.slice(source.indexOf('function drawWarpAnnotations('),source.indexOf('function renderWarpNotes('));
const oldLookup=" const closest=id=>(points||[]).filter(p=>p.id===id).sort((a,b)=>Math.hypot(a.x-w/2,a.y-h/2)-Math.hypot(b.x-w/2,b.y-h/2))[0];";
const reference=draw.replace(/ \/\/ Build once per drawing:[\s\S]*? context.save\(\);/,oldLookup+'\n context.save();');
assert.notEqual(reference,draw);
const arrows=Array.from({length:100},(_,i)=>({from:i,to:i+1,status:'confirmed',curve:(i%7-3)/2}));
function run(code,points,visible=true){
 const calls=[],game={warpArrows:arrows};
 const ctx={game,renderWarpNotes:{selection:null},warpCurveDrag:{},sameArrow:()=>false,
  $:id=>({checked:id==='showKnownArrows'?visible:false,value:id==='arrowTransparency'?'35':'all',getAttribute:()=> 'false'})};
 vm.runInNewContext(helpers+code,ctx);
 const pen=new Proxy({}, {get:(o,k)=>o[k]||((...args)=>calls.push([k,...args]))});
 const hits=ctx.drawWarpAnnotations(pen,points,1000,700);
 return JSON.stringify({calls,hits});
}
let reads=0;
const points=Array.from({length:20000},(_,i)=>({get id(){reads++;return i%101;},x:(i*37)%1100-50,y:(i*53)%800-50,tile:12}));
// Include equal-distance repeated images: first occurrence must continue to win.
points.unshift({id:0,x:480,y:350,tile:12},{id:0,x:520,y:350,tile:12});
const expected=run(reference,points),oldReads=reads;
reads=0;const actual=run(draw,points),newReads=reads;
assert.equal(actual,expected);// Serializing the returned hit samples reads another 100 endpoint IDs in both versions.
assert.equal(newReads,20100);assert.equal(oldReads,4000100);
reads=0;run(draw,points,false);assert.equal(reads,0);
assert.equal(run(draw,[]),run(reference,[]));
assert.equal(run(draw,points.filter(p=>p.id!==50)),run(reference,points.filter(p=>p.id!==50)));
// A fresh viewport must recompute its endpoints, without retaining stale coordinates.
const shifted=points.map(p=>({id:p.id,x:p.x+170,y:p.y-80,tile:p.tile}));
assert.equal(run(draw,shifted),run(reference,shifted));
console.log(`PASS: 100 arrows / 20,002 floor images: identical drawing and hit geometry; floor-ID reads ${oldReads} -> ${newReads}; hidden, missing, tied and shifted endpoints.`);

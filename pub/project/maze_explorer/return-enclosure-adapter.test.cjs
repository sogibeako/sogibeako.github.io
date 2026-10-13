const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),H=require('./return-enclosure.js'),S=require('./connection-space.js');
const elements=new Map(),keys={};let advances=0;const ctx=new Proxy({},{get:()=>()=>{}});
function el(id){if(!elements.has(id))elements.set(id,{value:id==='shiftY'?'0':id==='width'?'28':id==='height'?'34':id==='size'?'24':id==='layoutVariant'?'original':id==='loopThreshold'?'3':id==='shiftX'?'2':id==='underpasses'?'2':'3',checked:true,clientWidth:460,clientHeight:460,getContext:()=>ctx,setAttribute(){},focus(){},addEventListener(){}});return elements.get(id);}
const window={ReturnEnclosure:H,addEventListener(){},parent:{ExplorationHost:{advance(mode){assert.equal(mode,'enclosure');advances++;return true;}}}};
const sandbox={ExplorationGeneration:require('./exploration-generation.js'),window,ReturnEnclosure:H,ReturnEnclosureSave:require('./return-enclosure-save.js'),ConnectionSpace:S,SkewLoops:require('./lattice-holes-loops.js'),SkewFold:require('./lattice-holes-fold.js'),devicePixelRatio:1,document:{getElementById:el,querySelector:()=>({}),querySelectorAll:()=>[],addEventListener:(name,fn)=>keys[name]=fn}};
vm.runInNewContext(fs.readFileSync(__dirname+'/return-regions-ui.js','utf8'),sandbox);
const a=window.EnclosureExplorationAdapter,prior=a.snapshot();el('shiftX').value='-2';const fresh=a.fresh('course-real');assert.equal(a.snapshot(),prior);assert.equal(fresh.world.lattice.shiftX,2);assert.equal(fresh.world.layouts[0].width,28);assert.equal(fresh.world.layouts[0].height,34);a.enter(fresh);assert.equal(el('shiftX').value,'2');
const w=fresh.world,q=[w.start],parents=new Map([[w.start,null]]);for(const id of q)for(let d=0;d<4;d++){const e=w.edges.get(`${id}:${d}`);if(e&&!parents.has(e.to)){parents.set(e.to,{id,d});q.push(e.to);}}
const path=[];for(let id=w.exit;id!==w.start;){const p=parents.get(id);path.unshift(p.d);id=p.id;}
el('truth').onclick();for(const d of path)keys.keydown({key:['ArrowUp','ArrowRight','ArrowDown','ArrowLeft'][d],target:{matches:()=>false},preventDefault(){}});
assert(a.progress().exit);assert.equal(a.progress().steps,path.length);const before=a.snapshot();keys.keydown({key:'>',target:{matches:()=>false}});assert.equal(advances,1);assert.equal(a.snapshot(),before);
console.log('Real enclosure adapter: fresh is nonmutating, applied options retained, A-B-A exit walk and > handed to common course without local regeneration.');

for(const type of ['none','x','y','both']){
 const before=a.snapshot(),options={enabled:true,pool:[type]};
 const next=a.fresh('shift-course-'+type,false,undefined,undefined,undefined,options);
 assert.equal(a.snapshot(),before);const o=next.world.generationOptions;
 assert.equal(o.width,28);assert.equal(o.height,34);assert.equal(o.shiftX!==0,['x','both'].includes(type));assert.equal(o.shiftY!==0,['y','both'].includes(type));
 a.enter(next);assert.equal(el('shiftX').value,String(o.shiftX));assert.equal(el('shiftY').value,String(o.shiftY));
 assert.deepEqual(a.fresh('fixed').world.generationOptions,o);
}
assert.throws(()=>a.fresh('invalid',false,undefined,undefined,undefined,{enabled:true,pool:[]}));
console.log('Enclosure course: all shift groups, preserved dimensions, nonmutating preparation, applied controls and OFF retention passed.');

const assert=require('node:assert/strict'),H=require('./return-enclosure.js'),S=require('./connection-space.js'),R=require('./lattice-holes-loops.js'),F=require('./lattice-holes-fold.js'),vm=require('node:vm'),fs=require('node:fs');
let count=0;
for(const shiftX of [-2,0,2])for(const frame of [[0,1,2,3],[2,1,0,3]])for(const sheet of [0,1]){
 const st=H.create('learn',{shiftX}),route=st.world.verticalRoutes.find(r=>r.sheet===sheet);st.id=route.start;st.frame=frame.slice();R.start(st);
 for(let lap=1;lap<=3;lap++){for(const d of route.directions){R.start(st);assert(S.move(st,st.frame.indexOf(d)));R.observe(st,sheet);}assert.equal(R.knowledge(st).find(k=>k.sheet===sheet&&k.a===0&&k.b===1).count,lap);assert.equal(R.knowledge(st)[0].learned,lap===3);}
 const down=S.directions[st.frame[2]],right=S.directions[st.frame[1]],b=st.world.lattice.b,dx=b[0]*right[0]+b[1]*right[1],dy=b[0]*down[0]+b[1]*down[1];const record={id:st.id,x:st.x+dx,y:st.y+dy,frame:st.frame.slice(),wall:false},chart={cells:new Map([['record',record]])},before=JSON.stringify([...chart.cells]);assert(F.memory(st,chart,11).some(p=>p.x===0&&p.y===0));st.foldLoops=false;assert(!F.memory(st,chart,11).some(p=>p.x===0&&p.y===0));st.foldLoops=true;R.setThreshold(st,5);assert(!F.memory(st,chart,11).some(p=>p.x===0&&p.y===0));assert.equal(JSON.stringify([...chart.cells]),before);count++;
}
// Run the real UI renderer at each underpass layer; synthetic wall candidates must paint #.
let walls=0;
const base=H.create();for(const passage of base.world.passages)for(const id of [passage.horizontal,passage.vertical]){
 const st=H.create();st.id=id;const view=S.nearestView(st,4),blocked=view.filter(p=>p.id<0);if(!blocked.length)continue;
 const draws=new Map(),ctx=new Proxy({fillText(t,x,y){draws.set(`${x.toFixed(4)},${y.toFixed(4)}`,t);}},{get:(o,k)=>o[k]||(()=>{})}),els=new Map();function el(id){if(!els.has(id))els.set(id,{value:id==='loopThreshold'?'3':id==='underpasses'?'2':id==='shiftX'?'2':'3',checked:true,textContent:'',clientWidth:460,clientHeight:460,getContext:()=>ctx,focus(){},setAttribute(k,v){this[k]=v;},addEventListener(){}});return els.get(id);}
 const sandbox={ConnectionSpace:S,SkewLoops:R,SkewFold:F,ReturnEnclosure:{create:()=>st},document:{getElementById:el,querySelector:()=>({}),querySelectorAll:()=>[],addEventListener(){}},devicePixelRatio:1};sandbox.window={ReturnEnclosure:sandbox.ReturnEnclosure,addEventListener(){}};
 vm.runInNewContext(fs.readFileSync(__dirname+'/return-regions-ui.js','utf8'),sandbox);
 assert.equal(el('subjective')['aria-pressed'],'true');el('truth').onclick();assert.equal(el('truth')['aria-pressed'],'true');assert.equal(el('subjective')['aria-pressed'],'false');el('subjective').onclick();assert.equal(el('truth')['aria-pressed'],'false');
 for(const p of blocked){assert.equal(draws.get(`${(230+p.x*Math.min(24,440/19)).toFixed(4)},${(230+p.y*Math.min(24,440/19)).toFixed(4)}`),'#');walls++;}
}
assert(walls>0);console.log(`${count} real three-lap learning walks with shifted/reflected frames; reversible folding and ${walls} virtual wall render checks passed.`);

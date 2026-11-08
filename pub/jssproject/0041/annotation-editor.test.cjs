const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(__dirname+'/app.js','utf8'),nodes=new Map(),acts=[];
const game={world:{warpInvisible:true},cognition:{memory_nodes:new Map([[1,{world_id:1,terrain:1}],[2,{world_id:2,terrain:1}]]),archives:[]},zeroMarks:new Set([1,2]),warpArrows:[]};const context={MazeCore:require('./core.js'),game,renderWarpNotes:{selection:null},render(){},$:id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',checked:true});return nodes.get(id);},sameArrow:(a,b)=>a?.type==='arrow'&&a.from===b.from&&a.to===b.to,MazeSession:{act(g,kind,...args){acts.push([kind,...args]);if(kind==='arrow'){g.warpArrows.push({from:args[0],to:args[1]});return true;}if(kind==='eraseArrow'){g.warpArrows=[];return true;}if(kind==='eraseZeroAt'){g.zeroMarks.delete(args[0]);return {status:'erased'};}g.zeroMarks.add(args[0]);return {status:'placed'};}}};
vm.runInNewContext(source.slice(source.indexOf('function preferredArrowHit('),source.indexOf('function focusedWarpArrows(')),context);
vm.runInNewContext(source.slice(source.indexOf('function deleteAnnotationSelection(){'),source.indexOf("$('archiveMap').addEventListener('click'")),context);
const canvas={clientWidth:200,clientHeight:100,getBoundingClientRect:()=>({left:0,top:0,width:200,height:100})},points=[{id:1,x:20,y:20,tile:20},{id:2,x:120,y:20,tile:20},{id:3,x:20,y:70,tile:20}],hits=[{from:1,to:2,samples:[{x:20,y:20},{x:70,y:40},{x:120,y:20}]}];
const click=(x,y)=>context.editAnnotationFromClick(canvas,points,hits,{clientX:x,clientY:y});
click(20,20);assert.equal(context.renderWarpNotes.selection.id,1);assert.equal(acts.length,0);click(20,20);assert.equal(context.renderWarpNotes.selection,null);assert(game.zeroMarks.has(1));
click(20,20);click(120,20);assert.equal(context.renderWarpNotes.selection.type,'arrow');assert.deepEqual(acts.at(-1),['arrow',1,2]);
click(70,40);assert.equal(context.renderWarpNotes.selection,null);click(70,40);assert.equal(context.renderWarpNotes.selection.type,'arrow');context.deleteAnnotationSelection();assert.deepEqual(acts.at(-1),['eraseArrow',1,2]);assert(game.zeroMarks.has(1)&&game.zeroMarks.has(2));
click(20,20);context.deleteAnnotationSelection();assert(!game.zeroMarks.has(1));assert(game.zeroMarks.has(2));click(20,70);assert(game.zeroMarks.has(3));assert.equal(context.renderWarpNotes.selection.id,3);
console.log('PASS: actual editor handlers: zero selection/reclick, second-zero arrow, curve hit selection/reclick, Delete targets only selection, empty floor stamping.');

game.world.warpInvisible=false;game.zeroMarks.clear();context.renderWarpNotes.selection=null;
const before=acts.length;click(20,20);assert.equal(context.renderWarpNotes.selection.type,'floor');context.deleteAnnotationSelection();assert.equal(acts.length,before);click(20,20);assert.equal(context.renderWarpNotes.selection,null);
click(20,70);assert.equal(context.renderWarpNotes.selection,null);assert.equal(acts.length,before);
click(20,20);click(120,20);assert.deepEqual(acts.at(-1),['arrow',1,2]);assert.equal(context.renderWarpNotes.selection.type,'arrow');click(70,40);assert.equal(context.renderWarpNotes.selection,null);click(70,40);context.deleteAnnotationSelection();assert.deepEqual(acts.at(-1),['eraseArrow',1,2]);assert.equal(game.zeroMarks.size,0);
console.log('PASS: visible warp floor selection/reclick, unknown floor rejected, floor Delete inert, arrow creation/selection/deletion without zero stamps.');

vm.runInNewContext(source.slice(source.indexOf('function focusedWarpArrows('),source.indexOf('function drawWarpAnnotations(')),context);
const connections=[{from:1,to:2},{from:2,to:1},{from:3,to:1},{from:3,to:4}];
assert.equal(context.focusedWarpArrows(connections,null,true),connections);
assert.equal(context.focusedWarpArrows(connections,{type:'floor',id:1},false),connections);
assert.deepEqual(context.focusedWarpArrows(connections,{type:'floor',id:1},true),connections.slice(0,3));
assert.deepEqual(context.focusedWarpArrows(connections,{type:'zero',id:1},true),connections.slice(0,3));
assert.deepEqual(context.focusedWarpArrows(connections,{type:'arrow',from:1,to:2},true),[connections[0]]);
assert.equal(connections.length,4);
console.log('PASS: connection focus includes incoming/outgoing, isolates directed arrow, restores all on deselection and preserves records.');

vm.runInNewContext(source.slice(source.indexOf('function drawWarpAnnotations('),source.indexOf('function renderWarpNotes(')),context);
nodes.set('editZeroMark',{getAttribute:()=> 'true'});nodes.set('focusWarpArrows',{checked:true});nodes.set('showKnownArrows',{checked:true});nodes.set('arrowTransparency',{value:'35'});
context.warpCurveDrag={};
const drawing=new Proxy({}, {get:(_,key)=>key==='measureText'?()=>({width:80}):()=>{},set:()=>true});
const plotted=[{id:1,x:20,y:20,tile:12},{id:2,x:100,y:20,tile:12},{id:3,x:20,y:80,tile:12},{id:4,x:100,y:80,tile:12}];
game.warpArrows=connections.map(a=>({...a,status:'hypothesis'}));context.renderWarpNotes.selection={type:'floor',id:1};
assert.equal(context.drawWarpAnnotations(drawing,plotted,200,100).length,3);
context.renderWarpNotes.selection={type:'arrow',from:1,to:2};assert.equal(context.drawWarpAnnotations(drawing,plotted,200,100).length,1);
context.renderWarpNotes.selection=null;assert.equal(context.drawWarpAnnotations(drawing,plotted,200,100).length,4);
nodes.get('showKnownArrows').checked=false;assert.equal(context.drawWarpAnnotations(drawing,plotted,200,100).length,0);
assert.equal(game.warpArrows.length,4);
console.log('PASS: both shared canvas rendering and clickable hit regions follow focus and global visibility without modifying arrows.');

vm.runInNewContext(source.slice(source.indexOf('function warpCurveDrag('),source.indexOf('warpCurveDrag(canvas,')),context);
const events={},target={...canvas,setPointerCapture(){},hasPointerCapture(){return false;},addEventListener(name,fn){events[name]=fn;}};
context.warpCurveDrag(target,()=>[{from:1,to:2,samples:Array.from({length:25},(_,i)=>({x:20+i*4,y:40})),dx:96,dy:0,len:96,curve:0.2}]);
const ev=(x,y)=>({button:0,pointerId:1,clientX:x,clientY:y,preventDefault(){},stopImmediatePropagation(){this.stopped=true;}});
const prior=acts.length;events.pointerdown(ev(68,40));events.pointermove(ev(69,40));events.pointerup(ev(69,40));assert.equal(acts.length,prior);
events.pointerdown(ev(68,40));events.pointermove(ev(68,64));assert.equal(acts.length,prior);events.pointerup(ev(68,64));assert.deepEqual(acts.at(-1),['curveArrow',1,2,0.7]);const clickEvent=ev(68,64);events.click(clickEvent);assert(clickEvent.stopped);
const after=acts.length;events.pointerdown(ev(68,40));events.pointermove(ev(68,10));events.pointercancel(ev(68,10));assert.equal(acts.length,after);
console.log('PASS: small gestures retain click, drag commits once on release, synthetic click suppressed, cancelled drag not saved.');

const labels=[];const labelContext=new Proxy({}, {get:(_,key)=>key==='measureText'?()=>({width:80}):key==='fillText'?(text)=>labels.push(text):()=>{},set:()=>true});
nodes.get('showKnownArrows').checked=true;context.renderWarpNotes.selection={type:'arrow',from:1,to:2};context.drawWarpAnnotations(labelContext,plotted,200,100);
assert.deepEqual(labels,['地点1 出発','地点2 到着']);labels.length=0;
context.renderWarpNotes.selection=null;context.drawWarpAnnotations(labelContext,plotted,200,100);assert.equal(labels.length,0);
context.renderWarpNotes.selection={type:'arrow',from:1,to:2};nodes.get('showKnownArrows').checked=false;context.drawWarpAnnotations(labelContext,plotted,200,100);assert.equal(labels.length,0);
nodes.get('showKnownArrows').checked=true;context.drawWarpAnnotations(labelContext,plotted.filter(p=>p.id!==2),200,100);assert.deepEqual(labels,['地点1 出発']);
console.log('PASS: selected endpoint labels match exported numbers, absent endpoints not invented, deselection and hidden arrows suppress labels.');

game.warpArrows[1].status='confirmed';game.warpArrows[2].status='contradicted';
nodes.set('warpArrowStatusFilter',{value:'confirmed'});context.renderWarpNotes.selection=null;labels.length=0;
assert.equal(context.drawWarpAnnotations(labelContext,plotted,200,100).length,1);
context.renderWarpNotes.selection={type:'arrow',from:1,to:2};assert.equal(context.drawWarpAnnotations(labelContext,plotted,200,100).length,0);assert.equal(labels.length,0);
context.renderWarpNotes.selection={type:'floor',id:1};nodes.get('warpArrowStatusFilter').value='contradicted';assert.equal(context.drawWarpAnnotations(labelContext,plotted,200,100).length,1);
nodes.get('warpArrowStatusFilter').value='hypothesis';assert.equal(context.drawWarpAnnotations(labelContext,plotted,200,100).length,1);
context.renderWarpNotes.selection=null;assert.equal(context.drawWarpAnnotations(labelContext,plotted,200,100).length,2);
nodes.get('warpArrowStatusFilter').value='all';assert.equal(context.drawWarpAnnotations(labelContext,plotted,200,100).length,4);assert.equal(game.warpArrows.length,4);
console.log('PASS: status filters combine with selected connections; hidden arrows have no hit regions or labels; all records retained.');

const longStraight=context.arrowCurveSamples({x:0,y:0},{x:1000,y:0},{x:2000,y:0});assert.equal(longStraight.length,2);assert.equal(context.arrowLineDistance({x:957,y:0},longStraight),0);assert.equal(context.arrowLineDistance({x:957,y:9},longStraight),9);
for(const bend of [-12000,12000]){
 const start={x:0,y:0},control={x:bend,y:2000},end={x:0,y:4000},samples=context.arrowCurveSamples(start,control,end);
 assert(samples.length>25);assert(samples.length<=4097);
 for(let i=0;i<=1000;i++){const t=i/1000,u=1-t,p={x:2*u*t*bend,y:2*u*t*2000+t*t*4000};assert(context.arrowLineDistance(p,samples)<=0.5);}
}
const sparseEvents={},sparseTarget={...target,addEventListener(name,fn){sparseEvents[name]=fn;}};
context.warpCurveDrag(sparseTarget,()=>[{from:1,to:2,samples:[{x:0,y:40},{x:2000,y:40}],dx:2000,dy:0,len:2000,curve:0}]);
const actionsBefore=acts.length;sparseEvents.pointerdown(ev(957,40));sparseEvents.pointermove(ev(957,140));sparseEvents.pointerup(ev(957,140));assert.equal(acts.length,actionsBefore+1);assert.deepEqual(acts.at(-1),['curveArrow',1,2,0.1]);
console.log('PASS: long line gap is draggable, distant points rejected, extreme signed curves stay within 0.5px approximation.');

vm.runInNewContext(source.slice(source.indexOf('function abortArrowDrag('),source.indexOf('function undoRedoArrow(')),context);
const beforeCancel=acts.length;sparseEvents.pointerdown(ev(957,40));sparseEvents.pointermove(ev(957,140));assert(context.warpCurveDrag.state.moved);context.cancelArrowInteraction();assert.equal(context.warpCurveDrag.state,null);assert.equal(context.renderWarpNotes.selection,null);sparseEvents.pointerup(ev(957,140));assert.equal(acts.length,beforeCancel);
const releasedClick=ev(957,140);sparseEvents.click(releasedClick);assert(releasedClick.stopped);
context.renderWarpNotes.selection={type:'zero',id:1};context.renderWarpNotes.from=1;context.cancelArrowInteraction();assert.equal(context.renderWarpNotes.selection,null);assert.equal(context.renderWarpNotes.from,null);assert.equal(acts.length,beforeCancel);
console.log('PASS: Escape cancels preview without recording or late pointerup commit, suppresses release click, clears endpoint/zero selection.');

let keyHandler;context.document={addEventListener:(name,fn)=>{keyHandler=fn;}};
vm.runInNewContext(source.slice(source.indexOf("document.addEventListener('keydown', e => {"),source.indexOf('new ResizeObserver(render)')),context);
const escape=target=>({key:'Escape',target,preventDefault(){this.prevented=true;}});
context.renderWarpNotes.selection={type:'arrow',from:1,to:2};const typing=escape({tagName:'TEXTAREA'});keyHandler(typing);assert(context.renderWarpNotes.selection);assert(!typing.prevented);
const composing=escape({tagName:'CANVAS'});composing.isComposing=true;keyHandler(composing);assert(context.renderWarpNotes.selection);
const normalEscape=escape({tagName:'CANVAS'});keyHandler(normalEscape);assert.equal(context.renderWarpNotes.selection,null);assert(normalEscape.prevented);assert.equal(acts.length,beforeCancel);
console.log('PASS: actual Escape key handler cancels map selection, respects text fields and IME, and adds no history.');

const modeHandlers={};for(const id of ['editZeroMark','editWarpArrow'])nodes.set(id,{pressed:'true',getAttribute(){return this.pressed;},setAttribute(_,value){this.pressed=value;},addEventListener(_,fn){modeHandlers[id]=fn;}});
vm.runInNewContext(source.slice(source.indexOf("$('editZeroMark').addEventListener('click',()=>{"),source.indexOf('function deleteAnnotationSelection(){')),context);
vm.runInNewContext(source.slice(source.indexOf("$('editWarpArrow').addEventListener('click',()=>{"),source.indexOf('function abortArrowDrag(')),context);
for(const mode of ['editZeroMark','editWarpArrow']){
 nodes.get('editZeroMark').pressed='true';
 sparseEvents.pointerdown(ev(957,40));sparseEvents.pointermove(ev(957,140));assert(context.warpCurveDrag.state.moved);
 const beforeModeChange=acts.length;modeHandlers[mode]();assert.equal(context.warpCurveDrag.state,null);sparseEvents.pointermove(ev(957,150));sparseEvents.pointerup(ev(957,150));assert.equal(acts.length,beforeModeChange);assert.equal(nodes.get('editZeroMark').pressed,'false');
}
console.log('PASS: actual Z toggle and legacy arrow-mode switch cancel pending drag, late move/release never commit.');

vm.runInNewContext(source.slice(source.indexOf('function addReverseArrow('),source.indexOf("$('reverseWarpArrow').addEventListener")),context);
nodes.get('editZeroMark').pressed='true';game.won=false;game.warpArrows=[{from:1,to:2,status:'confirmed',curve:1}];context.renderWarpNotes.selection={type:'arrow',from:1,to:2};
const reverseBefore=acts.length;context.addReverseArrow();assert.deepEqual(acts.at(-1),['arrow',2,1]);assert.equal(acts.length,reverseBefore+1);assert.equal(context.renderWarpNotes.selection.from,2);assert.equal(nodes.get('warpArrowStatusFilter').value,'all');assert.equal(game.warpArrows[0].status,'confirmed');assert.equal(game.warpArrows[0].curve,1);
context.addReverseArrow();assert.equal(acts.length,reverseBefore+1);assert.equal(context.renderWarpNotes.selection.from,1);
game.won=true;context.addReverseArrow();assert.equal(acts.length,reverseBefore+1);
console.log('PASS: reverse button adds once, selects existing reverse without overwriting, respects exit state.');

const crossed=[{from:1,to:2,distance:0},{from:3,to:4,distance:0.5}];
assert.equal(context.preferredArrowHit(crossed,{type:'arrow',from:3,to:4}),crossed[1]);assert.equal(context.preferredArrowHit(crossed,null),crossed[0]);
assert.equal(context.preferredArrowHit([{...crossed[1],distance:3},crossed[0]],{type:'arrow',from:3,to:4}),crossed[0]);assert.equal(context.preferredArrowHit([{from:3,to:4,distance:8}],{type:'arrow',from:3,to:4}),null);
game.won=false;nodes.get('editZeroMark').pressed='true';nodes.get('showKnownArrows').checked=true;nodes.get('focusWarpArrows').checked=false;
game.warpArrows=[{from:1,to:2,status:'hypothesis'},{from:3,to:4,status:'hypothesis'}];context.renderWarpNotes.selection={type:'arrow',from:1,to:2};
const renderingOrder=context.drawWarpAnnotations(labelContext,plotted,200,100);assert.equal(renderingOrder.at(-1).from,1);assert.equal(game.warpArrows[0].from,1);
const overlapEvents={},overlapTarget={...target,addEventListener(name,fn){overlapEvents[name]=fn;}};
context.renderWarpNotes.selection={type:'arrow',from:3,to:4};context.warpCurveDrag(overlapTarget,()=>[1,3].map(from=>({from,to:from+1,samples:[{x:0,y:40},{x:200,y:40}],dx:200,dy:0,len:200,curve:0})));
overlapEvents.pointerdown(ev(100,40));assert.equal(context.warpCurveDrag.state.from,3);overlapEvents.pointermove(ev(100,60));overlapEvents.pointerup(ev(100,60));assert.deepEqual(acts.at(-1),['curveArrow',3,4,0.2]);
console.log('PASS: selected arrow drawn last without reordering records; overlapping drag favors selection, clearly closer line and hit tolerance still respected.');

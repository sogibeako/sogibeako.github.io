const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),M=require('./core.js');
const source=fs.readFileSync(__dirname+'/app.js','utf8'),nodes=new Map();
let creates=0,exportCalls=0,draws=0;
function element(){return {children:[],textContent:'',disabled:false,attrs:{},events:{},value:'',getAttribute(k){return this.attrs[k];},setAttribute(k,v){this.attrs[k]=v;},replaceChildren(){this.children=[];},append(b){this.children.push(b);},addEventListener(k,f){this.events[k]=f;}};}
const $=id=>{if(!nodes.has(id))nodes.set(id,element());return nodes.get(id);};
const game={world:{warps:new Map([[1,2]])},warpArrows:Array.from({length:100},(_,i)=>({from:i,to:i+1,status:'hypothesis'}))};
const c={game,$,document:{createElement(){creates++;return element();}},MazeCore:{...M,exportWarpArrowNotes(g){exportCalls++;return M.exportWarpArrowNotes(g);}},MazeSession:{arrowHistoryInfo:()=>({undo:2,redo:1})},abortArrowDrag(){},sameArrow:(a,b)=>a?.type==='arrow'&&a.from===b.from&&a.to===b.to,render(){},drawWarpAnnotations(){draws++;return [];},selectAnnotation(s){c.renderWarpNotes.selection=s;}};
vm.runInNewContext(source.slice(source.indexOf('function renderWarpNotes('),source.indexOf("$('editWarpArrow').addEventListener")),c);
const render=()=>c.renderWarpNotes({},1000,700),list=$('warpArrowList');
render();$('editZeroMark').setAttribute('aria-pressed','true');render();
const original=[...list.children];assert.equal(creates,100);assert.equal(exportCalls,1);
for(let i=0;i<200;i++)render();assert.equal(creates,100);assert.equal(exportCalls,1);assert.equal(draws,202);
assert.deepEqual(list.children,original);
original[5].events.click();render();assert.equal(original[5].getAttribute('aria-pressed'),'true');assert.equal(list.children[5],original[5]);
original[5].events.click();render();assert.equal(original[5].getAttribute('aria-pressed'),'false');
game.warpArrows[5].status='confirmed';render();assert.match(original[5].textContent,/照合に使用/);assert.equal(exportCalls,2);assert.equal(creates,100);
game.warpArrows[5].curve=1.25;render();assert.match($('warpArrowNotesText').value,/1.25/);assert.equal(exportCalls,3);assert.equal(list.children[5],original[5]);
// Undo/replay may replace objects while preserving the same directed endpoints.
game.warpArrows=game.warpArrows.map(a=>({...a}));render();assert.equal(exportCalls,3);original[5].events.click();assert.equal(c.renderWarpNotes.selection.from,5);
$('editZeroMark').setAttribute('aria-pressed','false');render();assert(list.children.every(b=>b.disabled));
game.warpArrows.splice(0,1);render();assert.equal(list.children.length,99);assert.equal(creates,199);assert.equal(exportCalls,4);
list.children[0].events.click();assert.equal(c.renderWarpNotes.selection.from,1);
game.warpArrows.unshift({from:0,to:1,status:'hypothesis'});render();assert.equal(list.children.length,100);assert.equal(exportCalls,5);
c.game={world:game.world,warpArrows:game.warpArrows.map(a=>({...a}))};render();assert.equal(c.renderWarpNotes.selection,null);assert.equal(exportCalls,6);assert(list.children.every(b=>b.disabled));
assert.equal($('warpArrowNotesText').value,M.exportWarpArrowNotes(c.game));
c.game.warpArrows=[];render();assert.equal(list.children.length,0);assert.equal($('warpArrowNotesText').value,M.exportWarpArrowNotes(c.game));
console.log('PASS: 100 buttons reused over 200 redraws; fresh selection/status/curve/mode, object replacement, delete/restore, game reset, empty list; map redraw remains active.');

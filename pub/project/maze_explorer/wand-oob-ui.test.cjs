// Execute the real UI controller with a minimal DOM and animation clock.
const a=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),E=require('./wand-engine.js');
const nodes=new Map();const drawn=[];const context=new Proxy({fillText(text){drawn.push(text);}},{get:(o,k)=>o[k]||(()=>{})});
function node(id){if(!nodes.has(id))nodes.set(id,{id,value:'',checked:false,children:[],clientWidth:800,clientHeight:400,textContent:'',append(c){this.children.push(c);},replaceChildren(){this.children=[];},getContext(){return context;},querySelectorAll(){return [];}});return nodes.get(id);}
node('spell').value='freeze';node('boundary').value='plane';node('oobDirection').value='3';
let key,queue=[],time=0;const sandbox={WandEngine:E,devicePixelRatio:1,document:{getElementById:node,createElement:()=>({textContent:''}),addEventListener:(name,fn)=>key=fn},ResizeObserver:class{observe(){}},requestAnimationFrame:fn=>{queue.push(fn);return queue.length;},cancelAnimationFrame:()=>{queue=[];}};
vm.runInNewContext(fs.readFileSync(__dirname+'/wand-lab.js','utf8'),sandbox);
function flush(){let count=0;while(queue.length){a(++count<1000);queue.shift()(time+=60);}}
for(const d of [0,1,2,3]){
 node('oobDirection').value=String(d);node('oobDemo').onclick();
 const before=Number(node('status').textContent.match(/記憶 (\d+)/)[1]);
 node('cast').onclick();flush();
 a(node('status').textContent.startsWith('外側・'+['上','右','下','左'][d]));
 a(node('status').textContent.includes('@ 10,6'));a.equal(node('returnHome').disabled,false);
 key({key:'ArrowRight',target:{closest:()=>false},preventDefault(){}});
 key({key:'>',target:{closest:()=>false},preventDefault(){}});
 a(node('status').textContent.startsWith('通常領域'));a.equal(node('returnHome').disabled,true);
 a(Number(node('status').textContent.match(/記憶 (\d+)/)[1])>=before);
}
node('oobDemo').onclick();node('cast').onclick();node('reset').onclick();flush();a(node('status').textContent.startsWith('通常領域'));
console.log('Real UI controller: four demo directions, animated OOB, stairs > return, memory retention and reset cancellation passed.');
const memories=[];
for(let d=0;d<4;d++){
 node('oobDirection').value=String(d);
 (d===0?node('oobDemo'):node('oobRevisit')).onclick();node('cast').onclick();flush();
 a(node('status').textContent.includes('OOB発見 '+(d+1)+'/4'));
 for(let i=0;i<3;i++)key({key:'ArrowDown',target:{closest:()=>false},preventDefault(){}});
 memories[d]=Number(node('status').textContent.match(/記憶 (\d+)/)[1]);
}
for(let d=0;d<4;d++){
 node('oobDirection').value=String(d);node('oobRevisit').onclick();node('cast').onclick();flush();
 a(node('status').textContent.startsWith('外側・'+['上','右','下','左'][d]));
 a(node('status').textContent.includes('OOB発見 4/4'));
 a.equal(Number(node('status').textContent.match(/記憶 (\d+)/)[1]),memories[d]);
}
const rooms=[0,1,2,3].map(E.oobRoom);
a.equal(new Set(rooms.map(r=>r.cells.join(''))).size,4);
a.equal(new Set(rooms.map(r=>r.floorColor)).size,4);
for(const room of rooms){
 const seen=new Set([130]),queue=[130];
 for(const id of queue)for(let d=0;d<4;d++){const n=E.next(room,id,d);if(n!==null&&room.cells[n]!=='#'&&!seen.has(n)){seen.add(n);queue.push(n);}}
 a(seen.has(131));a(seen.has(170));
 a.equal(seen.size,room.cells.filter(c=>c!=='#').length);
}
console.log('Four distinct connected OOB rooms; discovery 4/4 and independent exploration memory retained across revisits.');
node('seamless').checked=true;node('oobDemo').onclick();
a(node('status').textContent.includes('主観トーラス'));a(!/ @ \d+,\d+/.test(node('status').textContent));
const statusBefore=node('status').textContent;
node('seamless').checked=false;node('seamless').onchange();a(/ @ \d+,\d+/.test(node('status').textContent));
node('seamless').checked=true;node('seamless').onchange();a.equal(node('status').textContent,statusBefore);
node('cast').onclick();flush();a(node('status').textContent.startsWith('外側・'));node('returnHome').onclick();a(node('status').textContent.includes('主観トーラス'));
const wrapped={width:20,height:12,wrap:true};
for(const [id,d] of [[10,0],[139,1],[230,2],[120,3]]){
 const old=E.viewTiles(wrapped,id,9,9),now=E.viewTiles(wrapped,E.next(wrapped,id,d),9,9),[dx,dy]=[[0,-1],[1,0],[0,1],[-1,0]][d];
 a.equal(now[40].id,E.next(wrapped,id,d));
 for(let y=1;y<8;y++)for(let x=1;x<8;x++)a.equal(now[y*9+x].id,old[(y+dy)*9+x+dx].id);
}
console.log('Seamless torus: 4 boundary crossings shift by one tile, centered player, hidden coordinates, toggle preserves state and OOB return passed.');
node('hints').checked=true;node('reset').onclick();node('inspectSigns').onclick();a(node('log').children.some(n=>n.textContent.includes('壁の文章')));
node('oobDemo').onclick();
const press=k=>key({key:k,target:{closest:()=>false},preventDefault(){}});
press('ArrowRight');press('ArrowLeft');a.equal(node('log').children.filter(n=>n.textContent.includes('杖先がかすかに')).length,1);
node('hints').checked=false;node('reset').onclick();node('inspectSigns').onclick();a(!node('log').children.some(n=>n.textContent.includes('壁の文章')));
console.log('UI hints: initial wall text, wand response without key-repeat spam, hints OFF passed.');

node('reset').onclick();a(drawn.includes('f'));a(!drawn.includes('c'));console.log('Wand canvas renders cat as f.');

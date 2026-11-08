const assert=require('node:assert/strict'),K=require('./klein-biaxial.js'),vm=require('node:vm'),fs=require('node:fs');
let differences=0;for(const mode of ['consistent','free'])for(const sx of [-5,0,3])for(const sy of [-5,0,2]){const w=K.create(mode,sx,sy);for(let id=0;id<120;id++)for(const frame of [[0,1,2,3],[2,1,0,3]])for(let d=0;d<4;d++){const p={id,frame},q=K.step(w,p,d);assert.deepEqual(K.step(w,q,(d+2)%4),p);const a=K.step(w,K.step(w,p,1),2),b=K.step(w,K.step(w,p,2),1);if(mode==='consistent')assert.deepEqual(a,b);else if(JSON.stringify(a)!==JSON.stringify(b))differences++;}
for(const point of [[0,0],[12,10],[3,7],[-2,6]]){const back=K.unproject(w,...K.project(w,...point));assert(Math.abs(back[0]-point[0])<1e-9&&Math.abs(back[1]-point[1])<1e-9);}}
assert(differences>0);
let tick=null;const els={},keys={},ctx=new Proxy({},{get:()=>()=>{}}),el=id=>els[id]??={value:({mode:'consistent',sx:'3',sy:'2'})[id],checked:false,clientWidth:500,getContext:()=>ctx,focus(){}};vm.runInNewContext(fs.readFileSync(__dirname+'/klein-biaxial-ui.js','utf8'),{setInterval:fn=>{tick=fn;return 1;},clearInterval:()=>{tick=null;},KleinBiaxial:K,BiaxialRules:require('./biaxial-rules.js'),BiaxialUnderpasses:require('./biaxial-underpasses.js'),BiaxialExploration:require('./biaxial-exploration.js'),document:{getElementById:el,querySelectorAll:()=>[],addEventListener:(k,f)=>keys[k]=f},window:{addEventListener(){}},devicePixelRatio:1});assert.match(el('status').textContent,/0歩/);el('corner').onclick();for(const key of ['ArrowRight','ArrowDown','ArrowLeft','ArrowUp'])keys.keydown({key,target:{closest:()=>false},preventDefault(){}});assert.match(el('status').textContent,/4歩/);el('mode').value='free';el('settings').onsubmit({preventDefault(){}});el('walls').checked=true;el('walls').onchange();el('reset').onclick();assert.match(el('explanation').textContent,/自由接続/);
console.log('18 spaces: reversible moves in both frames, consistent local path agreement, free-mode disagreements, invertible shear and interactive UI smoke passed.');

let mazes=0;for(const mode of ['free','consistent'])for(const algorithm of ['dfs','prim'])for(const [sx,sy]of [[3,2],[-5,-4],[0,0]])for(const [width,height]of [[12,10],[24,20],[32,24]]){
 const w=K.maze(K.create(mode,sx,sy,{width,height}),algorithm,'maze-check'),same=K.maze(K.create(mode,sx,sy,{width,height}),algorithm,'maze-check');assert.deepEqual(w.cells,same.cells);assert(w.cells.some(n=>!n),'actual walls exist');
 const visited=new Set([w.start]),queue=[w.start];let horizontal=false,vertical=false;for(const id of queue)for(let d=0;d<4;d++){const e=w.edges.get(id+':'+d);if(!w.cells[e.to])continue;if(d===1&&id%width===width-1)horizontal=true;if(d===2&&Math.floor(id/width)===height-1)vertical=true;if(!visited.has(e.to)){visited.add(e.to);queue.push(e.to);}}
 assert.equal(visited.size,w.cells.reduce((a,b)=>a+b,0));assert(horizontal&&vertical);assert(visited.has(w.exit));
 for(const frame of [[0,1,2,3],[2,1,0,3]]){let p={id:w.start,frame};for(const d of K.solve(w,p)){p=K.step(w,p,d);assert(w.cells[p.id]);}assert.equal(p.id,w.exit);}mazes++;
}
console.log(mazes+' maze conditions: deterministic floors, walls, all-floor connectivity, both seam types and actual exit walking in both orientations passed.');
// Exercise the generated-maze UI and timer-driven solver.
els.mode.value='free';els.terrain.value='dfs';els.size.value='24,20';el('seed').value='ui-maze';els.settings.onsubmit({preventDefault(){}});assert.equal(els.walls.disabled,true);assert.equal(els.auto.disabled,false);assert.match(els.status.textContent,/床/);

els.auto.onclick();for(let n=0;tick&&n<2000;n++)tick();assert.equal(tick,null);assert.match(els.status.textContent,/出口に到着/);console.log('Maze UI: generated walls and automated walking reach the exit.');

const world=K.create('free',3,2),player={id:13,frame:[0,1,2,3]},isWall=id=>[1,12,14,25].includes(id),view=K.nearby(world,player,isWall,6);
assert.equal(view.size,5,'surrounding walls block all further observation');assert.equal(view.get('1,0').id,K.step(world,player,1).id);assert(view.get('1,0').wall);
const memory=new Map();K.remember(memory,view,0,0);const first=JSON.stringify([...memory]);K.nearby(world,player,isWall,24);assert.equal(JSON.stringify([...memory]),first,'display/projection cannot add memory by itself');
const open=()=>false,walk=K.step(world,player,1),next=K.nearby(world,walk,open,6);K.remember(memory,next,1,0);assert(memory.has('0,0'));assert(memory.has('7,0'),'memory expands by actual observation after a move');
K.remember(memory,new Map([['0,0',{id:99,frame:[2,1,0,3],x:0,y:0,dist:0,wall:false}]]),0,0);assert.equal(memory.get('0,0').id,99);assert(memory.get('0,0').changed);assert.equal(memory.get('0,0').x,0);
el('viewMode').value='ray';el('viewMode').onchange();el('viewMode').value='wide';el('memoryRadius').value='24';el('memoryRadius').onchange();assert.match(els.status.textContent,/記憶/);
console.log('Topowalk memory: wall occlusion, adjacent movement consistency, remembered observations, no range-based reveal, conflicting appearances and mode switches passed.');

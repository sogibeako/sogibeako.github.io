/* Local frame experiment. Input and projection are inverse transforms. */
(function(root){
'use strict';
const M=typeof module==='object'?require('./core.js'):root.MazeCore;
const sizes={small:[21,17],standard:[31,23],large:[41,29]};
const identity=()=>[1,0,0,1];
const transforms={right:[0,-1,1,0],left:[0,1,-1,0],half:[-1,0,0,-1],mirror:[-1,0,0,1]};
const apply=(f,x,y)=>[f[0]*x+f[1]*y,f[2]*x+f[3]*y];
const inverse=f=>[f[0],f[2],f[1],f[3]];
const compose=(a,b)=>[a[0]*b[0]+a[1]*b[2],a[0]*b[1]+a[1]*b[3],a[2]*b[0]+a[3]*b[2],a[2]*b[1]+a[3]*b[3]];
const direction=v=>Object.keys(M.DIRS).find(d=>M.DIRS[d][0]===v[0]&&M.DIRS[d][1]===v[1]);
function create(mode='right',options={}){
 if(!transforms[mode]&&mode!=='mixed')throw new Error('Unknown transform');
 const course=options.course||'all';if(!['all','visible','plain'].includes(course))throw new Error('Unknown course');
 const layout=options.layout||'demo';
 if(!['demo','dfs','prim','division','rooms'].includes(layout))throw new Error('Unknown layout');
 const size=options.size||'standard';if(!Object.hasOwn(sizes,size))throw new Error('Unknown size');
 const [width,height]=sizes[size];
 const world=layout==='demo'?M.createWarpDemo():M.generate({width,height,algorithm:layout,seed:options.seed||'orientation-walk',loops:10,warpMode:options.warpStyle!=='none',warpStyle:options.warpStyle||'pair',warpCount:options.warpCount??1,topology:'plane'});
 if(layout==='demo')world.exit=-1;
 if(!world.warps){world.warps=new Map();world.warpGroups=[];world.warpStyle='none';world.warpCount=0;world.requestedWarpCount=0;}
 world.separateMaps=false;world.warpInvisible=world.warps.size>0&&!!options.warpInvisible;
 const warpFrames=new Map(),groups=world.warpGroups||[[...world.warps.keys()]];
 groups.forEach((pads,i)=>{
  const transform=transforms[mode==='mixed'?['right','mirror','left','half'][i%4]:mode];
  // Only paired return edges undo the forward frame. Directed rings compose
  // the selected transform at every hop, including the hop back to their start.
  pads.forEach((pad,j)=>{
   if(world.warps.has(pad))warpFrames.set(pad,(world.warpStyle||'pair')==='pair'&&j===1?inverse(transform):[...transform]);
  });
 });
 const config={mode,layout,course,size:layout==='demo'?'standard':size,stage:options.stage??1,completedSteps:options.completedSteps??0,warpInvisible:world.warpInvisible,seed:options.seed||'orientation-walk',warpStyle:layout==='demo'?'pair':options.warpStyle||'pair',warpCount:layout==='demo'?1:options.warpCount??1};
 const state={config,history:[],exitReached:false,exploringAfterExit:false,game:M.createGame(world),frame:identity(),mode,warpFrames,crossings:0,archives:[]};
 state.chart=newChart(state);observe(state);return state;
}
function newChart(state){return {origin:state.game.player.world_position,frame:[...state.frame],nodes:new Map(),visible:new Set(),matches:new Set(),position:[0,0]};}
function observe(state,position=state.game.player.world_position){
 const w=state.game.world,chart=state.chart,px=position%w.width,py=Math.floor(position/w.width);
 const ax=chart.origin%w.width,ay=Math.floor(chart.origin/w.width),inv=inverse(chart.frame);
 chart.position=apply(inv,px-ax,py-ay);chart.visible=new Set();
 for(let dy=-5;dy<=5;dy++)for(let dx=-5;dx<=5;dx++){
  const x=px+dx,y=py+dy,id=y*w.width+x;
  if(dx*dx+dy*dy>25||x<0||y<0||x>=w.width||y>=w.height||!M.lineOfSight(w,position,id))continue;
  const [cx,cy]=apply(inv,x-ax,y-ay),key=`${cx},${cy}`;
  chart.nodes.set(key,{x:cx,y:cy,world_id:id,terrain:w.cells[id],feature:M.featureAt(state.game,id),seenAt:state.game.steps});
  chart.visible.add(key);
 }
}
function input(state,dir,truth=false){return truth?dir:direction(apply(state.frame,...M.DIRS[dir]));}
function move(state,dir,truth=false){
 const g=state.game,worldDirection=input(state,dir,truth);
 if(!M.move(g,worldDirection))return false;
 state.history.push(['move',worldDirection]);
 if(g.won){state.exitReached=true;if(state.exploringAfterExit)g.won=false;}
 if(g.lastEvent==='warp'){
  observe(state,g.lastTransition.from);state.chart.endedAt=g.steps;state.archives.push(state.chart);
  const transform=state.warpFrames.get(g.lastTransition.from);
  state.frame=compose(transform,state.frame);
  g.player.direction=direction(apply(transform,...M.DIRS[g.player.direction]));
  state.crossings++;state.chart=newChart(state);
 }
 observe(state);return true;
}
function createJourney(course,seed){
 if(!['all','visible','plain'].includes(course))throw Error('Unknown course');
 if(typeof seed!=='string'||!seed.length||seed.length>64)throw Error('旅のシードは1〜64文字にしてください。');
 const rng=M.random(`${seed}:begin`),pick=list=>list[Math.floor(rng()*list.length)];
 const warpStyle=course==='plain'?'none':pick(['none','pair','oneway','cycle3','cycle4']);
 const options={course,layout:pick(['dfs','prim','division','rooms']),size:'small',warpStyle,warpCount:pick([1,2]),warpInvisible:course==='all'&&rng()<.35};
 const mode=pick(['right','left','half','mirror','mixed']);
 for(let attempt=0;attempt<8;attempt++){
  options.seed=attempt?`${seed}-retry${attempt}`:seed;
  try{return create(mode,options);}catch(error){if(attempt===7)throw error;}
 }
}
function nextMaze(state){
 const g=state.game;
 if(g.world.exit<0||g.player.world_position!==g.world.exit)return null;
 const rng=M.random(`${state.config.seed}:next:${state.config.stage}`),pick=list=>list[Math.floor(rng()*list.length)];
 const options={layout:pick(['dfs','prim','division','rooms'].filter(x=>x!==state.config.layout)),size:pick(Object.keys(sizes).filter(x=>x!==state.config.size)),stage:state.config.stage+1,completedSteps:state.config.completedSteps+g.steps,
 warpStyle:pick(['none','pair','oneway','cycle3','cycle4'].filter(x=>x!==state.config.warpStyle)),warpCount:pick([1,2,3,4]),warpInvisible:rng()<.35};
 options.course=state.config.course;
 if(options.course==='plain')options.warpStyle='none';
 if(options.course!=='all')options.warpInvisible=false;
 const mode=pick(['right','left','half','mirror','mixed'].filter(x=>x!==state.mode));
 // Build independently; a failed generation leaves the cleared floor intact.
 for(let attempt=0;attempt<8;attempt++){
  options.seed=`journey-${Math.floor(rng()*4294967296).toString(36)}-${options.stage}`;
  try{return create(mode,options);}catch(error){if(attempt===7)throw error;}
 }
}
function setCourse(state,course){
 if(!['all','visible','plain'].includes(course))throw new Error('Unknown course');
 // This preference only affects the next generation, never past actions.
 state.config.course=course;
}
function continueExploring(state){
 if(!state.game.won)return false;
 state.game.won=false;state.exitReached=true;state.exploringAfterExit=true;
 state.history.push(['continue']);return true;
}
function placeMarker(state){const result=M.placeMarker(state.game);observe(state);state.history.push(['mark']);return result;}
function inspectMatch(state,index,landmarkCache=null){
 const archive=state.archives[index];
 if(!archive)return {status:'missing',candidates:[],shared:0};
 if(state.chart.matches.has(index))return {status:'matched',candidates:[],shared:0};
 const landmarks=chart=>{
  if(landmarkCache?.has(chart.nodes))return landmarkCache.get(chart.nodes);
  const result=new Map();
  for(const n of chart.nodes.values())if(n.warpAnchor||n.feature==='<'||/^[1-9]$/.test(n.feature)){
   const key=n.warpAnchor||n.feature;
   if(result.has(key))result.set(key,null);else result.set(key,n);
  }
  if(landmarkCache)landmarkCache.set(chart.nodes,result);
  return result;
 };
 const a=landmarks(archive),b=landmarks(state.chart),pairs=[];
 for(const [label,node] of a)if(b.has(label)){
  if(!node||!b.get(label))return {status:'ambiguous',candidates:[],shared:0};
  pairs.push([node,b.get(label)]);
 }
 if(!pairs.length)return {status:'no-landmarks',candidates:[],shared:0};
 const candidates=[];let rotation=identity();
 for(let i=0;i<4;i++){
  for(const mirrored of [false,true]){
   const matrix=mirrored?compose(rotation,transforms.mirror):rotation;
   const [source,target]=pairs[0],p=apply(matrix,source.x,source.y),offset=[target.x-p[0],target.y-p[1]];
   if(pairs.every(([a,b])=>{const p=apply(matrix,a.x,a.y);return p[0]+offset[0]===b.x&&p[1]+offset[1]===b.y;}))candidates.push({matrix:[...matrix],offset});
  }
  rotation=compose(transforms.right,rotation);
 }
 // Shared labels anchor the translation; observed terrain can disambiguate
 // rotations/reflections even when only one landmark was recorded.
 const consistent=candidates.filter(({matrix,offset})=>{
  for(const n of archive.nodes.values()){
   const p=apply(matrix,n.x,n.y),old=state.chart.nodes.get(`${p[0]+offset[0]},${p[1]+offset[1]}`);
   if(old&&old.terrain!==n.terrain)return false;
  }
  return true;
 });
 // Unknown cells are not evidence; never consult the true world or frame.
 if(consistent.length!==1)return {status:consistent.length?'ambiguous':'conflict',candidates:consistent,shared:pairs.length};
 return {status:'ready',candidates:consistent,shared:pairs.length};
}
function matchArchive(state,index,landmarkCache=null){
 const result=inspectMatch(state,index,landmarkCache);if(result.status!=='ready')return result;
 const {matrix,offset}=result.candidates[0],nodes=new Map(state.chart.nodes);
 for(const n of state.archives[index].nodes.values()){
  const p=apply(matrix,n.x,n.y),x=p[0]+offset[0],y=p[1]+offset[1],key=`${x},${y}`,old=nodes.get(key);
  if(!old||(n.seenAt??0)>(old.seenAt??0))nodes.set(key,{...n,x,y});
 }
 state.chart.nodes=nodes;state.chart.matches.add(index);
 // The saved integrated chart already contains these confirmed originals.
 for(const source of state.archives[index].matches||[])if(source>=0&&source<index)state.chart.matches.add(source);
 state.history.push(['match',index]);
 return {...result,status:'matched'};
}
// Revisit earlier records when a later record supplies new landmark evidence.
function matchAll(state){
 const before=new Set(state.chart.matches),landmarkCache=new WeakMap();let changed;
 do{
  changed=false;
  for(let i=0;i<state.archives.length;i++){
   if(state.chart.matches.has(i))continue;
   if(matchArchive(state,i,landmarkCache).status==='matched'){changed=true;}
  }
 }while(changed);
 return {matched:[...state.chart.matches].filter(i=>!before.has(i)),pending:state.archives.map((_,index)=>({index,...inspectMatch(state,index,landmarkCache)})).filter(r=>r.status!=='matched')};
}
function inspectAll(state){
 const preview={...state,history:[],chart:{...state.chart,nodes:new Map(state.chart.nodes),matches:new Set(state.chart.matches)}};
 return matchAll(preview);
}
function exportMapReport(state){
 const {game:g,config:c}=state,w=g.world;
 const names={demo:'二部屋の教材',dfs:'DFS',prim:'Prim',division:'領域分割',rooms:'部屋＋通路'};
 const styles={none:'なし',pair:'相互',oneway:'一方通行',cycle3:'3地点の輪',cycle4:'4地点の輪'};
 return [
  '迷路のアトリエ — 向きの実験・真世界の地図',
  `シード: ${c.seed}`,`生成方式: ${names[c.layout]}`,`空間: 平面 / ${w.width} × ${w.height}`,
  `第${c.stage}迷路 / ${g.steps}歩 / 累計${c.completedSteps+g.steps}歩 / 転移${state.crossings}回`,
  `ワープ: ${styles[c.warpStyle]} / ${w.warpCount??1}組 / ${c.warpInvisible?'不可視':'可視'}`,
  `向きの変化: ${{right:'時計回り90°',left:'反時計回り90°',half:'180°回転',mirror:'左右反転',mixed:'組ごとに回転・反転'}[c.mode]}`,`現在地: 左から${g.player.world_position%w.width+1}列・上から${Math.floor(g.player.world_position/w.width)+1}行`,
  '真世界の固定した向きで、未探索の地形も含めて出力しています。',
  'このテキストは地図の記録です。探索を復元するにはJSONの保存データを使ってください。','',
  M.exportTrueMap(g),'',
  '# 壁 / . 床 / @ 現在地 / < 入口 / > 出口 / 1〜9 目印 / O 可視ワープ',
  '同じマスの記号は@を優先します。不可視ワープは床として表示します。',
  'ワープの接続先・方向変換は地図上の線では表していません。'
 ].join('\n');
}
const api={createJourney,exportMapReport,setCourse,nextMaze,continueExploring,matchAll,inspectAll,placeMarker,inspectMatch,matchArchive,identity,transforms,apply,inverse,compose,direction,create,input,move};
if(typeof module==='object')module.exports=api;else root.MazeOrientation=api;
})(typeof globalThis!=='undefined'?globalThis:this);

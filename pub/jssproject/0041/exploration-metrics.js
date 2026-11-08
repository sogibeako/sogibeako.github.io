/* Read-only formatting of physical floor observations, never projected copies. */
(function(root){'use strict';
// Worlds are immutable between generation/load operations. Cache only topology.
const reports=new WeakMap();
function connectionReport(world){
 if(!world||!world.cells||!world.edges||!Number.isInteger(world.start))return null;
 if(reports.has(world))return reports.get(world);
 const cells=world.cells,seen=new Set(),queue=[];
 if(cells[world.start]){seen.add(world.start);queue.push(world.start);}
 for(let i=0;i<queue.length;i++)for(let d=0;d<4;d++){
  const id=world.edges.get(queue[i]+':'+d)?.to;
  if(cells[id]&&!seen.has(id)){seen.add(id);queue.push(id);}
 }
 const total=Array.from(cells).filter(Boolean).length;
 const text='地形接続（扉開放・ワープ移動を除く）：入口から '+seen.size+' / '+total+'床、'+(Number.isInteger(world.exit)?(seen.has(world.exit)?'出口へ到達可能':'出口への地形経路なし'):'出口なし');
 reports.set(world,text);return text;
}
function summarize({actions,cells,seen,complete,moves}){
 const floors=new Set();for(let id=0;id<cells.length;id++)if(cells[id])floors.add(id);
 const observed=new Set();for(const id of seen||[])if(floors.has(id))observed.add(id);
 const total=floors.size,count=observed.size,percent=total?Math.floor(count/total*100):0;
 // Some older runtimes only store an action count; do not mislabel waits as steps.
 const walked=Array.isArray(moves)?moves.filter(d=>Number.isInteger(d)&&d>=0&&d<4).length:null;
 return {turn:actions,stepLabel:walked===null?'行動回数':'歩数／行動',steps:walked===null?String(actions):walked+' / '+actions,label:'通路の発見率',discovery:percent+'%（'+count+' / '+total+'床）'+(complete?'・地図完成':'')};
}
const api={summarize,connectionReport};if(typeof module==='object')module.exports=api;else root.MazeConsoleMetrics=api;
})(globalThis);

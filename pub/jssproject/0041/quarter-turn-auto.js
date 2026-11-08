/* Directed BFS; returned directions belong to the true-world edge graph. */
(function(root){'use strict';
function next(state,visited,mode='explore'){
 if(!['explore','exit'].includes(mode))throw Error('Invalid walking mode');
 const w=state.world,remaining=mode==='explore'&&w.cells.some((v,id)=>v&&!visited.has(id));
 const goal=id=>remaining?!visited.has(id):id===w.exit;
 if(!remaining&&w.exit===undefined)return {done:true,reason:'全床探索が完了しました。'};
 if(goal(state.id))return {done:true,reason:mode==='explore'?'全床探索を終えて出口に到着しました。':'出口に到着しました。'};
 const q=[state.id],parents=new Map([[state.id,null]]);let target;
 for(let i=0;i<q.length;i++){const id=q[i];if(goal(id)){target=id;break;}for(let d=0;d<4;d++){const e=w.edges.get(id+':'+d);if(e&&w.cells[e.to]&&!parents.has(e.to)){parents.set(e.to,{id,d});q.push(e.to);}}}
 if(target===undefined)return {done:true,blocked:true,reason:'目標へ到達する経路が見つかりません。'};
 let step=parents.get(target);while(step.id!==state.id)step=parents.get(step.id);
 return {done:false,direction:step.d,phase:remaining?'未訪問の床へ':'出口へ'};
}
const api={next};if(typeof module==='object')module.exports=api;else root.QuarterTurnAuto=api;
})(globalThis);

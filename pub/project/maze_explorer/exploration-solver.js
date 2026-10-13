/* Exit assistance using full geometry. Planning never mutates exploration. */
(function(root){'use strict';
function search(start,isExit,neighbors){
 const key=s=>s.id+':'+(s.mask||0),q=[start],parents=new Map([[key(start),null]]);let finish=null;
 for(let i=0;i<q.length;i++){const at=q[i];if(isExit(at)){finish=key(at);break;}for(const [direction,next]of neighbors(at)){const k=key(next);if(parents.has(k))continue;parents.set(k,[key(at),direction]);q.push(next);}}
 if(finish===null)throw Error('現在地から出口への道が見つかりません。');
 const path=[];for(let p=parents.get(finish);p;p=parents.get(p[0]))path.push(p[1]);return path.reverse();
}
function connected(state){const w=state.world;if(!Number.isInteger(w.exit))throw Error('出口のある生成迷路で使えます。');return search({id:state.id},s=>s.id===w.exit,s=>{const list=[];for(let d=0;d<4;d++){const e=w.edges.get(s.id+':'+d);if(e&&w.cells[e.to])list.push([d,{id:e.to}]);}return list;});}
function main(game,core){const w=game.world;if(w.birdMode||w.birds?.length||w.warps?.size||w.rotatingWarp&&w.rotatingWarp!=='none')throw Error('この版の自動歩行は鳥人間・ワープのない迷路に対応しています。');if(!Number.isInteger(w.exit))throw Error('出口のある生成迷路で使えます。');
 const locks=w.puzzle?.locks||[],mask=locks.reduce((m,l,i)=>game.player.keys.includes(l.keyId)?m|1<<i:m,0);
 return search({id:game.player.world_position,mask},s=>s.id===w.exit,s=>{const list=[],keys=locks.filter((l,i)=>s.mask&(1<<i)).map(l=>l.keyId);for(const d of Object.keys(core.DIRS)){const e=core.ruleTransition(w,{...game.player,world_position:s.id,keys},d);if(!e)continue;const i=locks.findIndex(l=>l.key===e.to);list.push([d,{id:e.to,mask:i<0?s.mask:s.mask|1<<i}]);}return list;});
}
const api={connected,main};if(typeof module==='object')module.exports=api;else root.ExplorationSolver=api;
})(globalThis);

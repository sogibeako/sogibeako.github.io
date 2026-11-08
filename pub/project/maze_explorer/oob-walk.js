/* Hidden debug walk: use real movement and casts; never move actors while planning. */
(function(root){'use strict';
function plan(g,M){
 if(g.wands?.oob)return {done:true};
 if(g.world.topology!=='torus'||!g.wands)return null;
 const nav=M.wildlifeAdapter(g),q=[nav.player],parents=new Map([[nav.player,null]]);
 for(const id of q)for(const e of nav.edges(id))if(!parents.has(e.to)){parents.set(e.to,[id,e.dir]);q.push(e.to);}
 const path=id=>{const ds=[];while(parents.get(id)){const [from,d]=parents.get(id);ds.push(Object.keys(M.DIRS)[d]);id=from;}return ds.reverse();};
 const held=g.wands.held.includes('push'),items=new Set(g.wands.items.filter(i=>i.spell==='push').map(i=>i.id));
 if(!held&&!q.some(id=>items.has(id)))return null;
 let target=null,shot=-1;
 for(const id of q){const x=id%g.world.width,y=Math.floor(id/g.world.width);if(x&&y&&x!==g.world.width-1&&y!==g.world.height-1)continue;
 const hypothetical={...g,won:false,wands:{...g.wands,held:[...g.wands.held,'push']},player:{...g.player,world_position:id}};
 for(let d=0;d<4;d++){const r=M.previewWand(hypothetical,'push',d);if(r?.target==='@'&&r.oob!=null){target=id;shot=d;break;}}if(target!==null)break;}
 if(target===null)return null;
 if(!held){const item=q.find(id=>items.has(id));const ds=path(item);return ds.length?{path:ds}:{wait:true};}
 const ds=path(target);return ds.length?{path:ds}:{cast:shot};
}
const api={plan};if(typeof module==='object')module.exports=api;else root.OobWalk=api;
})(globalThis);

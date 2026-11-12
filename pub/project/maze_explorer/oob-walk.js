/* Hidden debug walk: use real movement and casts; never move actors while planning. */
(function(root){'use strict';
function planNow(g,M){
 if(g.wands?.oob)return {done:true};
 if(g.world.topology!=='torus'||!g.wands)return null;
 const nav=M.wildlifeAdapter(g),q=[nav.player],parents=new Map([[nav.player,null]]);
 for(const id of q)for(const [dir,name]of Object.keys(M.DIRS).entries()){const e=M.ruleTransition(g.world,{...g.player,world_position:id},name);if(!e)continue;const to=g.world.warps?.get(e.to)??e.to;if(!parents.has(to)){parents.set(to,[id,dir]);q.push(to);}}
 const path=id=>{const ds=[];while(parents.get(id)){const [from,d]=parents.get(id);ds.push(Object.keys(M.DIRS)[d]);id=from;}return ds.reverse();};
 const held=g.wands.held.includes('push'),items=new Set(g.wands.items.filter(i=>i.spell==='push').map(i=>i.id));
 const key=()=>{const id=q.find(id=>(g.world.puzzle?.locks||[]).some(l=>l.key===id&&!g.player.keys.includes(l.keyId)));return id!==undefined&&id!==nav.player?{path:path(id)}:null;};
 if(!held&&!q.some(id=>items.has(id)))return key();
 let target=null,shot=-1;
 for(const id of q){const x=id%g.world.width,y=Math.floor(id/g.world.width);if(x&&y&&x!==g.world.width-1&&y!==g.world.height-1)continue;
 const hypothetical={...g,won:false,wands:{...g.wands,held:[...g.wands.held,'push']},player:{...g.player,world_position:id}};
 for(let d=0;d<4;d++){const r=M.previewWand(hypothetical,'push',d);if(r?.target==='@'&&r.oob!=null){target=id;shot=d;break;}}if(target!==null)break;}
 if(target===null)return key();
 if(!held){const item=q.find(id=>items.has(id));const ds=path(item);return ds.length?{path:ds}:{wait:true};}
 const ds=path(target);return ds.length?{path:ds}:{cast:shot};
}
function plan(g,M){const actual=planNow(g,M);if(actual||!g.wands||g.world.topology!=='torus')return actual;const quiet={...g,birds:[],wildlife:g.wildlife?{...g.wildlife,pets:[]}:undefined};const candidate=planNow(quiet,M);return candidate?.cast!==undefined?{wait:true,blocked:true}:candidate;}
const api={plan};if(typeof module==='object')module.exports=api;else root.OobWalk=api;
})(globalThis);

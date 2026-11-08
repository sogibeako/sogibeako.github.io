/* Draw only warp connections established by actual traversal. */
(function(root){'use strict';
function records(state){const f=state.features;if(state.world.mode!=='tripleMaze'||!f)return [];return (f.warpTraversed||[]).filter(from=>f.warps.has(from)).map(from=>({from,to:f.warps.get(from)}));}
function endpoints(state){return new Set(records(state).flatMap(r=>[r.from,r.to]));}
function curves(state,tiles){const visible=[...new Map(tiles.map(t=>[t.x+','+t.y,t])).values()].filter(t=>!t.wall),out=[];for(const r of records(state)){const starts=visible.filter(t=>t.id===r.from),ends=visible.filter(t=>t.id===r.to);for(const a of starts){const b=ends.reduce((best,t)=>!best||Math.hypot(t.x-a.x,t.y-a.y)<Math.hypot(best.x-a.x,best.y-a.y)?t:best,null);if(b&&Math.hypot(b.x-a.x,b.y-a.y)>0)out.push({a,b});}}return out;}
function draw(ctx,state,tiles,size){const paths=curves(state,tiles);ctx.save();ctx.globalAlpha=.7;ctx.strokeStyle='#94d7a6';ctx.lineWidth=1.8;for(const {a,b}of paths){const dx=b.x-a.x,dy=b.y-a.y,cx=(a.x+b.x)/2-dy*.15,cy=(a.y+b.y)/2+dx*.15,angle=Math.atan2(b.y-cy,b.x-cx),endX=b.x-Math.cos(angle)*size*.3,endY=b.y-Math.sin(angle)*size*.3;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo(cx,cy,endX,endY);ctx.stroke();ctx.beginPath();ctx.moveTo(endX-Math.cos(angle-.45)*size*.3,endY-Math.sin(angle-.45)*size*.3);ctx.lineTo(endX,endY);ctx.lineTo(endX-Math.cos(angle+.45)*size*.3,endY-Math.sin(angle+.45)*size*.3);ctx.stroke();}ctx.restore();return paths.length;}
// Import each observed direction once; deleting a note must not recreate it.
function syncNotes(state,notes){
 if(state.world.mode!=='tripleMaze')return;
 const recorded=state.tripleNotesRecorded||(state.tripleNotesRecorded=[]);
 for(const r of records(state)){if(recorded.includes(r.from))continue;
  notes.edit(state,{type:'zero',id:r.from});notes.edit(state,{type:'zero',id:r.to});
  notes.edit(state,{type:'arrow',from:r.from,to:r.to});recorded.push(r.from);
 }
}
const api={records,endpoints,curves,draw,syncNotes};if(typeof module==='object')module.exports=api;else root.TripleWarpArrows=api;
})(globalThis);

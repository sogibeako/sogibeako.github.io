/* Draw only witnessed warp directions whose endpoints are on this projection. */
(function(root){'use strict';
function segments(state,positions){const f=state.features;if(!f)return [];const result=[];for(const from of f.warpTraversed||[]){const to=f.warps.get(from),a=positions.get(from),b=positions.get(to);if(a&&b)result.push({from,to,a,b});}return result;}
function draw(ctx,state,positions,tile){
 const arrows=segments(state,positions);ctx.save();ctx.strokeStyle='#80dce8';ctx.fillStyle='#80dce8';ctx.lineWidth=Math.max(1,tile*.065);ctx.globalAlpha=.85;
 for(const {a,b} of arrows){const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);if(length<tile*.8)continue;const ux=dx/length,uy=dy/length,pad=tile*.4,bend=Math.min(tile*.8,length*.18),start={x:a.x+ux*pad,y:a.y+uy*pad},end={x:b.x-ux*pad,y:b.y-uy*pad},control={x:(a.x+b.x)/2-uy*bend,y:(a.y+b.y)/2+ux*bend};
  ctx.beginPath();ctx.moveTo(start.x,start.y);ctx.quadraticCurveTo(control.x,control.y,end.x,end.y);ctx.stroke();
  const angle=Math.atan2(end.y-control.y,end.x-control.x),head=Math.max(3,tile*.23);ctx.beginPath();ctx.moveTo(end.x,end.y);ctx.lineTo(end.x-head*Math.cos(angle-.45),end.y-head*Math.sin(angle-.45));ctx.lineTo(end.x-head*Math.cos(angle+.45),end.y-head*Math.sin(angle+.45));ctx.closePath();ctx.fill();
 }ctx.restore();return arrows.length;
}
const api={segments,draw};if(typeof module==='object')module.exports=api;else root.BranchArrows=api;
})(globalThis);

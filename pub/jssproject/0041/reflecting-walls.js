/* Reflective faces on existing walls: never remove traversable edges. */
(function(root){'use strict';
function choose(seed,candidates){let h=2166136261;for(const c of String(seed)+'|reflecting-walls')h=Math.imul(h^c.charCodeAt(0),16777619);const rand=()=>{h=(Math.imul(h,1664525)+1013904223)>>>0;return h;};candidates=candidates.filter(p=>{if(!p.hole)return true;let n=2166136261;for(const c of String(seed)+'|hole-mirror|'+p.id)n=Math.imul(n^c.charCodeAt(0),16777619);return (n>>>0)%5===0;});const selected=[],used=new Set();
 for(const pool of [candidates.filter(p=>p.boundary),candidates]){const bag=[...pool];let count=0;while(bag.length&&count<3){const p=bag.splice(rand()%bag.length,1)[0];if(used.has(p.id))continue;used.add(p.id);selected.push(p);count++;}}
 // Every accessible face of a selected wall reflects, not just the selected approach.
 return candidates.filter(p=>used.has(p.id));}
function graph(w){const near=new Set(),raw=w.candidates||w.edges;
 for(const [key,e]of raw){if(e.kind&&/boundary|wrap|throat|seam|stairs/.test(e.kind)){near.add(Number(key.split(':')[0]));near.add(e.to);}}
 for(let n=0;n<2;n++)for(const id of [...near])for(let d=0;d<4;d++){const e=w.edges.get(id+':'+d);if(e)near.add(e.to);}
 const hole=new Set();if(['double','tripleMaze'].includes(w.mode)){for(const [key,e]of raw)if(e.kind==='throat'){hole.add(Number(key.split(':')[0]));hole.add(e.to);}for(let n=0;n<2;n++)for(const id of [...hole])for(let d=0;d<4;d++){const e=raw.get(id+':'+d);if(e)hole.add(e.to);}}
 const candidates=[];for(const [key,e]of raw){const [from,d]=key.split(':').map(Number);if(w.cells[from]&&!w.cells[e.to]&&e.to>=0&&e.to<w.cells.length&&!w.edges.has(key))candidates.push({from,d,id:e.to,boundary:near.has(from),hole:hole.has(from)||hole.has(e.to)});}
 return choose(w.seed,candidates);}
function main(w,nav){const candidates=[];for(let from=0;from<w.cells.length;from++)if(w.cells[from])for(let d=0;d<4;d++){if(nav.step(from,d)!==null)continue;const id=nav.wall?.(from,d);if(id!=null&&id>=0&&id<w.cells.length&&!w.cells[id]){const x=from%w.width,y=Math.floor(from/w.width);candidates.push({from,d,id,boundary:x<3||y<3||x>=w.width-3||y>=w.height-3});}}return choose(w.seed,candidates);}
function face(s,from,d){return s.wands?.reflectors?.find(p=>p.from===from&&p.d===d);}
function bump(s,from,d){if(!face(s,from,d))return false;const events=s.wands.events;events.push({turn:s.turns??s.steps,text:'＊ぼよよん＊'});if(events.length>100)events.shift();if(s.wands.revision!==undefined)s.wands.revision++;return true;}
function isWall(s,id){return !!s.wands?.reflectors?.some(p=>p.id===id);}
function paint(ctx,s,id,x,y,size){if(!isWall(s,id))return false;ctx.fillStyle='#d987ba';ctx.fillRect(x-size/2,y-size/2,size-1,size-1);ctx.fillStyle='#fff0fb';ctx.font=`${size*.75}px Consolas, monospace`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('#',x,y);return true;}
const api={bump,graph,main,face,isWall,paint};if(typeof module==='object')module.exports=api;else root.ReflectingWalls=api;
})(globalThis);

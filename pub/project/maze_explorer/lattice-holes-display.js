/* Read-only display data; coordinates are in tiles, independent of canvas size. */
(function(root){
'use strict';
const S=typeof module==='object'?require('./connection-space.js'):root.ConnectionSpace;
const F=typeof module==='object'?require('./lattice-holes-fold.js'):root.SkewFold;
function compose(state,book,view,truth=false){
 const w=state.world,tiles=[],portals=[];
 function tile(x,y,id,bright,glyph){tiles.push({x,y,id,bright,sheet:S.groundSheet(w,id),wall:!w.cells[id],glyph:glyph??(!w.cells[id]?'#':id===w.exit?'>':S.underpassSymbol(w,id)||'.')});}
 if(truth){
  const l=w.layouts[0],playerCells=new Set([state.id]);
  for(const p of w.passages||[])if(p.vertical===state.id)playerCells.add(p.horizontal);
  for(const id of w.domain){if(w.holes.has(id))continue;const p=S.position(w,id);tile(p.sheet*(l.width+2)+p.x,p.y,id,true,playerCells.has(id)?'@':undefined);}
  for(const h of w.portals)portals.push({x:h.sheet*(l.width+2)+h.x,y:h.y,width:2,height:2});
  return {truth:true,columns:2*l.width+2,rows:l.height,tiles,portals};
 }
 // Keep memory first: the current view must overwrite remembered appearances.
 for(const p of F.memory(state,book.charts[book.active]))tile(p.x,p.y,p.id,false,S.underpassSymbol(w,p.id,p.frame)||undefined);
 for(const p of view)tile(p.x,p.y,p.id,true,p.id===state.id?'@':S.underpassSymbol(w,p.id,p.frame)||undefined);
 return {truth:false,columns:19,rows:19,tiles,portals};
}
const api={compose};if(typeof module==='object')module.exports=api;else root.SkewDisplay=api;
})(globalThis);

const assert=require('node:assert/strict'),H=require('./lattice-holes.js'),S=require('./connection-space.js'),F=require('./lattice-holes-fold.js'),Session=require('./lattice-holes-session.js'),D=require('./lattice-holes-display.js');
// Reference the previous UI's tile emission order and glyph selection.
function previous(state,book,view,truth){
 const w=state.world,tiles=[],portals=[];
 function tile(x,y,id,bright,glyph){tiles.push({x,y,id,bright,sheet:S.groundSheet(w,id),wall:!w.cells[id],glyph:glyph??(!w.cells[id]?'#':id===w.exit?'>':S.underpassSymbol(w,id)||'.')});}
 if(truth){const l=w.layouts[0];for(const id of w.domain){if(w.holes.has(id))continue;const p=S.position(w,id);tile(p.sheet*(l.width+2)+p.x,p.y,id,true,(id===state.id||(w.passages||[]).some(c=>c.horizontal===id&&c.vertical===state.id))?'@':undefined);}for(const h of w.portals)portals.push({x:h.sheet*(l.width+2)+h.x,y:h.y,width:2,height:2});}
 else{for(const p of F.memory(state,book.charts[book.active]))tile(p.x,p.y,p.id,false,S.underpassSymbol(w,p.id,p.frame)||undefined);for(const p of view)tile(p.x,p.y,p.id,true,p.id===state.id?'@':S.underpassSymbol(w,p.id,p.frame)||undefined);}
 return {tiles,portals};
}
let frames=0,passageViews=0;
for(const growth of ['walls','dfs','prim','growing']){
 const state=H.create({maze:true,growth,periodSize:20,wallStyle:growth==='prim'?'grid':'dense',shiftX:-2,shiftY:4,underpasses:4,underpassShape:'mixed',holeRimWalls:true,seed:'display-'+growth}),book={charts:[],active:-1};
 function check(view){
  const before=structuredClone({state,book,view});
  for(const truth of [false,true]){
   const display=D.compose(state,book,view,truth),ref=previous(state,book,view,truth);assert.deepEqual(display.tiles,ref.tiles);assert.deepEqual(display.portals,ref.portals);assert.equal(display.truth,truth);
   if(!truth){assert.equal(display.columns,19);const live=display.tiles.filter(p=>p.bright);assert.equal(live.length,view.length);assert(live.some(p=>p.glyph==='@'));assert(display.tiles.slice(0,display.tiles.length-live.length).every(p=>!p.bright));}
   else{assert.equal(display.columns,2*state.world.layouts[0].width+2);assert.equal(display.portals.length,2);assert.equal(display.tiles.filter(p=>p.glyph==='@').length,1);}
   // Returned render data can be consumed or altered without changing exploration.
   if(display.tiles.length)display.tiles[0].glyph='test';if(display.portals.length)display.portals[0].x=-99;
   frames++;
  }
  assert.deepEqual({state,book,view},before);
 }
 check(Session.observe(state,book).view);
 const route=state.world.guaranteedLoops[0];
 for(let lap=0;lap<3;lap++)for(const wd of route.directions)check(Session.step(state,book,wd,true).view);
 // Visit every underpass lane, including virtual floors, and reflected/rotated views.
 for(const p of state.world.passages||[])for(const id of [p.horizontal,p.vertical])for(const frame of [[0,1,2,3],[1,2,3,0],[0,3,2,1]]){
  const probe={...state,id,frame},localBook={charts:[],active:-1},obs=Session.observe(probe,localBook);
  for(const truth of [false,true]){const result=D.compose(probe,localBook,obs.view,truth);assert.deepEqual(result.tiles,previous(probe,localBook,obs.view,truth).tiles);assert(result.tiles.some(t=>t.glyph==='@'));passageViews++;}
 }
 state.foldLoops=false;check(Session.observe(state,book).view);
}
console.log(`${frames} display frames and ${passageViews} underpass views match the previous UI; live-over-memory order, virtual-floor player, portal geometry and non-mutation passed.`);

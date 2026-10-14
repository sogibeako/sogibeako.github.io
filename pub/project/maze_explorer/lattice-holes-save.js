/* Versioned snapshots for the skew-hole experiment, separate from atelier saves. */
(function(root){
'use strict';
const S=typeof module==='object'?require('./connection-space.js'):root.ConnectionSpace;
function encode(snapshot){return JSON.stringify({format:'skew-holes-save',version:1,savedAt:new Date().toISOString(),snapshot},(_,v)=>v instanceof Map?{type:'Map',data:[...v]}:v instanceof Set?{type:'Set',data:[...v]}:v instanceof Uint8Array?{type:'Cells',data:[...v]}:v);}
function decode(text){
 const fail=()=>{throw Error('保存データの形式または内容が不正です。');};
 if(typeof text!=='string'||text.length>20000000)fail();
 const data=JSON.parse(text,(_,v)=>{if(!v||!['Map','Set','Cells'].includes(v.type))return v;if(!Array.isArray(v.data))fail();if(v.type==='Map')return new Map(v.data);if(v.type==='Set')return new Set(v.data);if(v.data.some(n=>n!==0&&n!==1))fail();return Uint8Array.from(v.data);});
 if(data?.format!=='skew-holes-save'||data.version!==1)throw Error('未対応の探索データです。');
 const s=data.snapshot,st=s?.state,w=st?.world,frame=f=>Array.isArray(f)&&f.length===4&&new Set(f).size===4&&f.every(n=>Number.isInteger(n)&&n>=0&&n<4),int=Number.isSafeInteger;
 if(!w||w.mode!=='double'||w.sheets!==2||!(w.cells instanceof Uint8Array)||w.cells.length>10000||!Array.isArray(w.layouts)||![2,4].includes(w.layouts.length))fail();
 let size=0;for(const l of w.layouts){if(!int(l.width)||!int(l.height)||l.width<8||l.width>32||l.height<8||l.height>32||l.offset!==size)fail();size+=l.width*l.height;}if(size!==w.cells.length)fail();
 const cell=n=>int(n)&&n>=0&&n<size,physical=w.layouts[2]?.offset??size;
 for(const name of ['domain','holes','rimCells'])if(!(w[name] instanceof Set)||[...w[name]].some(n=>!cell(n)||n>=physical))fail();
 for(const name of ['edges','candidates']){if(!(w[name] instanceof Map))fail();for(const [k,e] of w[name]){const parts=String(k).split(':').map(Number);if(parts.length!==2||!cell(parts[0])||!int(parts[1])||parts[1]<0||parts[1]>3||!cell(e?.to)||!frame(e.transform))fail();if(name==='edges'&&(!w.cells[parts[0]]||!w.cells[e.to]))fail();}}
 const l=w.lattice;if(!l||![l.width,l.height,l.shiftX,l.shiftY,w.minX,w.minY].every(int)||l.width<8||l.width>24||l.height<8||l.height>24||l.height%2||l.width%2||l.shiftX%2||l.shiftY%2||Math.abs(l.shiftX)>4||Math.abs(l.shiftY)>4||l.determinant!==l.width*l.height-l.shiftX*l.shiftY||JSON.stringify(l.a)!==JSON.stringify([l.width,-l.shiftY])||JSON.stringify(l.b)!==JSON.stringify([-l.shiftX,l.height]))fail();
 if(!cell(st.id)||!w.cells[st.id]||!frame(st.frame)||![st.x,st.y,st.steps].every(int)||st.steps<0||!Array.isArray(st.history)||!cell(w.start)||!w.cells[w.start]||w.maze&&(!cell(w.exit)||!w.cells[w.exit]))fail();
 if(!['walls','dfs','prim','growing'].includes(w.growth)||!['grid','dense'].includes(w.wallStyle)||!['straight','mixed','corners'].includes(w.underpassShape)||!Array.isArray(w.portals)||w.portals.length!==2)fail();
 for(const p of w.portals)if(![0,1].includes(p.sheet)||!int(p.x)||!int(p.y)||p.size!==2||p.x<1||p.y<1||p.x+2>=w.layouts[p.sheet].width||p.y+2>=w.layouts[p.sheet].height)fail();
 for(const p of w.passages||[])if(!cell(p.horizontal)||!cell(p.vertical)||![0,1].includes(p.baseSheet)||!int(p.cx)||!int(p.cy)||p.arms&&(!Array.isArray(p.arms)||p.arms.length!==2||p.arms.some(d=>!int(d)||d<0||d>3)))fail();
 if(!s.book||!Array.isArray(s.book.charts)||!int(s.book.active)||s.book.active< -1||s.book.active>=s.book.charts.length||!int(s.journey?.number)||s.journey.number<1||!int(s.journey.steps)||s.journey.steps<0)fail();
 for(const c of s.book.charts){if(!(c.cells instanceof Map)||!int(c.number)||c.number<1)fail();for(const [key,p] of c.cells){if(!p||!int(p.x)||!int(p.y)||key!==`${p.x},${p.y}`||p.id!==-1&&!cell(p.id)||p.frame&&!frame(p.frame))fail();}}
 if(w.holeRimWalls!==undefined&&typeof w.holeRimWalls!=='boolean')fail();
 if(w.holeRimWallCount!==undefined&&(!int(w.holeRimWallCount)||w.holeRimWallCount<0||w.holeRimWallCount>w.rimCells.size))fail();
 if(st.foldLoops!==undefined&&typeof st.foldLoops!=='boolean')fail();
 if(st.loopThreshold!==undefined&&![0,3,5].includes(st.loopThreshold))fail();
 if(st.loopExperience){const r=st.loopExperience;if(!(r.counts instanceof Map)||!Array.isArray(r.path)||r.path.length>size||!int(r.lastStep)||r.lastStep<0||r.lastStep>st.steps)fail();for(const [key,n] of r.counts){if(typeof key!=='string')fail();const parts=key.split(':').map(Number);if(parts.length!==3||![0,1].includes(parts[0])||!parts.every(int)||(!parts[1]&&!parts[2])||!int(n)||n<1)fail();}for(const p of r.path)if(!cell(p.id)||!w.cells[p.id]||!int(p.x)||!int(p.y)||typeof p.frame!=='string'||!frame(p.frame.split(',').map(Number)))fail();}
 if(!s.controls||Object.values(s.controls).some(c=>!c||typeof c.value!=='string'||typeof c.checked!=='boolean'))fail();
 const repaired=S.repairSkewSeams(w);
 if(repaired){
  // Discard only impossible off-domain wall sightings, not explored floors.
  for(const chart of s.book.charts)for(const [key,p] of chart.cells)if(p.wall&&p.id>=0&&!w.domain.has(p.id))chart.cells.delete(key);
  S.observeWalkingMap(st,s.book);
  data.repairedSeams=repaired;
 }
 if(w.returnPocket){const H=typeof module==='object'?require('./lattice-holes.js'):root.LatticeHoles;if(!H.verifyReturnPocket(w))fail();}
 (typeof module==='object'?require('./sheet-features.js'):root.SheetFeatures).validate(st);
 return data;
}
const api={encode,decode};if(typeof module==='object')module.exports=api;else root.SkewSave=api;
})(globalThis);

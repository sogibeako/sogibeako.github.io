'use strict';
const K=MazeKlein,$=id=>document.getElementById(id),canvas=$('kleinMap'),ctx=canvas.getContext('2d');
let state,truth=false,ascii=false;
function start(fresh=false){
 if(fresh)$('kleinSeed').value='klein-'+Math.random().toString(36).slice(2,10);
 state=K.create(K.rasterize(K.generate($('kleinSeed').value,$('kleinMode').value)));draw();canvas.focus();
}
function draw(){
 const width=canvas.clientWidth,height=canvas.clientHeight,dpr=window.devicePixelRatio||1;
 canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#0b161c';ctx.fillRect(0,0,width,height);
 const w=state.world,columns=truth?w.width:17,rows=truth?w.height:17,tile=Math.min((width-36)/columns,(height-36)/rows),ox=(width-columns*tile)/2,oy=(height-rows*tile)/2;
 const paint=(x,y,id,terrain,visible,player)=>{
  const px=ox+x*tile,py=oy+y*tile;if(x<0||x>=columns||y<0||y>=rows)return;
  ctx.fillStyle=player?'#b9dbc6':terrain?(visible?'#284443':'#162b31'):(visible?'#7b9693':'#34484e');ctx.fillRect(px,py,tile-.5,tile-.5);
  const mark=player?'@':!terrain?'#':id===w.exit?'>':id===w.start?'<':'.';
  if(ascii||player||(terrain&&(id===w.exit||id===w.start))){
   ctx.font=`${Math.max(10,tile*.72)}px monospace`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=player?'#142729':terrain?'#edba72':'#10252b';ctx.fillText(mark,px+tile/2,py+tile/2);
  }
 };
 if(truth){
  for(let id=0;id<w.width*w.height;id++)paint(id%w.width,Math.floor(id/w.width),id,w.cells[id],true,id===state.id);
  ctx.font='11px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  for(let row=0;row<w.height;row++){
   ctx.fillStyle='#edba72';ctx.fillText(String(row+1),ox-10,oy+(row+.5)*tile);ctx.fillText(String((w.height-row)%w.height+1),ox+w.width*tile+10,oy+(row+.5)*tile);
  }
 }else for(const [key,n] of state.memory)paint(n.x-state.x+8,n.y-state.y+8,n.id,n.terrain,state.visible.has(key),n.x===state.x&&n.y===state.y);
 $('kleinTiles').setAttribute('aria-pressed',String(!ascii));$('kleinAscii').setAttribute('aria-pressed',String(ascii));
 $('kleinSubjective').setAttribute('aria-pressed',String(!truth));$('kleinTruth').setAttribute('aria-pressed',String(truth));
 const seam=state.last?.seam==='horizontal'?'左右の境界を通過し、上下の対応が反転しました。':state.last?.seam==='vertical'?'上下の境界を通過しました。向きはそのままです。':'';
 $('kleinStatus').textContent=`${state.steps}歩 / 境界通過 ${state.crossings}回。真世界の上は、主観世界では${state.flipped?'下':'上'}です。 ${state.id===w.exit?'出口に到達しました！ このまま探索を続けられます。 ':''}${seam}${truth?' 左右の金色の数字は、同じ数字の行どうしが接続することを表します。':''}`;
 const path=K.pathSummary(state);
 $('kleinPath').textContent=`基準点からの境界通過 ${path.total}回：${path.recent}。逆向きの隣接ペアを除いた列（${path.length}記号）：${path.reduced}。`;
 const counts=state.returnCounts;
 $('kleinReturnStatus').textContent=`基準点：${state.reference.steps}歩目の場所。向きも同じ帰還 ${counts.same}回 / 向きが反転した帰還 ${counts.reversed}回。`;
 const groups=K.returnGroups(state);
 $('kleinReturnGroupStatus').textContent=groups.length?`最近の帰還${state.returns.length}件を、${groups.length}か所の展開先に整理しています。`:'まだ別の展開先への帰還はありません。';
 $('kleinReturnGroups').replaceChildren(...groups.map(g=>{
  const li=document.createElement('li');li.textContent=`横 ${g.dx} / 縦 ${g.dy}・${g.kind==='same'?'基準と同じ向き':'基準から上下反転'}：${g.count}回到着（表示中の初回 ${g.firstStep}歩目、最新 ${g.lastStep}歩目）`;return li;
 }));
 const intervals=state.returnIntervals,shifted=intervals.filter(e=>e.type==='shifted').length;
 $('kleinIntervalStatus').textContent=intervals.length?`最新${intervals.length}区間：展開先の変化 ${shifted}回 / 同じ展開先への再訪 ${intervals.length-shifted}回。`:'基準点の実セルへ戻ると、最初の区間を記録します。';
 $('kleinIntervals').replaceChildren(...intervals.slice().reverse().map(e=>{
  const t=K.intervalTransform(e),li=document.createElement('li');li.textContent=`${e.fromStep}→${e.toStep}歩目（${e.steps}歩）：${e.type==='revisit'?'同じ展開先への再訪':'展開先が変化'}。前回から横 ${e.dx} / 縦 ${e.dy}、向きは${e.flipped?'反転':'維持'}。出発時の反転をそろえた変位：横 ${t.dx} / 縦 ${t.dy}。`;return li;
 }));
 const transformGroups=K.intervalGroups(state);
 $('kleinTransformStatus').textContent=transformGroups.length?`最新20区間内の変位・反転を${transformGroups.length}組に整理（変位0・向き維持は除外）。`:'比較できる変位・反転はまだありません。';
 $('kleinTransformGroups').replaceChildren(...transformGroups.map(g=>{
  const inv=K.inverseTransform(g),li=document.createElement('li');li.textContent=`横 ${g.dx} / 縦 ${g.dy}・${g.flipped?'反転':'向き維持'}：${g.forward}区間 ／ 逆向き（横 ${inv.dx} / 縦 ${inv.dy}）：${g.reverse}区間`;return li;
 }));
 $('kleinReturnLog').replaceChildren(...state.returns.slice().reverse().map(e=>{
  const li=document.createElement('li');li.textContent=`${e.step}歩目：${e.kind==='same'?'場所も向きも一致':'場所は一致・上下の対応は反転'}（基準から${e.elapsed}歩、主観座標の差：横 ${e.dx} / 縦 ${e.dy}）。境界列：${e.path.recent} ／ 隣接ペア除去後：${e.path.reduced}`;return li;
 }));
 if(state.lastReturn)$('kleinStatus').textContent+=` 基準点へ帰還：${state.lastReturn.kind==='same'?'向きも元に戻りました。':'上下の対応が反転しています。'}`;
 canvas.setAttribute('aria-label',`クラインの壺、${truth?'真世界':'主観世界'}、${state.steps}歩、${state.flipped?'上下反転':'通常の向き'}`);
}
function move(d){if(K.move(state,d,truth))draw();else $('kleinStatus').textContent='その方向は壁です。';}
function compareRoutes(){
 const result=MazeKleinComparison.compare($('kleinCompareMode').value),table=document.createElement('table'),caption=document.createElement('caption');
 caption.textContent='独立した開放空間での到着結果（各44歩）';table.append(caption);
 const head=document.createElement('thead'),header=document.createElement('tr');
 for(const title of ['経路（真世界方向）','真世界の到着位置','向き','主観座標','境界列']){const th=document.createElement('th');th.scope='col';th.textContent=title;header.append(th);}head.append(header);table.append(head);
 const body=document.createElement('tbody');
 for(const r of result.results){const tr=document.createElement('tr');for(const value of [r.label,`${r.column}列・${r.row}行`,r.flipped?'上下反転':'通常',`(${r.x}, ${r.y})`,r.path.recent]){const td=document.createElement('td');td.textContent=value;tr.append(td);}body.append(tr);}table.append(body);
 const text=document.createElement('p');text.textContent=`真世界の場所：${result.sameCell?'一致':'異なる'}。向き：${result.sameFrame?'一致':'異なる'}。展開された主観地図の位置：${result.sameLift?'一致':'異なる'}。${result.sameLift?'縦の方向を逆にすると、この2経路の展開先も一致します。':'同じ実セル・同じ向きだけでは、展開された地図の位置まで一致するとは限りません。'}`;
 $('kleinCompareResult').replaceChildren(table,text);
}
$('kleinCompareRun').addEventListener('click',compareRoutes);
$('kleinCompareMode').addEventListener('change',()=>{$('kleinCompareResult').replaceChildren();});
$('kleinSettings').addEventListener('submit',e=>{e.preventDefault();start();});
$('kleinReference').addEventListener('click',()=>{K.setReference(state);draw();canvas.focus();});
$('kleinNew').addEventListener('click',()=>start(true));
$('kleinSubjective').addEventListener('click',()=>{truth=false;draw();canvas.focus();});
$('kleinTruth').addEventListener('click',()=>{truth=true;draw();canvas.focus();});
$('kleinTiles').addEventListener('click',()=>{ascii=false;draw();canvas.focus();});
$('kleinAscii').addEventListener('click',()=>{ascii=true;draw();canvas.focus();});
for(const button of document.querySelectorAll('[data-move]'))button.addEventListener('click',()=>move(button.dataset.move));
canvas.addEventListener('click',()=>canvas.focus());
document.addEventListener('keydown',e=>{
 if(e.isComposing||e.ctrlKey||e.metaKey||e.altKey||e.target.closest('input,select,textarea,[contenteditable="true"],#kleinReplay'))return;
 const d={ArrowUp:'N',ArrowDown:'S',ArrowLeft:'W',ArrowRight:'E',h:'W',j:'S',k:'N',l:'E'}[e.key];
 if(d){e.preventDefault();move(d);}else if(e.key==='0'||e.key==='1'){e.preventDefault();truth=e.key==='1';draw();}else if(e.shiftKey&&e.key.toLowerCase()==='n'&&!e.repeat){e.preventDefault();start(true);}
});
window.addEventListener('resize',()=>{if(state)draw();});start();

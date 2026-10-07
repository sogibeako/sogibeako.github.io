'use strict';
const S=ConnectionSpace,$=id=>document.getElementById(id),canvas=$('spaceMap'),ctx=canvas.getContext('2d');
const descriptions={underpassMaze:'枝道の途中に小さなアンダーパスが現れます。縦道と横道は交差点で曲がれず、抜けると同じ地上へ戻ります。出口 > を探してください。シードで地形と交差の位置が変わります。',underpass:'中央の1マスだけ縦道と横道が別々になっています。上下からは縦道、左右からは横道として見え、交差点では曲がれません。外周を回ると反対側の通路へ行けます。斜めからは近い入口側を優先し、同距離なら横道を優先します。',crossingMaze:'立体交差と2つの階段を残し、その周りへ枝道を生成します。緑は上層、紫は下層。出口 > を探してください。交差点では別の層へ曲がれません。同じシードで同じ迷路を再現できます。',crossing:'緑の上層は東西の橋、紫の下層は南北の通路です。同じ4列・4行で交差しますが、上下はつながらず、階段でだけ行き来できます。初期位置から右1歩が橋の交差部。初期位置から左→上→上→右→右→下→下で、その真下へ着きます。階段は△（上層）・▽（下層）、交差部は═・║です。',triple:'緑→紫→青の3トーラスを、同じ大きさの穴でつなぎます。横長の中央シートには左右2つの穴があり、それぞれ両端のシートにつながります。外周は各シート内で循環します。',branch3:'右上から下2→左2→上2→右2で柱を1周。風景がA→B→Cと順に変わり、3周で元に戻ります。逆回りでは逆順に変わります。見えるシートは視線の経路で選びます。',doubleTwist:'Topowalkのdouble-twist：左右の外周で上下反転、上下の外周で左右反転します。',cwTwist:'Topowalkのquarter-clockwise-twist：接続先辺を時計回りに選び、辺上の位置を逆順にします。向きは元ファイル通り反時計回り90度です。',ccwTwist:'Topowalkのquarter-counterclockwise-twist：接続先辺を反時計回りに選び、辺上の位置を逆順にします。向きは元ファイル通り時計回り90度です。',chaos:'全辺を越えるたび時計回り90度回転します。上→左、右→上、下→右、左→下へ接続し、逆操作でも元に戻るとは限りません。4歩以内の接続をたどり、近い候補を優先・同距離なら壁を表示します。移動は現在地からの実際の接続で判定します。',branch4:'右上から下2→左2→上2→右2で柱を1周します。反対側の区画から順にA→Bへ変わり、2周で元へ戻ります。主観図は視線が柱のどちら側を通るかで風景が変わります。チェックを外すと遮蔽なしで切替を比較できます。',branch:'中央の # を囲んで1周すると別の風景へ、2周すると元へ戻ります。最初の位置から右2→下2→左2→上2で1周です。緑の風景にはA、紫の風景にはBがあり、壁の配置も一部異なります。外周は行き止まり。切れ目は真世界だけに点線で表示します。',double:'各シートの外周は、そのシート内で通常のトーラスとして接続します。中央の黒い穴の水色の縁を越えると、別シートの穴の対応する縁へ移ります。境界に垂直な向きは反転します。主観にも穴の先をたどった周辺4歩を表示します。別の位置に自分の像が現れる場合は@で表示します。',plane:'四辺は行き止まりです。',cylinder:'左右だけがつながります。上下は行き止まりです。',mobius:'左右が上下反転してつながります。上下は行き止まりです。右8歩で反転、右16歩で位置と向きが戻ります。',torus:'左右・上下がそのままつながります。',klein:'左右は上下反転、上下はそのままつながります。',sheets:'左右境界を越えると別シートへ移ります。上下は同じシート内でつながります。右16歩で元のシートへ戻ります。',rotate:'右辺→上辺、左辺→下辺で時計回り90度回転します（対応位置は逆順）。逆に越えると反時計回りです。'};
let state=S.create('plane',{walls:true}),truth=false,atlasShown=false,atlasMemory=new Set(),walkingBook={charts:[],active:-1},browsedChart=0;
const statisticsCache=new WeakMap();
function draw(){
 const atlasMode=['crossing','crossingMaze'].includes(state.world.mode),atlas=atlasMode&&atlasShown,observation=S.observeAtlas(state,atlasMemory),visible=observation.visible;
 $('spaceAtlas').hidden=!atlasMode;$('spaceAtlas').setAttribute('aria-pressed',String(atlas));
 const full=truth||atlas;
 const preview=!['branch4','branch3'].includes(state.world.mode),metrics={},candidates=preview?S.nearestView(state,4,metrics):[];
 const walkingMode=atlasMode||['underpass','underpassMaze'].includes(state.world.mode);
 const walking=walkingMode?S.observeWalkingMap(state,walkingBook,candidates):null;
 $('chartBrowser').hidden=!walkingMode;
 const chooser=$('chartChoice');if(chooser.options.length!==walkingBook.charts.length+1){chooser.replaceChildren(new Option('現在の探索', '0'),...walkingBook.charts.map(c=>new Option(`主観地図 ${c.number}`,String(c.number))));}chooser.value=String(browsedChart);
 const archived=walkingMode&&!full&&browsedChart?walkingBook.charts.find(c=>c.number===browsedChart):null;
 let bounds=null;if(archived){const points=[...archived.cells.values()];bounds={minX:Math.min(...points.map(p=>p.x))-1,minY:Math.min(...points.map(p=>p.y))-1,maxX:Math.max(...points.map(p=>p.x))+1,maxY:Math.max(...points.map(p=>p.y))+1};}
 const width=canvas.clientWidth,height=canvas.clientHeight,dpr=window.devicePixelRatio||1;canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#0b161c';ctx.fillRect(0,0,width,height);
 const layouts=state.world.layouts||Array.from({length:state.world.sheets},(_,i)=>({width:8,height:8,offset:i*64})),starts=[];let total=0;for(const l of layouts){starts.push(total);total+=l.width+1;}
 const four=['branch4','branch3'].includes(state.world.mode),columns=bounds?bounds.maxX-bounds.minX+1:full?total:four?8:17,rows=bounds?bounds.maxY-bounds.minY+1:full?Math.max(...layouts.map(l=>l.height))+2:four?8:17,tile=Math.min((width-24)/columns,(height-30)/rows),ox=(width-columns*tile)/2,oy=(height-rows*tile)/2;
 function cell(x,y,id,player=false,selfImage=false,remembered=false){if(x<0||x>=columns||y<0||y>=rows)return;if(full&&state.world.holes.has(id))return;if(atlas&&!atlasMemory.has(id))return;ctx.globalAlpha=(remembered||atlas&&!visible.has(id))?.42:1;const branch=['branch','branch4','branch3'].includes(state.world.mode),wall=!state.world.cells[id],sheet=['underpass','underpassMaze'].includes(state.world.mode)?0:S.position(state.world,id).sheet;ctx.fillStyle=player?'#b9dbc6':wall?'#738887':['#284443','#453251','#234b64'][sheet]||'#284443';ctx.fillRect(ox+x*tile,oy+y*tile,tile-1,tile-1);ctx.font=`${tile*.7}px monospace`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=player?'#10252b':'#edba72';const mark=player?'@':wall?'#':selfImage?'@':id===state.world.exit?'>':state.world.stairs?.has(id)?(sheet===0?'△':'▽'):state.world.crossings?.has(id)?(['underpass','underpassMaze'].includes(state.world.mode)?(S.position(state.world,id).sheet===1?'║':'═'):(sheet===0?'═':'║')):id===state.world.start?'<':branch&&id%64===20?'ABC'[sheet]:'';if(mark)ctx.fillText(mark,ox+(x+.5)*tile,oy+(y+.5)*tile);ctx.globalAlpha=1;}
 if(['underpass','underpassMaze'].includes(state.world.mode)&&truth){
  // Two local cross-sections of the same shared ground, not separate full sheets.
  for(let section=0;section<2;section++){ctx.fillStyle='#b9dbc6';ctx.font='14px sans-serif';ctx.textAlign='left';ctx.fillText(section?'真世界 · 交差の縦道':'真世界 · 交差の横道',ox+starts[section]*tile,oy+tile*.5);
   for(let y=0;y<layouts[0].height;y++)for(let x=0;x<layouts[0].width;x++){let id=y*layouts[0].width+x;
    if(section){const crossing=state.world.passages.find(p=>p.horizontal===id);if(crossing)id=crossing.vertical;}
    cell(starts[section]+x,y+1,id,id===state.id);
   }
   for(const crossing of state.world.passages){const bx=ox+(starts[section]+crossing.cx)*tile,by=oy+(crossing.cy+1)*tile;ctx.strokeStyle='#edba72';ctx.lineWidth=3;ctx.beginPath();
   if(section){ctx.moveTo(bx,by);ctx.lineTo(bx,by+tile);ctx.moveTo(bx+tile,by);ctx.lineTo(bx+tile,by+tile);}else{ctx.moveTo(bx,by);ctx.lineTo(bx+tile,by);ctx.moveTo(bx,by+tile);ctx.lineTo(bx+tile,by+tile);}ctx.stroke();}
  }
 }else if(archived){for(const p of archived.cells.values())cell(p.x-bounds.minX,p.y-bounds.minY,p.id);}
 else if(full){for(let sheet=0;sheet<state.world.sheets;sheet++){
  ctx.fillStyle='#b9dbc6';ctx.font='14px sans-serif';ctx.textAlign='left';ctx.fillText(`${['crossing','crossingMaze'].includes(state.world.mode)?(sheet===0?'上層 · 東西の橋':'下層 · 南北の通路'):'シート '+ 'ABC'[sheet]} · ${layouts[sheet].width}×${layouts[sheet].height}`,ox+starts[sheet]*tile,oy+tile*.5);
  const l=layouts[sheet];for(let id=l.offset;id<l.offset+l.width*l.height;id++){const p=S.position(state.world,id);cell(starts[sheet]+p.x,1+p.y,id,id===state.id);}
  if(['branch','branch4','branch3'].includes(state.world.mode)){
   ctx.strokeStyle='#edba72';ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(ox+(starts[sheet]+(four?0:4))*tile,oy+5*tile);ctx.lineTo(ox+(starts[sheet]+(four?3:8))*tile,oy+5*tile);ctx.stroke();ctx.setLineDash([]);
  }
  const portals=state.world.portals||(state.world.mode==='double'?[{sheet,x:3,y:3,target:1-sheet}]:[]);
  for(const h of portals.filter(h=>h.sheet===sheet)){
   const hs=h.size||2;
   ctx.strokeStyle='#75c5db';ctx.lineWidth=3;ctx.strokeRect(ox+(starts[sheet]+h.x)*tile,oy+(h.y+1)*tile,hs*tile,hs*tile);
   ctx.fillStyle='#75c5db';ctx.font=`${tile*.4}px sans-serif`;ctx.textAlign='center';ctx.fillText(`↔ ${'ABC'[h.target]}`,ox+(starts[sheet]+h.x+hs/2)*tile,oy+(h.y+1+hs/2)*tile);
  }
 }}else if(four){for(const p of ($('spaceOcclusion').checked?S.branchRayView(state):S.branchView(state,false)))cell(p.x,p.y,p.id,p.id===state.id);}
 else if(preview){if(walking)for(const [key,p] of walking.chart.cells)if(!walking.visible.has(key))cell(p.x-state.x+8,p.y-state.y+8,p.id,false,false,true);for(const p of candidates)cell(p.x+8,p.y+8,p.id,false,!p.wall&&p.selfCandidate);cell(8,8,state.id,true);}

 $('underpassGeneration').hidden=state.world.mode!=='underpassMaze';
 $('underpassExitNext').hidden=state.world.mode!=='underpassMaze';
 $('underpassExitNext').disabled=state.world.mode!=='underpassMaze'||state.id!==state.world.exit;
 $('crossingGeneration').hidden=state.world.mode!=='crossingMaze';
 $('crossingStatistics').hidden=state.world.mode!=='crossingMaze';
 if(state.world.mode==='crossingMaze'){
  if(!statisticsCache.has(state.world))statisticsCache.set(state.world,S.crossingStats(state.world));
  const stats=statisticsCache.get(state.world);
  $('crossingStatisticsText').textContent=`床 ${stats.floors}マス ／ 行き止まり ${stats.deadEnds}か所 ／ 分岐 ${stats.junctions}か所 ／ 入口→出口の最短 ${stats.exitSteps??'到達不能'}${stats.exitSteps===null?'':'歩'}`;
 }

 $('spaceSizes').hidden=!['double','triple'].includes(state.world.mode);$('sheetCSize').hidden=state.world.mode!=='triple';updateHoleHint();
 $('spaceOcclusionControl').hidden=!four;$('spaceViewHint').hidden=four;$('spaceViewHint').textContent=['double','triple'].includes(state.world.mode)?'穴の周辺表示：現在のシートを優先します。別シートの壁は表示せず、その先へは展開しません。異なる色の床は穴の向こうのシートです。':'Topowalk参考の周辺表示：近い候補を優先し、同距離なら壁を表示します。壁の先へは展開せず、周辺4歩までを描きます。';
 $('spaceSubjective').textContent=walkingMode?'0 · 主観の視界と記憶':'0 · 主観の周辺表示';
 if(atlasMode&&!atlas&&!truth)$('spaceViewHint').textContent='明るい範囲は現在の視界、暗い部分はこの地図の記憶です。風景が記憶と矛盾すると別の地図へ切り替えます。Mで上下層の探索地図を確認できます。';
 $('spaceDescription').textContent=descriptions[state.world.mode];$('spaceSubjective').setAttribute('aria-pressed',String(!truth&&!atlas&&!archived));$('spaceTruth').setAttribute('aria-pressed',String(truth));
 if(atlas)$('spaceViewHint').textContent='探索地図：明るいマスは現在の周辺表示、暗いマスは記憶。未探索は空白です。上下層は別々に記録します。Mで周辺表示に戻ります。';
 if(archived)$('spaceViewHint').textContent=`主観地図 ${archived.number} の記録全体を閲覧中です。現在の視界や @ は重ねません。0 または「探索に戻る」で戻れます。移動キーは探索へ戻って1歩進みます。`;
 const here=S.position(state.world,state.id);
 $('spaceStatus').textContent=`${state.steps}歩 / シート ${here.sheet+1} / 真世界 ${here.x+1}列・${here.y+1}行 / 主観 (${state.x}, ${state.y})。主観の上は真世界の${['上','右','下','左'][state.frame[0]]}、主観の右は真世界の${['上','右','下','左'][state.frame[1]]}です。`;
 if(archived)$('spaceStatus').textContent+=` 閲覧中：主観地図 ${archived.number}。記録した床 ${[...archived.cells.values()].filter(p=>!p.wall).length}マス。`;
 if(walking)$('spaceStatus').textContent+=` 主観地図 ${walking.chart.number} / ${walking.book.charts.length}枚。`;
 if(atlasMode)$('spaceStatus').textContent+=` 地図に記録した床 ${[...atlasMemory].filter(id=>state.world.cells[id]).length}マス。`;
 if(state.world.mode==='crossingMaze')$('spaceStatus').textContent+=` シード ${state.world.seed} / ${{dfs:'DFS型',frontier:'各所から枝道',growing:'Growing Tree型',hunt:'Hunt-and-Kill型',prim:'Prim型',kruskal:'Kruskal型'}[state.world.growth]}${state.world.growth==='growing'?'（長い道 '+state.world.newestBias+'%）':''} / ${state.world.wallStyle==='grid'?'格子状の壁':'密な枝道'}。${state.id===state.world.exit?'出口に到達しました！ Shift+Nで次の迷路を生成できます。':''}`;
 if(['underpass','underpassMaze'].includes(state.world.mode)){$('spaceStatus').textContent+=` 基準の交差は${S.underpassAxis(state)==='vertical'?'縦道':'横道'}を優先表示。`;$('spaceViewHint').textContent=truth?'同じ真世界を、交差の横道・縦道に分けて表示します。交差の金色の線は、その通路から曲がれない方向です。外側の床は共通です。':'中央の3×3は近い入口側の通路を表示します。交差点では直進・引き返しだけができます。';}
 if(['underpass','underpassMaze'].includes(state.world.mode)&&!truth)$('spaceViewHint').textContent=archived?`主観地図 ${archived.number} の記録です。0で探索へ戻ります。`:'明るい範囲は現在の視界、暗い範囲は記憶です。アンダーパスの見え方だけが違う部分は同じ地図として扱い、交差は新しい観測で更新します。地図の選択欄で見返せます。';
 if(state.world.mode==='underpassMaze')$('spaceStatus').textContent+=` シード ${state.world.seed} / ${{dfs:'DFS型',frontier:'各所から枝道',growing:'Growing Tree型',hunt:'Hunt-and-Kill型',prim:'Prim型'}[state.world.growth]} / 交差 ${state.world.passages.length}か所（目標 ${state.world.requestedCount}） / ${state.world.route==='required'?'縦→大回り→横の通過が必須':'周回路あり'}。${state.id===state.world.exit?'出口に到達しました！ > で次の迷路へ。移動すれば探索を続けられます。':''}`;
 if(state.world.holeSize)$('spaceStatus').textContent+=` 穴 ${state.world.holeSize}×${state.world.holeSize}。`;
 if(preview)$('spaceStatus').textContent+=` 周辺4歩：候補状態 ${metrics.states}件 / 表示 ${metrics.tiles}マス / 別の位置の自分 ${candidates.filter(p=>!p.wall&&p.selfCandidate&&(p.x!==0||p.y!==0)).length}体。`;
 if(four&&$('spaceOcclusion').checked)$('spaceStatus').textContent+=' 視線ごとに柱の切れ目をたどり、見えるシートを選びます。';
 if(four&&!$('spaceOcclusion').checked){const q=S.quadrantSheets(state).map(n=>'ABC'[n]);$('spaceStatus').textContent+=` 区画：左上 ${q[0]} / 右上 ${q[1]} / 右下 ${q[2]} / 左下 ${q[3]}。`;}
 if(['crossing','crossingMaze'].includes(state.world.mode))$('spaceStatus').textContent+=` ${here.sheet===0?'上層の橋':'下層の通路'}にいます。${state.world.crossings.has(state.id)?'ここは立体交差。別の層へは曲がれません。':''}${state.last?.kind==='stairs'?'階段で層を移りました。':''}`;
 if(state.last?.kind==='throat')$('spaceStatus').textContent+=' 穴の縁を越え、別のシートへ移りました。';
 canvas.setAttribute('aria-label',`${S.names[state.world.mode]}、${archived?'主観地図 '+archived.number+' 閲覧':atlas?'探索地図':truth?'真世界':'主観'}、${state.steps}歩、シート${here.sheet+1}`);
}
function reset(){
 const mode=$('spaceMode').value,options={walls:true,seed:$('crossingSeed').value};
 if(['double','triple'].includes(mode))options.dimensions=['A','B','C'].slice(0,mode==='triple'?3:2).map(n=>[Number($('size'+n+'Width').value),Number($('size'+n+'Height').value)]);
 if(mode==='underpassMaze'){options.growth=$('underpassGrowth').value;options.count=Number($('underpassCount').value);options.route=$('underpassRoute').value;options.seed=$('underpassSeed').value;options.width=Number($('underpassWidth').value);options.height=Number($('underpassHeight').value);}
 if(mode==='crossingMaze'){options.growth=$('crossingGrowth').value;options.newestBias=Number($('crossingBias').value);options.wallStyle=$('crossingWallStyle').value;options.width=Number($('crossingWidth').value);options.height=Number($('crossingHeight').value);}
 if(options.dimensions)options.holeSize=$('holeSize').value==='auto'?'auto':Number($('holeSize').value);
 try{const next=S.create(mode,options);state=next;atlasMemory=new Set();walkingBook={charts:[],active:-1};browsedChart=0;$('sizeError').textContent='';draw();canvas.focus();}catch(error){$('spaceMode').value=state.world.mode;$('sizeError').textContent=error.message;}
}
function updateHoleHint(){
 const mode=$('spaceMode').value,dims=['A','B','C'].slice(0,mode==='triple'?3:2).map(n=>[Number($('size'+n+'Width').value),Number($('size'+n+'Height').value)]),limit=S.holeLimit(mode,dims);
 $('holeHint').textContent=`現在の入力サイズでの上限：${Math.max(0,limit)}×${Math.max(0,limit)}。外周から2マス、中央Bの穴どうしにも2マス以上の通路を残します。自動は最も短い辺のおよそ1/4です。`;
}
for(const input of document.querySelectorAll('#spaceSizes input'))input.addEventListener('input',updateHoleHint);
function nextCrossing(){ $('crossingSeed').value='bridge-'+Math.random().toString(36).slice(2,10);reset();}
$('crossingGrowth').addEventListener('change',()=>{$('crossingBiasControl').hidden=$('crossingGrowth').value!=='growing';});
$('crossingWallStyle').addEventListener('change',()=>{const min=$('crossingWallStyle').value==='grid'?15:8;for(const name of ['crossingWidth','crossingHeight']){$(name).min=String(min);if(Number($(name).value)<min)$(name).value=String(min);}});
function nextUnderpass(){$('underpassSeed').value='underpass-'+Math.random().toString(36).slice(2,10);reset();}
function advanceUnderpass(){
 if(state.world.mode!=='underpassMaze')return;
 if(state.id!==state.world.exit){$('spaceStatus').textContent+=' 次の迷路へは出口 > の上で > を押してください。';return;}
 const world=state.world;
 $('underpassWidth').value=world.layouts[0].width;$('underpassHeight').value=world.layouts[0].height;
 $('underpassGrowth').value=world.growth;$('underpassCount').value=world.requestedCount;$('underpassRoute').value=world.route;
 truth=false;atlasShown=false;nextUnderpass();
}
$('underpassExitNext').addEventListener('click',advanceUnderpass);
$('generateUnderpass').addEventListener('click',reset);$('nextUnderpass').addEventListener('click',nextUnderpass);
$('generateCrossing').addEventListener('click',reset);$('nextCrossing').addEventListener('click',nextCrossing);
$('applySizes').addEventListener('click',reset);
function move(d){browsedChart=0;if(S.move(state,d,truth))draw();else {draw();$('spaceStatus').textContent+=' この辺は行き止まりです。';}}
$('spaceOcclusion').addEventListener('change',draw);
$('spaceMode').addEventListener('change',()=>{if($('spaceMode').value==='triple'){$('sizeBWidth').value=14;$('sizeBHeight').value=8;}reset();});$('spaceReset').addEventListener('click',reset);
function toggleAtlas(){browsedChart=0;atlasShown=!atlasShown;truth=false;draw();canvas.focus();}
$('chartChoice').addEventListener('change',()=>{browsedChart=Number($('chartChoice').value);truth=false;atlasShown=false;draw();canvas.focus();});
$('returnToWalk').addEventListener('click',()=>{browsedChart=0;truth=false;atlasShown=false;draw();canvas.focus();});
$('spaceAtlas').addEventListener('click',toggleAtlas);
for(const [id,value] of [['spaceSubjective',false],['spaceTruth',true]])$(id).addEventListener('click',()=>{truth=value;atlasShown=false;browsedChart=0;draw();canvas.focus();});
for(const b of document.querySelectorAll('[data-direction]'))b.addEventListener('click',()=>move(Number(b.dataset.direction)));
document.addEventListener('keydown',e=>{if(e.isComposing||e.ctrlKey||e.metaKey||e.altKey||e.target.closest('input,select,textarea,[contenteditable=true]'))return;if(state.world.mode==='underpassMaze'&&e.key==='>'){e.preventDefault();if(!e.repeat)advanceUnderpass();return;}if(state.world.mode==='underpassMaze'&&e.shiftKey&&e.key.toLowerCase()==='n'){e.preventDefault();if(!e.repeat)nextUnderpass();return;}if(state.world.mode==='crossingMaze'&&e.shiftKey&&e.key.toLowerCase()==='n'){e.preventDefault();if(!e.repeat)nextCrossing();return;}if(['crossing','crossingMaze'].includes(state.world.mode)&&e.key.toLowerCase()==='m'){e.preventDefault();if(!e.repeat)toggleAtlas();return;}const d={ArrowUp:0,ArrowRight:1,ArrowDown:2,ArrowLeft:3,k:0,l:1,j:2,h:3}[e.key];if(d!==undefined){e.preventDefault();move(d);}else if(e.key==='0'||e.key==='1'){e.preventDefault();truth=e.key==='1';atlasShown=false;browsedChart=0;draw();}});
window.addEventListener('resize',draw);draw();

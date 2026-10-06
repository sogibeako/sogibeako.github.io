'use strict';
const $ = id => document.getElementById(id);
const canvas = $('map'), ctx = canvas.getContext('2d');
let game, view = 0, ascii = false, markerEditorGame, archiveNoteRecord, trueMapExportGame, warpDebugWorld;
let archiveNavigation={game:null,key:null,index:-1,points:[]};
// Keep original hint elements (and their IDs) so generator-specific updates still apply.
for(const hint of document.querySelectorAll('#settings p.hint')) {
  if(hint.closest('#experimentTools'))continue;
  const details=document.createElement('details'),summary=document.createElement('summary');
  details.className='setting-help';summary.textContent='解説';
  hint.before(details);details.append(summary,hint);
  details.addEventListener('keydown',event=>{
    if(event.key==='Escape'){details.open=false;summary.focus();event.stopPropagation();event.preventDefault();}
  });
}
function newWorld(demo = false, prepared = null) {
  try {
    const loopLearning = $('loopLearning').value !== 'off';
    const shifted = $('topology').value === 'torus';
    const dual = shifted && $('shiftAxis').value === 'both';
    const shiftX = dual ? Number($('shiftAmountX').value) : shifted && $('shiftAxis').value === 'x' ? Number($('shiftAmount').value) : 0;
    const shiftY = shifted && (dual || $('shiftAxis').value === 'y') ? Number($('shiftAmount').value) : 0;
    const selfVision = $('selfVision').checked && (demo || $('topology').value === 'torus');
    const learningLaps = $('loopLearning').value === 'three' ? 3 : 5;
    const options = { width: Number($('width').value), height: Number($('height').value), algorithm: $('algorithm').value, newestBias: Number($('newestBias').value), seed: $('seed').value, loops: Number($('loops').value), roomCount: Number($('roomCount').value), connectionStyle: $('connectionStyle').value, roomPlacement: $('roomPlacement').value, warpMode: $('ruleMode').value==='warp', warpStyle:$('warpStyle').value, warpCount:Number($('warpCount').value), warpInvisible:$('warpInvisible').checked, keyDoor: ['key-door','bird-keys'].includes($('ruleMode').value), birdMode: ['bird','bird-keys'].includes($('ruleMode').value), birdCount: Number($('birdCount').value), teleportPolicy: $('teleportPolicy').value, separateMaps: $('separateMaps').checked, keyCount: Number($('keyCount').value), topology: $('topology').value, loopLearning, learningLaps, selfVision, shiftX, shiftY };
    const candidate = prepared || (demo ? MazeCore.createGame(demo === 'warp' ? MazeCore.createWarpDemo() : demo === 'archive' ? MazeCore.createArchiveDemo() : demo ? MazeCore.createTorusDemo({ loopLearning, learningLaps, selfVision, openRoom: demo === 'optics', diagonalRoom: demo === 'crossed' ? 'crossed' : demo === 'diagonal', shiftX, shiftY }) : null) : MazeMainJourney.start(options,$('warpRotation').value));
    if(demo && (candidate.world.warpMode||candidate.world.warpDemo)&&candidate.world.topology!=='torus')MazeRotationBridge.enable(candidate,$('warpRotation').value);
    game = MazeSession.attach(candidate);
    $('archiveExportResult').hidden=true;$('archiveExportText').value='';
    const { world } = game;
    const algorithmName = { warp: 'ワープ実験', dfs: 'DFS', prim: 'Prim', eller: 'Eller', division: 'Recursive Division', wilson: 'Wilson', rooms: '部屋と通路', kruskal: 'Kruskal', hunt: 'Hunt-and-Kill', growing: `Growing Tree（長い道 ${world.newestBias}%）` }[world.algorithm];
    $('generationInfo').textContent = world.rooms
      ? `生成済み：${world.rooms.length}室 / 目標${world.requestedRoomCount}室 · 追加接続${world.connections.filter(e => e.kind === 'extra').length}本。全室への到達を確認しました。`
      : `生成済み：${algorithmName} · ${world.width} × ${world.height}`;
    if (world.topology === 'torus') $('generationInfo').textContent = world.demo
      ? (world.diagonalRoom === 'crossed' ? '斜め二方向のデモ。二方向が見えても、基本の横・縦はまだ未理解です。横通路へ出ると残った区別が解けます。' : world.diagonalRoom ? '斜めの自己視認デモ。開始地点では斜めの周回だけが見通せます。横に伸びる通路へ進むと別の周回も調べられます。' : world.openRoom ? '8 × 8 の光学実験室。壁のない周期空間で、ずれや一周先の自分を観察できます。出口はありません。' : '8 × 8 の周回デモ。出口はありません。右または下へ8歩で、真世界の同じ場所へ戻ります。')
      : world.rooms ? `生成済み：トーラス / 領域分割 · ${world.rooms.length}室 / 目標${world.requestedRoomCount}室 · 追加接続${world.connections.filter(e => e.kind === 'extra').length}本。全室接続・二方向の周回を検証済み。`
      : `生成済み：トーラス / ${algorithmName} · ${world.width} × ${world.height}。二方向の独立した周回路を検証済み。`;
    if (world.lattice) $('generationInfo').textContent = `生成済み：二方向ずれ / ${world.demo ? '光学実験室' : algorithmName} · 周期成分 ${world.lattice.width} × ${world.lattice.height} · ${world.domain.reduce((a,b)=>a+b,0)}セル（壁を含む）。全通路接続・全周期を検証済み。左右接続の縦ずれ ${world.shiftY}、上下接続の横ずれ ${world.shiftX}。`;
    else if (world.shiftX || world.shiftY) $('generationInfo').textContent += ` 境界のずれ：${world.shiftY ? '左右接続で縦' : '上下接続で横'}に${world.shiftY || world.shiftX}セル。`;
    if (world.lattice && world.rooms) $('generationInfo').textContent += ` 部屋 ${world.rooms.length}室 / 目標${world.requestedRoomCount}室。${world.rooms.length < world.requestedRoomCount ? '周期上の重なりを避けるため、配置可能な数に調整しました。' : ''}${world.rooms.some(r=>r.w<3||r.h<3)?'周期上の重なりや部屋の間隔に合わせて一部の部屋を小さくしています。':''}`;
    if (world.rooms) {
      const styles = { tree: '短い通路でつなぐ', chain: '順につなぐ', ring: '環状につなぐ', hub: '入口の部屋を中心につなぐ' };
      $('generationInfo').textContent += ` 配置：${{bsp:'領域分割',scatter:'散らして配置',grid:'格子状に配置'}[world.roomPlacement]}。接続：${styles[world.connectionStyle]}。`;
      if (world.roomGrid) $('generationInfo').textContent += ` ${world.roomGrid.columns}列 × ${world.roomGrid.rows}行の区画。${world.rooms.length}区画に部屋を配置しました。`;
      if (world.roomPlacement === 'scatter' && world.rooms.length < world.requestedRoomCount) $('generationInfo').textContent += ' 部屋の重なりと間隔を確認し、試行回数内で配置できた数に調整しました。';
      if (world.connectionStyle === 'ring' && world.rooms.length < 3) $('generationInfo').textContent += ' 環状接続には3室以上が必要なため、今回は順につないでいます。';
    }
    if(world.warpMode)$('generationInfo').textContent+=` ワープ：${{pair:'相互',oneway:'一方通行',cycle3:'3地点の輪',cycle4:'4地点の輪'}[world.warpStyle]} ${world.warpCount}組 / 目標${world.requestedWarpCount}組。${world.warpInvisible?'不可視の床です。':'O が発動床です。'}${world.warpCount<world.requestedWarpCount?'配置可能な組数へ調整しました。':''}全通路・出口への到達をワープ込みで検証済み。${world.topology==='torus'?'地形の周回路はありますが、ワープで分断されるため二方向を歩いて周回できる保証はありません。':''}`;
    if (world.birdMode) $('generationInfo').textContent += ` 鳥人間${game.birds.length}体。転移先：${{far:"遠くを優先",unseen:"まだ見ていない場所を優先",known:"見覚えのある場所を優先"}[world.teleportPolicy || "far"]}。2行動ごとに行動し、接触すると転移します。${game.birds.length < world.birdCount ? '床150セル未満、または配置場所が不足するため1体に調整しました。' : ''}`;
    if (world.birdMode && world.separateMaps) $('generationInfo').textContent += ' 転移ごとに地図を分けます。';
    if (world.puzzle) {
      const { locks, requestedCount } = world.puzzle;
      $('generationInfo').textContent += ` 鍵と扉：${locks.length}組 / 目標${requestedCount}組。`;
      if (locks.length < requestedCount) $('generationInfo').textContent += ' この地形で順序を保証できる組数に調整しました。';
      if (locks.some(lock => lock.placement === 'exit-door')) $('generationInfo').textContent += ' 最後の扉は出口を施錠しています。';
      $('puzzleLegend').textContent = locks.length === 1 ? 'a 鍵A · + 閉じた扉 · / 開いた扉' : `${locks.map(lock => lock.keyId.toLowerCase()).join(' / ')} 鍵 · ${locks.map(lock => lock.keyId).join(' / ')} 対応する扉 · / 開いた扉`;
      $('puzzleSequence').textContent = locks.map(lock => `鍵${lock.keyId} → 扉${lock.keyId}`).join(' → ') + ' → 出口';
    }
    $('status').textContent = world.demo && (world.shiftX || world.shiftY) ? 'ずれのある8×8実験室です。0 / 1キーで主観世界と真世界を比べてください。' : world.demo ? (world.loopLearning ? `右へ8歩で1周。${world.learningLaps}周すると横方向の場所を理解します。` : '右へ8歩、歩いてみましょう。0 / 1キーで主観世界と真世界を比べられます。') : world.puzzle ? 'まず鍵A（a）を探しましょう。対応する扉へ進むと開きます。' : '探索を始めました。見えた道は記憶に残ります。';
    if(world.birdMode) $('status').textContent = `${game.birds.map(b=>b.symbol).join('・')} が鳥人間です。2行動ごとに動き、触れると転移します。`;
    if(world.archiveDemo){ $('generationInfo').textContent='地図帳の実験：8×8・ずれなし・3周で理解・鳥人間なし。1周歩いた記録を、転移前の地図として用意しています。'; $('status').textContent='右へ24歩（8歩×3周）進み、古い地図の変化を見てください。'; }
    if(world.warpDemo){$('generationInfo').textContent='ワープ実験：二つの部屋と一対の O。床へ進入すると相手側へ移動します。通常の通路でも部屋を行き来できます。';$('status').textContent='下へ2歩、右へ2歩で O に入ります。移動先では一度離れて入り直すと戻れます。光はワープしません。';}
    announceSelfVision();
    render();
  } catch (error) { $('status').textContent = error.message; }
}
function loadMarkerName() {
  $('markerName').value=game.markerNames.get($('markerChoice').value)||'';
  renderArchive();
  renderMarkerArchiveSearch();
}
function renderMarkerNames() {
  const select=$('markerChoice'),labels=[...game.markers.values()];
  const reset=markerEditorGame!==game || select.options.length!==labels.length;
  const selected=select.value;
  if(reset){select.replaceChildren(...labels.map(label=>new Option(MazeCore.markerTitle(game,label),label)));if(labels.includes(selected))select.value=selected;markerEditorGame=game;loadMarkerName();$('markerNameStatus').textContent='';}
  else for(const option of select.options)option.textContent=MazeCore.markerTitle(game,option.value);
  renderMarkerArchiveSearch();
  $('markerNaming').hidden=!labels.length;
  $('markerList').textContent=labels.map(label=>MazeCore.markerTitle(game,label)).join(' ／ ');
}
function renderMarkerArchiveSearch() {
  const label=$('markerChoice').value, matches=MazeCore.markerArchives(game,label);
  $('findMarkerArchive').disabled=!matches.length;
  $('markerArchiveStatus').textContent=matches.length
    ? `${MazeCore.markerTitle(game,label)}の記録：地図帳 ${matches.map(i=>i+1).join('・')}（${matches.length}冊）。${matches.includes(Number($('archiveChoice').value)) ? `現在は地図帳 ${Number($('archiveChoice').value)+1} を表示中。` : ''}`
    : 'この目印を記録した保存地図はまだありません。';
}
$('findMarkerArchive').addEventListener('click',()=>{
  const matches=MazeCore.markerArchives(game,$('markerChoice').value);
  if(!matches.length)return;
  const current=matches.indexOf(Number($('archiveChoice').value));
  $('archiveOriginals').checked=true;renderArchive();
  $('archiveChoice').value=String(matches[(current+1)%matches.length]);
  renderArchive();
  $('mapArchive').scrollIntoView({block:'nearest'});
});
$('markerChoice').addEventListener('change',loadMarkerName);
$('saveMarkerName').addEventListener('click',()=>{
  const label=$('markerChoice').value;
  if(!MazeSession.act(game,'name',label,$('markerName').value)){renderSessionInfo();$('markerNameStatus').textContent='名前は改行なしで24文字以内にしてください。';return;}
  loadMarkerName();$('markerNameStatus').textContent=`${MazeCore.markerTitle(game,label)}として記録しました。`;render();
});
function markHere() {
  const result=MazeSession.act(game,'mark');
  $('status').textContent={placed:`目印 ${result.label} を置きました。離れると番号が見えます。`,existing:`ここには目印 ${result.label} があります。`,blocked:'目印は入口・出口・鍵・扉・ワープ床を除く普通の床に置けます。',full:'目印は9個までです。',won:'探索は完了しています。'}[result.status];
  render();
  if(result.label){$('markerChoice').value=result.label;loadMarkerName();}
}
$('placeMarker').addEventListener('click',markHere);
function renderTransferHistory() {
  const transfers=MazeCore.archiveTransfers(game),select=$('transferChoice');
  $('transferHistory').hidden=!transfers.length;
  const signature=JSON.stringify(transfers);
  if(select.dataset.records!==signature){
    const previous=select.value;
    select.replaceChildren(...transfers.map(t=>new Option(`${t.turn}行動目：記録 ${t.from+1} → ${t.to+1}`,String(t.from))));
    select.value=transfers.some(t=>String(t.from)===previous)?previous:String(transfers.at(-1)?.from??'');
    select.dataset.records=signature;
  }
  const transfer=transfers.find(t=>String(t.from)===select.value);
  $('transferDescription').textContent=transfer?`${transfer.label}による移動。記録 ${transfer.from+1} → 記録 ${transfer.to+1}${transfer.to===game.cognition.archives.length?'（現在の探索）':''}。`:'';
  $('transferTo').disabled=!transfer||transfer.to===game.cognition.archives.length;
}
function openTransferArchive(side) {
  const transfer=MazeCore.archiveTransfers(game).find(t=>String(t.from)===$('transferChoice').value);
  if(!transfer||!game.cognition.archives[transfer[side]])return;
  $('archiveOriginals').checked=true;renderArchive();
  $('archiveChoice').value=String(transfer[side]);renderArchive();
  $('archiveChoice').focus();
}
$('transferChoice').addEventListener('change',renderTransferHistory);
$('transferFrom').addEventListener('click',()=>openTransferArchive('from'));
$('transferTo').addEventListener('click',()=>openTransferArchive('to'));
function recordedMatchExplanation(reason){
 return ({
  ready:'この記録は、現在の記録や照合できる他の記録をたどってつなげられます。Cキーで照合できます。',
  matched:'この記録は現在の地図につながっています。照合した統合記録に含まれる原本も、この状態になります。',
  'no-common':'照合に使える共通の入口・番号目印・確認済みのワープ端点が、現在つながる記録との間にありません。同じ手掛かりを別の地図でも観測すると、照合できる場合があります。',
  ambiguous:'共通の手掛かりが複数の場所に残り、対応を一つに定められません。周期を理解すると、同じ場所として整理できる場合があります。',
  offset:'共通の手掛かりから求めた地図の位置関係が一致していません。未知の周期などが残っている可能性があります。',
  terrain:'手掛かりを合わせると、記録した地形や場所が重なる部分で食い違うため保留しています。',
  'orientation-multiple':'共通の手掛かりを合わせても、観測済みの地形に合う位置・向きが複数残っています。手掛かりの周りをさらに観測すると、候補を絞れる場合があります。',
  'orientation-anchors':'共通の入口・目印・確認済みワープ端点の記録が複数の場所にあり、対応を一つに定められません。',
  'orientation-conflict':'回転・反転の候補を調べましたが、共通の手掛かりと観測済みの地形に同時に合う配置が見つからないため保留しています。',
  orientation:'回転・反転を含めて照合を試しましたが、位置と向きを確定できていません。共通の入口・番号目印・確認済みのワープ端点と、その周囲の地形を観測すると絞れる場合があります。',
  disabled:'この迷路では、転移ごとに地図を分ける設定が無効です。'
 })[reason]||'この記録の照合状況を確認できません。';
}
function openMatchRecord(index){
 if(!Number.isInteger(index)||!game.cognition.archives[index])return;
 $('archiveOriginals').checked=true;renderArchive();
 $('archiveChoice').value=String(index);renderArchive();
 $('archiveChoice').focus();
}
function renderMatchingOverview(reasons){
 const labels={ready:'照合できます',matched:'照合済み','no-common':'共通の手掛かりなし',ambiguous:'印の対応が複数',offset:'位置関係が不一致',terrain:'重なる記録が不一致',
  'orientation-multiple':'位置・向きの候補が複数','orientation-anchors':'印の対応が複数','orientation-conflict':'条件に合う配置なし',orientation:'位置・向きが未確定',disabled:'照合は無効'};
 const ready=reasons.filter(r=>r==='ready').length,matched=reasons.filter(r=>r==='matched').length;
 const summary=`保存 ${reasons.length}冊 / 照合済み ${matched}冊 / 照合可能 ${ready}冊 / 保留 ${reasons.length-matched-ready}冊`;
 if($('archiveMatchSummary').textContent!==summary)$('archiveMatchSummary').textContent=summary;
 const filter=$('archiveMatchFilter').value||'all';
 const visible=reasons.map((reason,index)=>({reason,index})).filter(({reason})=>filter==='all'||(filter==='pending'? !['ready','matched'].includes(reason):reason===filter));
 const signature=JSON.stringify([filter,reasons]);
 if(renderMatchingOverview.game===game&&renderMatchingOverview.signature===signature)return;
 const list=$('archiveMatchList');list.replaceChildren();
 $('archiveMatchEmpty').hidden=visible.length>0;
 $('archiveMatchEmpty').textContent=filter==='pending'?'保留中の記録はありません。':filter==='ready'?'今、照合できる未照合の記録はありません。':filter==='matched'?'現在の地図につながった記録はまだありません。':'保存された記録はまだありません。';
 visible.forEach(({reason,index})=>{
  const item=document.createElement('li'),button=document.createElement('button');
  button.type='button';button.textContent=`記録 ${index+1}：${labels[reason]||'状況を確認できません'} — 原本を見る`;
  button.addEventListener('click',()=>openMatchRecord(index));item.append(button);list.append(item);
 });
 renderMatchingOverview.game=game;renderMatchingOverview.signature=signature;
}
function renderArchive() {
  renderArchive.zeroPoints=[];renderArchive.arrowHits=[];
  renderTransferHistory();
  const archives=game.cognition.archives, select=$('archiveChoice');
  $('mapArchive').hidden=!archives.length;
  if(!archives.length){archiveNavigation={game:null,key:null,index:-1,points:[]};$('jumpArchiveMarker').disabled=true;$('archiveJumpStatus').textContent='';select.replaceChildren();delete select.dataset.options;return;}
  const groups=MazeCore.archiveGroups(game),showOriginals=$('archiveOriginals').checked;
  const options=showOriginals ? archives.map((a,i)=>({value:String(i),label:`原本 ${i+1}（${a.turn}行動目まで）`}))
    : groups.map(group=>({value:group.live?'live':String(group.representative),label:group.live||group.members.length>1 ? `統合地図（記録 ${group.members.map(i=>i+1).join('・')}${group.live?' ＋ 現在の探索':''}）` : `地図帳 ${group.representative+1}（位置関係は未同定）`}));
  const signature=JSON.stringify(options),previous=select.value;
  if(select.dataset.options!==signature){
    select.replaceChildren(...options.map(o=>new Option(o.label,o.value)));select.dataset.options=signature;
    const enclosing=groups.find(g=>g.members.includes(Number(previous)));
    select.value=options.some(o=>o.value===previous)?previous:!showOriginals&&enclosing?(enclosing.live?'live':String(enclosing.representative)):options[options.length-1].value;
  }
  const group=!showOriginals ? groups.find(g=>(g.live?'live':String(g.representative))===select.value) : null;
  const live=!!group?.live,combined=live||(group?.members.length||0)>1;
  const index=live?group.representative:Number(select.value),archive=archives[index];
  renderMarkerArchiveSearch();
  const original=[...(live?game.cognition.memory_nodes:archive.nodes).values()];
  if(combined){
    archiveNoteRecord=null;
    $('archiveNote').value=group.members.map(i=>`【記録 ${i+1}】\n${game.archiveNotes.get(i)||'（メモなし）'}`).join('\n\n');
    $('archiveNoteStatus').textContent='各記録のメモです。「原本を個別に表示」で編集できます。';
  } else if(archiveNoteRecord!==archive){
    archiveNoteRecord=archive;
    $('archiveNote').value=game.archiveNotes.get(index)||'';
    $('archiveNoteStatus').textContent=$('archiveNote').value ? 'この地図帳のメモを表示しています。' : 'この地図帳のメモはまだありません。';
  }
  $('archiveNote').readOnly=combined;
  $('archiveNoteLabel').textContent=combined?'各記録のメモ（閲覧用）':'この地図帳のメモ（200文字まで）';
  $('archiveKnowledge').disabled=live;
  if(live)$('archiveKnowledge').checked=true;
  const folded=live||$('archiveKnowledge').checked;
  let nodes=MazeCore.archiveDisplayCells(game,live?original:MazeCore.archiveCells(game,index,folded),folded);
  if(game.viewFrame)nodes=nodes.map(n=>{const [x,y]=MazeRotationBridge.project(live?game.viewFrame:archive.viewFrame,n.x,n.y);return {...n,x,y};});
  const selectedMarker=$('markerChoice').value;
  const markerWorld=[...game.markers].find(([,label])=>label===selectedMarker)?.[0];
  const isSelected=n=>markerWorld!==undefined && n.world_id===markerWorld && n.feature===selectedMarker;
  const selectedNodes=nodes.filter(isSelected), originalCount=original.filter(isSelected).length;
  selectedNodes.sort((a,b)=>a.y-b.y||a.x-b.x);
  const navigationKey=JSON.stringify([select.value,showOriginals,folded,selectedMarker,selectedNodes.map(n=>[n.x,n.y])]);
  if(archiveNavigation.game!==game||archiveNavigation.key!==navigationKey)archiveNavigation={game,key:navigationKey,index:-1,points:[]};
  $('jumpArchiveMarker').disabled=!selectedNodes.length;
  $('jumpArchiveMarker').textContent=archiveNavigation.index<0?'選んだ目印へ移動':selectedNodes.length>1?'次の目印の像へ移動':'選んだ目印へ移動';
  $('archiveJumpStatus').textContent=archiveNavigation.index>=0?`${MazeCore.markerTitle(game,selectedMarker)}：${archiveNavigation.index+1} / ${selectedNodes.length}か所目を表示位置に選択。`:selectedNodes.length?'選んだ目印が見える位置へ地図帳をスクロールします。':'この地図帳には選んだ目印の記録がありません。';
  const highlight=$('highlightArchiveMarker').checked;
  const focusText=!selectedMarker ? '目印を置くと、選んだ番号の記録をここで確認できます。'
    : `${MazeCore.markerTitle(game,selectedMarker)}：${originalCount ? `当時の記録 ${originalCount}か所 → この表示では ${selectedNodes.length}か所。${highlight ? '白い枠で強調しています。' : '強調表示はオフです。'}` : 'この地図帳には記録されていません。'}`;
  $('archiveMarkerFocus').textContent=focusText;
  const landmark=MazeCore.currentLandmark(game);
  const matches=MazeCore.matchLandmarkMaps(game);
  $('archiveMarkerNames').textContent=[...new Set(original.map(n=>n.feature).filter(f=>/^[1-9]$/.test(f)))].sort().map(label=>MazeCore.markerTitle(game,label)).join(' ／ ');
  const entrance=landmark ? MazeCore.inspectLandmarkMemory(game,index) : MazeCore.inspectEntranceMemory(game,index);
  const landmarkLabel=landmark?.label || '入口';
  $('matchEntrance').textContent=landmark ? `${landmark.label}で地図を照合` : '入口・目印で地図を照合';
  $('matchEntrance').disabled=!matches.length;
  const diagnosis=MazeCore.inspectRecordedMatching(game),recordedMatches=diagnosis.matches;
  $('archiveMatchReason').textContent=recordedMatchExplanation(diagnosis.reasons[index]);
  renderMatchingOverview(diagnosis.reasons);
  $('matchRecorded').disabled=!recordedMatches.length;
  $('matchRecordedHint').textContent=recordedMatches.length ? `記録した入口・番号目印・確認済みのワープ矢印から、${recordedMatches.length}冊を連鎖的につなげられます。現在地が目印の上でなくても照合できます。`
    : '両方の地図に記録した同じ入口・番号目印を手がかりにします。理解済みの周期だけで整理し、印が複数の場所に残る地図・共通の印がない地図・位置関係が食い違う地図は保留します。';
  $('matchHint').textContent=!landmark ? '入口または番号付き目印の上で、その印を記録した地図帳を照合できます。閲覧・照合では時間は進みません。' : matches.length ? `${matches.length}冊を${landmarkLabel}の位置で照合できます。その印を記録していない地図・対応する像が一つに定まらない地図は保留します。` : '今照合できる地図はありません。周回を理解すると、保留した地図を照合できる場合があります。';
  if(game.viewFrame)$('matchHint').textContent='回転・反転した地図は、共通の入口・目印と観測した地形で向きを絞ります。情報不足や対称な形で候補が複数ある場合は保留します。';
  $('archiveCaption').textContent=`現在は地図帳 ${archives.length+1} を探索中。${game.cognition.matchedArchives.has(Number(select.value)) ? "この地図は照合済み。" : "この地図との位置関係は未同定。"}保存時 ${original.filter(n=>n.terrain).length}床セル → ${folded ? "今の知識で整理" : "当時の記録"} ${nodes.filter(n=>n.terrain).length}床セル。${landmarkLabel}の記録 ${entrance.images}像 → 現在の知識では ${entrance.classes}種類。`;
  if(combined)$('archiveCaption').textContent=`統合地図：記録 ${group.members.map(i=>i+1).join('・')}${live?' と現在の探索':''}。表示中 ${nodes.filter(n=>n.terrain).length}床セル。${live?'現在の知識と観測を反映しています。':'最後に統合して保存した地図を表示しています。'} 原本は保持しています。`;
  if(folded&&game.cognition.knowledgeBasis)$('archiveCaption').textContent+=' 表示の細長さを抑えるため、理解済みの周期内で配置を整えています。';
  const viewport=$('archiveViewport'),extent=$('archiveExtent'),c=$('archiveMap'),g=c.getContext('2d'),dpr=window.devicePixelRatio||1;
  let w=viewport.clientWidth,h=viewport.clientHeight;
  c.setAttribute('aria-label',`保存地図、${folded ? '今の知識で整理' : '当時の記録'}、${nodes.filter(n=>n.terrain).length}床セル。入口は金色の印。${focusText}`);
  if(!nodes.length){c.width=0;extent.style.width='100%';extent.style.height='100%';return;}
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  for(const n of nodes){minX=Math.min(minX,n.x);maxX=Math.max(maxX,n.x);minY=Math.min(minY,n.y);maxY=Math.max(maxY,n.y);}
  const zoom=$('archiveZoom').value;
  // Keep the bitmap viewport-sized even for very long unfolded memories.
  const tile=zoom==='fit'?Math.min(18,(w-20)/(maxX-minX+1),(h-20)/(maxY-minY+1)):Number(zoom);
  extent.style.width=zoom==='fit'?'100%':`${(maxX-minX+1)*tile+20}px`;
  extent.style.height=zoom==='fit'?'100%':`${(maxY-minY+1)*tile+20}px`;
  w=viewport.clientWidth;h=viewport.clientHeight;
  c.style.width=`${w}px`;c.style.height=`${h}px`;
  c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);g.setTransform(dpr,0,0,dpr,0,0);g.fillStyle='#0b161c';g.fillRect(0,0,w,h);
  const ox=(extent.clientWidth-(maxX-minX+1)*tile)/2-viewport.scrollLeft,oy=(extent.clientHeight-(maxY-minY+1)*tile)/2-viewport.scrollTop;
  archiveNavigation.points=selectedNodes.map(n=>({x:ox+viewport.scrollLeft+(n.x-minX+.5)*tile,y:oy+viewport.scrollTop+(n.y-minY+.5)*tile}));
  for(const n of nodes){
    const x=ox+(n.x-minX)*tile,y=oy+(n.y-minY)*tile;
    if(x+tile<0||y+tile<0||x>w||y>h)continue;
    if(n.terrain)renderArchive.zeroPoints.push({id:n.world_id,x:x+tile/2,y:y+tile/2,tile});
    const entrance=n.world_id===game.world.start,marker=/^[0-9]$/.test(n.feature)||n.feature==='O';
    g.fillStyle=entrance?'#f1c583':marker?'#8be1ee':n.terrain?'#36534e':'#77918e';
    if(ascii&&tile>=7){g.font=`${tile}px monospace`;g.textAlign='center';g.textBaseline='middle';g.fillText(entrance?'<':marker?n.feature:n.terrain?'.':'#',x+tile/2,y+tile/2);}
    else {g.fillRect(x,y,Math.max(.5,tile-1),Math.max(.5,tile-1));if(marker&&tile>=9){g.fillStyle='#0b161c';g.font=`${tile*.8}px monospace`;g.textAlign='center';g.textBaseline='middle';g.fillText(n.feature,x+tile/2,y+tile/2);}}
  }
  renderArchive.arrowHits=drawWarpAnnotations(g,renderArchive.zeroPoints,w,h);
  // Draw after all cells so nearby tiles cannot cover the selected marker's outline.
  if(highlight){
    g.strokeStyle='#ffffff';g.lineWidth=1.5;
    for(const n of selectedNodes){
      const x=ox+(n.x-minX+.5)*tile,y=oy+(n.y-minY+.5)*tile,size=Math.max(6,tile);
      g.strokeRect(x-size/2,y-size/2,size,size);
    }
  }
}
$('jumpArchiveMarker').addEventListener('click',()=>{
  if($('archiveZoom').value==='fit'){$('archiveZoom').value='14';renderArchive();}
  if(!archiveNavigation.points.length)return;
  archiveNavigation.index=(archiveNavigation.index+1)%archiveNavigation.points.length;
  const point=archiveNavigation.points[archiveNavigation.index],viewport=$('archiveViewport');
  viewport.scrollTo({left:point.x-viewport.clientWidth/2,top:point.y-viewport.clientHeight/2});
  renderArchive();
});
$('archiveZoom').addEventListener('change',()=>{
  $('archiveViewport').scrollTo(0,0);renderArchive();
});
$('archiveViewport').addEventListener('scroll',renderArchive,{passive:true});
$('archiveViewport').addEventListener('keydown',event=>{if(!['c','z','y','delete','escape'].includes(event.key.toLowerCase()))event.stopPropagation();});
$('highlightArchiveMarker').addEventListener('change',renderArchive);
$('showTrueMapText').addEventListener('click',()=>{
  $('trueMapText').value=MazeCore.exportTrueMap(game);
  $('trueMapTextStatus').textContent=`${game.turns}行動目の真世界（${game.world.width}列 × ${game.world.height}行）。移動後は出力ボタンを押すと更新します。`;
  $('trueMapTextResult').hidden=false;
});
$('saveTrueMapText').addEventListener('click',()=>{
  const blob=new Blob(['\uFEFF',$('trueMapText').value],{type:'text/plain;charset=utf-8'});
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download='maze-explorer-map.txt';document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
function annotatedMapPng(target,archive){
 const output=document.createElement('canvas'),scale=target.width/(target.clientWidth||target.width),padding=12*scale,lineHeight=18*scale;
 output.width=target.width;
 const g=output.getContext('2d');g.font=`${12*scale}px sans-serif`;
 const w=game.world,label=archive?'地図帳':view===1?'真世界':'主観世界';
 const texts=[`迷路のアトリエ — ${label} / ${game.turns}行動目`, `シード: ${w.seed}`, `${w.topology==='torus'?'トーラス':'平面'} / ${w.width} × ${w.height} / ${w.algorithm}`, '表示範囲の記録です。探索再開には途中セーブを使用してください。'];
 const lines=[],available=Math.max(1,output.width-padding*2);
 for(const text of texts){let line='';for(const ch of text){if(line&&g.measureText(line+ch).width>available){lines.push(line);line='';}line+=ch;}lines.push(line);}
 output.height=target.height+Math.ceil(padding*2+lines.length*lineHeight);
 g.fillStyle='#0b181e';g.fillRect(0,0,output.width,output.height);g.drawImage(target,0,0);
 g.font=`${12*scale}px sans-serif`;g.fillStyle='#d7e8e7';g.textBaseline='top';
 lines.forEach((line,i)=>g.fillText(line,padding,target.height+padding+i*lineHeight));
 return output;
}
function exportMapPng(archive){
 const status=$('mapPngStatus');
 if(archive&&$('mapArchive').hidden){status.textContent='保存できる地図帳がありません。';return;}
 try{
  render();
  const target=archive?$('archiveMap'):canvas;
  if(!target.width||!target.height)throw Error('地図がまだ表示されていません。');
  const output=$('annotateMapPng').checked?annotatedMapPng(target,archive):target;
  const data=output.toDataURL('image/png');if(!data.startsWith('data:image/png'))throw Error('画像を作成できませんでした。');
  const seed=String(game.world.seed||'maze').replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,60);
  const kind=archive?'archive':view===1?'truth':'subjective';
  const link=document.createElement('a');link.href=data;link.download=`maze-${seed}-${kind}-${game.turns}.png`;
  const caption=`${archive?'地図帳':view===1?'真世界':'主観世界'} / シード: ${game.world.seed} / ${game.turns}行動目 / ${output.width} × ${output.height}px`;
  $('mapPngImage').src=data;$('mapPngImage').alt=caption;
  $('mapPngDownload').href=data;$('mapPngDownload').download=link.download;
  $('mapPngCaption').textContent=caption;$('mapPngPreview').hidden=false;
  if($('autoDownloadMapPng').checked){
   document.body.append(link);try{link.click();}finally{link.remove();}
   status.textContent='PNG保存を開始しました。始まらない場合はプレビュー下の「このPNGを保存」を使ってください。';
  }else status.textContent='PNGを作成しました。プレビューを確認して「このPNGを保存」を押してください。';
 }catch(error){status.textContent=`画像を保存できませんでした：${error.message}`;}
}
$('exportMapPng').addEventListener('click',()=>exportMapPng(false));
$('exportArchivePng').addEventListener('click',()=>exportMapPng(true));
$('exportArchiveNotes').addEventListener('click',()=>{
  const text=MazeCore.exportArchiveNotes(game);
  $('archiveExportText').value=text;$('archiveExportResult').hidden=false;
  const blob=new Blob(['\uFEFF',text],{type:'text/plain;charset=utf-8'});
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download='maze-explorer-notes.txt';document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
$('archiveNote').addEventListener('input',()=>{
  const text=$('archiveNote').value;
  if($('archiveNote').readOnly)return;
  const saved=MazeSession.act(game,'note',Number($('archiveChoice').value),text);renderSessionInfo();
  $('archiveNoteStatus').textContent=saved ? (text ? `地図帳 ${Number($('archiveChoice').value)+1} に記録しました。` : 'この地図帳のメモを消しました。') : 'メモは200文字以内にしてください。';
});
$('showWarpLinks').addEventListener('change',render);
$('warpDebugGroup').addEventListener('change',render);
$('archiveOriginals').addEventListener('change',renderArchive);
$('archiveChoice').addEventListener('change',renderArchive);
$('archiveMatchFilter').addEventListener('change',renderArchive);
$('archiveKnowledge').addEventListener('change',renderArchive);
function matchingResultMessage(matches){
 const total=game.cognition.archives.length;
 if(!total)return '保存された地図帳はまだありません。転移後に残る記録を照合できます。';
 const linked=new Set(MazeCore.archiveGroups(game).filter(group=>group.live).flatMap(group=>group.members)).size;
 const remaining=total-linked;
 const result=matches.length?`地図帳 ${matches.map(i=>i+1).join('・')} を現在の地図へつなぎました。`:'今回、新しくつながる記録はありません。';
 return remaining?`${result} 保存 ${total}冊のうち ${linked}冊が現在の地図につながり、${remaining}冊は保留中です。「全記録の照合状況を見る」で手掛かりを確認できます。`
  :matches.length?`${result} 保存された ${total}冊すべてが現在の地図につながっています。`
  :`保存された ${total}冊すべてが、すでに現在の地図につながっています。`;
}
function matchAvailableMaps() {
 if(!game)return;
 const matches=[...new Set([...MazeSession.act(game,'landmark'),...MazeSession.act(game,'recorded')])];
 $('status').textContent=matchingResultMessage(matches);
 render();
}
$('matchAll').addEventListener('click',matchAvailableMaps);
$('matchRecorded').addEventListener('click',()=>{
  const matches=MazeSession.act(game,'recorded');
  $('status').textContent=matchingResultMessage(matches);
  render();
});
$('matchEntrance').addEventListener('click',()=>{
  const matched=MazeSession.act(game,'landmark');
  $('status').textContent=matchingResultMessage(matched);
  render();
});
function render() {
  if (!game) return;
  $('trueMapExport').hidden=!view;
  if(trueMapExportGame!==game){trueMapExportGame=game;$('trueMapTextResult').hidden=true;$('trueMapText').value='';}
  const { world, player, cognition } = game;
  const w = canvas.clientWidth, h = canvas.clientHeight, dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#0b161c'; ctx.fillRect(0, 0, w, h);
  const tile = view ? Math.min((w - 28) / world.width, (h - 28) / world.height) : Math.min(24, (w - 20) / 19);
  const continuous = !view && world.topology === 'torus' && ($('foldDisplay').value === 'continuous' || cognition.knowledgeBasis !== null || world.lattice);
  const perceived = continuous ? { x: player.perceived_x, y: player.perceived_y } : MazeCore.cognitivePosition(game);
  const px = view ? player.world_position % world.width : perceived.x;
  const py = view ? Math.floor(player.world_position / world.width) : perceived.y;
  const ox = view ? (w - world.width * tile) / 2 : w / 2 - (px + .5) * tile;
  const oy = view ? (h - world.height * tile) / 2 : h / 2 - (py + .5) * tile;
  render.warpPoints=[];
  const featureColor = symbol => /^[1-9]$/.test(symbol) ? '#8be1ee' : ['V','W'].includes(symbol) && game.bird ? (symbol === 'V' ? '#ef9eaf' : '#8be1ee') : ({ a: '#f1c583', b: '#8bd3e6', c: '#d0a5e8' }[symbol?.toLowerCase()] || '#f1c583');
  function cell(x, y, terrain, visible, worldId, feature, familiar = false) {
    if(!view&&game.viewFrame){const p=MazeRotationBridge.project(game.viewFrame,x-px,y-py);x=px+p[0];y=py+p[1];}
    const bird = visible && game.birds?.find(b=>b.position===worldId);
    if (bird) feature = bird.symbol;
    const sx = ox + x * tile, sy = oy + y * tile;
    if (sx + tile < 0 || sy + tile < 0 || sx > w || sy > h) return;
    if(terrain)render.warpPoints.push({id:worldId,x:sx+tile/2,y:sy+tile/2,tile});
    if (ascii) {
      const symbol = x === px && y === py ? '@' : feature || (terrain ? '.' : '#');
      ctx.fillStyle = symbol === '@' ? '#ceeac3' : feature && feature !== '<' ? featureColor(feature) : terrain ? (familiar ? '#ceeac3' : '#b3ccc5') : '#94b0b0';
      ctx.globalAlpha = visible ? 1 : .42;
      ctx.font = `${tile * .88}px Consolas, "Liberation Mono", monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(symbol, sx + tile / 2, sy + tile / 2);
      ctx.globalAlpha = 1;
      return;
    }
    ctx.fillStyle = terrain ? (visible ? (familiar ? '#466b55' : '#36534e') : '#192e33') : (visible ? '#77918e' : '#34474d');
    const gap = tile > 8 ? 1 : 0;
    ctx.fillRect(sx, sy, tile - gap, tile - gap);
    if (feature) {
      ctx.globalAlpha = visible ? 1 : .5; ctx.fillStyle = feature === '<' ? '#acd3ce' : featureColor(feature);
      ctx.font = `bold ${Math.max(7, tile * .8)}px monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(feature === '<' ? '·' : feature, sx + tile / 2, sy + tile / 2); ctx.globalAlpha = 1;
    }
  }
  if (view) { for (let i = 0; i < world.cells.length; i++) if (!world.domain || world.domain[i]) cell(i % world.width, Math.floor(i / world.width), world.cells[i], true, i, MazeCore.featureAt(game, i)); }
  else if (continuous) {
    const bounds = { minX: Math.floor(-ox / tile), maxX: Math.ceil((w - ox) / tile), minY: Math.floor(-oy / tile), maxY: Math.ceil((h - oy) / tile) };
    for (const node of MazeCore.subjectiveCells(game, bounds)) cell(node.x, node.y, node.terrain, node.visible, node.world_id, node.feature, node.familiar);
  }
  else for (const [id, node] of cognition.memory_nodes) cell(node.x, node.y, node.terrain, cognition.visible_cells.has(id), node.world_id, node.feature);
  renderWarpNotes(ctx,w,h);
  if (world.topology === 'torus' && !continuous && !world.lattice) {
    const memoryFloor = (x, y) => cognition.memory_nodes.get(`C${x},${y}`)?.terrain;
    const ys = view ? Array.from({ length: world.height }, (_, i) => i) : [...new Set([...cognition.memory_nodes.values()].map(n => n.y))];
    const xs = view ? Array.from({ length: world.width }, (_, i) => i) : [...new Set([...cognition.memory_nodes.values()].map(n => n.x))];
    ctx.lineWidth = 2; ctx.strokeStyle = '#f1c583'; ctx.beginPath();
    for (const y of ys) if (view || cognition.known_loops.has('x')) {
      const dest = view ? MazeCore.periodicPosition(world, world.width, y) : MazeCore.cognitivePosition(game, world.width, y);
      if (!(view ? world.cells[y * world.width + world.width - 1] && world.cells[MazeCore.periodicId(world, world.width, y)] : memoryFloor(world.width - 1, y) && memoryFloor(dest.x, dest.y))) continue;
      ctx.moveTo(ox + world.width * tile + 2, oy + (y + .5) * tile); ctx.lineTo(ox + world.width * tile + 8, oy + (y + .5) * tile);
      ctx.moveTo(ox - 8, oy + (dest.y + .5) * tile); ctx.lineTo(ox - 2, oy + (dest.y + .5) * tile);
    }
    ctx.stroke(); ctx.strokeStyle = '#8bd3e6'; ctx.beginPath();
    for (const x of xs) if (view || cognition.known_loops.has('y')) {
      const dest = view ? MazeCore.periodicPosition(world, x, world.height) : MazeCore.cognitivePosition(game, x, world.height);
      if (!(view ? world.cells[(world.height - 1) * world.width + x] && world.cells[MazeCore.periodicId(world, x, world.height)] : memoryFloor(x, world.height - 1) && memoryFloor(dest.x, dest.y))) continue;
      ctx.moveTo(ox + (x + .5) * tile, oy + world.height * tile + 2); ctx.lineTo(ox + (x + .5) * tile, oy + world.height * tile + 8);
      ctx.moveTo(ox + (dest.x + .5) * tile, oy - 8); ctx.lineTo(ox + (dest.x + .5) * tile, oy - 2);
    }
    ctx.stroke();
  }
  if (view && world.lattice) {
    for(let id=0;id<world.domain.length;id++) if(world.domain[id]) {
      const x=id%world.width,y=Math.floor(id/world.width);
      for(const [direction,[dx,dy]] of Object.entries(MazeCore.DIRS)) {
        const edge=world.cells[id]?MazeCore.transition(world,{world_position:id},direction):null;
        const nx=x+dx,ny=y+dy;
        const outside=nx<0||ny<0||nx>=world.width||ny>=world.height||!world.domain[ny*world.width+nx];
        if(outside) {
          ctx.strokeStyle='#58716f';ctx.lineWidth=1;ctx.beginPath();
          const cx=ox+(x+.5+.5*dx)*tile,cy=oy+(y+.5+.5*dy)*tile;
          ctx.moveTo(cx-dy*tile/2,cy+dx*tile/2);ctx.lineTo(cx+dy*tile/2,cy-dx*tile/2);ctx.stroke();
        }
        if(edge?.kind==='wrap') {
          ctx.strokeStyle=edge.wrapX&&edge.wrapY?'#df9feb':edge.wrapX?'#f1c583':'#8bd3e6';ctx.lineWidth=2;ctx.beginPath();
          ctx.moveTo(ox+(x+.5+.25*dx)*tile,oy+(y+.5+.25*dy)*tile);
          ctx.lineTo(ox+(x+.5+.55*dx)*tile,oy+(y+.5+.55*dy)*tile);ctx.stroke();
        }
      }
    }
  }
  const warpVisible=!!world.warps?.size&&!world.warpInvisible;
  $('warpDebugControls').hidden=!warpVisible;
  const warpSelect=$('warpDebugGroup'),warpGroups=warpVisible?(world.warpGroups||[[...world.warps.keys()]]):[];
  if(warpDebugWorld!==world){
    warpDebugWorld=world;warpSelect.replaceChildren(...warpGroups.map((_,i)=>new Option(`組 ${i+1}`,String(i))));
    $('showWarpLinks').checked=false;
  }
  $('showWarpLinks').disabled=!view;
  warpSelect.disabled=!view||!$('showWarpLinks').checked;
  $('warpDebugInfo').textContent=warpVisible?'1 · 真世界でチェックを入れると接続先を表示します。':'';
  if(warpVisible&&view&&$('showWarpLinks').checked){
    const pads=warpGroups[Number(warpSelect.value)]||[],coords=id=>`(${id%world.width}, ${Math.floor(id/world.width)})`;
    const edges=pads.filter(id=>world.warps.has(id)).map(from=>({from,to:world.warps.get(from)}));
    $('warpDebugInfo').textContent=`組 ${Number(warpSelect.value)+1}：${edges.map(e=>`${coords(e.from)} → ${coords(e.to)}`).join(' ／ ')}。座標は左上を (0, 0) とします。`;
    ctx.save();ctx.strokeStyle='#e5b4f6';ctx.fillStyle='#e5b4f6';ctx.lineWidth=2;
    for(const {from,to} of edges){
      const x1=ox+(from%world.width+.5)*tile,y1=oy+(Math.floor(from/world.width)+.5)*tile;
      const x2=ox+(to%world.width+.5)*tile,y2=oy+(Math.floor(to/world.width)+.5)*tile;
      const dx=x2-x1,dy=y2-y1,length=Math.hypot(dx,dy);if(!length)continue;
      const bend=Math.min(24,length/5),cx=(x1+x2)/2-dy/length*bend,cy=(y1+y2)/2+dx/length*bend;
      const tx=x2-cx,ty=y2-cy,tlen=Math.hypot(tx,ty),ux=tx/tlen,uy=ty/tlen;
      const ex=x2-ux*tile*.45,ey=y2-uy*tile*.45,head=Math.max(5,Math.min(9,tile*.45));
      ctx.beginPath();ctx.moveTo(x1,y1);ctx.quadraticCurveTo(cx,cy,ex,ey);ctx.stroke();
      ctx.beginPath();ctx.moveTo(ex,ey);ctx.lineTo(ex-ux*head-uy*head*.5,ey-uy*head+ux*head*.5);ctx.lineTo(ex-ux*head+uy*head*.5,ey-uy*head-ux*head*.5);ctx.closePath();ctx.fill();
    }
    ctx.restore();
  }
  $('birdDebugControls').hidden = !game.bird;
  const birdTarget=$('birdDebugTarget');
  if(birdTarget.options.length !== (game.birds?.length || 1)) { birdTarget.replaceChildren(...(game.birds || [{symbol:'V'}]).map((b,i)=>new Option(b.symbol,String(i)))); }
  birdTarget.disabled = !view || !$('showBirdVision').checked;
  $('birdDebugInfo').textContent = !view ? '1 · 真世界で表示します。主観世界では鳥の視界や追跡先を表示しません。' : '桃色：今の位置から見通せる範囲。金の枠：最後に見た場所。金の点線：そこへ向かう経路。表示の切替で時間は進みません。';
  if (game.bird && view && $('showBirdVision').checked) {
    const debug=MazeCore.inspectBird(game,Number(birdTarget.value));
    ctx.save();ctx.fillStyle='#ef9eaf';ctx.globalAlpha=.22;
    for(const id of debug.visibleCells) if(world.cells[id]) ctx.fillRect(ox+(id%world.width)*tile+1,oy+Math.floor(id/world.width)*tile+1,Math.max(1,tile-2),Math.max(1,tile-2));
    ctx.globalAlpha=1;ctx.strokeStyle='#f1c583';ctx.lineWidth=2;
    if(debug.target!==null) {
      const tx=ox+(debug.target%world.width)*tile,ty=oy+Math.floor(debug.target/world.width)*tile;
      ctx.strokeRect(tx+2,ty+2,Math.max(1,tile-4),Math.max(1,tile-4));
      ctx.setLineDash([4,4]);ctx.beginPath();
      for(let i=1;i<debug.path.length;i++) {
        const from=debug.path[i-1],to=debug.path[i],fx=from%world.width,fy=Math.floor(from/world.width),tx=to%world.width,ty=Math.floor(to/world.width);
        const edge=Object.keys(MazeCore.DIRS).map(d=>MazeCore.transition(world,{world_position:from},d)).find(e=>e?.to===to);
        if(edge?.kind==='wrap') {
          const [dx,dy]=MazeCore.DIRS[edge.direction];
          ctx.moveTo(ox+(fx+.5)*tile,oy+(fy+.5)*tile);ctx.lineTo(ox+(fx+.5+dx*.5)*tile,oy+(fy+.5+dy*.5)*tile);
          ctx.moveTo(ox+(tx+.5-dx*.5)*tile,oy+(ty+.5-dy*.5)*tile);ctx.lineTo(ox+(tx+.5)*tile,oy+(ty+.5)*tile);
        } else {ctx.moveTo(ox+(fx+.5)*tile,oy+(fy+.5)*tile);ctx.lineTo(ox+(tx+.5)*tile,oy+(ty+.5)*tile);}
      }ctx.stroke();
    }
    ctx.restore();
    const timing=game.won?'クリア済み':debug.cooldown?`休止中：あと${debug.cooldown}行動`:`次の鳥の行動まで${debug.nextActionIn}行動`;
    $('birdDebugInfo').textContent += ` 現在の視線：${debug.canSeePlayer?'プレイヤーまで通る':'プレイヤーまで通らない'}。${timing}。`;
    if(debug.target!==null) $('birdDebugInfo').textContent += ` 記憶した追跡先 (${debug.target%world.width}, ${Math.floor(debug.target/world.width)})${debug.state==='SEARCH'?`、探索残り${debug.searchLeft}回`:''}。`;
    $('birdDebugInfo').textContent += ' 視界は現在位置での計算、追跡先は前回の行動時の記憶です。';
  }
  renderArchive();
  $('warpDemoGuide').hidden=!(world.warpDemo||world.warpMode);
  if(world.warpDemo||world.warpMode)$('warpDemoGuide').textContent=`ワープ床：${world.warpInvisible?'見えない発動床':'O'}へ踏み込むと転移します。到着・待機では再発動しません。${world.warpStyle==='oneway'?'一方通行の到着地点は普通床です。':world.warpStyle?.startsWith('cycle')?'到着した床を離れて踏み直すと、輪の次の地点へ進みます。':'到着した床を離れて踏み直すと戻れます。'}${game.viewFrame?'転移で向きが回転・反転します。主観表示の画面方向へ操作できます。':'向きは変わらず、'}転移前の記憶は地図帳へ残します。光はワープしません。`;
  $('archiveDemoGuide').hidden=!world.archiveDemo;
  if(world.archiveDemo) $('archiveDemoGuide').textContent=cognition.matchedArchives.has(0)
    ? '照合完了！ 古い地図が現在の記憶につながりました。「最初から探索」で実験をやり直せます。'
    : cognition.known_loops.has('x')
      ? '横の周回を理解しました。自動折りたたみがオンなら地図帳にも反映されています。チェックを外して当時の記録と比較し、入口の上で「入口で地図を照合」を押してください。'
      : `① 右へ24歩（8歩×3周）。現在、横 ${cognition.loopProgress.x} / 3周。② 地図帳の整理表示を比較。③ 入口で照合。保存地図は以前の探索を模した教材で、現在の周回数には含みません。`;

  $('birdInfo').hidden = !game.bird;
  if(game.bird) {
    const states = {WANDER:'徘徊',CHASE:'追跡',SEARCH:'最後に見た場所を探索'};
    const descriptions=game.birds.map(b=>`${b.symbol}：${view || [...cognition.visible_cells].some(id=>cognition.memory_nodes.get(id)?.world_id===b.position) ? states[b.state] : '視界外'}`);
    $('birdInfo').textContent = `鳥人間 ${descriptions.join(' ｜ ')} ／ 転移 ${game.teleports}回${world.separateMaps ? ` ／ 地図帳 ${cognition.archives.length+1}` : ""}。2行動ごとに行動。接触後は全員が4行動休止します。`;
  }
  $('rayControls').hidden = !world.selfVision;
  const raySelect = $('rayTarget'), oldTarget = raySelect.value;
  const images = cognition.self_images || [];
  const signature = images.map(n => n.winding.join(',')).join(';');
  if (raySelect.dataset.images !== signature) {
    raySelect.replaceChildren(new Option('見えている自己像すべて', 'all'));
    for (const copy of images) {
      const [a, b] = copy.winding;
      raySelect.add(new Option(`横 ${a}周・縦 ${b}周 ／ 距離 ${copy.distance.toFixed(1)}セル`, copy.winding.join(',')));
    }
    raySelect.dataset.images = signature;
    if ([...raySelect.options].some(o => o.value === oldTarget)) raySelect.value = oldTarget;
  }
  raySelect.disabled = !$('showRays').checked || !images.length;
  const traced = images.filter(n => raySelect.value === 'all' || n.winding.join(',') === raySelect.value);
  $('rayInfo').textContent = !images.length ? '自己像が見えていないため、視線はありません。' : !$('showRays').checked ? '表示を有効にすると、現在見えている自己像までの光路を比較できます。' : view ? '紫の線が真世界の光路です。境界で途切れた線は、ずれた接続先へ続きます。0キーで主観世界の直線と比較できます。' : '紫の線は現在見えている自己像への視線です。1キーで真世界の光路と比較できます。';
  if (world.selfVision && $('showRays').checked) {
    ctx.save(); ctx.strokeStyle = '#df9feb'; ctx.globalAlpha = .8; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (const copy of traced) for (const segment of MazeCore.selfRaySegments(game, copy, view ? 'truth' : continuous ? 'continuous' : 'folded')) {
      ctx.moveTo(ox + (segment.from.x + .5) * tile, oy + (segment.from.y + .5) * tile);
      ctx.lineTo(ox + (segment.to.x + .5) * tile, oy + (segment.to.y + .5) * tile);
    }
    ctx.stroke(); ctx.restore();
  }
  if (!view && world.selfVision) {
    for (const copy of cognition.self_images) {
      const p = continuous ? copy : MazeCore.cognitivePosition(game, copy.x, copy.y);
      if (p.x === px && p.y === py) continue;
      ctx.fillStyle = '#e4b6f5'; ctx.font = `bold ${tile * .84}px monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('@', ox + (p.x + .5) * tile, oy + (p.y + .5) * tile);
    }
  }
  $('selfVisionInfo').hidden = !world.selfVision;
  $('selfVisionInfo').textContent = `自己視認実験：半径12セル・斜めにも対応。${cognition.self_images.length ? (!view && continuous ? '紫の @ は一周先の自分です。' : '一周先の自分を視認中。主観世界の連続表示で紫の @ を確認できます。') : '今は一周先の自分は見えていません。'}${world.loopLearning ? ' 見えた基本・複合周回を即座に理解します。単独の複合周回から横・縦を個別には推測しません。独立した知識を組み合わせて説明できる場合は推論します。' : ' 学習なしのため、地図は統合しません。'}`;
  if (!ascii) {
  const sx = ox + (px + .5) * tile, sy = oy + (py + .5) * tile;
  ctx.fillStyle = '#ceeac3'; ctx.fillRect(sx - tile / 2, sy - tile / 2, tile - (tile > 8 ? 1 : 0), tile - (tile > 8 ? 1 : 0));
  ctx.fillStyle = '#132a24'; ctx.font = `bold ${Math.max(8, tile * .84)}px monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('@', sx, sy);
  }
  if(game.viewFrame){
    const vector=view?MazeCore.DIRS[player.direction]:MazeRotationBridge.project(game.viewFrame,...MazeCore.DIRS[player.direction]);
    const symbol=vector[0]>0?'→':vector[0]<0?'←':vector[1]>0?'↓':'↑';
    ctx.fillStyle='#e6ffd6';ctx.font=`${Math.max(9,tile*.4)}px monospace`;ctx.fillText(symbol,ox+(px+.85)*tile,oy+(py+.15)*tile);
  }
  $('steps').textContent = `${game.steps} / ${game.turns}`;
  renderJourneyOverview();
  $('journeyControls').hidden=!game.journey;
  renderSessionInfo();
  $('checkpointExport').disabled=!game.generationOptions;
  $('checkpointDownload').disabled=!game.generationOptions;
  $('journeyInfo').hidden=!game.journey;
  $('journeyInfo').textContent=game.journey?`第${game.journey.completed+1}迷路 · 踏破済み ${game.journey.completed+Number(game.won||!!game.exploringAfterExit)} · 累計 ${game.journey.steps+game.steps}歩（現在の迷路を含む）`:'';
  $('nextMaze').hidden=!game.generationOptions;
  $('exitSave').hidden=!MazeSession.supported(game);$('exitSaveHint').hidden=!MazeSession.supported(game);
  if(game.exploringAfterExit)$('exitSaveHint').textContent='探索継続中の現在地と旅の累計を保存できます。保存欄を開いて .json の保存またはJSONのコピーを済ませてください。次の迷路へ進むには出口へ戻って > を押します。';
  else $('exitSaveHint').textContent='この迷路の出口到達状態と旅の累計を保存できます。ボタンは保存欄を開きます。.json の保存またはJSONのコピーを済ませると、後日ここから > で旅を続けられます。';
  $('nextMaze').disabled=!MazeMainJourney.canAdvance(game);
  $('exitContinuePanel').hidden=!(game.won||game.exploringAfterExit);
  $('continueExploring').hidden=!game.won;
  $('exitContinueInfo').textContent=game.exploringAfterExit?`出口到達済み（${game.firstClearSteps}歩）。探索を継続中です。出口へ戻っても停止しません。`:'出口に到着しました。向き・地図帳・目印を保ったまま探索を再開できます。鳥人間がいる場合は、その行動も再開します。';
  $('waitTurn').disabled = game.won;
  renderMarkerNames();
  $('placeMarker').disabled=game.won;
  $('placeZeroMark').hidden=!world.warpInvisible;$('editZeroMark').hidden=$('zeroMarkHint').hidden=$('zeroMarkStatus').hidden=!world.warps?.size;$('editZeroMark').textContent=world.warpInvisible?'0・矢印を編集（Z）':'矢印を編集（Z）';$('placeZeroMark').disabled=game.won;
  $('markerInfo').textContent=`目印 ${game.markers.size} / 9個。${game.markers.has(player.world_position) ? `足元は${MazeCore.markerTitle(game,game.markers.get(player.world_position))}。` : ''} Mキーで普通の床に置けます。設置で時間は進みません。`;
  const remembered = [...cognition.memory_nodes.values()].filter(n => n.terrain);
  const known = new Set([cognition.memory_nodes,...cognition.archives.map(a=>a.nodes)].flatMap(nodes=>[...nodes.values()].filter(n=>n.terrain).map(n=>n.world_id))).size;
  const subjectiveTorus = world.topology === 'torus' && !view;
  $('discoveredLabel').textContent = subjectiveTorus ? '記憶した床（重複を含む）' : '通路の発見率';
  $('discovered').textContent = subjectiveTorus ? `${remembered.length}セル` : Math.floor(100 * known / world.validation.floors) + '%';
  $('validation').textContent = world.warpMode ? `全 ${world.validation.floors} 通路 · ワープ込み到達可` : world.topology === 'torus' ? '全通路接続 · 二方向の周回可' : world.puzzle ? `${world.puzzle.locks.length}組の攻略順序 検証済み` : `全 ${world.validation.floors} 通路セル到達可`;
  $('topologyInfo').hidden = world.topology !== 'torus';
  const knowledge = MazeCore.knowledgeSummary(game);
  $('knowledgeSummary').textContent = !world.loopLearning ? '周期の理解：学習なし' : knowledge.complete ? '周期の理解：全周期を理解しました。未探索の地形は引き続き探索が必要です。' : knowledge.rank === 2 ? `周期の理解：二方向の一部を理解。まだ${knowledge.index}種類の周期コピーを別の場所として記憶します。` : knowledge.rank === 1 ? '周期の理解：一方向の繰り返しを理解。横断する方向には、未知のつながりが残っています。' : '周期の理解：まだ周回のつながりを理解していません。';
  $('loopProgress').textContent = world.loopLearning
    ? ['x', 'y'].map(axis => `${axis === 'x' ? '横' : '縦'}：${cognition.known_loops.has(axis) ? ({ inference: '知識の組合せで理解', vision: '自己視認で理解', walk: '周回して理解' }[cognition.knowledgeSources[axis]] || '理解済み') : `${cognition.loopProgress[axis]} / ${world.learningLaps ?? 5}周`}`).join(' ｜ ')
    : '方向感覚：学習せず、展開を続けます。';
  const routes = [...cognition.compositeLoops.values()];
  if (world.loopLearning && routes.length) $('loopProgress').textContent += ' ｜ ' + routes.slice(-6).map(r => `複合（横${r.winding[0]}・縦${r.winding[1]}）：${r.recognized ? (r.source === 'vision' ? '自己視認で理解' : '理解済み') : `${r.count} / ${world.learningLaps ?? 5}周`}`).join(' ｜ ');
  $('topologyReadout').textContent = view
    ? `実位置 (${px}, ${py}) ／ 展開座標 (${player.perceived_x}, ${player.perceived_y})`
    : world.separateMaps ? `地図帳 ${cognition.archives.length+1}：保存地図 ${cognition.archives.length}冊のうち ${cognition.matchedArchives.size}冊を照合済み。` : `主観位置 (${px}, ${py}) · ${continuous ? "視界は連続し、理解済みの場所は同じ記憶を参照します。" : "未理解の方向だけ展開を続けます。"}`;
  $('topologyGuide').textContent = view
    ? `左右の金色・上下の水色が接続口。右端→左端は縦に${world.shiftY || 0}セル、下端→上端は横に${world.shiftX || 0}セルずれます（逆向きは逆のずれ）。`
    : cognition.knowledgeBasis ? '複合周回の理解は連続表示で表現します。学習した周回だけ同じ記憶を共有し、他の未知のつながりは残します。' : continuous ? '視界は途切れず続きます。理解済みの記憶を共有し、見覚えのある床を淡い緑で表示します。' : cognition.known_loops.size ? '理解した方向の端はつながっています。左右は金色、上下は水色の印で示します。矢印の向きに進めます。' : '境界でも道と視界は続きます。どちらの表示でも矢印の向きに進みます。';
  if (world.lattice) $('topologyGuide').textContent = view ? '段差状の輪郭が真世界の範囲。外側は壁ではなく別の周期コピーです。接続口の金色は横周期、水色は縦周期、紫は両周期をまたぐ接続。矢印キーは表示の上下左右に対応します。' : '二方向ずれは連続表示を使用します。横・縦は斜めに伸びる二つの基本周期を意味し、理解した周期だけ記憶を統合します。';
  $('puzzleInfo').hidden = !world.puzzle;
  const inventory = (world.puzzle?.locks || []).map(lock => `${lock.keyId}：${game.openedDoors.has(lock.keyId) ? '開扉済み' : player.keys.includes(lock.keyId) ? '鍵を所持' : '鍵は未取得'}`).join(' ｜ ');
  if ($('inventory').textContent !== inventory) $('inventory').textContent = inventory;
  canvas.setAttribute('aria-label', `迷路、${view ? '真世界' : '主観世界'}、${ascii ? '等幅文字' : 'タイル'}表示。${game.steps}歩・${game.turns}行動。${$('discoveredLabel').textContent}${$('discovered').textContent}。${game.won ? '出口に到着。' : '矢印キーまたはhjklで移動。'}`);
}
function setAscii(next) {
  ascii = next;
  $('tiles').setAttribute('aria-pressed', String(!ascii));
  $('ascii').setAttribute('aria-pressed', String(ascii));
  $('asciiLegend').hidden = !ascii;
  document.querySelector('.legend').hidden = ascii;
  render();
}
function setView(next) {
  view = next; $('subjective').setAttribute('aria-pressed', String(!view)); $('truth').setAttribute('aria-pressed', String(!!view));
  $('viewLabel').textContent = view ? '全体図 · 未探索部分も表示' : '見える範囲と、歩いた記憶'; render();
}
function announceSelfVision() {
  if (!game.won && game.selfRecognized?.length) $('status').textContent = `${game.selfRecognized.map(a => a === 'x' ? '横' : a === 'y' ? '縦' : a).join('・')}方向に、一周先の自分が見えました！ その周回を即座に理解しました。`;
  if (!game.won && game.inferredRecognized?.length) $('status').textContent += ` 学んだ周回を組み合わせ、${game.inferredRecognized.map(a => a === 'x' ? '横' : '縦').join('・')}方向のつながりも理解しました！`;
}
function step(direction) {
  if (game.won) return;
  const moved = direction === 'wait' ? MazeSession.act(game,'wait') : MazeSession.act(game,'move', MazeRotationBridge.input(game,direction,!!view));
  const id = game.eventKeyId;
  const locks = game.world.puzzle?.locks || [];
  const next = locks[locks.findIndex(lock => lock.keyId === id) + 1];
  const messages = {
    wait: 'その場で1行動待ちました。歩数は増えません。',
    warp: 'ワープ床で別の場所へ移動しました。向きはそのまま、新しい地図帳で探索します。',
    teleport: '鳥人間に触れ、開いている通路でつながる別の場所へ転移しました！ 地図の記憶・取得した鍵・開けた扉はそのままです。',
    'bird-stay': '鳥人間に触れましたが、閉じた扉を越えずに転移できる場所がありません。位置はそのままで、鳥人間全員が4行動休止します。',
    key: `鍵${id}を手に入れました！ 対応する扉へ進むと自動で開きます。`,
    door: `扉${id}を開けました。${next ? `次は鍵${next.keyId}（${next.keyId.toLowerCase()}）を探しましょう。` : '出口を目指しましょう。'}`,
    locked: `この扉には鍵${id}が必要です。鍵（${id?.toLowerCase()}）を探しましょう。`
  };
  if(game.viewFrame)messages.warp='向きが変わるワープで移動しました。主観の画面方向で操作できます。転移前の地図は当時の向きで保存しました。';
  if (game.world.separateMaps) messages.teleport = '鳥人間に触れて転移しました。新しい地図帳で探索を再開します。古い地図・鍵・扉・周回の知識は保持しています。';
  if (game.lastEvent === 'teleport') messages.teleport += game.lastTeleport?.fallback ? ' 希望する転移先がないため、通常の転移先を選びました。' : game.lastTeleport?.policy === 'unseen' ? ' まだ見ていなかった場所です。' : game.lastTeleport?.policy === 'known' ? ' 以前に見たことのある場所です。' : '';
  $('status').textContent = game.won ? `出口に到着！ ${game.steps}歩で踏破しました。探索を続けるか、出口で > を押して次の迷路へ。` : messages[game.lastEvent] || (moved ? '通路を進みました。記憶が少しずつ広がります。' : '壁があり、そちらには進めません。');
  if (moved && !game.won && view && game.lastTransition.kind === 'wrap') $('status').textContent = '接続された境界を通り、真世界の反対側へ進みました。主観上の道は続いています。';
  if (game.lastLoopEvent && !game.won) {
    const { axis, count, recognized } = game.lastLoopEvent, name = axis === 'composite' ? `複合（横${game.lastLoopEvent.winding[0]}・縦${game.lastLoopEvent.winding[1]}）` : axis === 'x' ? '横' : '縦';
    $('status').textContent = recognized ? `${name}方向の周回を理解しました！ その方向の重複した記憶をつなぎ直しました。` : `${name}方向の周回を経験しました（${count} / ${game.world.learningLaps ?? 5}）。`;
  }
  announceSelfVision();
  if(game.lastTransition?.kind==='warp'&&game.lastEvent==='warp'&&game.warpArrows?.some(a=>a.from===game.lastTransition.from&&a.status==='contradicted'))$('status').textContent+=' 記入したワープ先と違うのでは？ 実際の到着先が矢印の予想と一致しません。';
  render();
}
function updateGeneratorControls() {
  const torus = $('topology').value === 'torus';
  $('torusOptions').hidden = !torus;
  $('shiftAmount').disabled = !torus || $('shiftAxis').value === 'none';
  const dual = torus && $('shiftAxis').value === 'both';
  $('dualShiftOptions').hidden = !dual; $('shiftAmountX').disabled = !dual;
  $('shiftLabel').textContent = dual ? '左右接続の縦ずれ（セル）' : 'ずれ量（セル）';
  $('warpOptions').hidden=$('ruleMode').value!=='warp';
  for(const id of ['warpStyle','warpCount','warpInvisible'])$(id).disabled=$('ruleMode').value!=='warp';
  $('warpRotation').disabled=torus||$('ruleMode').value!=='warp';
  if(torus && $('ruleMode').value === 'key-door') $('ruleMode').value = 'explore';
  if(torus && $('ruleMode').value === 'bird-keys') $('ruleMode').value = 'bird';
  for(const option of $('ruleMode').options) option.disabled = torus && ['key-door','bird-keys'].includes(option.value);
  for (const id of ['width', 'height']) { $(id).min = torus ? '8' : '9'; $(id).max = torus ? '100' : '101'; }
  $('sizeHint').textContent = torus ? '8〜100の偶数（壁を含む周期の長さ）。空間切替時にサイズを調整します。' : '9〜101の奇数（壁を含むセル数）';
  $('ellerHint').hidden = $('algorithm').value !== 'eller';
  $('divisionHint').hidden = $('algorithm').value !== 'division';
  const growing = $('algorithm').value === 'growing';
  $('growingOptions').hidden = !growing; $('newestBias').disabled = !growing;
  const rooms = $('algorithm').value === 'rooms';
  $('roomOptions').hidden = !rooms; $('roomCount').disabled = !rooms; $('connectionStyle').disabled = !rooms; $('roomPlacement').disabled = !rooms;
  const birds = ['bird','bird-keys'].includes($('ruleMode').value);
  $('birdTorusHint').hidden = !birds || !torus;
  $('birdHint').hidden = !birds; $('birdOptions').hidden = !birds; $('birdCount').disabled = !birds; $('teleportPolicy').disabled = !birds; $('separateMaps').disabled = !birds;
  const keyDoor = ['key-door','bird-keys'].includes($('ruleMode').value);
  $('keyOptions').hidden = !keyDoor; $('keyCount').disabled = !keyDoor;
  $('loopLabel').textContent = rooms ? '追加接続率' : 'ループ率';
  $('loopHint').textContent = rooms
    ? (torus ? '境界の向こうの部屋も接続候補です。0%でも二方向の周回路を確保し、この確率で近い部屋への通路を追加します。' : '近い部屋への追加通路を、この確率で作ります。0%でも部屋内や通路の交差にループは生じます。')
    : torus ? '二方向の周回路に加えて、残った壁をこの確率で開きます。' : '残った通路間の壁を、この確率で開きます。';
}
$('topology').addEventListener('change', () => {
  const torus = $('topology').value === 'torus';
  for (const id of ['width', 'height']) {
    let size = Math.round(Number($(id).value)) || 31;
    if (size % 2 !== (torus ? 0 : 1)) size += torus ? -1 : 1;
    $(id).value = Math.max(torus ? 8 : 9, Math.min(torus ? 100 : 101, Math.round(size)));
  }
  updateGeneratorControls();
});
function startDemo(optics = false) {
  $('topology').value = 'torus'; $('width').value = '8'; $('height').value = '8';
  $('algorithm').value = 'dfs'; $('loops').value = '0'; $('loopValue').textContent = '0%'; $('seed').value = 'torus-demo';
  if (optics) { $('selfVision').checked = true; $('foldDisplay').value = 'continuous'; $('seed').value = 'optics-room'; }
  if (optics === 'diagonal' || optics === 'crossed') { $('shiftAxis').value = 'none'; $('seed').value = optics === 'crossed' ? 'crossed-room' : 'diagonal-room'; }
  updateGeneratorControls(); newWorld(optics === 'crossed' ? 'crossed' : optics === 'diagonal' ? 'diagonal' : optics ? 'optics' : true); setView(0); canvas.focus();
}
$('warpDemo').addEventListener('click',()=>{
  $('topology').value='plane';$('width').value='17';$('height').value='9';$('ruleMode').value='explore';
  updateGeneratorControls();newWorld('warp');setView(0);canvas.focus();
});
$('archiveDemo').addEventListener('click',()=>{
  $('topology').value='torus';$('width').value='8';$('height').value='8';$('shiftAxis').value='none';
  $('loopLearning').value='three';$('selfVision').checked=false;$('foldDisplay').value='continuous';$('ruleMode').value='explore';$('archiveKnowledge').checked=true;
  updateGeneratorControls();newWorld('archive');setView(0);canvas.focus();
});
$('torusDemo').addEventListener('click', () => startDemo());
$('opticsDemo').addEventListener('click', () => startDemo(true));
$('algorithm').addEventListener('change', updateGeneratorControls);
$('ruleMode').addEventListener('change', updateGeneratorControls);
$('settings').addEventListener('submit', e => { e.preventDefault(); newWorld(); });
$('newestBias').addEventListener('input', () => { $('newestValue').textContent = $('newestBias').value + '%'; });
$('loops').addEventListener('input', () => { $('loopValue').textContent = $('loops').value + '%'; });
$('randomize').addEventListener('click', () => { $('seed').value = 'walk-' + Math.random().toString(36).slice(2, 10); if ($('settings').reportValidity()) newWorld(); });
$('waitTurn').addEventListener('click', () => step('wait'));
$('restart').addEventListener('click', () => { game = MazeSession.attach(MazeMainJourney.restart(game)); $('archiveExportResult').hidden=true;$('archiveExportText').value=''; $('status').textContent = game.world.puzzle ? '入口に戻りました。探索記憶・鍵・扉を初期状態に戻しました。' : '同じ迷路の入口に戻りました。探索記憶とループの学習をリセットしました。'; announceSelfVision(); render(); });
$('subjective').addEventListener('click', () => setView(0)); $('truth').addEventListener('click', () => setView(1));
$('tiles').addEventListener('click', () => setAscii(false)); $('ascii').addEventListener('click', () => setAscii(true));
for (const button of document.querySelectorAll('[data-dir]')) button.addEventListener('click', () => step(button.dataset.dir));
canvas.addEventListener('pointerdown', () => canvas.focus());
document.addEventListener('keydown', e => {
  if (e.isComposing || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName) || e.target.isContentEditable) return;
  if (e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey && ['z','y'].includes(e.key.toLowerCase()) && game.world.warps?.size) {
    e.preventDefault();if(!e.repeat)undoRedoArrow(e.key.toLowerCase()==='y');return;
  }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === 'Escape' && (warpCurveDrag.state || renderWarpNotes.selection || renderWarpNotes.from!=null)) { e.preventDefault(); if(!e.repeat)cancelArrowInteraction(); return; }
  if (e.key === 'Delete' && $('editZeroMark').getAttribute('aria-pressed')==='true') { e.preventDefault(); if(!e.repeat) deleteAnnotationSelection(); return; }
  if (e.key.toLowerCase() === 'z' && game.world.warps?.size) { e.preventDefault(); if(!e.repeat) $('editZeroMark').click(); return; }
  if (e.key.toLowerCase() === 'e' && game.won) { e.preventDefault(); if(!e.repeat) continueExploration(); return; }
  if (e.key === '>') { e.preventDefault(); if(!e.repeat) nextMaze(); return; }
  if (e.key.toLowerCase() === 'c') { e.preventDefault(); if(!e.repeat) matchAvailableMaps(); return; }
  if (e.key.toLowerCase() === 'm') { e.preventDefault(); if(!e.repeat) markHere(); return; }
  if (e.shiftKey && e.key.toLowerCase() === 'n') {
    e.preventDefault();
    if (!e.repeat) $('randomize').click();
    return;
  }
  if (e.key === '.' || e.key === '5' || e.code === 'Numpad5') {
    e.preventDefault(); if (!e.repeat) step('wait'); return;
  }
  const keys = { ArrowUp: 'up', ArrowRight: 'right', ArrowDown: 'down', ArrowLeft: 'left', h: 'left', j: 'down', k: 'up', l: 'right', '2': 'down', '4': 'left', '6': 'right', '8': 'up' };
  const direction = keys[e.key];
  if (direction) { e.preventDefault(); step(direction); }
  else if (e.key === '0' || e.key === '1') { e.preventDefault(); setView(Number(e.key)); }
});
new ResizeObserver(render).observe(canvas);
updateGeneratorControls();
newWorld();

$('foldDisplay').addEventListener('change', render);

$('shiftAxis').addEventListener('change', updateGeneratorControls);

$('showRays').addEventListener('change', render);
$('rayTarget').addEventListener('change', render);

$('diagonalDemo').addEventListener('click', () => startDemo('diagonal'));

$('crossedDemo').addEventListener('click', () => startDemo('crossed'));

$('showBirdVision').addEventListener('change', render);

$('birdDebugTarget').addEventListener('change', render);

$('warpStyle').addEventListener('change',updateGeneratorControls);

function continueExploration(){if(game.won&&MazeSession.act(game,'continue')){$('status').textContent='出口への到達を記録したまま探索を再開しました。';render();canvas.focus();}}
$('continueExploring').addEventListener('click',continueExploration);

function nextMaze() {
  if(!MazeMainJourney.canAdvance(game)) { $('status').textContent='次の迷路へ進むには、出口 > の上に戻ってください。実験用の部屋は対象外です。';return; }
  try {
    const seed='walk-'+Math.random().toString(36).slice(2,10);
    const course=$('journeyCourse').value;
    const next=MazeMainJourney.next(game,seed,course);
    if(course!=='same')applyJourneySettings(next);
    newWorld(false,next); $('seed').value=next.generationOptions.seed;canvas.focus();
  } catch(error) { $('status').textContent=`次の迷路を生成できませんでした。現在の探索を保持しています。${error.message}`; }
}
$('nextMaze').addEventListener('click',nextMaze);

function applyJourneySettings(next) {
  const o=next.generationOptions;
  for(const id of ['topology','algorithm','width','height','loops','roomCount','roomPlacement','connectionStyle','warpStyle','warpCount'])$(id).value=String(o[id]);
  $('ruleMode').value=o.warpMode?'warp':o.keyDoor?(o.birdMode?'bird-keys':'key-door'):o.birdMode?'bird':'explore';
  $('keyCount').value=String(o.keyCount||1);
  $('birdCount').value=String(o.birdCount||1);$('teleportPolicy').value=o.teleportPolicy||'far';
  $('warpRotation').value=next.world.rotatingWarp||'none';
  $('warpInvisible').checked=!!o.warpInvisible;$('separateMaps').checked=!!o.separateMaps;
  $('shiftAxis').value=o.shiftX&&o.shiftY?'both':o.shiftX?'x':o.shiftY?'y':'none';
  $('shiftAmount').value=String(o.shiftY||o.shiftX||2);$('shiftAmountX').value=String(o.shiftX||2);
  $('selfVision').checked=!!o.selfVision;$('loopLearning').value=o.loopLearning?(o.learningLaps===3?'three':'on'):'off';
  $('newestBias').value=String(o.newestBias??70);
  $('loopValue').textContent=String(o.loops)+'%';updateGeneratorControls();
}

$('beginJourney').addEventListener('click',()=>{
  try {
    const course=$('journeyCourse').value;
    const next=MazeMainJourney.begin(game,'walk-'+Math.random().toString(36).slice(2,10),course);
    if(course!=='same')applyJourneySettings(next);
    newWorld(false,next);$('seed').value=next.generationOptions.seed;
    $('status').textContent='新しい旅を始めました。出口で > を押すと、選んだコースの次の迷路へ進みます。';
    canvas.focus();
  } catch(error) { $('status').textContent=`旅を開始できませんでした。${error.message}`; }
});

function currentGenerationDetails(g){
 const w=g.world,o=g.generationOptions||{},lines=[`シード：${w.seed}`];
 if(w.algorithm==='rooms'){
  lines.push(`部屋の配置：${{bsp:'領域分割',scatter:'散らして配置',grid:'格子状に配置'}[w.roomPlacement]||w.roomPlacement}`);
  lines.push(`部屋のつなぎ方：${{tree:'短い通路でつなぐ',chain:'順につなぐ',ring:'環状につなぐ',hub:'入口の部屋を中心につなぐ'}[w.connectionStyle]||w.connectionStyle}`);
  lines.push(`部屋数：目標 ${w.requestedRoomCount}室 / 生成 ${w.rooms.length}室`);
 }
 if(w.algorithm==='growing')lines.push(`長い道を伸ばす割合：${w.newestBias}%`);
 if(w.warpMode)lines.push(`ワープの組数：目標 ${o.warpCount??w.warpCount}組 / 配置 ${w.warpCount}組`);
 if(w.puzzle)lines.push(`鍵と扉：目標 ${o.keyCount??w.puzzle.locks.length}組 / 配置 ${w.puzzle.locks.length}組`);
 if(w.birdMode){
  lines.push(`鳥人間：目標 ${o.birdCount??g.birds.length}体 / 配置 ${g.birds.length}体`);
  lines.push(`鳥人間の転移先：${{far:'遠くを優先',known:'見覚えのある場所を優先',unseen:'まだ見ていない場所を優先'}[w.teleportPolicy]||w.teleportPolicy}`);
 }
 lines.push('現在の迷路の条件です。次の迷路用に変更した候補とは別です。');
 return lines.join('\n');
}
function renderJourneyOverview() {
  renderRandomSettings();
  renderRandomPending();
  const w=game.world,o=game.generationOptions||w;
  const names={dfs:'DFS',prim:'Prim',division:'壁で領域分割',rooms:'部屋と通路',eller:'Eller',wilson:'Wilson',kruskal:'Kruskal',hunt:'Hunt-and-Kill',growing:'Growing Tree'};
  const parts=[w.topology==='torus'?'トーラス':'平面',`${o.width} × ${o.height}`,names[w.algorithm]||w.algorithm];
  if(w.topology==='torus'){
    parts.push(`境界のずれ：横 ${w.shiftX||0} / 縦 ${w.shiftY||0}`);
    parts.push(w.loopLearning?`${w.learningLaps||5}周で理解`:'周回を展開し続ける');
  }
  if(w.warpMode){
    parts.push(`${{pair:'相互ワープ',oneway:'一方通行ワープ',cycle3:'3地点の輪',cycle4:'4地点の輪'}[w.warpStyle]} ${w.warpCount}組`);
    parts.push(w.warpInvisible?'ワープ床は不可視':'ワープ床は可視');
    parts.push({right:'時計回り90°',left:'反時計回り90°',half:'180°回転',mirror:'左右反転',mixed:'組ごとに回転・反転'}[w.rotatingWarp]||'向きは変わらない');
  }
  if(w.puzzle)parts.push(`鍵と扉 ${w.puzzle.locks.length}組`);
  if(w.birdMode)parts.push(`鳥人間 ${game.birds.length}体`);
  if(!w.warpMode&&!w.puzzle&&!w.birdMode)parts.push('通常探索');
  renderJourneyHistory();
  $('journeyCurrent').textContent='今の迷路：'+parts.join(' · ');
  const details=currentGenerationDetails(game);
  if($('journeyCurrentDetails').textContent!==details)$('journeyCurrentDetails').textContent=details;
  const course=$('journeyCourse').value;
  for(const button of document.querySelectorAll('[data-course]')){const selected=button.dataset.course===course;button.setAttribute('aria-pressed',String(selected));button.textContent=selected?'選択中':'選ぶ';}
  $('journeySize').value=game.journey?.size||'standard';$('journeySize').disabled=course==='same'||course==='random';
  $('journeyLayout').value=game.journey?.layout||'all';$('journeyLayout').disabled=course==='same'||course==='random';
  const destination=course==='random'?'選んだ候補からランダムに生成':course==='same'?'現在と同じ生成条件の別シード':course==='plain'?'平面の通常迷路（方式とサイズを選び直す）':course==='variety'?(w.warpMode?'平面の通常迷路':'可視ワープの迷路（接続と向きも選び直す）'):course==='torus'?(w.topology==='torus'?'平面の通常迷路':'トーラスの迷路（境界のずれを選び直す・3周で理解）'):course==='keys'?(w.puzzle?'平面の通常迷路':'鍵と扉の迷路（目標1〜3組）'):course==='birds'?(w.birdMode?'平面の通常迷路':'鳥人間が1体いる迷路（転移ごとに地図を記録）'):'';
  const nextText='出口で > を押すと：'+destination+'。'+(course==='random'?randomRangeText()+`適用済みの候補：${MazeRandomJourney.inspect(game.journey?.random||MazeRandomJourney.defaults).count}組。` :course==='same'?'サイズも現在の条件を引き継ぎます。':`地形：${{all:'すべて',corridors:'通路型だけ',rooms:'部屋と通路だけ'}[game.journey?.layout||'all']}。規模：${{small:'小さめ',standard:'標準',large:'大きめ'}[game.journey?.size||'standard']}。`);
  if($('journeyNext').textContent!==nextText)$('journeyNext').textContent=nextText;
}
$('journeyCourse').addEventListener('change',()=>{renderJourneyOverview();renderSessionInfo();});

let checkpointReadVersion=0;
$('checkpointText').addEventListener('input',()=>{checkpointReadVersion++;});
$('checkpointExport').addEventListener('click',()=>{
 checkpointReadVersion++;
 try { $('checkpointText').value=MazeCheckpoint.encode(game,$('journeyCourse').value);$('checkpointStatus').textContent='入口再開用の記録を表示しました。全文をコピーして保管してください。'; }
 catch(error){$('checkpointStatus').textContent=error.message;}
});
$('checkpointImport').addEventListener('click',()=>{
 checkpointReadVersion++;
 try {
  const restored=MazeCheckpoint.decode($('checkpointText').value);
  applyJourneySettings(restored.game);$('journeyCourse').value=restored.course;
  newWorld(false,restored.game);$('seed').value=restored.game.generationOptions.seed;
  $('checkpointStatus').textContent='記録した迷路の入口から再開しました。この迷路の探索記憶と歩数は初期状態です。';canvas.focus();
 }catch(error){$('checkpointStatus').textContent='再開できませんでした。現在の探索は保持しています。'+error.message;}
});

$('checkpointDownload').addEventListener('click',()=>{
 checkpointReadVersion++;
 try {
  const text=MazeCheckpoint.encode(game,$('journeyCourse').value);
  $('checkpointText').value=text;
  const blob=new Blob([text],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download=`maze-entrance-${game.journey.completed+1}.json`;
  document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  $('checkpointStatus').textContent='ファイル保存を開始しました。保存されない場合は、下の欄の全文をコピーして保管してください。';
 }catch(error){$('checkpointStatus').textContent=error.message;}
});
$('checkpointFile').addEventListener('change',async()=>{
 const file=$('checkpointFile').files[0],version=++checkpointReadVersion;
 $('checkpointFile').value='';if(!file)return;
 try {
  if(file.size>60000)throw Error('記録ファイルは60KB以内にしてください。');
  const text=await file.text();if(version!==checkpointReadVersion)return;
  const restored=MazeCheckpoint.decode(text.replace(/^\uFEFF/,''));
  $('checkpointText').value=text.replace(/^\uFEFF/,'');
  $('checkpointStatus').textContent=`第${restored.game.journey.completed+1}迷路の入口記録を読み込みました。現在の探索は変えていません。「この記録の入口から再開」で適用できます。`;
 }catch(error){if(version===checkpointReadVersion)$('checkpointStatus').textContent='ファイルを読み込めませんでした。現在の探索と欄内の記録は保持しています。'+error.message;}
});

$('placeZeroMark').addEventListener('click',()=>{
 const result=MazeSession.act(game,'zero');
 $('status').textContent={placed:'この床に 0 を刻印しました。離れると印が見えます。',existing:'この床には既に 0 があります。',blocked:'入口・出口・番号付き目印・鍵・扉以外の床に刻印できます。',unavailable:'不可視ワープの迷路で使えます。',won:'Eキーで探索を再開してから刻印できます。'}[result.status];
 render();canvas.focus();
});

function selectAnnotation(selection){renderWarpNotes.selection=selection;render();}
function sameArrow(a,b){return a?.type==='arrow'&&a.from===b.from&&a.to===b.to;}
function preferredArrowHit(hits,selection){
 const eligible=hits.filter(a=>a.distance<=7);
 if(!eligible.length)return null;
 const nearest=eligible.reduce((a,b)=>a.distance<=b.distance?a:b);
 return eligible.find(a=>sameArrow(selection,a)&&a.distance<=nearest.distance+1)||nearest;
}
function arrowLineDistance(point,samples){
 let best=Infinity;
 for(let i=1;i<samples.length;i++){
  const a=samples[i-1],b=samples[i],dx=b.x-a.x,dy=b.y-a.y;
  const t=Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/(dx*dx+dy*dy||1)));
  best=Math.min(best,Math.hypot(point.x-a.x-t*dx,point.y-a.y-t*dy));
 }
 return best;
}
function arrowCurveSamples(start,control,end){
 const points=[start],mid=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
 const divide=(a,c,b,depth)=>{
  // Bound the curve's deviation from each chord to half a CSS pixel.
  if(depth>=12||arrowLineDistance(c,[a,b])<=0.5){points.push(b);return;}
  const ac=mid(a,c),cb=mid(c,b),center=mid(ac,cb);
  divide(a,ac,center,depth+1);divide(center,cb,b,depth+1);
 };
 divide(start,control,end,0);return points;
}
function focusedWarpArrows(arrows,selection,enabled,status='all'){
 if(status!=='all')arrows=arrows.filter(a=>a.status===status);
 if(!enabled||!selection)return arrows;
 return arrows.filter(a=>selection.type==='arrow'?sameArrow(selection,a):a.from===selection.id||a.to===selection.id);
}
function drawWarpAnnotations(context,points,w,h){
 const selection=$('editZeroMark').getAttribute('aria-pressed')==='true'?renderWarpNotes.selection:null,hits=[];
 const filtered=[...focusedWarpArrows(game.warpArrows||[],selection,$('focusWarpArrows').checked,$('warpArrowStatusFilter').value||'all')].sort((a,b)=>Number(sameArrow(selection,a))-Number(sameArrow(selection,b)));
 // Build once per drawing: repeated images of each floor share one nearest endpoint.
 let nearest;
 const closest=id=>{
  if(!nearest){
   nearest=new Map();
   for(const p of points||[]){
    const key=p.id,distance=Math.hypot(p.x-w/2,p.y-h/2),previous=nearest.get(key);
    if(!previous||distance<previous.distance)nearest.set(key,{point:p,distance});
   }
  }
  return nearest.get(id)?.point;
 };
 context.save();
 if($('showKnownArrows').checked&&Number($('arrowTransparency').value)<100){
  for(const a of filtered){
   const from=closest(a.from),to=closest(a.to);if(!from||!to)continue;
   const dx=to.x-from.x,dy=to.y-from.y,len=Math.hypot(dx,dy);if(!len)continue;
   const preview=warpCurveDrag.state,curve=preview?.moved&&preview.game===game&&preview.from===a.from&&preview.to===a.to?preview.curve:a.curve;
   const bend=Number.isFinite(curve)?curve*len:Math.min(22,len/5),cx=(from.x+to.x)/2-dy/len*bend,cy=(from.y+to.y)/2+dx/len*bend;
   const length=Math.hypot(to.x-cx,to.y-cy),ux=(to.x-cx)/length,uy=(to.y-cy)/length,x=to.x-ux*to.tile*.35,y=to.y-uy*to.tile*.35;
   const selected=sameArrow(selection,a);context.globalAlpha=selected?1:1-Number($('arrowTransparency').value)/100;context.lineWidth=selected?4:2;
   context.strokeStyle=context.fillStyle=selected?'#ffffff':{hypothesis:'#edba72',confirmed:'#8cd69c',contradicted:'#ef8290'}[a.status];
   context.setLineDash(a.status==='hypothesis'&&!selected?[5,4]:[]);context.beginPath();context.moveTo(from.x,from.y);context.quadraticCurveTo(cx,cy,x,y);context.stroke();context.setLineDash([]);
   context.beginPath();context.moveTo(x,y);context.lineTo(x-ux*8-uy*4,y-uy*8+ux*4);context.lineTo(x-ux*8+uy*4,y-uy*8-ux*4);context.closePath();context.fill();
   const samples=arrowCurveSamples(from,{x:cx,y:cy},{x,y});hits.push({from:a.from,to:a.to,samples,dx,dy,len,curve:Number.isFinite(curve)?curve:bend/len});
  }
 }
 if(selection?.type==='arrow'&&$('showKnownArrows').checked&&Number($('arrowTransparency').value)<100){
  const index=(game.warpArrows||[]).findIndex(a=>sameArrow(selection,a)),record=MazeCore.warpArrowRecords(game)[index];
  if(record&&filtered.some(a=>sameArrow(selection,a))){
   context.globalAlpha=1;context.font='12px sans-serif';context.textAlign='left';context.textBaseline='middle';context.lineWidth=2;context.setLineDash([]);
   for(const [id,label,departure] of [[selection.from,record.from,true],[selection.to,record.to,false]]){
    const p=closest(id);if(!p||p.x<0||p.x>w||p.y<0||p.y>h)continue;
    const text=`${label} ${departure?'出発':'到着'}`,width=context.measureText(text).width+12;
    const x=Math.max(2,Math.min(w-width-2,p.x+8)),y=Math.max(2,Math.min(h-24,p.y+(departure?-p.tile/2-26:p.tile/2+4)));
    context.strokeStyle=departure?'#edba72':'#8cd69c';context.strokeRect(p.x-p.tile/2,p.y-p.tile/2,p.tile,p.tile);
    context.fillStyle='#0b181e';context.fillRect(x,y,width,22);context.strokeRect(x,y,width,22);context.fillStyle='#ffffff';context.fillText(text,x+6,y+11);
   }
  }
 }
 if(selection?.type==='zero'||selection?.type==='floor'){context.globalAlpha=1;context.strokeStyle='#ffffff';context.lineWidth=3;for(const p of points||[])if(p.id===selection.id)context.strokeRect(p.x-p.tile/2,p.y-p.tile/2,p.tile,p.tile);}
 context.restore();return hits;
}
function renderWarpNotes(context,w,h){
 $('warpNotes').hidden=!game.world.warps?.size;
 if(renderWarpNotes.game!==game){abortArrowDrag();renderWarpNotes.game=game;renderWarpNotes.from=null;renderWarpNotes.selection=null;$('editZeroMark').setAttribute('aria-pressed','false');$('zeroMarkStatus').textContent='';$('editWarpArrow').setAttribute('aria-pressed','false');$('warpArrowStatus').textContent='';}
 const arrows=game.warpArrows||[],list=$('warpArrowList');
 const signature=JSON.stringify(arrows);
 if(renderWarpNotes.notesGame!==game||renderWarpNotes.notesSignature!==signature){
  $('warpArrowNotesText').value=MazeCore.exportWarpArrowNotes(game);
  renderWarpNotes.records=MazeCore.warpArrowRecords(game);
  renderWarpNotes.notesGame=game;renderWarpNotes.notesSignature=signature;
 }
 const records=renderWarpNotes.records;
 const structure=JSON.stringify(arrows.map(a=>[a.from,a.to]));
 if(renderWarpNotes.listGame!==game||renderWarpNotes.listStructure!==structure){
  list.replaceChildren();
  renderWarpNotes.buttons=arrows.map(a=>{
   const button=document.createElement('button');button.type='button';
   const endpoint={type:'arrow',from:a.from,to:a.to};
   button.addEventListener('click',()=>{selectAnnotation(sameArrow(renderWarpNotes.selection,endpoint)?null:{...endpoint});$('zeroMarkStatus').textContent=renderWarpNotes.selection?'矢印を選択しました。Deleteで消去できます。':'矢印の選択を解除しました。';});
   list.append(button);return button;
  });
  renderWarpNotes.listGame=game;renderWarpNotes.listStructure=structure;
 }
 $('warpArrowCounts').textContent=`全${arrows.length}本 / 未確認 ${arrows.filter(a=>a.status==='hypothesis').length} / 確認済み ${arrows.filter(a=>a.status==='confirmed').length} / 不一致 ${arrows.filter(a=>a.status==='contradicted').length}`;
 const selected=$('editZeroMark').getAttribute('aria-pressed')==='true'&&arrows.find(a=>sameArrow(renderWarpNotes.selection,a));
 $('straightenWarpArrow').disabled=$('resetWarpArrowCurve').disabled=!selected;
 $('reverseWarpArrow').disabled=!selected||game.won;
 const history=MazeSession.arrowHistoryInfo(game);$('undoWarpArrow').disabled=!history.undo;$('redoWarpArrow').disabled=!history.redo;
 arrows.forEach((a,i)=>{
  const button=renderWarpNotes.buttons[i],text=`矢印 ${i+1}：${records[i].from} → ${records[i].to} / ${{hypothesis:'予想（未確認）',confirmed:'実際のワープと一致・照合に使用',contradicted:'違うのでは？ ワープ先が不一致'}[a.status]}`;
  const disabled=$('editZeroMark').getAttribute('aria-pressed')!=='true',pressed=String(sameArrow(renderWarpNotes.selection,a));
  if(button.textContent!==text)button.textContent=text;
  if(button.disabled!==disabled)button.disabled=disabled;
  if(button.getAttribute('aria-pressed')!==pressed)button.setAttribute('aria-pressed',pressed);
 });
 render.arrowHits=drawWarpAnnotations(context,render.warpPoints,w,h);
}
$('editWarpArrow').addEventListener('click',()=>{
 abortArrowDrag();
 $('editZeroMark').setAttribute('aria-pressed','false');renderWarpNotes.selection=null;
 const active=$('editWarpArrow').getAttribute('aria-pressed')!=='true';$('editWarpArrow').setAttribute('aria-pressed',String(active));renderWarpNotes.from=null;
 $('warpArrowStatus').textContent=active?'予想する出発床をクリックしてください。':'矢印の記入を終了しました。';render();
});
function abortArrowDrag(){
 const drag=warpCurveDrag.state;
 warpCurveDrag.state=null;
 if(drag){
  warpCurveDrag.suppress=drag.target;
  if(drag.target.hasPointerCapture(drag.pointerId))drag.target.releasePointerCapture(drag.pointerId);
 }
 return drag;
}
function cancelArrowInteraction(){
 const drag=abortArrowDrag();
 renderWarpNotes.selection=null;renderWarpNotes.from=null;
 $('zeroMarkStatus').textContent=drag?.moved?'ドラッグをキャンセルし、元の曲がりに戻しました。':'選択を解除しました。編集モードはそのまま続けられます。';
 $('warpArrowStatus').textContent='';render();
}
function undoRedoArrow(redo){
 if(warpCurveDrag.state)return;
 const ok=MazeSession.act(game,redo?'redoArrow':'undoArrow');
 if(ok){renderWarpNotes.selection=null;renderWarpNotes.from=null;}
 $('zeroMarkStatus').textContent=ok?(redo?'矢印の編集をやり直しました。':'矢印の編集を取り消しました。'):(redo?'やり直せる矢印の編集はありません。':'取り消せる矢印の編集はありません。');
 render();
}
$('undoWarpArrow').addEventListener('click',()=>undoRedoArrow(false));
$('redoWarpArrow').addEventListener('click',()=>undoRedoArrow(true));
function addReverseArrow(){
 const selected=renderWarpNotes.selection;
 if($('editZeroMark').getAttribute('aria-pressed')!=='true'||selected?.type!=='arrow'||game.won)return;
 const source=game.warpArrows?.find(a=>sameArrow(selected,a));if(!source)return;
 const existing=game.warpArrows.find(a=>a.from===source.to&&a.to===source.from);
 if(!existing&&!MazeSession.act(game,'arrow',source.to,source.from)){$('zeroMarkStatus').textContent='逆向きの予想を追加できません。矢印の上限や探索記録を確認してください。';return;}
 abortArrowDrag();renderWarpNotes.selection={type:'arrow',from:source.to,to:source.from};
 $('warpArrowStatusFilter').value='all';$('showKnownArrows').checked=true;
 $('zeroMarkStatus').textContent=existing?'既存の逆向きの矢印を選択しました。確認結果・曲率は保持します。':'逆向きの予想を追加しました。往復できるかは、実際のワープで確認してください。';
 render();
}
$('reverseWarpArrow').addEventListener('click',addReverseArrow);
function setSelectedArrowCurve(reset){
 const selected=renderWarpNotes.selection;
 if($('editZeroMark').getAttribute('aria-pressed')!=='true'||selected?.type!=='arrow')return;
 const ok=reset?MazeSession.act(game,'resetArrowCurve',selected.from,selected.to):MazeSession.act(game,'curveArrow',selected.from,selected.to,0);
 if(ok)$('zeroMarkStatus').textContent=reset?'選択した矢印を標準の曲がりに戻しました。':'選択した矢印を直線にしました。';
 render();
}
$('straightenWarpArrow').addEventListener('click',()=>setSelectedArrowCurve(false));
$('resetWarpArrowCurve').addEventListener('click',()=>setSelectedArrowCurve(true));
$('showKnownArrows').addEventListener('change',render);
$('focusWarpArrows').addEventListener('change',render);
$('warpArrowStatusFilter').addEventListener('change',render);
$('arrowTransparency').addEventListener('input',()=>{$('arrowOpacityValue').textContent=$('arrowTransparency').value+'%';render();});
canvas.addEventListener('click',event=>{
 if($('editZeroMark').getAttribute('aria-pressed')==='true'){editAnnotationFromClick(canvas,render.warpPoints,render.arrowHits,event);return;}
 if($('editWarpArrow').getAttribute('aria-pressed')!=='true')return;
 const rect=canvas.getBoundingClientRect(),x=(event.clientX-rect.left)*canvas.clientWidth/rect.width,y=(event.clientY-rect.top)*canvas.clientHeight/rect.height;
 const point=(render.warpPoints||[]).find(p=>Math.abs(p.x-x)<p.tile/2&&Math.abs(p.y-y)<p.tile/2);
 const known=point&&[...game.cognition.memory_nodes.values(),...game.cognition.archives.flatMap(a=>[...a.nodes.values()])].some(n=>n.world_id===point.id&&n.terrain);
 if(!known){$('warpArrowStatus').textContent='探索して記録した床を選んでください。';return;}
 if(renderWarpNotes.from===null){renderWarpNotes.from=point.id;$('warpArrowStatus').textContent='次に、予想する到着床をクリックしてください。';return;}
 const ok=MazeSession.act(game,'arrow',renderWarpNotes.from,point.id);renderWarpNotes.from=null;
 $('warpArrowStatus').textContent=ok?'矢印を予想として記録しました。続けて別の出発床を選べます。':'記入できません。同じ床・上限・出口到達状態を確認してください。';render();
});

$('editZeroMark').addEventListener('click',()=>{
 abortArrowDrag();
 const active=$('editZeroMark').getAttribute('aria-pressed')!=='true';$('editZeroMark').setAttribute('aria-pressed',String(active));
 $('editWarpArrow').setAttribute('aria-pressed','false');renderWarpNotes.from=null;renderWarpNotes.selection=null;
 $('zeroMarkStatus').textContent=active?(game.world.warpInvisible?'床をクリックで0を記入。0を選択→別の0で矢印。再クリックで選択解除。Deleteで選択を消去。':'記憶済みの床を選択→別の床で矢印。再クリックで選択解除。矢印を選択しDeleteで消去。'):'0・矢印の編集を終了しました。';render();
});
function deleteAnnotationSelection(){
 const selected=renderWarpNotes.selection;if(!selected)return;
 if(selected.type==='floor'){$('zeroMarkStatus').textContent='床そのものは消せません。消したい矢印をクリックして選択してください。';return;}
 const result=selected.type==='zero'?MazeSession.act(game,'eraseZeroAt',selected.id):MazeSession.act(game,'eraseArrow',selected.from,selected.to);
 const ok=selected.type==='zero'?result.status==='erased':result;
 $('zeroMarkStatus').textContent=ok?(selected.type==='zero'?'選択した0を消しました。矢印は残ります。':'選択した矢印を消しました。'):'消去できません。出口到達後はEで探索を再開してください。';
 if(ok)renderWarpNotes.selection=null;render();
}
function editAnnotationFromClick(target,points,hits,event){
 const rect=target.getBoundingClientRect(),x=(event.clientX-rect.left)*target.clientWidth/rect.width,y=(event.clientY-rect.top)*target.clientHeight/rect.height;
 const point=(points||[]).find(p=>Math.abs(p.x-x)<p.tile/2&&Math.abs(p.y-y)<p.tile/2),selected=renderWarpNotes.selection;
 if(point&&game.zeroMarks?.has(point.id)){
  if(selected?.type==='zero'&&selected.id===point.id){renderWarpNotes.selection=null;$('zeroMarkStatus').textContent='0の選択を解除しました。';}
  else if(selected?.type==='zero'){
   const ok=MazeSession.act(game,'arrow',selected.id,point.id);
   if(ok){renderWarpNotes.selection={type:'arrow',from:selected.id,to:point.id};$('showKnownArrows').checked=true;$('zeroMarkStatus').textContent='選択元の0から矢印を記入・選択しました。Deleteで消去できます。';}
   else $('zeroMarkStatus').textContent='矢印を記入できません。上限や出口到達状態を確認してください。';
  }else{renderWarpNotes.selection={type:'zero',id:point.id};$('zeroMarkStatus').textContent='0を選択しました。再クリックで解除、別の0で矢印、Deleteで消去。';}
  render();return;
 }

 const arrow=preferredArrowHit((hits||[]).filter(a=>game.world.warpInvisible||!point||(a.from!==point.id&&a.to!==point.id)).map(a=>({...a,distance:arrowLineDistance({x,y},a.samples)})),selected);
 if(arrow){renderWarpNotes.selection=sameArrow(selected,arrow)?null:{type:'arrow',from:arrow.from,to:arrow.to};$('zeroMarkStatus').textContent=renderWarpNotes.selection?'矢印を選択しました。Deleteで消去できます。':'矢印の選択を解除しました。';render();return;}
 if(!point){$('zeroMarkStatus').textContent='記憶済みの床・0・矢印をクリックしてください。';return;}
 if(!game.world.warpInvisible){
  const known=[game.cognition.memory_nodes,...game.cognition.archives.map(a=>a.nodes)].some(nodes=>[...nodes.values()].some(n=>n.world_id===point.id&&n.terrain));
  if(!known){$('zeroMarkStatus').textContent='記憶済みの床を選んでください。';return;}
  if(selected?.type==='floor'&&selected.id===point.id){renderWarpNotes.selection=null;$('zeroMarkStatus').textContent='床の選択を解除しました。';}
  else if(selected?.type==='floor'){
   if(MazeSession.act(game,'arrow',selected.id,point.id)){renderWarpNotes.selection={type:'arrow',from:selected.id,to:point.id};$('showKnownArrows').checked=true;$('zeroMarkStatus').textContent='矢印を記入・選択しました。Deleteで消去できます。';}
   else $('zeroMarkStatus').textContent='矢印を記入できません。上限や出口到達状態を確認してください。';
  }else{renderWarpNotes.selection={type:'floor',id:point.id};$('zeroMarkStatus').textContent='床を選択しました。別の床で矢印、同じ床で選択解除。';}
  render();return;
 }

 const result=MazeSession.act(game,'zeroAt',point.id);
 if(result.status==='placed'){renderWarpNotes.selection={type:'zero',id:point.id};$('zeroMarkStatus').textContent='0を記入・選択しました。別の0で矢印、Deleteで消去できます。';}
 else $('zeroMarkStatus').textContent='この床には記入できません。未探索・入口・出口・目印・鍵・扉、または出口到達状態を確認してください。';render();
}
$('archiveMap').addEventListener('click',event=>{if($('editZeroMark').getAttribute('aria-pressed')==='true')editAnnotationFromClick($('archiveMap'),renderArchive.zeroPoints,renderArchive.arrowHits,event);});
// Preview in screen space; commit a single replayable edit only on pointer release.
function warpCurveDrag(target,getHits){
 const position=e=>{const r=target.getBoundingClientRect();return {x:(e.clientX-r.left)*target.clientWidth/r.width,y:(e.clientY-r.top)*target.clientHeight/r.height};};
 target.addEventListener('pointerdown',e=>{
  warpCurveDrag.suppress=null;
  if(e.button!==0||$('editZeroMark').getAttribute('aria-pressed')!=='true')return;
  const p=position(e),hit=preferredArrowHit((getHits()||[]).filter(a=>[a.samples[0],a.samples.at(-1)].every(q=>Math.hypot(q.x-p.x,q.y-p.y)>8)).map(a=>({...a,distance:arrowLineDistance(p,a.samples)})),renderWarpNotes.selection);
  if(!hit)return;
  warpCurveDrag.state={...hit,game,target,pointerId:e.pointerId,start:p,moved:false,initial:hit.curve};target.setPointerCapture(e.pointerId);
 });
 target.addEventListener('pointermove',e=>{
  const d=warpCurveDrag.state;if(!d||d.target!==target||d.pointerId!==e.pointerId)return;
  const p=position(e);if(Math.hypot(p.x-d.start.x,p.y-d.start.y)<5&&!d.moved)return;
  if(d.game!==game||$('editZeroMark').getAttribute('aria-pressed')!=='true'){abortArrowDrag();return;}
  d.moved=true;d.curve=Math.round(Math.max(-3,Math.min(3,d.initial+2*((p.x-d.start.x)*(-d.dy)+(p.y-d.start.y)*d.dx)/(d.len*d.len)))*1000)/1000;
  renderWarpNotes.selection={type:'arrow',from:d.from,to:d.to};e.preventDefault();render();
 });
 const finish=(e,cancel)=>{
  const d=warpCurveDrag.state;if(!d||d.target!==target||d.pointerId!==e.pointerId)return;
  warpCurveDrag.state=null;
  if(target.hasPointerCapture(e.pointerId))target.releasePointerCapture(e.pointerId);
  if(d.moved){warpCurveDrag.suppress=target;if(!cancel&&d.game===game&&$('editZeroMark').getAttribute('aria-pressed')==='true'){MazeSession.act(game,'curveArrow',d.from,d.to,d.curve);$('zeroMarkStatus').textContent='矢印の曲がり具合を変更しました。途中セーブにも記録します。';}render();}
 };
 target.addEventListener('pointerup',e=>finish(e,false));
 target.addEventListener('pointercancel',e=>finish(e,true));
 target.addEventListener('lostpointercapture',e=>finish(e,true));
 target.addEventListener('click',e=>{if(warpCurveDrag.suppress===target){warpCurveDrag.suppress=null;e.preventDefault();e.stopImmediatePropagation();}},true);
}
warpCurveDrag(canvas,()=>render.arrowHits);
warpCurveDrag($('archiveMap'),()=>renderArchive.arrowHits);


let sessionReadVersion=0,sessionActiveRead=null;
$('sessionText').addEventListener('input',()=>{sessionReadVersion++;});
$('sessionExport').addEventListener('click',()=>{
 sessionReadVersion++;
 try{$('sessionText').value=MazeSession.encode(game,$('journeyCourse').value);$('sessionJson').open=true;MazeSession.markExport(game,$('journeyCourse').value);renderSessionInfo();$('sessionStatus').textContent='途中セーブを表示しました。全文をコピーして保管してください。';}
 catch(error){$('sessionStatus').textContent=error.message;}
});
$('sessionImport').addEventListener('click',async()=>{
 const version=++sessionReadVersion,original=game,revision=MazeSession.info(game).revision,course=$('journeyCourse').value,size=game.journey?.size,layout=game.journey?.layout,random=JSON.stringify(game.journey?.random);
 const changed=()=>JSON.stringify(game.journey?.random)!==random||game!==original||game.journey?.layout!==layout||game.journey?.size!==size||MazeSession.info(game).revision!==revision||$('journeyCourse').value!==course;
 try{
  const restored=await readSessionAsync($('sessionText').value,version,changed);
  if(version!==sessionReadVersion)return;
  if(changed())throw Error('読み込み中に探索が変わったため、再開を中止しました。');
  applyJourneySettings(restored.game);$('journeyCourse').value=restored.course;
  newWorld(false,restored.game);$('seed').value=restored.game.generationOptions.seed;
  $('status').textContent=game.won?'出口到達時の探索を復元しました。':'保存した途中の探索を復元しました。';
  $('sessionStatus').textContent='保存した探索状態と地図帳を復元しました。';canvas.focus();
 }catch(error){if(version===sessionReadVersion)$('sessionStatus').textContent='再開できませんでした。現在の探索は保持しています。'+error.message;}
});

$('sessionDownload').addEventListener('click',()=>{
 sessionReadVersion++;
 try {
  const text=MazeSession.encode(game,$('journeyCourse').value);
  $('sessionText').value=text;
  const blob=new Blob([text],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download=`maze-session-${game.journey.completed+1}-${game.turns}.json`;
  document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  MazeSession.markExport(game,$('journeyCourse').value);renderSessionInfo();$('sessionStatus').textContent='ファイル保存を開始しました。保存されない場合は、欄の全文をコピーして保管してください。';
 }catch(error){$('sessionStatus').textContent=error.message;}
});
$('sessionFile').addEventListener('change',async()=>{
 const file=$('sessionFile').files[0],version=++sessionReadVersion;
 $('sessionFile').value='';if(!file)return;
 try {
  if(file.size>6000000)throw Error('途中セーブは6MB以内にしてください。');
  const text=(await file.text()).replace(/^\uFEFF/,'');if(version!==sessionReadVersion)return;
  const restored=await readSessionAsync(text,version);if(version!==sessionReadVersion)return;
  $('sessionText').value=text;
  $('sessionStatus').textContent=`第${restored.game.journey.completed+1}迷路・${restored.game.turns}行動目の途中セーブを読み込みました。現在の探索は変えていません。「この途中セーブから再開」で適用できます。`;
 }catch(error){if(version===sessionReadVersion)$('sessionStatus').textContent='ファイルを読み込めませんでした。現在の探索と欄内の記録は保持しています。'+error.message;}
});

function renderSessionInfo(){
 const state=MazeSession.info(game,$('journeyCourse').value);
 const available=state.supported&&state.tracked&&!state.overflow;
 $('sessionExport').disabled=!available;$('sessionDownload').disabled=!available;
 let text=!state.supported?'実験用の地形は途中セーブの対象外です。':!state.tracked?'途中セーブに必要な操作履歴がありません。':state.overflow?'保存上限を超えたため、現在の探索は途中セーブできません。上限前に保管した記録は利用できます。':
  `記録した操作：${state.count.toLocaleString()} / ${state.limit.toLocaleString()}（残り ${state.remaining.toLocaleString()}）。`+
  (state.remaining<=2000?' 保存上限が近づいています。早めに記録を保管してください。':'')+
  (state.current?' 最後に書き出した、または読み込んだ記録と同じ段階です。':state.exported?' 前回の記録から操作または旅の設定が変わっています。':' この探索はまだ書き出していません。');
 if($('sessionSupport').textContent!==text)$('sessionSupport').textContent=text;
}

$('sessionCancel').addEventListener('click',()=>{if(sessionActiveRead===null)return;sessionReadVersion++;sessionActiveRead=null;$('sessionCancel').disabled=true;$('sessionStatus').textContent='読み込みを中止しました。現在の探索と欄内の記録は保持しています。';});
async function readSessionAsync(text,version,changed=()=>false){
 sessionActiveRead=version;$('sessionCancel').disabled=false;
 $('sessionStatus').textContent='途中セーブを検証しています…';
 try{return await MazeSession.decodeAsync(text,{
  cancelled:()=>version!==sessionReadVersion||changed(),
  onProgress:({done,total})=>{if(version===sessionReadVersion)$('sessionStatus').textContent=`操作履歴を確認中：${done.toLocaleString()} / ${total.toLocaleString()}。`;}
 });}finally{if(sessionActiveRead===version){sessionActiveRead=null;$('sessionCancel').disabled=true;}}
}

$('sessionReturn').addEventListener('click',()=>{
 sessionReadVersion++;
 if(sessionActiveRead!==null){sessionActiveRead=null;$('sessionCancel').disabled=true;$('sessionStatus').textContent='読み込みを中止しました。現在の探索と欄内の記録は保持しています。';}
 $('sessionPanel').open=false;
 canvas.focus({preventScroll:true});canvas.scrollIntoView({block:'center'});
});

$('exitSave').addEventListener('click',()=>{
 if(!MazeSession.supported(game))return;
 sessionReadVersion++;sessionActiveRead=null;$('sessionCancel').disabled=true;
 $('sessionPanel').open=true;renderSessionInfo();
 $('sessionStatus').textContent='現在の探索を保管するには「現在の途中セーブを .json で保存」、または「途中セーブを表示」で全文をコピーしてください。';
 const target=$('sessionDownload').disabled?$('sessionReturn'):$('sessionDownload');
 target.focus({preventScroll:true});$('sessionPanel').scrollIntoView({block:'center'});
});

for(const button of document.querySelectorAll('[data-course]'))button.addEventListener('click',()=>{
 $('journeyCourse').value=button.dataset.course;
 renderJourneyOverview();renderSessionInfo();
});

$('journeySize').addEventListener('change',()=>{
 if(!game.journey)return;
 game.journey.size=$('journeySize').value;
 renderJourneyOverview();renderSessionInfo();
});

$('journeyLayout').addEventListener('change',()=>{
 if(!game.journey)return;
 game.journey.layout=$('journeyLayout').value;
 renderJourneyOverview();renderSessionInfo();
});

$('journeyReturn').addEventListener('click',()=>{
 $('journeySettings').open=false;
 canvas.focus({preventScroll:true});canvas.scrollIntoView({block:'center'});
});

function renderJourneyHistory(){
 const history=game.journey?.history||[];
 const names={dfs:'DFS',prim:'Prim',division:'領域分割',rooms:'部屋と通路',wilson:'Wilson',kruskal:'Kruskal',hunt:'Hunt-and-Kill',growing:'Growing Tree',eller:'Eller'};
 const rules={plain:'通常探索',warp:'ワープ',keys:'鍵と扉',birds:'鳥人間','bird-keys':'鳥人間＋鍵と扉'};
 const lines=history.slice().reverse().map(h=>`第${h.number}迷路 · ${names[h.algorithm]} · ${h.topology==='torus'?'トーラス':'平面'} ${h.width}×${h.height} · ${rules[h.rule]}
初回踏破 ${h.clearSteps}歩 / 次の迷路へ進むまで ${h.steps}歩
シード：${h.seed}`);
 const text=lines.length?lines.join('\n\n'):'次の迷路へ進むと、ここに記録されます。';
 if($('journeyHistoryText').textContent!==text)$('journeyHistoryText').textContent=text;
}

function randomRangeText(){const c=game.journey?.random||MazeRandomJourney.defaults;return `横幅 ${c.minWidth}〜${c.maxWidth} / 高さ ${c.minHeight}〜${c.maxHeight}。`;}
function renderRandomSettings(){
 const active=$('journeyCourse').value==='random';$('journeyRandom').checked=active;$('journeyRandomBounds').hidden=!active;
 if(renderRandomSettings.game===game)return;
 renderRandomSettings.game=game;
 const c=game.journey?.random||MazeRandomJourney.defaults;
 for(const k of ['minWidth','maxWidth','minHeight','maxHeight'])$('random'+k[0].toUpperCase()+k.slice(1)).value=c[k];
 const names={algorithms:'生成方式',topologies:'空間',rules:'ルール',warpVisibility:'ワープ床の見え方',visible:'見える床',invisible:'不可視の床',warpStyles:'ワープの接続方式（ワープ選択時）',warpRotations:'ワープの向き（平面のみ）',none:'変化なし',right:'時計回り90°',left:'反時計回り90°',half:'180°',mirror:'左右反転',mixed:'組ごとに混在',pair:'相互',oneway:'一方通行',cycle3:'3地点の輪',cycle4:'4地点の輪',dfs:'DFS',prim:'Prim',division:'領域分割',rooms:'部屋と通路',wilson:'Wilson',kruskal:'Kruskal',hunt:'Hunt-and-Kill',growing:'Growing Tree',eller:'Eller',plane:'平面',torus:'トーラス',plain:'通常探索',warp:'ワープ',keys:'鍵と扉',birds:'鳥人間','bird-keys':'鍵と扉＋鳥人間'};
 const box=$('randomCandidates');box.replaceChildren();
 for(const [group,values] of Object.entries(MazeRandomJourney.catalog)){
  const field=document.createElement('fieldset'),legend=document.createElement('legend');legend.textContent=names[group];field.append(legend);
  const actions=document.createElement('div');actions.className='random-group-actions';
  for(const enabled of [true,false]){
   const button=document.createElement('button');button.type='button';button.textContent=enabled?'すべてON':'すべてOFF';button.setAttribute('aria-label',names[group]+'を'+button.textContent);
   button.addEventListener('click',()=>{for(const input of field.querySelectorAll('input[type="checkbox"]'))input.checked=enabled;randomDraftChanged();});actions.append(button);
  }
  field.append(actions);
  for(const v of values){const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.dataset.randomGroup=group;input.value=v;input.checked=(c[group]||MazeRandomJourney.defaults[group]).includes(v);label.append(input,document.createTextNode(' '+names[v]));field.append(label);}
  box.append(field);
 }
 $('randomStatus').textContent='適用中：'+randomRangeText();
 renderRandomPreview();
}
function readRandomDraft(){
 const config={};for(const k of ['minWidth','maxWidth','minHeight','maxHeight'])config[k]=Number($('random'+k[0].toUpperCase()+k.slice(1)).value);
 for(const group of Object.keys(MazeRandomJourney.catalog))config[group]=Array.from(document.querySelectorAll('[data-random-group="'+group+'"]:checked'),x=>x.value);
 return config;
}
function randomSizeSummary(values){return values.length===1?String(values[0]):`${values[0]}〜${values[values.length-1]}（2刻み・${values.length}候補）`;}
function renderRandomPreview(){
 try{
  const draft=readRandomDraft(),report=MazeRandomJourney.inspect(draft);
  const lines=[`編集中の候補：${report.count}組（生成方式 × 空間 × ルール）`];
  for(const row of report.spaces){
   const name=row.topology==='torus'?'トーラス':'平面';
   lines.push(`${name}：${row.count}組`+(row.count?` / 横幅 ${randomSizeSummary(row.widths)} / 高さ ${randomSizeSummary(row.heights)}`:' / 抽選対象なし'));
   for(const reason of row.reasons)lines.push(reason);
  }
  if(draft.rules.includes('warp'))lines.push('ワープの接続方式：'+draft.warpStyles.map(v=>({pair:'相互',oneway:'一方通行',cycle3:'3地点の輪',cycle4:'4地点の輪'}[v])).join('・')+'。ワープが選ばれた後に、この中から等確率で抽選します。');
  if(draft.rules.includes('warp')){
   lines.push('ワープ床：'+draft.warpVisibility.map(v=>v==='visible'?'見える床':'不可視の床').join('・')+'。両方を選ぶと迷路ごとに等確率で抽選します。');
   if(draft.topologies.includes('plane'))lines.push('平面ワープの向き：'+draft.warpRotations.map(v=>({none:'変化なし',right:'時計回り90°',left:'反時計回り90°',half:'180°',mirror:'左右反転',mixed:'組ごとに混在'}[v])).join('・')+'。平面ワープが選ばれた後に等確率で抽選します。');
   if(draft.topologies.includes('torus'))lines.push('トーラスのワープは、上の向きの候補によらず「変化なし」です。');
  }
  lines.push(report.count?'各組合せを同じ確率で抽選します。空間やルール単独の登場率は、対応する組合せ数に応じて変わります。':'候補またはサイズ範囲を変更してください。この設定は適用できません。');
  $('randomPreview').textContent=lines.join('\n');
 }catch(error){$('randomPreview').textContent=error.message;}
}
function applyRandomSettings(){
 const checked=MazeRandomJourney.validate(readRandomDraft());
 game.journey=game.journey||{completed:0,steps:0};game.journey.random=checked;
 $('randomStatus').textContent='適用しました。次の迷路から '+randomRangeText();renderJourneyOverview();renderSessionInfo();
}
$('randomApply').addEventListener('click',()=>{try{applyRandomSettings();}catch(error){$('randomStatus').textContent=error.message+' 適用中の設定を保持しています。';}});
$('journeyRandom').addEventListener('change',()=>{$('journeyCourse').value=$('journeyRandom').checked?'random':'same';renderJourneyOverview();renderSessionInfo();});
function randomDraftIsPending(){
 const draft=readRandomDraft(),saved=game.journey?.random||MazeRandomJourney.defaults;
 return ['minWidth','maxWidth','minHeight','maxHeight'].some(k=>draft[k]!==saved[k])||Object.keys(MazeRandomJourney.catalog).some(k=>draft[k].length!==(saved[k]||MazeRandomJourney.defaults[k]).length||draft[k].some(v=>!(saved[k]||MazeRandomJourney.defaults[k]).includes(v)));
}
function renderRandomPending(){
 const pending=randomDraftIsPending(),active=$('journeyCourse').value==='random';
 $('randomPending').hidden=!pending;
 $('randomPending').textContent=pending?'ランダム設定に未適用の変更があります。'+(active?'次の迷路は適用済みの設定で生成します。':'現在は別のコースが選ばれています。')+'変更を使うには旅の設定で「候補と範囲を適用」を押してください。途中セーブには適用済みの設定だけを保存します。':'';
}
function randomDraftChanged(){renderRandomPreview();renderRandomPending();$('randomStatus').textContent=randomDraftIsPending()?'変更は未適用です。「候補と範囲を適用」を押してください。':'適用中の設定と同じです。';}
$('journeyRandomBounds').addEventListener('input',randomDraftChanged);
$('randomRevert').addEventListener('click',()=>{renderRandomSettings.game=null;renderRandomSettings();renderRandomPending();$('randomStatus').textContent='編集を取り消し、適用中の候補とサイズ範囲に戻しました。';});

for(const button of document.querySelectorAll('[data-random-preset]'))button.addEventListener('click',()=>{
 const presets={paths:{topologies:['plane'],rules:['plain']},topology:{topologies:['plane','torus'],rules:['plain']},warps:{topologies:['plane','torus'],rules:['warp']},all:MazeRandomJourney.catalog};
 const preset=presets[button.dataset.randomPreset];if(!preset)return;
 for(const group of Object.keys(MazeRandomJourney.catalog)){
  const selected=preset[group]||MazeRandomJourney.defaults[group];
  for(const input of document.querySelectorAll('[data-random-group="'+group+'"]'))input.checked=selected.includes(input.value);
 }
 randomDraftChanged();
 $('randomStatus').textContent='「'+button.textContent+'」の候補を選びました。サイズ範囲は保持しています。'+(randomDraftIsPending()?'変更は未適用です。「候補と範囲を適用」を押してください。':'適用中の設定と同じです。');
});

let randomSettingsReadVersion=0;
$('randomSettingsText').addEventListener('input',()=>{randomSettingsReadVersion++;});
$('randomSettingsExport').addEventListener('click',()=>{
 randomSettingsReadVersion++;
 try{
  $('randomSettingsText').value=MazeRandomJourney.exportSettings(game.journey?.random||MazeRandomJourney.defaults);
  $('randomSettingsRecordStatus').textContent='適用済みの候補とサイズ範囲を書き出しました。未適用の編集は含みません。全文をコピーして保管してください。';
 }catch(error){$('randomSettingsRecordStatus').textContent=error.message;}
});
$('randomSettingsImport').addEventListener('click',()=>{
 randomSettingsReadVersion++;
 try{
  const config=MazeRandomJourney.importSettings($('randomSettingsText').value);
  for(const k of ['minWidth','maxWidth','minHeight','maxHeight'])$('random'+k[0].toUpperCase()+k.slice(1)).value=config[k];
  for(const group of Object.keys(MazeRandomJourney.catalog))for(const input of document.querySelectorAll('[data-random-group="'+group+'"]'))input.checked=(config[group]||MazeRandomJourney.defaults[group]).includes(input.value);
  randomDraftChanged();
  $('randomSettingsRecordStatus').textContent='編集欄へ読み込みました。内容を確認して「候補と範囲を適用」を押してください。編集欄が閉じている場合はランダムスイッチをONにしてください。';
 }catch(error){$('randomSettingsRecordStatus').textContent='読み込めませんでした。編集欄と適用済み設定を保持しています。'+error.message;}
});

$('randomSettingsDownload').addEventListener('click',()=>{
 randomSettingsReadVersion++;
 try{
  const text=MazeRandomJourney.exportSettings(game.journey?.random||MazeRandomJourney.defaults);
  $('randomSettingsText').value=text;
  const blob=new Blob([text],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download='maze-random-settings.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  $('randomSettingsRecordStatus').textContent='適用済み設定のファイル保存を開始しました。未適用の編集は含みません。保存されない場合はテキスト欄の全文をコピーしてください。';
 }catch(error){$('randomSettingsRecordStatus').textContent=error.message;}
});
$('randomSettingsFile').addEventListener('change',async()=>{
 const file=$('randomSettingsFile').files[0],version=++randomSettingsReadVersion;
 $('randomSettingsFile').value='';if(!file)return;
 try{
  if(file.size>30000)throw Error('ランダム設定のファイルは30KB以内にしてください。');
  const text=await file.text();if(version!==randomSettingsReadVersion)return;
  const config=MazeRandomJourney.importSettings(text);
  $('randomSettingsText').value=MazeRandomJourney.exportSettings(config);
  $('randomSettingsRecordStatus').textContent='ファイルを検証してテキスト欄に表示しました。「テキストを編集欄に読み込む」で確認できます。現在の候補と探索は変更していません。';
 }catch(error){if(version===randomSettingsReadVersion)$('randomSettingsRecordStatus').textContent='ファイルを読み込めませんでした。欄内の記録と現在の設定を保持しています。'+error.message;}
});


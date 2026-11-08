/* Exploration host: select one runtime while retaining independent in-memory sessions. */
'use strict';
(()=>{
 const $=id=>document.getElementById(id),frame=$('skewPilotFrame'),enclosureFrame=$('enclosureFrame'),enclosurePane=$('enclosureExplorePane'),mainPane=$('mainExplorePane'),skewPane=$('skewExplorePane'),layout=document.querySelector('.layout'),aside=layout.querySelector('aside');
 const tripleFrame=$('tripleFrame'),triplePane=$('tripleExplorePane');
 const crossingFrame=$('crossingFrame'),crossingPane=$('crossingExplorePane');
 const kleinFrame=$('kleinFrame'),kleinPane=$('kleinExplorePane'),biaxialFrame=$('biaxialFrame'),biaxialPane=$('biaxialExplorePane');
 const branchFrame=$('branchFrame'),branchPane=$('branchExplorePane');
 const quarterFrame=$('quarterFrame'),quarterPane=$('quarterExplorePane'),isQuarter=m=>['doubleTwist','quarter','quarterTwist'].includes(m);
 let active='main',busy=false,course={enabled:false,completed:0,steps:0,randomGeneration:false,randomTripleRoute:true,randomTripleHole:true,randomTripleUnderpasses:true,order:'sequence',pool:['plane','torus','skew','enclosure']},courseToken=null;
 function focusMap(){if(isQuarter(active)){if(!$('explorationSettingsDialog')?.open)quarterFrame.contentDocument?.getElementById('map')?.focus();return;}if(active==='branch'){if(!$('explorationSettingsDialog')?.open)branchFrame.contentDocument?.getElementById('map')?.focus();return;}if(active==='triple'&&!$('explorationSettingsDialog')?.open){tripleFrame.contentDocument?.getElementById('spaceMap')?.focus();return;}if(active==='crossing'&&!$('explorationSettingsDialog')?.open){crossingFrame.contentDocument?.getElementById('spaceMap')?.focus();return;}if($('explorationSettingsDialog')?.open)return;if(active==='biaxial'){biaxialFrame.contentDocument?.getElementById('view')?.focus();return;}if(active!=='main')(active==='klein'?kleinFrame:active==='enclosure'?enclosureFrame:frame).contentDocument?.getElementById('map')?.focus();else $('map').focus();}
 function select(mode,internal=false){
  if(busy)return;
  quarterFrame?.contentWindow?.QuarterExplorationAdapter?.pause();
  if(active==='branch')branchFrame.contentWindow?.BranchExplorationAdapter?.pause();
  if(active==='triple')tripleFrame.contentWindow?.TripleExplorationAdapter?.pause();
  if(active==='crossing')crossingFrame.contentWindow?.CrossingExplorationAdapter?.pause();
  if(active==='biaxial')biaxialFrame.contentWindow?.BiaxialExperiment?.pause();
  if(!internal)course.enabled=false;$('coursePlayError').textContent='';
  active=mode;quarterPane.hidden=!isQuarter(mode);if(branchPane)branchPane.hidden=mode!=='branch';if(triplePane)triplePane.hidden=mode!=='triple';if(crossingPane)crossingPane.hidden=mode!=='crossing';if(biaxialPane)biaxialPane.hidden=mode!=='biaxial';const skew=mode==='skew',enclosure=mode==='enclosure',embedded=mode!=='main';mainPane.hidden=embedded;skewPane.hidden=!skew;enclosurePane.hidden=!enclosure;if(kleinPane)kleinPane.hidden=mode!=='klein';aside.hidden=embedded;layout.classList.toggle('skew-exploration',embedded);
  for(const name of ['main','skew','enclosure'])$(name+'ExploreSelect').setAttribute('aria-pressed',String(mode===name));
  $('sharedCoursePanel').hidden=false;$('bundlePanel').hidden=false;
  $('explorationModeStatus').textContent=isQuarter(mode)?'回転・反転接続（'+mode+'）を探索中':mode==='branch'?'柱を巡る分枝迷路を探索中':mode==='triple'?'中央穴の3トーラスを探索中':mode==='crossing'?'立体交差を探索中':mode==='biaxial'?'クラインの壺（自由接続）を探索中':mode==='klein'?'クラインの壺を探索中':enclosure?'囲いのある2トーラス（作例3）を探索中':skew?'中央穴の2トーラスを探索中':'通常の迷路を探索中';
  const target=isQuarter(mode)?quarterFrame:mode==='branch'?branchFrame:mode==='triple'?tripleFrame:mode==='crossing'?crossingFrame:mode==='biaxial'?biaxialFrame:mode==='klein'?kleinFrame:enclosure?enclosureFrame:frame;
  if(embedded&&!target.getAttribute('src'))target.setAttribute('src',isQuarter(mode)?'quarter-turn-lab.html?embedded=1&family='+mode+'&v=565':mode==='branch'?'branch-maze.html?embedded=1&v=565':mode==='triple'?'connections-lab.html?embedded=1&space=tripleMaze&v=566':mode==='crossing'?'connections-lab.html?embedded=1&space=crossingMaze&v=566':mode==='biaxial'?'klein-biaxial.html?embedded=1&v=565':mode==='klein'?'klein-player.html?embedded=1&v=565':enclosure?'return-enclosure.html?embedded=1&v=565':'lattice-holes.html?embedded=1&v=565');
  else {if(isQuarter(mode))quarterFrame.contentWindow?.QuarterExplorationAdapter?.family(mode);focusMap();}
  courseToken=currentAdapter()?.progress().token;courseStatus();
  window.dispatchEvent?.(new CustomEvent('exploration-selected',{detail:{mode}}));
 }
 quarterFrame?.addEventListener('load',()=>{quarterFrame.contentWindow?.addEventListener('keydown',courseNewKey,true);quarterFrame.contentWindow?.addEventListener('exploration-change',progressChanged);if(isQuarter(active))focusMap();});
 branchFrame?.addEventListener('load',()=>{branchFrame.contentWindow?.addEventListener('keydown',courseNewKey,true);branchFrame.contentWindow?.addEventListener('exploration-change',progressChanged);if(active==='branch')focusMap();courseStatus();});
 tripleFrame?.addEventListener('load',()=>{tripleFrame.contentWindow?.addEventListener('keydown',courseNewKey,true);tripleFrame.contentWindow?.addEventListener('exploration-change',progressChanged);if(active==='triple')focusMap();courseStatus();});
 crossingFrame?.addEventListener('load',()=>{crossingFrame.contentWindow?.addEventListener('keydown',courseNewKey,true);crossingFrame.contentWindow?.addEventListener('exploration-change',progressChanged);if(active==='crossing')focusMap();courseStatus();});
 biaxialFrame?.addEventListener('load',()=>{biaxialFrame.contentWindow?.addEventListener('keydown',courseNewKey,true);biaxialFrame.contentWindow?.addEventListener('exploration-change',progressChanged);if(active==='biaxial')focusMap();});
 kleinFrame?.addEventListener('load',()=>{kleinFrame.contentWindow?.addEventListener('keydown',courseNewKey,true);kleinFrame.contentWindow?.addEventListener('exploration-change',progressChanged);if(active==='klein')focusMap();courseStatus();});
 $('enclosureExploreSelect').addEventListener('click',()=>select('enclosure'));
 enclosureFrame.addEventListener('load',()=>{enclosureFrame.contentWindow?.addEventListener('keydown',courseNewKey,true);enclosureFrame.contentWindow?.addEventListener('exploration-change',progressChanged);if(active==='enclosure')focusMap();courseStatus();});
 $('skewPilotOpen').addEventListener('click',()=>select('skew'));
 $('skewExploreSelect').addEventListener('click',()=>select('skew'));
 $('mainExploreSelect').addEventListener('click',()=>select('main'));
 // The inactive main runtime must not react to keys on the host's controls.
 document.addEventListener('keydown',event=>{if(courseNewKey(event))return;if((active!=='main'||busy)&&!$('explorationSettingsDialog')?.open)event.stopPropagation();},true);
 frame.addEventListener('load',()=>{frame.contentWindow?.addEventListener('keydown',courseNewKey,true);frame.contentWindow?.addEventListener('exploration-change',progressChanged);focusMap();courseStatus();});

 function lock(value){busy=value;quarterPane.inert=value;if(quarterFrame.contentDocument?.body)quarterFrame.contentDocument.body.inert=value;if(value)quarterFrame.contentWindow?.QuarterExplorationAdapter?.pause();if(branchPane)branchPane.inert=value;if(branchFrame?.contentDocument?.body)branchFrame.contentDocument.body.inert=value;if(value)branchFrame?.contentWindow?.BranchExplorationAdapter?.pause();if(triplePane)triplePane.inert=value;if(tripleFrame?.contentDocument?.body)tripleFrame.contentDocument.body.inert=value;if(value)tripleFrame?.contentWindow?.TripleExplorationAdapter?.pause();if(crossingPane)crossingPane.inert=value;if(crossingFrame?.contentDocument?.body)crossingFrame.contentDocument.body.inert=value;if(value)crossingFrame?.contentWindow?.CrossingExplorationAdapter?.pause();if(biaxialPane)biaxialPane.inert=value;if(biaxialFrame?.contentDocument?.body)biaxialFrame.contentDocument.body.inert=value;if(value)biaxialFrame?.contentWindow?.BiaxialExperiment?.pause();if(kleinPane)kleinPane.inert=value;if(kleinFrame?.contentDocument?.body)kleinFrame.contentDocument.body.inert=value;mainPane.inert=value;aside.inert=value;$('embeddedGeneration').inert=value;$('bundlePanel').inert=value;$('sharedCoursePanel').inert=value;$('mainExploreSelect').disabled=value;$('skewExploreSelect').disabled=value;$('enclosureExploreSelect').disabled=value;enclosurePane.inert=value;$('explorationSpace').disabled=value;const enclosureBody=enclosureFrame.contentDocument?.body;if(enclosureBody)enclosureBody.inert=value;const body=frame.contentDocument?.body;if(body)body.inert=value;syncCoursePlay();}
 async function adapters(includeEnclosure=false,includeKlein=false,includeBiaxial=false,includeCrossing=false,includeTriple=false,includeBranch=false,includeQuarter=false){
  if(includeQuarter&&!quarterFrame.contentWindow?.QuarterExplorationAdapter)await new Promise((resolve,reject)=>{const finish=()=>{clearTimeout(timer);quarterFrame.removeEventListener('load',loaded);};const loaded=()=>{finish();quarterFrame.contentWindow?.QuarterExplorationAdapter?resolve():reject(Error('回転接続を読み込めませんでした。'));};const timer=setTimeout(()=>{finish();reject(Error('回転接続の読込がタイムアウトしました。'));},10000);quarterFrame.addEventListener('load',loaded);if(!quarterFrame.getAttribute('src'))quarterFrame.src='quarter-turn-lab.html?embedded=1&v=565';});
  if(includeBranch&&!branchFrame.contentWindow?.BranchExplorationAdapter)await new Promise((resolve,reject)=>{const finish=()=>{clearTimeout(timer);branchFrame.removeEventListener('load',loaded);};const loaded=()=>{finish();branchFrame.contentWindow?.BranchExplorationAdapter?resolve():reject(Error('分枝迷路を読み込めませんでした。'));};const timer=setTimeout(()=>{finish();reject(Error('分枝迷路の読み込みがタイムアウトしました。'));},10000);branchFrame.addEventListener('load',loaded);if(!branchFrame.getAttribute('src'))branchFrame.setAttribute('src','branch-maze.html?embedded=1&v=565');});
  if(includeTriple&&!tripleFrame.contentWindow?.TripleExplorationAdapter?.snapshot)await new Promise((resolve,reject)=>{
   const finish=()=>{clearTimeout(timer);tripleFrame.removeEventListener('load',loaded);};
   const loaded=()=>{finish();if(tripleFrame.contentWindow?.TripleExplorationAdapter?.snapshot)resolve();else reject(Error('3トーラスを読み込めませんでした。'));};
   const timer=setTimeout(()=>{finish();reject(Error('3トーラスの読み込みがタイムアウトしました。'));},10000);
   tripleFrame.addEventListener('load',loaded);if(!tripleFrame.getAttribute('src'))tripleFrame.setAttribute('src','connections-lab.html?embedded=1&space=tripleMaze&v=566');
  });
  if(includeCrossing&&!crossingFrame.contentWindow?.CrossingExplorationAdapter?.snapshot)await new Promise((resolve,reject)=>{
   const finish=()=>{clearTimeout(timer);crossingFrame.removeEventListener('load',loaded);};
   const loaded=()=>{finish();if(crossingFrame.contentWindow?.CrossingExplorationAdapter?.snapshot)resolve();else reject(Error('立体交差を読み込めませんでした。'));};
   const timer=setTimeout(()=>{finish();reject(Error('立体交差の読み込みがタイムアウトしました。'));},10000);
   crossingFrame.addEventListener('load',loaded);if(!crossingFrame.getAttribute('src'))crossingFrame.setAttribute('src','connections-lab.html?embedded=1&space=crossingMaze&v=566');
  });
  if(includeBiaxial&&!biaxialFrame.contentWindow?.BiaxialExplorationAdapter?.snapshot)await new Promise((resolve,reject)=>{
   const finish=()=>{clearTimeout(timer);biaxialFrame.removeEventListener('load',loaded);};
   const loaded=()=>{finish();if(biaxialFrame.contentWindow?.BiaxialExplorationAdapter?.snapshot)resolve();else reject(Error('クラインの壺（自由接続）を読み込めませんでした。'));};
   const timer=setTimeout(()=>{finish();reject(Error('クラインの壺（自由接続）の読み込みがタイムアウトしました。'));},10000);
   biaxialFrame.addEventListener('load',loaded);if(!biaxialFrame.getAttribute('src'))biaxialFrame.setAttribute('src','klein-biaxial.html?embedded=1&v=565');
  });
  if(includeKlein&&!kleinFrame.contentWindow?.KleinExplorationAdapter)await new Promise((resolve,reject)=>{
   const finish=()=>{clearTimeout(timer);kleinFrame.removeEventListener('load',loaded);};
   const loaded=()=>{finish();if(kleinFrame.contentWindow?.KleinExplorationAdapter)resolve();else reject(Error('クラインを読み込めませんでした。'));};
   const timer=setTimeout(()=>{finish();reject(Error('クラインの読み込みがタイムアウトしました。'));},10000);
   kleinFrame.addEventListener('load',loaded);if(!kleinFrame.getAttribute('src'))kleinFrame.setAttribute('src','klein-player.html?embedded=1&v=565');
  });
  if(!frame.contentWindow?.SkewExplorationAdapter)await new Promise((resolve,reject)=>{
   const finish=()=>{clearTimeout(timer);frame.removeEventListener('load',loaded);};
   const loaded=()=>{if(frame.contentWindow?.SkewExplorationAdapter){finish();resolve();}else{finish();reject(Error('中央穴の探索を読み込めませんでした。'));}};
   const timer=setTimeout(()=>{finish();reject(Error('中央穴の読み込みがタイムアウトしました。'));},10000);
   frame.addEventListener('load',loaded);if(!frame.getAttribute('src'))frame.setAttribute('src','lattice-holes.html?embedded=1&v=565');
  });
  if(includeEnclosure&&!enclosureFrame.contentWindow?.EnclosureExplorationAdapter)await new Promise((resolve,reject)=>{
   const finish=()=>{clearTimeout(timer);enclosureFrame.removeEventListener('load',loaded);};
   const loaded=()=>{finish();if(enclosureFrame.contentWindow?.EnclosureExplorationAdapter)resolve();else reject(Error('作例3を読み込めませんでした。'));};
   const timer=setTimeout(()=>{finish();reject(Error('作例3の読み込みがタイムアウトしました。'));},10000);
   enclosureFrame.addEventListener('load',loaded);if(!enclosureFrame.getAttribute('src'))enclosureFrame.setAttribute('src','return-enclosure.html?embedded=1&v=565');
  });
  return {quarter:quarterFrame.contentWindow?.QuarterExplorationAdapter,doubleTwist:quarterFrame.contentWindow?.QuarterExplorationAdapter,quarterTwist:quarterFrame.contentWindow?.QuarterExplorationAdapter,branch:branchFrame?.contentWindow?.BranchExplorationAdapter,triple:tripleFrame?.contentWindow?.TripleExplorationAdapter,crossing:crossingFrame?.contentWindow?.CrossingExplorationAdapter,biaxial:biaxialFrame?.contentWindow?.BiaxialExplorationAdapter,preferences:{apply(p){window.ExplorationDisplayPreference.restore(p.render);window.ExplorationLearningPreference.restore(p);if(p.auto)window.ExplorationAutoPreference.restore(p.auto);}},klein:kleinFrame?.contentWindow?.KleinExplorationAdapter,main:window.MainExplorationAdapter,skew:frame.contentWindow.SkewExplorationAdapter,enclosure:enclosureFrame.contentWindow?.EnclosureExplorationAdapter};
 }
 const preferences=()=>window.ExplorationDisplayPreference&&window.ExplorationLearningPreference?{render:window.ExplorationDisplayPreference.snapshot(),...window.ExplorationLearningPreference.snapshot(),...(window.ExplorationAutoPreference?{auto:window.ExplorationAutoPreference.snapshot()}:{})}:undefined;
 const stable=text=>{const data=JSON.parse(text);delete data.savedAt;return JSON.stringify(data);};
 async function exportBundle(download){
  if(busy)return;lock(true);$('bundleStatus').textContent='共通セーブを作成しています…';
  try{const a=await adapters(true,true,active==='biaxial',active==='crossing',active==='triple',active==='branch'||course.pool.includes('branch'),isQuarter(active)||course.pool.some(isQuarter)),text=ExplorationBundle.encode(a.main.snapshot(),a.skew.snapshot(),active,course,a.enclosure.snapshot(),preferences(),a.klein.snapshot(),a.biaxial?.snapshot?.(),a.crossing?.snapshot?.(),a.triple?.snapshot?.(),a.branch?.snapshot?.(),a.quarter?.snapshot?.());$('bundleText').value=text;
   if(download){const url=URL.createObjectURL(new Blob([text],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download='maze-explorations-'+Date.now()+'.json';document.body.append(link);try{link.click();}finally{link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}}
   $('bundleStatus').textContent=download?'共通セーブのダウンロードを開始しました。':'共通セーブを表示しました。全文をコピーして保管してください。';
  }catch(error){$('bundleStatus').textContent='保存できませんでした。'+error.message;}finally{lock(false);}
 }
 $('bundleExport').addEventListener('click',()=>exportBundle(false));$('bundleDownload').addEventListener('click',()=>exportBundle(true));
 $('bundleImport').addEventListener('click',async()=>{
  if(busy)return;const text=$('bundleText').value;lock(true);$('bundleStatus').textContent='保存対象の探索を検証しています…';
  try{const incoming=ExplorationBundle.unpack(text),a=await adapters(true,true,incoming.biaxial!==undefined||active==='biaxial',incoming.crossing!==undefined||active==='crossing',incoming.triple!==undefined||active==='triple',incoming.branch!==undefined||active==='branch'||course.pool.includes('branch'),incoming.quarter!==undefined||isQuarter(active)||course.pool.some(isQuarter));lock(true);const originals={main:a.main.snapshot(),skew:a.skew.snapshot(),enclosure:a.enclosure.snapshot(),klein:a.klein.snapshot(),biaxial:a.biaxial?.snapshot?.(),crossing:a.crossing?.snapshot?.(),triple:a.triple?.snapshot?.(),branch:a.branch?.snapshot?.(),quarter:a.quarter?.snapshot?.()},before=ExplorationBundle.encode(originals.main,originals.skew,active,course,originals.enclosure,preferences(),originals.klein,originals.biaxial,originals.crossing,originals.triple,originals.branch,originals.quarter);
   const prepared=await ExplorationBundle.prepare(text,a),backup=await ExplorationBundle.prepare(before,a);
   if(stable(a.main.snapshot())!==stable(originals.main)||stable(a.skew.snapshot())!==stable(originals.skew)||stable(a.enclosure.snapshot())!==stable(originals.enclosure)||stable(a.klein.snapshot())!==stable(originals.klein)||(originals.biaxial!==undefined&&stable(a.biaxial.snapshot())!==stable(originals.biaxial))||(originals.triple!==undefined&&stable(a.triple.snapshot())!==stable(originals.triple))||(originals.crossing!==undefined&&stable(a.crossing.snapshot())!==stable(originals.crossing))||(originals.quarter!==undefined&&stable(a.quarter.snapshot())!==stable(originals.quarter))||(originals.branch!==undefined&&stable(a.branch.snapshot())!==stable(originals.branch)))throw Error('検証中に探索が変わったため中止しました。');
   const mode=ExplorationBundle.apply(prepared,a,backup);course=prepared.course;lock(false);select(mode,true);$('bundleStatus').textContent=prepared.preferences?'探索・選択中の空間・共通の表示設定・保存された自動歩行設定を復元しました。':'保存対象の探索と選択中の空間を復元しました。共通の表示設定は現在の選択を保持します。';
  }catch(error){$('bundleStatus').textContent='再開できませんでした。'+error.message;}finally{lock(false);}
 });
 let fileRevision=0;$('bundleText').addEventListener('input',()=>fileRevision++);
 $('bundleFile').addEventListener('change',async event=>{const file=event.target.files?.[0],revision=++fileRevision,previous=$('bundleText').value;event.target.value='';if(!file||busy)return;
  try{if(file.size>50000000)throw Error('共通セーブは50MB以内にしてください。');const text=await file.text();if(revision!==fileRevision||busy||$('bundleText').value!==previous)return;ExplorationBundle.unpack(text);$('bundleText').value=text;$('bundleStatus').textContent='共通セーブを欄へ読み込みました。「再開」で保存対象の探索を復元します。';}
  catch(error){if(revision===fileRevision)$('bundleStatus').textContent='読込できませんでした。'+error.message;}
 });

 function currentAdapter(){if(isQuarter(active))return quarterFrame.contentWindow?.QuarterExplorationAdapter;if(active==='branch')return branchFrame?.contentWindow?.BranchExplorationAdapter;if(active==='triple')return tripleFrame?.contentWindow?.TripleExplorationAdapter;if(active==='crossing')return crossingFrame?.contentWindow?.CrossingExplorationAdapter;if(active==='biaxial')return biaxialFrame?.contentWindow?.BiaxialExplorationAdapter;if(active==='klein')return kleinFrame?.contentWindow?.KleinExplorationAdapter;if(active==='enclosure')return enclosureFrame.contentWindow?.EnclosureExplorationAdapter;return active==='main'?window.MainExplorationAdapter:frame.contentWindow?.SkewExplorationAdapter;}
 function syncCoursePlay(){
  $('coursePlayBar').hidden=!course.enabled;
  $('coursePlaySummary').textContent=$('sharedCourseStatus').textContent;
  $('coursePlayNext').disabled=busy||!currentAdapter()?.progress().exit;
  $('coursePlayNext').textContent=busy?'次の空間を準備しています…':'出口から次の空間へ · >';
 }
 function tripleConditionStatus(){
  if(active!=='triple')return;
  const options=tripleFrame?.contentWindow?.TripleExplorationAdapter?.courseOptions?.();if(!options)return;
  const dims=options.dimensions.map(([w,h],i)=>`${'ABC'[i]} ${w}×${h}`).join(' ／ '),route=options.tripleRoute==='return'?'往復 A → B → C → B → A':'通常 A → B → C';
  const growth={dfs:'DFS',prim:'Prim',growing:'Growing Tree',kruskal:'Kruskal',hunt:'Hunt-and-Kill',wilson:'Wilson',rooms:'部屋と通路',walls:'連結を保つ壁配置'}[options.growth]??options.growth;
  $('tripleAppliedConditions').textContent=`今の迷路：${route}。${dims}。${growth??''} ／ ${options.wallStyle==='grid'?'格子状の壁':'密な枝道'}。穴 ${options.holeSize}×${options.holeSize}・${options.holePlacement==='offset'?'位置ずらし':'従来位置'}・縁の壁${options.holeRimWalls?'あり':'なし'}。上下境界の横ずれ ${options.shiftX??0} ／ 左右境界の縦ずれ ${options.shiftY??0}。アンダーパス目標 各シート${options.floorUnderpasses??0}個・${{straight:'直進',mixed:'直進と曲がる形',corners:'曲がる形を多め'}[options.underpassShape]??'直進'}。${options.ruleMode==='warpBirds'?'鳥人間＋ワープ床':options.ruleMode==='warpHiddenBirds'?'鳥人間＋不可視ワープ床':options.ruleMode==='warpAll'?'鍵と扉＋鳥人間＋ワープ床':options.ruleMode==='warpHiddenAll'?'鍵と扉＋鳥人間＋不可視ワープ床':options.ruleMode==='birds'?'鳥人間':options.ruleMode==='birdsKeys'?'鍵と扉＋鳥人間':options.ruleMode==='warpKeys'?'鍵と扉＋ワープ床':options.ruleMode==='warpHiddenKeys'?'鍵と扉＋不可視ワープ床':options.ruleMode==='keys'?'鍵と扉':options.ruleMode==='warp'?'ワープ床（相互）':options.ruleMode==='warpHidden'?'不可視ワープ床（相互）':'通常探索'}。シード：${options.seed??''}`;
  if(!course.enabled){$('tripleNextConditions').textContent='共通コースOFF：設定画面の「次の迷路の条件」に従って、この空間を続けます。';return;}
  if(!course.pool.includes('triple')){$('tripleNextConditions').textContent='共通コースの候補に3トーラスは入っていません。次の空間は共通コースの設定に従います。';return;}
  const next=[];
  if(course.forceTripleReturn)next.push('往復配置を強制（サイズ・穴の固定値と抽選より優先して調整）');
  else {next.push(course.randomTripleRoute?'通常・往復を成立する条件から抽選':'経路を維持');next.push(course.sizes?.enabled?'サイズを抽選':'サイズを維持');next.push(course.randomTripleHole?'穴の大きさ・位置を抽選':'穴を維持');}
  next.push(course.randomGeneration?'生成方式を抽選':'生成方式を維持',course.styles?.enabled?'壁配置を抽選':'壁配置を維持',course.shifts?.enabled?'境界のずれを抽選':'境界のずれを維持',(course.randomRimWalls??course.order==='random')?'穴の縁の壁を抽選':'穴の縁の壁を維持',course.randomTripleUnderpasses?'アンダーパス数・形を抽選':'アンダーパスを維持');
  const rules=ExplorationGeneration.validateRules(course.rules??{enabled:course.order==='random',pool:['plain','keys','warp','birds']});
  const supported=rules.pool;
  next.push(rules.enabled?(supported.length?'仕掛けを抽選（'+supported.map(rule=>rule==='birds'?'鳥人間':rule==='keys'?'鍵と扉':rule==='warp'?'ワープ床（可視・不可視）':'通常探索').join('・')+'）':'仕掛け候補なし：仕掛け候補をONにしてください'):'仕掛けを維持');
  $('tripleNextConditions').textContent='次に3トーラスが選ばれた時：'+next.join(' ／ ')+'。';
 }
 function courseStatus(){
  tripleConditionStatus();for(const m of ['doubleTwist','quarter','quarterTwist'])$('sharedPool_'+m).checked=course.pool.includes(m);
  $('bundlePanel').hidden=false;$('sharedCoursePanel').hidden=false;$('sharedPoolBranch').checked=course.pool.includes('branch');$('sharedPoolTriple').checked=course.pool.includes('triple');$('sharedPoolCrossing').checked=course.pool.includes('crossing');$('sharedPoolBiaxial').checked=course.pool.includes('biaxial');
  $('sharedPoolKlein').checked=course.pool.includes('klein');
  $('sharedForceTripleReturn').checked=course.forceTripleReturn??false;
  $('sharedRandomTripleRoute').checked=course.randomTripleRoute??false;
  $('sharedRandomTripleHole').checked=course.randomTripleHole??false;$('sharedRandomTripleUnderpasses').checked=course.randomTripleUnderpasses??false;
  $('sharedRandomQuarterUnderpasses').checked=course.randomQuarterUnderpasses??false;
  $('sharedRandomPocket').checked=course.randomPocket??false;
  const es=ExplorationGeneration.validateEnclosureSizes(course.enclosureSizes);$('sharedEnclosureSize').checked=es.enabled;for(const k of ['widthMin','widthMax','heightMin','heightMax'])$('sharedEnclosure_'+k).value=String(es[k]);
  $('sharedRandomRimWalls').checked=course.randomRimWalls??course.order==='random';
  const styles=ExplorationGeneration.validateStyles(course.styles);$('sharedRandomStyle').checked=styles.enabled;for(const name of ['dense','grid'])$('sharedStyle_'+name).checked=styles.pool.includes(name);
  const rules=ExplorationGeneration.validateRules(course.rules??{enabled:course.order==='random',pool:['plain','keys','warp','birds']});$('sharedRandomRules').checked=rules.enabled;$('sharedRuleChoices').hidden=!rules.enabled;for(const name of ['plain','keys','warp','birds'])$('sharedRule_'+name).checked=rules.pool.includes(name);
  const shifts=ExplorationGeneration.validateShifts(course.shifts);$('sharedRandomShift').checked=shifts.enabled;$('sharedShiftChoices').hidden=!shifts.enabled;for(const name of ['none','x','y','both'])$('sharedShift_'+name).checked=shifts.pool.includes(name);
  const topologies=ExplorationGeneration.validateTopologies(course.topologies);$('sharedRandomTopology').checked=topologies.enabled;$('sharedTopologyChoices').hidden=!topologies.enabled;for(const name of ['plane','torus'])$('sharedTopology_'+name).checked=topologies.pool.includes(name);
  const sizes=ExplorationGeneration.validateSizes(course.sizes);$('sharedRandomSize').checked=sizes.enabled;$('sharedSizeChoices').hidden=!sizes.enabled;for(const key of ['widthMin','widthMax','heightMin','heightMax','periodMin','periodMax'])$('sharedSize_'+key).value=String(sizes[key]);
  const pools=ExplorationGeneration.validatePools(course.generators);for(const mode of ['main','skew','enclosure','klein','biaxial','crossing','triple','branch','quarter'])for(const name of ExplorationGeneration.candidates(mode,{}))$('sharedGen_'+mode+'_'+name).checked=(pools[mode]??ExplorationGeneration.candidates(mode,{})).includes(name);
  $('sharedGeneratorChoices').hidden=!course.randomGeneration;
  $('sharedRandomGeneration').checked=course.randomGeneration??false;
  $('sharedCourseOrder').value=course.order??'alternate';$('sharedPoolMain').checked=(course.pool??['main','skew']).some(m=>m==='plane'||m==='main');$('sharedPoolTorus').checked=(course.pool||[]).includes('torus');$('sharedPoolSkew').checked=(course.pool??['main','skew']).includes('skew');$('sharedPoolEnclosure').checked=(course.pool??['main','skew']).includes('enclosure');$('sharedCoursePool').hidden=!['random','sequence'].includes(course.order);$('sharedRandomTopology').disabled=(course.pool||[]).some(m=>m==='plane'||m==='torus');
  const p=currentAdapter()?.progress();$('sharedCourseEnabled').checked=course.enabled;$('sharedCourseNext').hidden=!course.enabled;$('sharedCourseNext').disabled=busy||!p?.exit;
  $('sharedCourseStatus').textContent=course.enabled?`${course.order==='random'?'ランダムコース':course.order==='sequence'?'選択した空間の順番コース':course.order==='cycle'?'3空間の周回コース':'交互コース'}：第${course.completed+1}迷路 ／ ${course.completed}枚踏破 ／ 通算${course.steps+(p?.steps||0)}歩 ／ 次は${course.order==='random'?'候補から抽選（'+course.pool.map(m=>({main:'通常迷路',plane:'平面',torus:'トーラス',skew:'中央穴',enclosure:'囲いの2トーラス',klein:'クライン',biaxial:'クラインの壺（自由接続）',triple:'3トーラス',branch:'分枝迷路',crossing:'立体交差',doubleTwist:'二重反転',quarter:'回転',quarterTwist:'回転反転'})[m]).join('・')+'）':course.order==='sequence'?course.pool.map(m=>({plane:'平面',torus:'トーラス',skew:'中央穴',enclosure:'囲い',main:'通常',klein:'クライン',biaxial:'クラインの壺（自由接続）',triple:'3トーラス',branch:'分枝迷路',crossing:'立体交差',doubleTwist:'二重反転',quarter:'回転',quarterTwist:'回転反転'})[m]).join(' → '):course.order==='cycle'?{main:'中央穴の2トーラス',skew:'囲いのある2トーラス',enclosure:'通常の迷路',klein:'通常の迷路',biaxial:'通常の迷路',branch:'通常の迷路',triple:'通常の迷路',crossing:'通常の迷路'}[active]:active==='main'?'中央穴の2トーラス':'通常の迷路'}`:'OFF：それぞれの探索を続けます。';syncCoursePlay();
 }
 function progressChanged(){if(busy)return;const p=currentAdapter()?.progress();if(course.enabled&&p?.token!==courseToken)course.enabled=false;courseStatus();}
 window.addEventListener('exploration-change',progressChanged);
 let courseDefaultsApplied=false;
 $('sharedCourseEnabled').addEventListener('change',()=>{if($('sharedCourseEnabled').checked&&!courseDefaultsApplied){course=ExplorationCourse.allOptions(course);courseDefaultsApplied=true;}course={...course,enabled:$('sharedCourseEnabled').checked,completed:0,steps:0};courseToken=currentAdapter()?.progress().token;courseStatus();focusMap();});
 for(const id of ['sharedCourseOrder','sharedPoolMain','sharedPoolTorus','sharedPoolSkew','sharedPoolEnclosure','sharedPoolKlein','sharedPoolBiaxial','sharedPoolCrossing','sharedPoolTriple','sharedPoolBranch','sharedPool_doubleTwist','sharedPool_quarter','sharedPool_quarterTwist','sharedRandomGeneration'])$(id).addEventListener('change',()=>{
  try{course=ExplorationCourse.validate({...course,randomGeneration:$('sharedRandomGeneration').checked,order:$('sharedCourseOrder').value,pool:['plane','torus','skew','enclosure','klein','biaxial','crossing','triple','branch','doubleTwist','quarter','quarterTwist'].filter(m=>$({doubleTwist:'sharedPool_doubleTwist',quarter:'sharedPool_quarter',quarterTwist:'sharedPool_quarterTwist',plane:'sharedPoolMain',torus:'sharedPoolTorus',skew:'sharedPoolSkew',enclosure:'sharedPoolEnclosure',klein:'sharedPoolKlein',biaxial:'sharedPoolBiaxial',branch:'sharedPoolBranch',triple:'sharedPoolTriple',crossing:'sharedPoolCrossing'}[m]).checked)});courseStatus();}
  catch(error){courseStatus();$('sharedCourseStatus').textContent=error.message;}
 });
 for(const mode of ['main','skew','enclosure','klein','biaxial','crossing','triple','branch','quarter'])for(const name of ExplorationGeneration.candidates(mode,{}))$('sharedGen_'+mode+'_'+name).addEventListener('change',()=>{
  try{const generators=Object.fromEntries(['main','skew','enclosure','klein','biaxial','crossing','triple','branch','quarter'].map(m=>[m,ExplorationGeneration.candidates(m,{}).filter(n=>$('sharedGen_'+m+'_'+n).checked)]));course=ExplorationCourse.validate({...course,generators});courseStatus();}
  catch(error){courseStatus();$('sharedCourseStatus').textContent=error.message;}
 });
 for(const id of ['sharedRandomSize',...['widthMin','widthMax','heightMin','heightMax','periodMin','periodMax'].map(k=>'sharedSize_'+k)])$(id).addEventListener('change',()=>{
  try{const sizes={enabled:$('sharedRandomSize').checked};for(const key of ['widthMin','widthMax','heightMin','heightMax','periodMin','periodMax'])sizes[key]=Number($('sharedSize_'+key).value);const enclosureSizes=id==='sharedRandomSize'?{...ExplorationGeneration.validateEnclosureSizes(course.enclosureSizes),enabled:sizes.enabled}:course.enclosureSizes;course=ExplorationCourse.validate({...course,sizes,...(enclosureSizes===undefined?{}:{enclosureSizes})});courseStatus();}catch(error){courseStatus();$('sharedCourseStatus').textContent=error.message;}
 });
 for(const id of ['sharedRandomTopology','sharedTopology_plane','sharedTopology_torus'])$(id).addEventListener('change',()=>{
  try{const topologies={enabled:$('sharedRandomTopology').checked,pool:['plane','torus'].filter(t=>$('sharedTopology_'+t).checked)};course=ExplorationCourse.validate({...course,topologies});courseStatus();}catch(error){courseStatus();$('sharedCourseStatus').textContent=error.message;}
 });
 for(const [id,key]of [['sharedRandomQuarterUnderpasses','randomQuarterUnderpasses'],['sharedForceTripleReturn','forceTripleReturn'],['sharedRandomTripleRoute','randomTripleRoute'],['sharedRandomTripleHole','randomTripleHole'],['sharedRandomTripleUnderpasses','randomTripleUnderpasses']])$(id).addEventListener('change',()=>{course=ExplorationCourse.validate({...course,[key]:$(id).checked});courseStatus();});
 $('sharedRandomPocket').addEventListener('change',()=>{course=ExplorationCourse.validate({...course,randomPocket:$('sharedRandomPocket').checked});courseStatus();});
 $('sharedRandomRimWalls').addEventListener('change',()=>{course=ExplorationCourse.validate({...course,randomRimWalls:$('sharedRandomRimWalls').checked});courseStatus();});
 for(const id of ['sharedEnclosureSize',...['widthMin','widthMax','heightMin','heightMax'].map(k=>'sharedEnclosure_'+k)])$(id).addEventListener('change',()=>{try{const enclosureSizes={enabled:$('sharedEnclosureSize').checked};for(const k of ['widthMin','widthMax','heightMin','heightMax'])enclosureSizes[k]=Number($('sharedEnclosure_'+k).value);course=ExplorationCourse.validate({...course,enclosureSizes});courseStatus();}catch(error){courseStatus();$('sharedCourseStatus').textContent=error.message;}});
 for(const id of ['sharedRandomStyle','sharedStyle_dense','sharedStyle_grid'])$(id).addEventListener('change',()=>{try{course=ExplorationCourse.validate({...course,styles:{enabled:$('sharedRandomStyle').checked,pool:['dense','grid'].filter(t=>$('sharedStyle_'+t).checked)}});courseStatus();}catch(error){courseStatus();$('sharedCourseStatus').textContent=error.message;}});
 for(const id of ['sharedRandomRules',...['plain','keys','warp','birds'].map(t=>'sharedRule_'+t)])$(id).addEventListener('change',()=>{try{course=ExplorationCourse.validate({...course,rules:{enabled:$('sharedRandomRules').checked,pool:['plain','keys','warp','birds'].filter(t=>$('sharedRule_'+t).checked)}});courseStatus();}catch(error){courseStatus();$('sharedCourseStatus').textContent=error.message;}});
 for(const id of ['sharedRandomShift',...['none','x','y','both'].map(t=>'sharedShift_'+t)])$(id).addEventListener('change',()=>{
  try{const shifts={enabled:$('sharedRandomShift').checked,pool:['none','x','y','both'].filter(t=>$('sharedShift_'+t).checked)};course=ExplorationCourse.validate({...course,shifts});courseStatus();}catch(error){courseStatus();$('sharedCourseStatus').textContent=error.message;}
 });
 function courseNewKey(event){
  if(!course.enabled||!event.shiftKey||event.key?.toLowerCase()!=='n'||event.ctrlKey||event.altKey||event.metaKey||event.isComposing||event.target?.closest?.('input,select,textarea,[contenteditable="true"]'))return false;
  event.preventDefault();event.stopImmediatePropagation();
  if(!event.repeat&&!busy)void crossSpace(undefined,true);
  return true;
 }
 async function crossSpace(allowed,skip=false){
  if(busy)return;$('coursePlayError').textContent='';lock(true);
  try{
   const a=await adapters(active==='enclosure'||course.order==='cycle'||(['random','sequence'].includes(course.order)&&course.pool.includes('enclosure')) ,active==='klein'||course.pool.includes('klein'),active==='biaxial'||course.pool.includes('biaxial'),active==='crossing'||course.pool.includes('crossing'),active==='triple'||course.pool.includes('triple'),active==='branch'||course.pool.includes('branch'),isQuarter(active)||course.pool.some(isQuarter));lock(true);const source=a[active],p=source.progress();if(p.token!==courseToken)throw Error('探索が変更されています。コースをONにし直してください。');
   const prepared=await ExplorationCourse.prepareNext(course,active,p,next=>{const target=a[next.mode];return isQuarter(next.mode)?target.courseFresh(next.mode,'journey-'+Math.random().toString(36).slice(2,10),course):next.mode==='branch'?target.courseFresh(ExplorationGeneration.chooseBranch(target.courseOptions(),'journey-'+Math.random().toString(36).slice(2,10),course)):next.mode==='triple'?target.courseFresh(ExplorationGeneration.chooseTriple(target.courseOptions(),'journey-'+Math.random().toString(36).slice(2,10),course)):next.mode==='crossing'?target.courseFresh(ExplorationGeneration.chooseCrossing(target.courseOptions(),'journey-'+Math.random().toString(36).slice(2,10),course)):next.mode==='biaxial'?target.courseFresh(ExplorationGeneration.chooseBiaxial(target.courseOptions(),'journey-'+Math.random().toString(36).slice(2,10),{...course,rules:course.rules??{enabled:course.order==='random',pool:['plain','keys','warp','birds']}})):next.mode==='klein'?target.courseFresh('journey-'+Math.random().toString(36).slice(2,10),{...course,rules:course.rules??{enabled:course.order==='random',pool:['plain','keys','warp','birds']}}):target.fresh('journey-'+Math.random().toString(36).slice(2,10),course.randomGeneration??false,course.generators,course.sizes,next.topology?{enabled:true,pool:[next.topology]}:course.topologies,course.shifts,course.rules??{enabled:course.order==='random',pool:['plain','keys','warp','birds']},course.styles,course.randomRimWalls??course.order==='random',course.enclosureSizes,course.randomPocket??false);},Math.random,skip);
   const {next,fresh}=prepared,target=a[next.mode],backup=target.checkpoint?target.checkpoint():next.mode==='klein'?null:await target.prepare(target.snapshot());
   if(source.progress().token!==p.token||source.progress().steps!==p.steps||(!skip&&!source.progress().exit))throw Error('探索が変更されたため中止しました。');
   if(typeof allowed==='function'&&!allowed())return false;
   try{if(isQuarter(next.mode)||next.mode==='branch'||next.mode==='klein'||next.mode==='biaxial'||next.mode==='crossing'||next.mode==='triple')target.courseEnter(fresh);else target.enter(fresh);}catch(error){if(target.restoreCheckpoint)target.restoreCheckpoint(backup);else if(next.mode!=='klein')target.apply(backup);throw error;}
   course=next.course;lock(false);select(next.mode,true);return true;
  }catch(error){$('sharedCourseStatus').textContent='次の空間へ進めませんでした。'+error.message;$('coursePlayError').textContent=$('sharedCourseStatus').textContent;return false;}finally{lock(false);}
 }
 window.ExplorationHost={wands:()=>currentAdapter()?.wands?.(),consoleStatus:()=>currentAdapter()?.consoleStatus?.(),wallPass(){const a=currentAdapter();if(!a?.toggleWallPass)return false;a.pause?.();a.toggleWallPass();return true;},async autoAdvance(allowed){if(busy||!allowed()||!currentAdapter()?.progress().exit)return false;if(course.enabled)return crossSpace(allowed);const a=currentAdapter(),token=a.progress().token;a.autoNext?.();return a.progress().token!==token;},select,mode:()=>active,focus:focusMap,reroll(mode){if(!course.enabled||mode!==active)return false;void crossSpace(undefined,true);return true;},advance(mode){if(!course.enabled||mode!==active)return false;void crossSpace();return true;}};
 $('sharedCourseNext').addEventListener('click',crossSpace);$('coursePlayNext').addEventListener('click',crossSpace);
})();


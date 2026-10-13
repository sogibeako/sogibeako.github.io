/* Exploration host: select one runtime while retaining independent in-memory sessions. */
'use strict';
(()=>{
 const $=id=>document.getElementById(id),frame=$('skewPilotFrame'),enclosureFrame=$('enclosureFrame'),enclosurePane=$('enclosureExplorePane'),mainPane=$('mainExplorePane'),skewPane=$('skewExplorePane'),layout=document.querySelector('.layout'),aside=layout.querySelector('aside');
 let active='main',busy=false,course={enabled:false,completed:0,steps:0,randomGeneration:false,order:'alternate',pool:['main','skew']},courseToken=null;
 function focusMap(){if($('explorationSettingsDialog')?.open)return;if(active!=='main')(active==='enclosure'?enclosureFrame:frame).contentDocument?.getElementById('map')?.focus();else $('map').focus();}
 function select(mode,internal=false){
  if(busy)return;
  if(!internal)course.enabled=false;$('coursePlayError').textContent='';
  active=mode;const skew=mode==='skew',enclosure=mode==='enclosure',embedded=mode!=='main';mainPane.hidden=embedded;skewPane.hidden=!skew;enclosurePane.hidden=!enclosure;aside.hidden=embedded;layout.classList.toggle('skew-exploration',embedded);
  for(const name of ['main','skew','enclosure'])$(name+'ExploreSelect').setAttribute('aria-pressed',String(mode===name));
  $('sharedCoursePanel').hidden=false;$('bundlePanel').hidden=false;
  $('explorationModeStatus').textContent=enclosure?'囲いのある2トーラス（作例3）を探索中':skew?'中央穴の2トーラスを探索中':'通常の迷路を探索中';
  const target=enclosure?enclosureFrame:frame;
  if(embedded&&!target.getAttribute('src'))target.setAttribute('src',enclosure?'return-enclosure.html?embedded=1&v=300':'lattice-holes.html?embedded=1&v=300');
  else focusMap();
  courseToken=currentAdapter()?.progress().token;courseStatus();
  window.dispatchEvent?.(new CustomEvent('exploration-selected',{detail:{mode}}));
 }
 $('enclosureExploreSelect').addEventListener('click',()=>select('enclosure'));
 enclosureFrame.addEventListener('load',()=>{enclosureFrame.contentWindow?.addEventListener('exploration-change',progressChanged);if(active==='enclosure')focusMap();courseStatus();});
 $('skewPilotOpen').addEventListener('click',()=>select('skew'));
 $('skewExploreSelect').addEventListener('click',()=>select('skew'));
 $('mainExploreSelect').addEventListener('click',()=>select('main'));
 // The inactive main runtime must not react to keys on the host's controls.
 document.addEventListener('keydown',event=>{if((active!=='main'||busy)&&!$('explorationSettingsDialog')?.open)event.stopPropagation();},true);
 frame.addEventListener('load',()=>{frame.contentWindow?.addEventListener('exploration-change',progressChanged);focusMap();courseStatus();});

 function lock(value){busy=value;mainPane.inert=value;aside.inert=value;$('embeddedGeneration').inert=value;$('bundlePanel').inert=value;$('sharedCoursePanel').inert=value;$('mainExploreSelect').disabled=value;$('skewExploreSelect').disabled=value;$('enclosureExploreSelect').disabled=value;enclosurePane.inert=value;$('explorationSpace').disabled=value;const enclosureBody=enclosureFrame.contentDocument?.body;if(enclosureBody)enclosureBody.inert=value;const body=frame.contentDocument?.body;if(body)body.inert=value;syncCoursePlay();}
 async function adapters(includeEnclosure=false){
  if(!frame.contentWindow?.SkewExplorationAdapter)await new Promise((resolve,reject)=>{
   const finish=()=>{clearTimeout(timer);frame.removeEventListener('load',loaded);};
   const loaded=()=>{if(frame.contentWindow?.SkewExplorationAdapter){finish();resolve();}else{finish();reject(Error('中央穴の探索を読み込めませんでした。'));}};
   const timer=setTimeout(()=>{finish();reject(Error('中央穴の読み込みがタイムアウトしました。'));},10000);
   frame.addEventListener('load',loaded);if(!frame.getAttribute('src'))frame.setAttribute('src','lattice-holes.html?embedded=1&v=300');
  });
  if(includeEnclosure&&!enclosureFrame.contentWindow?.EnclosureExplorationAdapter)await new Promise((resolve,reject)=>{
   const finish=()=>{clearTimeout(timer);enclosureFrame.removeEventListener('load',loaded);};
   const loaded=()=>{finish();if(enclosureFrame.contentWindow?.EnclosureExplorationAdapter)resolve();else reject(Error('作例3を読み込めませんでした。'));};
   const timer=setTimeout(()=>{finish();reject(Error('作例3の読み込みがタイムアウトしました。'));},10000);
   enclosureFrame.addEventListener('load',loaded);if(!enclosureFrame.getAttribute('src'))enclosureFrame.setAttribute('src','return-enclosure.html?embedded=1&v=300');
  });
  return {preferences:{apply(p){window.ExplorationDisplayPreference.restore(p.render);window.ExplorationLearningPreference.restore(p);}},main:window.MainExplorationAdapter,skew:frame.contentWindow.SkewExplorationAdapter,enclosure:enclosureFrame.contentWindow?.EnclosureExplorationAdapter};
 }
 const preferences=()=>window.ExplorationDisplayPreference&&window.ExplorationLearningPreference?{render:window.ExplorationDisplayPreference.snapshot(),...window.ExplorationLearningPreference.snapshot()}:undefined;
 const stable=text=>{const data=JSON.parse(text);delete data.savedAt;return JSON.stringify(data);};
 async function exportBundle(download){
  if(busy)return;lock(true);$('bundleStatus').textContent='共通セーブを作成しています…';
  try{const a=await adapters(true),text=ExplorationBundle.encode(a.main.snapshot(),a.skew.snapshot(),active,course,a.enclosure.snapshot(),preferences());$('bundleText').value=text;
   if(download){const url=URL.createObjectURL(new Blob([text],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download='maze-explorations-'+Date.now()+'.json';document.body.append(link);try{link.click();}finally{link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}}
   $('bundleStatus').textContent=download?'共通セーブのダウンロードを開始しました。':'共通セーブを表示しました。全文をコピーして保管してください。';
  }catch(error){$('bundleStatus').textContent='保存できませんでした。'+error.message;}finally{lock(false);}
 }
 $('bundleExport').addEventListener('click',()=>exportBundle(false));$('bundleDownload').addEventListener('click',()=>exportBundle(true));
 $('bundleImport').addEventListener('click',async()=>{
  if(busy)return;const text=$('bundleText').value;lock(true);$('bundleStatus').textContent='保存対象の探索を検証しています…';
  try{const a=await adapters(true);lock(true);const originals={main:a.main.snapshot(),skew:a.skew.snapshot(),enclosure:a.enclosure.snapshot()},before=ExplorationBundle.encode(originals.main,originals.skew,active,course,originals.enclosure,preferences());
   const prepared=await ExplorationBundle.prepare(text,a),backup=await ExplorationBundle.prepare(before,a);
   if(stable(a.main.snapshot())!==stable(originals.main)||stable(a.skew.snapshot())!==stable(originals.skew)||stable(a.enclosure.snapshot())!==stable(originals.enclosure))throw Error('検証中に探索が変わったため中止しました。');
   const mode=ExplorationBundle.apply(prepared,a,backup);course=prepared.course;lock(false);select(mode,true);$('bundleStatus').textContent=prepared.preferences?'探索・選択中の空間・共通の表示設定を復元しました。':'保存対象の探索と選択中の空間を復元しました。共通の表示設定は現在の選択を保持します。';
  }catch(error){$('bundleStatus').textContent='再開できませんでした。'+error.message;}finally{lock(false);}
 });
 let fileRevision=0;$('bundleText').addEventListener('input',()=>fileRevision++);
 $('bundleFile').addEventListener('change',async event=>{const file=event.target.files?.[0],revision=++fileRevision,previous=$('bundleText').value;event.target.value='';if(!file||busy)return;
  try{if(file.size>50000000)throw Error('共通セーブは50MB以内にしてください。');const text=await file.text();if(revision!==fileRevision||busy||$('bundleText').value!==previous)return;ExplorationBundle.unpack(text);$('bundleText').value=text;$('bundleStatus').textContent='共通セーブを欄へ読み込みました。「再開」で保存対象の探索を復元します。';}
  catch(error){if(revision===fileRevision)$('bundleStatus').textContent='読込できませんでした。'+error.message;}
 });

 function currentAdapter(){if(active==='enclosure')return enclosureFrame.contentWindow?.EnclosureExplorationAdapter;return active==='main'?window.MainExplorationAdapter:frame.contentWindow?.SkewExplorationAdapter;}
 function syncCoursePlay(){
  $('coursePlayBar').hidden=!course.enabled;
  $('coursePlaySummary').textContent=$('sharedCourseStatus').textContent;
  $('coursePlayNext').disabled=busy||!currentAdapter()?.progress().exit;
  $('coursePlayNext').textContent=busy?'次の空間を準備しています…':'出口から次の空間へ · >';
 }
 function courseStatus(){
  const shifts=ExplorationGeneration.validateShifts(course.shifts);$('sharedRandomShift').checked=shifts.enabled;$('sharedShiftChoices').hidden=!shifts.enabled;for(const name of ['none','x','y','both'])$('sharedShift_'+name).checked=shifts.pool.includes(name);
  const topologies=ExplorationGeneration.validateTopologies(course.topologies);$('sharedRandomTopology').checked=topologies.enabled;$('sharedTopologyChoices').hidden=!topologies.enabled;for(const name of ['plane','torus'])$('sharedTopology_'+name).checked=topologies.pool.includes(name);
  const sizes=ExplorationGeneration.validateSizes(course.sizes);$('sharedRandomSize').checked=sizes.enabled;$('sharedSizeChoices').hidden=!sizes.enabled;for(const key of ['widthMin','widthMax','heightMin','heightMax','periodMin','periodMax'])$('sharedSize_'+key).value=String(sizes[key]);
  const pools=ExplorationGeneration.validatePools(course.generators);for(const mode of ['main','skew'])for(const name of ExplorationGeneration.candidates(mode,{}))$('sharedGen_'+mode+'_'+name).checked=pools[mode].includes(name);
  $('sharedGeneratorChoices').hidden=!course.randomGeneration;
  $('sharedRandomGeneration').checked=course.randomGeneration??false;
  $('sharedCourseOrder').value=course.order??'alternate';$('sharedPoolMain').checked=(course.pool??['main','skew']).includes('main');$('sharedPoolSkew').checked=(course.pool??['main','skew']).includes('skew');$('sharedPoolEnclosure').checked=(course.pool??['main','skew']).includes('enclosure');$('sharedCoursePool').hidden=course.order!=='random';
  const p=currentAdapter()?.progress();$('sharedCourseEnabled').checked=course.enabled;$('sharedCourseNext').hidden=!course.enabled;$('sharedCourseNext').disabled=busy||!p?.exit;
  $('sharedCourseStatus').textContent=course.enabled?`${course.order==='random'?'ランダムコース':course.order==='cycle'?'3空間の周回コース':'交互コース'}：第${course.completed+1}迷路 ／ ${course.completed}枚踏破 ／ 通算${course.steps+(p?.steps||0)}歩 ／ 次は${course.order==='random'?'候補から抽選（'+course.pool.map(m=>m==='main'?'通常迷路':m==='skew'?'中央穴':'囲いの2トーラス').join('・')+'）':course.order==='cycle'?{main:'中央穴の2トーラス',skew:'囲いのある2トーラス',enclosure:'通常の迷路'}[active]:active==='main'?'中央穴の2トーラス':'通常の迷路'}`:'OFF：それぞれの探索を続けます。';syncCoursePlay();
 }
 function progressChanged(){if(busy)return;const p=currentAdapter()?.progress();if(course.enabled&&p?.token!==courseToken)course.enabled=false;courseStatus();}
 window.addEventListener('exploration-change',progressChanged);
 $('sharedCourseEnabled').addEventListener('change',()=>{course={...course,enabled:$('sharedCourseEnabled').checked,completed:0,steps:0};courseToken=currentAdapter()?.progress().token;courseStatus();focusMap();});
 for(const id of ['sharedCourseOrder','sharedPoolMain','sharedPoolSkew','sharedPoolEnclosure','sharedRandomGeneration'])$(id).addEventListener('change',()=>{
  try{course=ExplorationCourse.validate({...course,randomGeneration:$('sharedRandomGeneration').checked,order:$('sharedCourseOrder').value,pool:['main','skew','enclosure'].filter(m=>$({main:'sharedPoolMain',skew:'sharedPoolSkew',enclosure:'sharedPoolEnclosure'}[m]).checked)});courseStatus();}
  catch(error){courseStatus();$('sharedCourseStatus').textContent=error.message;}
 });
 for(const mode of ['main','skew'])for(const name of ExplorationGeneration.candidates(mode,{}))$('sharedGen_'+mode+'_'+name).addEventListener('change',()=>{
  try{const generators=Object.fromEntries(['main','skew'].map(m=>[m,ExplorationGeneration.candidates(m,{}).filter(n=>$('sharedGen_'+m+'_'+n).checked)]));course=ExplorationCourse.validate({...course,generators});courseStatus();}
  catch(error){courseStatus();$('sharedCourseStatus').textContent=error.message;}
 });
 for(const id of ['sharedRandomSize',...['widthMin','widthMax','heightMin','heightMax','periodMin','periodMax'].map(k=>'sharedSize_'+k)])$(id).addEventListener('change',()=>{
  try{const sizes={enabled:$('sharedRandomSize').checked};for(const key of ['widthMin','widthMax','heightMin','heightMax','periodMin','periodMax'])sizes[key]=Number($('sharedSize_'+key).value);course=ExplorationCourse.validate({...course,sizes});courseStatus();}catch(error){courseStatus();$('sharedCourseStatus').textContent=error.message;}
 });
 for(const id of ['sharedRandomTopology','sharedTopology_plane','sharedTopology_torus'])$(id).addEventListener('change',()=>{
  try{const topologies={enabled:$('sharedRandomTopology').checked,pool:['plane','torus'].filter(t=>$('sharedTopology_'+t).checked)};course=ExplorationCourse.validate({...course,topologies});courseStatus();}catch(error){courseStatus();$('sharedCourseStatus').textContent=error.message;}
 });
 for(const id of ['sharedRandomShift',...['none','x','y','both'].map(t=>'sharedShift_'+t)])$(id).addEventListener('change',()=>{
  try{const shifts={enabled:$('sharedRandomShift').checked,pool:['none','x','y','both'].filter(t=>$('sharedShift_'+t).checked)};course=ExplorationCourse.validate({...course,shifts});courseStatus();}catch(error){courseStatus();$('sharedCourseStatus').textContent=error.message;}
 });
 async function crossSpace(){
  if(busy)return;$('coursePlayError').textContent='';lock(true);
  try{
   const a=await adapters(active==='enclosure'||course.order==='cycle'||(course.order==='random'&&course.pool.includes('enclosure')));lock(true);const source=a[active],p=source.progress();if(p.token!==courseToken)throw Error('探索が変更されています。コースをONにし直してください。');
   const next=ExplorationCourse.advance(course,active,p),target=a[next.mode],backup=await target.prepare(target.snapshot());
   if(source.progress().token!==p.token||source.progress().steps!==p.steps||!source.progress().exit)throw Error('探索が変更されたため中止しました。');
   const fresh=target.fresh('journey-'+Math.random().toString(36).slice(2,10),course.randomGeneration??false,course.generators,course.sizes,course.topologies,course.shifts);
   try{target.enter(fresh);}catch(error){target.apply(backup);throw error;}
   course=next.course;lock(false);select(next.mode,true);
  }catch(error){$('sharedCourseStatus').textContent='次の空間へ進めませんでした。'+error.message;$('coursePlayError').textContent=$('sharedCourseStatus').textContent;}finally{lock(false);}
 }
 window.ExplorationHost={select,mode:()=>active,focus:focusMap,advance(mode){if(!course.enabled||mode!==active)return false;void crossSpace();return true;}};
 $('sharedCourseNext').addEventListener('click',crossSpace);$('coursePlayNext').addEventListener('click',crossSpace);
})();


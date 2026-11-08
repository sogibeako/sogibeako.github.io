/* Shared atelier-style display for the standalone three-torus experiment. */
(()=>{
 'use strict';
 if(new URLSearchParams(location.search).get('embedded')==='1')return;
 const main=document.querySelector('main'),stage=document.createElement('section');
 stage.id='tripleStage';stage.hidden=true;stage.setAttribute('aria-label','3トーラスの探索');
 const bar=document.createElement('div');bar.className='mapbar';stage.append(bar);
 const buttons=[];
 function group(label,items,action){
  const tabs=document.createElement('div');tabs.className='tabs';tabs.setAttribute('role','group');tabs.setAttribute('aria-label',label);bar.append(tabs);
  for(const [value,text] of items){
   const button=document.createElement('button');button.type='button';button.textContent=text;
   button.addEventListener('click',()=>action(value));tabs.append(button);buttons.push({button,label,value});
  }
 }
 group('表示する世界',[['subjective','0 · 主観世界'],['truth','1 · 真世界'],['atlas','M · 探索地図']],value=>{
  $('space'+({subjective:'Subjective',truth:'Truth',atlas:'Atlas'}[value])).click();
 });
 group('描画モード',[['tiles','タイル'],['ascii','等幅文字'],['hybrid','タイル＋等幅文字']],value=>{crossRender=value;draw();});
 const nodes=[canvas,$('spaceStatus'),$('tripleLoopStatus'),$('tripleMarkControls'),$('tripleFoldControl'),$('crossAutoControls'),$('underpassExitNext')];
 const anchors=nodes.map(node=>{const anchor=document.createComment('display position');node.before(anchor);return anchor;});
 main.prepend(stage);
 const structure=document.createElement('details'),summary=document.createElement('summary'),report=document.createElement('p');
 summary.textContent='シート間の区画構造を確認（未探索部分を含む）';structure.append(summary,report);stage.append(structure);
 structure.style.cssText='padding:12px 20px';let analyzedWorld=null;
 structure.addEventListener('toggle',()=>{
  if(!structure.open||analyzedWorld===state.world)return;
  const r=SheetRouteAnalysis.analyze(state.world);analyzedWorld=state.world;
  report.textContent='穴を通らずにつながる区画：'+r.regionsPerSheet.map((n,i)=>'ABC'[i]+' '+n+'区画').join(' ／ ')+
   '。全床の接続：'+(r.allConnected?'確認済み':'未接続あり')+'。最短経路のシート順：'+r.sheetRoute.map(i=>'ABC'[i]).join(' → ')+
   '。BとCの両方を経由しないと入れないA区画：'+r.tripleReturnCandidates.length+'。'+
   '作例3型ではBとCの経由必須性を生成時に検証します。理解した方向は主観地図へ重ねて表示します。上下・左右の境界ずれにも対応。本体統合は今後の対応です。';
 });
 let active=false;
 const previousDraw=draw;
 draw=()=>{
  const enabled=state.world.mode==='tripleMaze';
  if(enabled!==active){
   active=enabled;stage.hidden=!enabled;document.body.classList.toggle('triple-display',enabled);
   nodes.forEach((node,i)=>enabled?stage.insertBefore(node,structure):anchors[i].after(node));
  }
  if(analyzedWorld&&analyzedWorld!==state.world){structure.open=false;analyzedWorld=null;report.textContent="";}
  previousDraw();
  for(const {button,label,value} of buttons){
   const selected=label==='描画モード'?crossRender===value:value==='truth'?truth:value==='atlas'?atlasShown:!truth&&!atlasShown;
   button.setAttribute('aria-pressed',String(selected));
  }
 };
 draw();
})();

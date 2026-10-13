/* Share the learning threshold without rewriting an existing main maze's memories. */
'use strict';
(()=>{
 const main=document.getElementById('loopLearning'),fold=document.getElementById('mainFoldLoops'),frames={skew:document.getElementById('skewPilotFrame'),enclosure:document.getElementById('enclosureFrame')};
 const toThreshold={off:'0',three:'3',on:'5'},toMain={'0':'off','3':'three','5':'on'};
 let threshold=toThreshold[main.value]||'3',applying=false,folding=fold.checked;
 function apply(){
  const mode=window.ExplorationHost.mode();
  main.value=toMain[threshold];
  const frame=frames[mode],doc=mode==='main'?document:frame?.contentDocument;
  const control=mode==='main'?null:doc?.getElementById('loopThreshold'),foldControl=mode==='main'?fold:doc?.getElementById('foldLoops');
  applying=true;try{
   if(control&&control.value!==threshold){control.value=threshold;control.dispatchEvent(new frame.contentWindow.Event('change',{bubbles:true}));}
   if(foldControl&&foldControl.checked!==folding){foldControl.checked=folding;foldControl.dispatchEvent(new (mode==='main'?Event:frame.contentWindow.Event)('change',{bubbles:true}));}
  }finally{applying=false;}
 }
 main.addEventListener('change',()=>{if(!applying){threshold=toThreshold[main.value];apply();}});
 fold.addEventListener('change',()=>{if(!applying)folding=fold.checked;});
 for(const [mode,frame]of Object.entries(frames))frame.addEventListener('load',()=>{
  const control=frame.contentDocument?.getElementById('loopThreshold');
  control?.addEventListener('change',()=>{if(!applying){threshold=control.value;main.value=toMain[threshold];}});
  frame.contentDocument?.getElementById('foldLoops')?.addEventListener('change',()=>{if(!applying)folding=frame.contentDocument.getElementById('foldLoops').checked;});
  if(window.ExplorationHost.mode()===mode)apply();
 });
 window.addEventListener('exploration-selected',apply);
 // Native restore updates form values without a change event. Keep the shared choice
 // when reopening settings; never mutate a restored exploration during its transaction.
 document.getElementById('openExplorationSettings').addEventListener('click',apply);
 window.ExplorationLearningPreference={snapshot:()=>({threshold:Number(threshold),folding,foldDisplay:document.getElementById('foldDisplay').value}),restore(value){
  if(![0,3,5].includes(value?.threshold)||typeof value.folding!=='boolean'||!['bounded','continuous'].includes(value.foldDisplay))throw Error('地図の表示設定が不正です。');
  threshold=String(value.threshold);folding=value.folding;main.value=toMain[threshold];document.getElementById('foldDisplay').value=value.foldDisplay;
 }};
})();

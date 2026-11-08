/* Adapt the existing two-floor experiment to the shared exploration host. */
(()=>{'use strict';if(new URLSearchParams(location.search).get('embedded')!=='1')return;window.CrossingEmbedded=true;const triple=new URLSearchParams(location.search).get('space')==='tripleMaze',adapter=()=>triple?window.TripleExplorationAdapter:window.CrossingExplorationAdapter;document.body.classList.add('crossing-embedded');
 const main=document.querySelector('main'),form=document.createElement('form');form.id='settings';
 for(const id of (triple?['tripleMazeGeneration','underpassShape','tripleFoldControl']:['crossingRuleMode','crossingSeed','crossingWidth','crossingHeight','crossingGrowth','crossingBias','crossingWallStyle','crossingStairs','floorUnderpassesEnabled','floorUnderpassesCount','underpassShape'])){const input=document.getElementById(id);form.append(input.closest('label')||input);}
 const generate=document.createElement('button');generate.textContent='条件を反映して最初から';form.append(generate);form.addEventListener('submit',e=>{e.preventDefault();adapter().pause();reset();});
 const controls=document.createElement('div');controls.id='mapDisplayControls';controls.className='mapbar';
 const worldTabs=document.createElement('div'),renderTabs=document.createElement('div');
 for(const [group,label]of [[worldTabs,'表示する世界'],[renderTabs,'描画モード']]){group.className='tabs';group.setAttribute('role','group');group.setAttribute('aria-label',label);controls.append(group);}
 for(const [id,text]of [['subjective','0 · 主観世界'],['truth','1 · 真世界']]){const button=document.createElement('button');button.id=id;button.textContent=text;button.type='button';button.addEventListener('click',()=>document.getElementById(id==='truth'?'spaceTruth':'spaceSubjective').click());worldTabs.append(button);}
 for(const [mode,text]of [['tiles','タイル'],['ascii','等幅文字'],['hybrid','タイル＋等幅文字']]){const button=document.createElement('button');button.type='button';button.dataset.render=mode;button.textContent=text;button.addEventListener('click',()=>{crossRender=mode;draw();});renderTabs.append(button);}
 const originalDraw=draw;draw=()=>{originalDraw();document.getElementById('subjective').setAttribute('aria-pressed',String(!truth));document.getElementById('truth').setAttribute('aria-pressed',String(truth));controls.querySelectorAll('[data-render]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.render===crossRender)));document.getElementById('crossAutoControls').hidden=true;window.dispatchEvent(new Event('exploration-change'));};
 // Keep the original controls in the document for the proven renderer/reset handlers.
 const loopStatus=document.getElementById('tripleLoopStatus'),markControls=document.getElementById('tripleMarkControls');
 const status=document.getElementById('spaceStatus'),next=document.getElementById('underpassExitNext');
 const legacy=document.createElement('div');legacy.hidden=true;while(main.firstChild)legacy.append(main.firstChild);main.append(controls,canvas,status,...(triple?[loopStatus]:[]),...(triple&&markControls?[markControls]:[]),next,form,legacy);if(triple)form.querySelectorAll('button').forEach(b=>b.type='button');generate.type='submit';
 const savePanel=document.createElement('details'),summary=document.createElement('summary');summary.textContent=triple?'3トーラスの保存・再開':'立体交差の保存・再開';savePanel.append(summary);
 const output=document.createElement('textarea');output.setAttribute('aria-label',triple?'3トーラスの保存データ':'立体交差の保存データ');output.style.cssText='width:100%;height:100px';
 const message=document.createElement('p');message.setAttribute('role','status');
 function button(text,fn){const b=document.createElement('button');b.type='button';b.textContent=text;b.addEventListener('click',()=>{try{adapter().pause();fn();}catch(e){message.textContent=e.message;}});savePanel.append(b);}
 button('保存内容を表示',()=>{output.value=adapter().snapshot();message.textContent='保存内容を表示しました。コピーして保管できます。';});
 button('JSONをダウンロード',()=>{const text=adapter().snapshot(),url=URL.createObjectURL(new Blob([text],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=triple?'triple-exploration.json':'crossing-exploration.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message.textContent='保存ファイルをダウンロードしました。';});
 button('保存内容から再開',()=>{const prepared=adapter().prepare(output.value);adapter().apply(prepared);message.textContent='両階の地図と歩数を復元しました。';});
 savePanel.append(output,message);savePanel.style.cssText='margin:16px 20px';main.append(savePanel);
 form.hidden=true;draw();
})();

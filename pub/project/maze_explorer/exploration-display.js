/* One drawing preference for the host's independent exploration sessions. */
'use strict';
(()=>{
 const modes=['tiles','ascii','hybrid'],frames={doubleTwist:document.getElementById('quarterFrame'),quarter:document.getElementById('quarterFrame'),quarterTwist:document.getElementById('quarterFrame'),branch:document.getElementById('branchFrame'),triple:document.getElementById('tripleFrame'),crossing:document.getElementById('crossingFrame'),biaxial:document.getElementById('biaxialFrame'),klein:document.getElementById('kleinFrame'),skew:document.getElementById('skewPilotFrame'),enclosure:document.getElementById('enclosureFrame')};
 let mode=modes.find(name=>document.getElementById(name).getAttribute('aria-pressed')==='true')||'tiles',applying=false,worldView=document.getElementById('truth')?.getAttribute('aria-pressed')==='true'?'truth':'subjective';
 function buttons(doc,main){return modes.map(name=>main?doc.getElementById(name):doc.querySelector(`[data-render="${name}"]`));}
 function apply(){
  const active=window.ExplorationHost.mode(),doc=active==='main'?document:frames[active]?.contentDocument;
  if(!doc)return;const button=buttons(doc,active==='main')[modes.indexOf(mode)];if(!button)return;
  // Repaint only the visible canvas; hidden iframe canvases have zero dimensions.
  applying=true;try{button.click();doc.getElementById(worldView)?.click();}finally{applying=false;}
 }
 function bind(doc,main){
  for(const name of ['subjective','truth'])doc.getElementById(name)?.addEventListener('click',()=>{if(!applying)worldView=name;});
  // Runtime keyboard handlers run first and update the pressed state.
  doc.addEventListener('keydown',event=>{
   if(applying||!['0','1'].includes(event.key)||event.ctrlKey||event.metaKey||event.altKey||event.isComposing||event.target?.closest?.('input,select,textarea,[contenteditable="true"]'))return;
   worldView=doc.getElementById('truth')?.getAttribute('aria-pressed')==='true'?'truth':'subjective';
  });
  buttons(doc,main).forEach((button,i)=>button?.addEventListener('click',()=>{if(!applying)mode=modes[i];}));}
 bind(document,true);
 for(const [name,frame]of Object.entries(frames))frame?.addEventListener('load',()=>{if(frame.contentDocument)bind(frame.contentDocument,false);if(window.ExplorationHost.mode()===name)apply();});
 window.addEventListener('exploration-selected',apply);
 window.ExplorationDisplayPreference={snapshot:()=>mode,restore(value){if(!modes.includes(value))throw Error('描画方式が不正です。');mode=value;}};
})();

'use strict';
const $ = id => document.getElementById(id);
const colors=['#c7f197','#85d8d0','#e8bf78','#c2adf4','#ee9cbd','#82b8ed','#ed9981','#e3e7dc','#c1d16d','#83cac1','#dca5e9','#b8cbe9','#efbfaa','#a3caaa','#dcbf86','#b7aedb'];
let u=1/12, word='LLsLLLs', period=1200, order=Array.from({length:8},(_,i)=>i), ctx, master;
let running=false, starting=false, generation=0, nextTime=0, nextStep=0, timer, sweep=null, voices=[], events=[], active=-1;
let bounds={min:-500,max:1250}, markers=[], cursor, sounding;
let ratioDirty=false;
const fmt=n=>Math.abs(n)<0.0005?'0.000':n.toFixed(3);
function stepRatio(L,s){
  const magnitude=Math.max(Math.abs(L),Math.abs(s));
  if(Math.abs(s)<magnitude*1e-12)return `${Math.sign(L)} : 0`;
  if(Math.abs(L)<magnitude*1e-12)return '0 : 1';
  const ratio=L/s;
  for(let denominator=1;denominator<=64;denominator++){
    const numerator=Math.round(ratio*denominator);
    if(numerator!==0 && Math.abs(numerator)<=64 && Math.abs(ratio-numerator/denominator)<1e-10)
      return `${numerator} : ${denominator}`;
  }
  // Mark rounded continuous values explicitly; avoid huge numbers near s=0.
  return Math.abs(ratio)<=64 ? `≈ ${ratio.toFixed(4)} : 1` : `≈ ${Math.sign(L)} : ${(s/Math.abs(L)).toFixed(4)}`;
}
const numeric=(id,fallback)=>{const e=$(id), n=e.valueAsNumber;return Number.isFinite(n)&&n>=Number(e.min)&&n<=Number(e.max)?n:fallback;};
const scale=()=>MOS.pitches(u,word,period);
const target=id=>MOS.frequency(scale().notes[id],numeric('ref',261.6255653));
const x=t=>60+900*t, y=p=>390-(p-bounds.min)/(bounds.max-bounds.min)*360;
function svg(tag,attrs,parent=$('graph')){const e=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);parent.append(e);return e;}
function buildGraph(){
  const a=MOS.pitches(0,word,period).notes,b=MOS.pitches(1,word,period).notes;
  bounds={min:Math.min(-500,...a,...b)-20,max:Math.max(1250,...a,...b)+20};
  $('graph').replaceChildren();
  const interval=(bounds.max-bounds.min)>4000?600:300;
  for(let p=Math.ceil(bounds.min/interval)*interval;p<=bounds.max;p+=interval){svg('line',{x1:60,x2:960,y1:y(p),y2:y(p),stroke:p===0?'#6e8178':'#344247','stroke-dasharray':p===0?'':'3 5'});svg('text',{x:49,y:y(p)+4,'text-anchor':'end'}).textContent=p;}
  for(let t=0;t<=1.001;t+=.1){svg('line',{x1:x(t),x2:x(t),y1:30,y2:390,stroke:'#2a363b'});svg('text',{x:x(t),y:418,'text-anchor':'middle'}).textContent=t.toFixed(1);}
  a.forEach((p,i)=>svg('line',{x1:x(0),y1:y(p),x2:x(1),y2:y(b[i]),stroke:colors[i],'stroke-width':2,opacity:.85}));
  cursor=svg('line',{x1:x(u),x2:x(u),y1:25,y2:390,stroke:'#ecf3e7','stroke-dasharray':'4 4'});
  markers=a.map((_,i)=>{const e=svg('circle',{r:5,fill:colors[i],stroke:'#101619','stroke-width':2});svg('title',{},e).textContent=`音 ${i}`;return e;});
  sounding=svg('g',{});
  $('legend').innerHTML=a.map((_,i)=>`<span style="--voice:${colors[i]}">音 ${i}${i===a.length-1?' · 終端':''}</span>`).join('');
  $('structure').textContent=`${[...word].filter(c=>c==='L').length}L${[...word].filter(c=>c==='s').length}s · ${word.length} steps / ${a.length} voices`;
}
const presets=[['5EDO',0],['12EDO',1/12],['7EDO',1/7],['9EDO',2/9],['2EDO',.5],['負領域',1]];
function render(){
  const {L,s,notes}=scale(); $('u').value=u;$('uValue').textContent=u.toFixed(6);$('lValue').textContent=fmt(L);$('sValue').textContent=fmt(s);
  if(!ratioDirty||sweep)$('ratioValue').value=stepRatio(L,s);
  $('ratioValue').disabled=!!sweep;$('ratioApply').disabled=!!sweep;
  cursor.setAttribute('x1',x(u));cursor.setAttribute('x2',x(u));notes.forEach((p,i)=>{markers[i].setAttribute('cx',x(u));markers[i].setAttribute('cy',y(p));});
  $('notes').innerHTML=notes.map((p,i)=>`<tr><td style="color:${colors[i]}">${i}${i===notes.length-1?'（終端）':''}</td><td>${fmt(p)}</td><td>${fmt(MOS.frequency(p,numeric('ref',261.6255653)))}</td></tr>`).join('');
  $('region').textContent=L<0?'負のL — 音番号を保持したまま交差':Math.abs(L-s)<1e-7?'均衡点 — 等分された音階':Math.abs(L)<1e-7?'L = 0 — 複数の音が合流':L>s?'L > s — 正のステップ領域':'L < s — 大小関係が反転';
  [...$('presets').children].forEach((b,i)=>{b.disabled=word!=='LLsLLLs'||period!==1200;b.setAttribute('aria-pressed',Math.abs(u-presets[i][1])<1e-9);});
}
function retune(){if(!ctx)return;const now=ctx.currentTime, duration=numeric('glide',250)/1000;for(const v of voices){if(v.end<=now)continue;const t=Math.max(now,v.start), from=MOS.rampValue(v.ramp,t),to=target(v.id);v.osc.frequency.cancelScheduledValues(t);v.osc.frequency.setValueAtTime(from,t);if(duration)v.osc.frequency.exponentialRampToValueAtTime(to,t+duration);else v.osc.frequency.setValueAtTime(to,t);v.ramp={from,to,start:t,end:t+duration};}}
function setU(value){ratioDirty=false;$('ratioError').textContent='';$('ratioValue').removeAttribute('aria-invalid');u=Math.max(0,Math.min(1,value));render();retune();}
function stopSweep(){sweep=null;$('sweep').textContent='掃引開始';$('ratioValue').disabled=false;$('ratioApply').disabled=false;}
function updateSweep(){if(!sweep)return;const t=Math.min(1,(performance.now()-sweep.start)/sweep.duration);setU(sweep.from+(sweep.to-sweep.from)*t);if(t===1)stopSweep();}
function sequence(){
 $('sequence').innerHTML=order.map((id,i)=>`<div class="step" style="--voice:${colors[id]}"><small>STEP ${String(i+1).padStart(2,'0')}</small><strong>${id}</strong><button type="button" data-i="${i}" data-d="-1" aria-label="位置${i+1}の音を左へ" ${i===0?'disabled':''}>←</button> <button type="button" data-i="${i}" data-d="1" aria-label="位置${i+1}の音を右へ" ${i===order.length-1?'disabled':''}>→</button></div>`).join('');
 $('order').value=order.join(' ');active=-1;
}
function schedule(id,step,time,beat){
 const osc=ctx.createOscillator(),gain=ctx.createGain(),f=target(id),end=time+beat;
 osc.type=$('wave').value;osc.frequency.setValueAtTime(f,time);gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(1,time+.008);gain.gain.setValueAtTime(1,end-.025);gain.gain.linearRampToValueAtTime(0,end);
 osc.connect(gain);gain.connect(master);osc.start(time);osc.stop(end+.005);
 const v={osc,gain,id,start:time,end,ramp:{from:f,to:f,start:time,end:time}};voices.push(v);events.push({step,id,time});
 osc.onended=()=>{osc.disconnect();gain.disconnect();voices=voices.filter(w=>w!==v);};
}
function tick(){if(!running)return;updateSweep();const now=ctx.currentTime;if(nextTime<now-.1)nextTime=now+.01;while(nextTime<now+.075){const beat=60/numeric('bpm',120);schedule(order[nextStep],nextStep,nextTime,beat);nextTime+=beat;nextStep=(nextStep+1)%order.length;}}
async function play(){
 if(running||starting)return;starting=true;const token=++generation;$('play').disabled=true;
 try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error('このブラウザはWeb Audioに対応していません。');
 if(!ctx){ctx=new Audio();master=ctx.createGain();master.connect(ctx.destination);}
 await ctx.resume();if(token!==generation)return;master.gain.cancelScheduledValues(ctx.currentTime);master.gain.setValueAtTime(0,ctx.currentTime);master.gain.linearRampToValueAtTime(numeric('volume',.12),ctx.currentTime+.015);
 running=true;nextTime=ctx.currentTime+.035;nextStep=0;events=[];tick();timer=setInterval(tick,20);$('audioState').textContent='再生中';
 }catch(e){stop();$('audioState').textContent=e.message;}finally{starting=false;$('play').disabled=running;}
}
function stop(){generation++;running=false;clearInterval(timer);stopSweep();if(ctx){const t=ctx.currentTime;master.gain.cancelScheduledValues(t);master.gain.setValueAtTime(master.gain.value,t);master.gain.linearRampToValueAtTime(0,t+.015);for(const v of voices){v.osc.stop(t+.02);v.end=Math.min(v.end,t+.02);}}events=[];active=-1;[...$('sequence').children].forEach(e=>e.classList.remove('active'));$('audioState').textContent='停止中';$('play').disabled=false;}
function frame(){
 if(!running)updateSweep();
 if(running){const now=ctx.currentTime;while(events.length&&events[0].time<=now){const event=events.shift();active=event.step;$('audioState').textContent=`再生中 · 音 ${event.id}`;}[...$('sequence').children].forEach((e,i)=>e.classList.toggle('active',i===active));}
 sounding.replaceChildren();if(ctx&&running)for(const v of voices){const t=ctx.currentTime;if(t<v.start||t>=v.end)continue;const f=MOS.rampValue(v.ramp,t),p=1200*Math.log2(f/numeric('ref',261.6255653));svg('circle',{cx:x(u),cy:y(p),r:10,fill:'none',stroke:colors[v.id],'stroke-width':2},sounding);}
 requestAnimationFrame(frame);
}
presets.forEach(([name,value])=>{const b=document.createElement('button');b.textContent=name;b.onclick=()=>{stopSweep();setU(value);};$('presets').append(b);});
$('u').oninput=()=>{stopSweep();setU(Number($('u').value));};
$('ratioValue').oninput=()=>{ratioDirty=true;$('ratioError').textContent='';$('ratioValue').removeAttribute('aria-invalid');};
$('ratioForm').onsubmit=e=>{
 e.preventDefault();if(sweep||!ratioDirty)return;
 try{setU(MOS.positionFromRatio($('ratioValue').value,word));}
 catch(err){$('ratioError').textContent=err.message;$('ratioValue').setAttribute('aria-invalid','true');}
};
$('ratioValue').onkeydown=e=>{if(e.key==='Escape'){ratioDirty=false;$('ratioError').textContent='';$('ratioValue').removeAttribute('aria-invalid');render();}};
$('play').onclick=play;$('stop').onclick=stop;
$('ref').oninput=()=>{render();retune();};$('glide').onchange=retune;
$('volume').oninput=()=>{if(ctx&&running)master.gain.setTargetAtTime(numeric('volume',.12),ctx.currentTime,.01);};
$('sweep').onclick=()=>{if(sweep){stopSweep();return;}sweep={from:numeric('from',0),to:numeric('to',1),duration:numeric('seconds',20)*1000,start:performance.now()};setU(sweep.from);$('sweep').textContent='掃引停止';};
$('sequence').onclick=e=>{const b=e.target.closest('button');if(!b)return;const i=Number(b.dataset.i),j=i+Number(b.dataset.d);[order[i],order[j]]=[order[j],order[i]];sequence();$('sequence').children[j].querySelector(`[data-d="${b.dataset.d}"]`).focus();};
$('orderForm').onsubmit=e=>{e.preventDefault();try{order=MOS.permutation($('order').value,word.length+1);sequence();$('error').textContent='';}catch(err){$('error').textContent=err.message;}};
$('reset').onclick=()=>{order=Array.from({length:word.length+1},(_,i)=>i);sequence();$('error').textContent='';};
function applyScale(preserveOrder=false){
 try{const newWord=$('word').value.trim(),newPeriod=Number($('period').value);if(newPeriod<100||newPeriod>2400)throw Error('周期は100〜2400 centで指定してください。');MOS.pitches(u,newWord,newPeriod);stop();ratioDirty=false;$('ratioError').textContent='';$('ratioValue').removeAttribute('aria-invalid');word=newWord;period=newPeriod;if(!preserveOrder||order.length!==word.length+1)order=Array.from({length:word.length+1},(_,i)=>i);sequence();buildGraph();render();$('error').textContent='';$('scaleMessage').textContent=MOS.balanced(word)?'巡回的に均等な語です。縮退点・負領域を含むMOS由来の軌跡を表示します。':'この語は巡回的に均等ではありません。一般の2ステップ語として表示します（MOSとは限りません）。';}
 catch(e){$('scaleMessage').textContent=e.message;}
}
$('scaleForm').onsubmit=e=>{e.preventDefault();applyScale();};$('tritave').onclick=()=>{$('period').value=1200*Math.log2(3);applyScale();};$('defaultScale').onclick=()=>{$('word').value='LLsLLLs';$('period').value=1200;u=1/12;applyScale();};
function rotateWord(direction){
 if(!$('scaleForm').reportValidity())return;
 const current=$('word').value.trim();
 try{
  MOS.pitches(u,current,Number($('period').value));
  $('word').value=direction==='left'?current.slice(1)+current[0]:current.at(-1)+current.slice(0,-1);
  applyScale(true);
 }catch(e){$('scaleMessage').textContent=e.message;}
}
$('rotateLeft').onclick=()=>rotateWord('left');
$('rotateRight').onclick=()=>rotateWord('right');
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});window.addEventListener('pagehide',stop);
buildGraph();sequence();render();requestAnimationFrame(frame);

/* An isolated, seekable replay: no timers and no writes to the live exploration. */
(function(){
'use strict';
const $=id=>document.getElementById(id),panel=$('kleinReplay'),slider=$('replayPosition'),svg=$('replayMap');
let frames;
function element(tag,attributes,text){const node=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [key,value] of Object.entries(attributes))node.setAttribute(key,value);if(text!==undefined)node.textContent=text;return node;}
function draw(step){
 const repeated=$('replayMode').value==='repeat';
 if(!frames)frames=MazeKleinComparison.roundTrip($('replayMode').value);
 $('replayInstructions').textContent=repeated?'主観操作：右24歩→上2歩→右24歩→下2歩。真世界では右24歩→下2歩を2回たどります。':'主観操作：右24歩→上2歩→下2歩→左24歩。後半は来た経路を逆に戻ります。';
 step=Math.max(0,Math.min(52,step));slider.value=step;const frame=frames[step],nodes=[];
 const label=(x,y,text)=>nodes.push(element('text',{x,y,fill:'#b9dbc6','font-size':14},text));
 label(30,24,'真世界（24 × 20）');label(350,24,'展開された主観座標');
 nodes.push(element('rect',{x:30,y:42,width:240,height:200,fill:'none',stroke:'#526b70'}));
 const positions=[f=>[30+(f.id%24+.5)*10,42+(Math.floor(f.id/24)+.5)*10],f=>[350+f.x*5,150+f.y*5]];
 for(const [view,position] of positions.entries()){
  for(let i=1;i<=step;i++){
   if(view===0&&frames[i].seam)continue;
   const [x1,y1]=position(frames[i-1]),[x2,y2]=position(frames[i]);
   nodes.push(element('line',{x1,y1,x2,y2,stroke:i<=26?'#edba72':'#75c5db','stroke-width':i<=26?5:2}));
  }
  const [sx,sy]=position(frames[0]);nodes.push(element('circle',{cx:sx,cy:sy,r:6,fill:'none',stroke:'#b9dbc6'}));
  const [x,y]=position(frame);nodes.push(element('circle',{cx:x,cy:y,r:10,fill:'#b9dbc6'}));nodes.push(element('text',{x,y:y+5,'text-anchor':'middle',fill:'#10252b','font-size':15},'@'));
 }
 label(350,180,`縮尺：1マス 5（図の単位）`);
 label(350,205,`主観位置 (${frame.x}, ${frame.y})`);label(350,230,`真世界の上 → 主観の${frame.flipped?'下':'上'}`);
 svg.replaceChildren(...nodes);svg.setAttribute('aria-label',`${step}歩目、主観位置${frame.x},${frame.y}、${frame.flipped?'上下反転':'通常の向き'}`);
 const interval=frame.interval,t=interval?MazeKlein.intervalTransform(interval):null;
 $('replayStatus').textContent=`${step} / 52歩。${step===0?'出発点です。':`直前の主観操作：${{N:'上',S:'下',E:'右',W:'左'}[frame.direction]}。`}${step===26?'同じ実セルへ帰還しましたが、上下は反転しています。':step===52?(repeated?'真世界の位置と向きは戻りましたが、主観位置は右48マス先です。':'位置・向き・主観座標が出発時に戻りました。'):''} 境界列：${frame.path.recent}。${t?`直近の帰還区間：出発時の向きをそろえると横 ${t.dx} / 縦 ${t.dy}、${t.flipped?'反転':'向き維持'}。`:''}`;
 $('replayPrev').disabled=step===0;$('replayNext').disabled=step===52;
}
$('replayMode').addEventListener('change',()=>{frames=undefined;draw(Number(slider.value));});
panel.addEventListener('toggle',()=>{if(panel.open)draw(Number(slider.value));});
slider.addEventListener('input',()=>draw(Number(slider.value)));
for(const [id,value] of [['replayStart',0],['replayTurn',26],['replayEnd',52]])$(id).addEventListener('click',()=>draw(value));
$('replayPrev').addEventListener('click',()=>draw(Number(slider.value)-1));
$('replayNext').addEventListener('click',()=>draw(Number(slider.value)+1));
})();

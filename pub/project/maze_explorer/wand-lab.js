(()=>{'use strict';
const $=id=>document.getElementById(id),canvas=$('map'),ctx=canvas.getContext('2d'),E=WandEngine;
const rows=['....................','..####......####....','..#.................','..#....##...........','..R..............#..','.......##....##.....','..........#.........','..###.....#.........','....................','.....####.....###...','....................','....................'];
let lastWandHint=-10,readSigns=new Set(),seamFlash=false,regions=new Map(),items=[],aim=null,tail=null,world,actors,memory,turn=0,busy=false,animation=null,frame=0;
const player=()=>actors[0];
const region=()=>player().region||'normal';
const localActors=()=>actors.filter(a=>(a.region||'normal')===region());
function syncRegion(){
 if(!regions.has(region())){
  regions.set(region(),{world:E.oobRoom(Number(region().slice(4))),memory:new Set(),items:[]});
 }
 ({world,memory,items}=regions.get(region()));
 if(localActors().some(a=>a!==player()&&a.id===player().id)){
  const queue=[player().id],seen=new Set(queue);
  for(const id of queue){if(!localActors().some(a=>a!==player()&&a.id===id)){player().id=id;break;}for(let d=0;d<4;d++){const n=E.next(world,id,d);if(n!==null&&!['#','R'].includes(world.cells[n])&&!seen.has(n)){seen.add(n);queue.push(n);}}}
 }

}
function returnHome(){
 if(busy||region()==='normal')return;
 const home=regions.get('normal'),reachable=new Set([player().returnId??86]),queue=[...reachable];
 for(const id of queue)for(let d=0;d<4;d++){const n=E.next(home.world,id,d);if(n!==null&&!['#','R'].includes(home.world.cells[n])&&!reachable.has(n)){reachable.add(n);queue.push(n);}}
 const free=home.world.cells.map((c,id)=>({c,id})).filter(p=>reachable.has(p.id)&&!['#','R'].includes(p.c)&&!actors.some(a=>a.key!=='@'&&(a.region||'normal')==='normal'&&a.id===p.id));
 if(!free.length){log('帰還先の床が空いていません。');return;}
 player().region='normal';player().id=free[Math.floor(Math.random()*free.length)].id;aim=null;turn++;syncRegion();log('緊急脱出口から元の迷路へ戻りました。地図の記憶は残っています。');draw();
}
function oobDemo(keep=false){
 if(busy&&keep)return;
 $('boundary').value='torus';if(!keep)reset();else{player().region='normal';player().frozen=0;syncRegion();world.wrap=true;}const d=Number($('oobDirection').value),x=d===1?19:d===3?0:10,y=d===0?0:d===2?11:6;
 player().id=y*20+x;let at=player().id;world.cells[at]='.';for(let i=0;i<2;i++){at=E.next(world,at,(d+2)%4);world.cells[at]=i===1?'R':'.';}
 $('spell').value='push';aim=(d+2)%4;log((keep?'記憶を保持して再配置。':'')+'OOB再現配置：Enterで反射壁へ発射すると、自分が外側へ吹き飛びます。');draw();
}
const inscriptions=new Map([[67,'反射した力は、世界の継ぎ目をほどく。'],[97,'同じ道は続いても、杖の光は一瞬だけ色を失う。'],[187,'壁へ向けた力が戻るとき、足元が世界の縁ならば、その先へ。']]);
function inspectSigns(manual=false){
 if(!$('hints').checked||region()!=='normal')return;
 const visible=observe(),x=player().id%world.width,y=Math.floor(player().id/world.width);let found=false;
 for(const [id,text]of inscriptions){let dx=Math.abs(id%world.width-x),dy=Math.abs(Math.floor(id/world.width)-y);if(world.wrap){dx=Math.min(dx,world.width-dx);dy=Math.min(dy,world.height-dy);}
 if(visible.has(id)&&dx+dy<=2&&world.cells[id]==='#'){found=true;if(manual||!readSigns.has(id)){log('壁の文章：「'+text+'」');readSigns.add(id);}}}
 if(manual&&!found)log('近くに読める壁の文章はありません。');
}
function log(text){const li=document.createElement('li');li.textContent=turn+'：'+text.replace(/\bc\b/g,'f');$('log').append(li);while($('log').children.length>100)$('log').firstChild.remove();$('log').scrollTop=$('log').scrollHeight;}
function observe(){const visible=new Set([player().id]),queue=[[player().id,0]];for(const [id,dist]of queue){if(dist>=6)continue;for(let d=0;d<4;d++){const n=E.next(world,id,d);if(n===null||visible.has(n))continue;visible.add(n);if(!['#','R'].includes(world.cells[n]))queue.push([n,dist+1]);}}for(const n of visible)memory.add(n);return visible;}
function draw(){const seamless=world.wrap&&$('seamless').checked;const visible=observe(),w=canvas.clientWidth,h=canvas.clientHeight,dpr=devicePixelRatio||1;canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#0b161c';ctx.fillRect(0,0,w,h);const cols=seamless?Math.max(3,2*Math.floor((w-16)/48)+1):world.width,rows=seamless?15:world.height,size=Math.min(24,(w-16)/cols,(h-16)/rows),ox=(w-cols*size)/2,oy=(h-rows*size)/2;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`${size*.8}px Consolas,monospace`;
const tiles=seamless?E.viewTiles(world,player().id,cols,rows):[...memory].map(id=>({id,x:id%world.width,y:Math.floor(id/world.width)}));
for(const tile of tiles){const {id}=tile;if(!memory.has(id))continue;const x=ox+tile.x*size,y=oy+tile.y*size,wall=['#','R'].includes(world.cells[id]),a=visible.has(id)?localActors().find(a=>a.id===id):null;ctx.fillStyle=a?.key==='@'?'#fff5a9':a?.key==='d'?'#79552f':a?.key==='c'?'#355b7e':a?'#66467d':wall?(visible.has(id)?'#738c8b':'#34474b'):(visible.has(id)?(world.floorColor||'#39625a'):'#1a3334');ctx.fillRect(x,y,size-1,size-1);ctx.fillStyle=a?.key==='@'?'#111':world.cells[id]==='R'?'#ff9dcc':visible.has(id)?'#e3dab0':'#718582';ctx.fillText((a?.key==='c'?'f':a?.key)||(wall?'#':items.some(item=>item.id===id)?'/':world.cells[id]),x+size/2,y+size/2);}
for(const tile of tiles){const glyph=tail?.id===tile.id?'↶':animation===tile.id?(seamFlash&&$('hints').checked?'◇':'*'):null;if(glyph){ctx.fillStyle='#b66fd1';ctx.fillRect(ox+tile.x*size,oy+tile.y*size,size-1,size-1);ctx.fillStyle=seamFlash&&$('hints').checked&&!tail?'#e4ffff':'#ffb4df';ctx.fillText(glyph,ox+(tile.x+.5)*size,oy+(tile.y+.5)*size);}}

$('aim').textContent=aim===null?'歩行中：1〜4で杖を構えます。':'発射準備：'+E.names[$('spell').value]+'・'+['上','右','下','左'][aim]+'向き（Enterで発射／Escで解除）';$('cast').disabled=aim===null||busy;
$('returnHome').disabled=busy||region()==='normal';
$('status').textContent=(region()==='normal'?'通常領域':('外側・'+['上','右','下','左'][Number(region().slice(4))]))+' ／ OOB発見 '+[0,1,2,3].filter(d=>regions.has('oob-'+d)).length+'/4 ／ '+turn+'ターン ／ '+E.names[$('spell').value]+(seamless?' ／ 主観トーラス':(' ／ @ '+player().id%world.width+','+Math.floor(player().id/world.width)))+' ／ 記憶 '+memory.size+'マス ／ '+actors.filter(a=>a.frozen).map(a=>a.key+' 金縛り残り'+a.frozen).join('・')+' ／ Vの杖：'+(actors[1].wands||[]).map(n=>E.names[n]).join('・')+(actors[1].dormant?'（外側で休眠）':'');}
function enemyTurn(skip=null){for(const pet of localActors().filter(a=>['c','d'].includes(a.key)))E.petStep(world,localActors(),pet);if($('hints').checked){const visible=observe();for(const pet of localActors().filter(a=>['c','d'].includes(a.key)&&visible.has(a.id))){const hint=E.petHint(world,pet,turn);if(hint)log(hint);}}for(const a of localActors()){if(a.key===skip||a.dormant)continue;if(a.frozen){a.frozen--;continue;}if(a.key!=='V'||!$('birds').checked)continue;const shot=E.birdCast(world,localActors(),a,turn);if(shot&&Math.random()<.5){a.nextCastTurn=turn+10;a.casts=(a.casts||0)+1;log('V が '+shot.target+' に向かって '+E.names[shot.spell]+'の杖を振りました！');castAnimated('V',shot.direction,shot.spell);return;}const item=E.birdStep(world,localActors(),a,items,turn);if(item)log('V が '+E.names[item.spell]+'の杖 / を拾いました。');}}
function reset(){lastWandHint=-10;readSigns=new Set();seamFlash=false;cancelAnimationFrame(frame);busy=false;animation=null;aim=null;tail=null;items=[{id:93,spell:'freeze'},{id:152,spell:'push'}];world={width:20,height:12,cells:rows.join('').split(''),wrap:$('boundary').value==='torus',oob:true};actors=[{key:'@',id:86,frozen:0},{key:'V',id:92,frozen:0},{key:'c',id:66},{key:'d',id:126}];memory=new Set();regions=new Map([['normal',{world,memory,items}]]);turn=0;$('log').replaceChildren();log('右にVと杖 /、上に猫 f、下に犬 d、左に反射壁があります。');draw();}
function frozen(){if(!player().frozen)return false;turn++;enemyTurn();log('金縛りで動けません。1ターン経過しました。');draw();return true;}
function move(d){if(busy||frozen())return;const n=E.next(world,player().id,d);if(n===null||['#','R'].includes(world.cells[n])||localActors().some(a=>a.id===n))return;player().id=n;turn++;inspectSigns();enemyTurn();if(world.cells[n]==='>')log('緊急脱出口です。> キーまたは「緊急帰還」で元の迷路へ戻れます。');if(world.cells[n]==='X')log('特別な迷路への入口は工事中です。');draw();}
function wait(){if(busy)return;turn++;enemyTurn();draw();}
function castAnimated(source,d,spell,after){const nextActors=actors.map(a=>({...a})),result=E.cast(world,nextActors,source,d,spell),path=E.animationPath(result.path,source,observe());busy=true;let index=0,last=0;
function finish(){animation=null;tail=null;busy=false;actors=nextActors;syncRegion();log(result.message);if(result.oob!==undefined&&result.target==='@')log('隣の > が緊急脱出口です。X の先は工事中です。');after?.(result);draw();}
if(!path.length){finish();return;}
function animate(time){if(time-last>=30){last=time;const point=path[index++];animation=point?.id??null;seamFlash=!!point?.seam;tail=point?.tail?point:null;if(tail)log(tail.tail+' がくるりと反転し、尻尾で魔法弾を跳ね返しました！');draw();}if(index<=path.length){frame=requestAnimationFrame(animate);return;}finish();}frame=requestAnimationFrame(animate);}

function fire(d){if(busy||frozen())return;aim=null;turn++;castAnimated('@',d,$('spell').value,result=>enemyTurn(result.target));}
function arm(d=1){if(busy)return;aim=d;if($('hints').checked&&E.nearSeam(world,player().id)&&turn-lastWandHint>=5){log('杖先がかすかに震えた。どちらからとも分からない気配がします。');lastWandHint=turn;}draw();}
$('fire').querySelectorAll('button').forEach(b=>b.onclick=()=>arm(Number(b.dataset.dir)));$('reset').onclick=reset;$('inspectSigns').onclick=()=>inspectSigns(true);$('oobDemo').onclick=()=>oobDemo();$('oobRevisit').onclick=()=>oobDemo(true);$('returnHome').onclick=returnHome;$('boundary').onchange=reset;$('seamless').onchange=draw;$('spell').onchange=()=>arm();$('wait').onclick=wait;$('cast').onclick=()=>{if(aim!==null)fire(aim);};$('cancel').onclick=()=>{if(!busy){aim=null;draw();}};
document.addEventListener('keydown',e=>{if(e.target.closest('input,select,textarea')||e.ctrlKey||e.altKey||e.metaKey)return;const d=['ArrowUp','ArrowRight','ArrowDown','ArrowLeft'].indexOf(e.key);if(e.key==='>'&&region()!=='normal'&&world.cells[player().id]==='>'){e.preventDefault();returnHome();}else if(d>=0){e.preventDefault();if(aim!==null)arm(d);else move(d);}else if(e.key==='Enter'&&aim!==null){e.preventDefault();fire(aim);}else if(e.key==='Escape'){if(!busy){aim=null;draw();}}else if(e.key==='.') {e.preventDefault();wait();}else if(/^[1-4]$/.test(e.key)&&!busy){e.preventDefault();$('spell').selectedIndex=Number(e.key)-1;arm();}});
new ResizeObserver(draw).observe(canvas);reset();
})();

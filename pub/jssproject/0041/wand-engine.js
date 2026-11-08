/* Turn-independent wand tracing. The caller owns turns, rendering and memory. */
(function(root){'use strict';
const directions=[[0,-1],[1,0],[0,1],[-1,0]],names={freeze:'金縛り',push:'吹き飛ばし',swap:'場所替え',pull:'引き寄せ'};
function next(w,id,d){if(w.step)return w.step(id,d);const [dx,dy]=directions[d];let x=id%w.width+dx,y=Math.floor(id/w.width)+dy;if(w.wrap){x=(x+w.width)%w.width;y=(y+w.height)%w.height;}if(x<0||y<0||x>=w.width||y>=w.height)return null;return y*w.width+x;}
function cast(w,actors,sourceKey,d,spell){
 if(!names[spell]||!Number.isInteger(d)||d<0||d>3)throw Error('杖または方向が不正です。');
 const source=actors.find(a=>a.key===sourceKey);if(!source)throw Error('発射者がいません。');
 const origin=source.id,path=[],seen=new Set();let id=origin,dir=d,reflected=false,reflections=0,pullAnchor=origin,pullDistance=0;
 const occupied=id=>actors.find(a=>(a.region||'normal')===(source.region||'normal')&&a.id===id);
 for(let i=0;i<w.width*w.height*28+1;i++){
  const key=id+':'+dir+':'+reflections;if(seen.has(key))return {path,message:'魔法弾は周回して消えました。'};seen.add(key);
  let to=next(w,id,dir);const mirror=to===null?w.reflect?.(id,dir):null;if(mirror){path.push({id:mirror.id,reflection:true});if(++reflections>5)return {path,reflections,message:'反射が5回を超え、魔法弾はかき消えました。'};dir=(dir+2)%4;pullAnchor=mirror.id;pullDistance=0;reflected=true;to=id;}if(to===null)return {path,message:'魔法弾は外周で消えました。'};
  if(w.cells[to]==='#')return {path,message:'魔法弾は壁に当たりました。'};
  const seam=w.seam?.(id,dir)||w.wrap&&next({...w,wrap:false},id,dir)===null;
  if(w.cells[to]==='R'){path.push({id:to,reflection:true,...(seam?{seam:true}:{})});if(++reflections>5)return {path,reflections,message:'反射が5回を超え、魔法弾は効力を失ってかき消えました。'};dir=(dir+2)%4;id=to;pullAnchor=to;pullDistance=0;reflected=true;continue;}
  path.push({id:to,...(seam?{seam:true}:{})});id=to;pullDistance++;const target=occupied(id);if(!target)continue;
  if(['c','d'].includes(target.key)){path[path.length-1].tail=target.key;if(++reflections>5)return {path,reflections,message:'反射が5回を超え、魔法弾は効力を失ってかき消えました。'};dir=(dir+2)%4;pullAnchor=id;pullDistance=0;reflected=true;continue;}
  const from=target.id;let caughtBy=null;
  if(spell==='freeze')target.frozen=Math.max(target.frozen||0,5);
  if(spell==='swap'&&target!==source){source.id=target.id;target.id=origin;}
  if(spell==='push'){
   const escape=reflected?w.escape?.(target.id,dir):null;if(escape!=null&&!occupied(next(w,target.id,dir)))return {path,target:target.key,from,to:target.id,reflected,oob:escape,message:'反射した吹き飛ばしで境界の外へ出ました。'};
   if(w.oob&&w.wrap&&reflected&&(target.region||'normal')==='normal'&&next({...w,wrap:false},target.id,dir)===null&&!['#','R'].includes(w.cells[next(w,target.id,dir)])&&!occupied(next(w,target.id,dir))){
    target.returnId=from;target.region='oob-'+dir;target.id=Math.floor(w.height/2)*w.width+Math.floor(w.width/2);target.dormant=target.key==='V';
    return {path,target:target.key,from,to:target.id,reflected,oob:dir,message:target.key+' は境界の'+['上','右','下','左'][dir]+'へはみ出しました。'+(target.dormant?'鳥人間は休眠しています。':'ここはどこでもありません。')};
   }
   const walked=new Set([target.id]);
   while(true){const n=next(w,target.id,dir);if(n!==null&&['c','d'].includes(occupied(n)?.key)){caughtBy=occupied(n).key;break;}if(n===null||['#','R'].includes(w.cells[n])||occupied(n)||walked.has(n))break;walked.add(n);target.id=n;}
  }
  if(spell==='pull'){
   // Attraction points opposite the arriving ray; do not rewind its route.
   // An unreflected full lap hits the caster and moves it one cell backward.
   const distance=target===source&&!reflected?1:Math.max(0,pullDistance-1),toward=(dir+2)%4,walked=new Set([target.id]);
   for(let step=0;step<distance;step++){
    const n=next(w,target.id,toward);
    if(n===null||n===pullAnchor||['#','R'].includes(w.cells[n])||occupied(n)||walked.has(n))break;
    walked.add(n);target.id=n;
   }
  }
  return {path,target:target.key,from,to:target.id,reflected,reflections,...(caughtBy?{caughtBy}:{}),message:(reflected?'反射した':'')+names[spell]+'が '+target.key+' に命中しました。'+(spell==='freeze'?' 5ターン停止します。':'')+(caughtBy?(caughtBy==='c'?' 猫 f は':' 犬 d は')+(target.key==='@'?'あなた':'鳥人間 '+target.key)+(caughtBy==='c'?'を猫パンチで叩き落としました。':'を空中でキャッチして吠えています！'):'' )};
 }
 return {path,message:'魔法弾は消えました。'};
}
function pickup(actor,items){const i=items.findIndex(item=>item.id===actor.id);if(i<0)return null;const [item]=items.splice(i,1);actor.wands=[...(actor.wands||[]),item.spell];return item;}
function birdStep(w,actors,bird,items,turn,random=Math.random){
 const old=bird.id;
 const occupied=id=>actors.some(a=>a!==bird&&a.id===id),queue=[bird.id],parents=new Map([[bird.id,null]]);let target=null;
 for(const id of queue){if(items.some(item=>item.id===id)){target=id;break;}for(let d=0;d<4;d++){const n=next(w,id,d);if(n!==null&&!['#','R'].includes(w.cells[n])&&!occupied(n)&&!parents.has(n)){parents.set(n,id);queue.push(n);}}}
 if(target!==null){let at=target;while(parents.get(at)!==null&&parents.get(at)!==bird.id)at=parents.get(at);bird.id=at;}
 else{let choices=[0,1,2,3].map(d=>next(w,bird.id,d)).filter(n=>n!==null&&!['#','R'].includes(w.cells[n])&&!occupied(n));const forward=choices.filter(n=>n!==bird.previous);if(forward.length)choices=forward;if(choices.length)bird.id=choices[Math.floor(random()*choices.length)];}
 if(bird.id!==old)bird.previous=old;
 return pickup(bird,items);
}
function birdCast(w,actors,bird,turn){
 const spells=(bird.wands||[]).filter(spell=>names[spell]);
 if(!spells.length||bird.frozen||turn<(bird.nextCastTurn||0))return null;
 let best=null;
 for(let d=0;d<4;d++){let id=bird.id;const seen=new Set([id]);
  for(let distance=1;distance<=w.width*w.height;distance++){
   id=next(w,id,d);if(id===null||seen.has(id)||['#','R'].includes(w.cells[id]))break;seen.add(id);
   const target=actors.find(a=>a!==bird&&a.id===id);
   if(target){if(['@','c','d'].includes(target.key)&&(!best||distance<best.distance))best={direction:d,distance,target:target.key,spell:spells[(bird.casts||0)%spells.length]};break;}
  }
 }
 return best;
}
// Pets wander once per turn; animation itself never advances their movement.
function petStep(w,actors,pet,random=Math.random){
 if(pet.rest>0){pet.rest--;return;}
 if(random()<(pet.key==='c'?.12:.04)){pet.rest=pet.key==='c'?2+Math.floor(random()*4):1;return;}
 let choices=[0,1,2,3].map(d=>next(w,pet.id,d)).filter(n=>n!==null&&!['#','R'].includes(w.cells[n])&&!actors.some(a=>a!==pet&&a.id===n));
 const onward=choices.filter(n=>n!==pet.previous);
 if(onward.length)choices=onward;
 if(choices.length){const old=pet.id;pet.id=choices[Math.floor(random()*choices.length)];pet.previous=old;}
}
// Four independent, non-wrapping rooms with a shared safe entry/exit area.
function oobRoom(direction){
 if(!Number.isInteger(direction)||direction<0||direction>3)throw Error('OOB方向が不正です。');
 const width=20,height=12,cells=Array(width*height).fill('.');
 const wall=(x,y)=>cells[y*width+x]='#';
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(!x||!y||x===width-1||y===height-1)wall(x,y);
 if(direction===0)for(const x of [4,8,12,16])for(const y of [4,8])wall(x,y);
 if(direction===1)for(let y=4;y<=9;y++)for(const x of [5,15])if(y!==7)wall(x,y);
 if(direction===2)for(let x=3;x<=16;x++)for(const y of [4,9])if(x!==6&&x!==13)wall(x,y);
 if(direction===3)for(let y=4;y<=9;y++){wall(3+Math.floor((y-4)/2),y);wall(16-Math.floor((y-4)/2),y);}
 [...'THIS IS NOWHERE'].forEach((ch,i)=>cells[2*width+2+i]=ch===' '?'.':ch);
 [...['NORTH','EAST','SOUTH','WEST'][direction]].forEach((ch,i)=>cells[5*width+8+i]=ch);
 cells[6*width+11]='>';cells[8*width+10]='X';
 return {width,height,cells,wrap:false,floorColor:['#304e73','#635036','#385c4d','#573d68'][direction]};
}
function nearSeam(w,id){const x=id%w.width,y=Math.floor(id/w.width);return !!w.wrap&&Math.min(x,w.width-1-x,y,w.height-1-y)<=1;}
function petHint(w,pet,turn,random=Math.random){
 if(!w.wrap||turn<(pet.nextHintTurn||0))return null;
 // Ordinary gestures can also occur away from the seam, so this is not a detector.
 if(random()> (nearSeam(w,pet.id)?.3:.04))return null;
 pet.nextHintTurn=turn+8;
 const dialogue=typeof module==='object'?require('./wand-dialogue.js'):root.WandDialogue,lines=dialogue?.[pet.key]?.[nearSeam(w,pet.id)?'boundary':'ordinary'];
 return lines?.length?lines[Math.floor(random()*lines.length)]:pet.key+' が何かの気配を感じています。';
}
function viewTiles(w,center,cols,rows){
 const tiles=[],cx=center%w.width,cy=Math.floor(center/w.width);
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
  const wx=((cx+x-Math.floor(cols/2))%w.width+w.width)%w.width,wy=((cy+y-Math.floor(rows/2))%w.height+w.height)%w.height;
  tiles.push({id:wy*w.width+wx,x,y});
 }
 return tiles;
}
// Presentation only: do not shorten the actual ray used for collisions/effects.
function animationPath(path,source,visible){return path.filter(point=>visible.has(point.id));}
const api={cast,next,names,pickup,birdStep,birdCast,petStep,animationPath,oobRoom,viewTiles,nearSeam,petHint};if(typeof module==='object')module.exports=api;else root.WandEngine=api;
})(globalThis);

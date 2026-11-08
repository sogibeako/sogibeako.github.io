(function(root){
'use strict';
const WANDS=['金縛り','吹き飛ばし','場所替え','身代わり'];
const FLAVOR=typeof module!=="undefined"?require("./dialogue.js"):ARIADNE_FLAVOR;
const BRANCH_PUZZLES={"7":[{"points":[[100,150],[290,45],[290,150],[290,255],[520,65],[520,235],[760,150]],"edges":[[0,5],[0,3],[4,6],[5,6],[1,4],[2,6],[0,2],[3,5],[1,2]],"exit":1,"enemy":4,"name":"分かれ道の罠"},{"points":[[100,150],[290,45],[290,150],[290,255],[520,65],[520,235],[760,150]],"edges":[[4,5],[3,4],[5,6],[4,6],[0,3],[2,4],[1,2],[0,1]],"exit":6,"enemy":2,"name":"三角の抜け道"},{"points":[[100,150],[290,45],[290,150],[290,255],[520,65],[520,235],[760,150]],"edges":[[2,6],[4,6],[2,4],[0,3],[1,4],[0,5],[0,1],[2,5]],"exit":6,"enemy":2,"name":"誘いの回廊"},{"points":[[100,150],[290,45],[290,150],[290,255],[520,65],[520,235],[760,150]],"edges":[[0,3],[0,1],[2,6],[4,6],[5,6],[2,5],[0,5],[3,5],[1,4]],"exit":6,"enemy":2,"name":"遠回りの広間"},{"points":[[100,150],[290,45],[290,150],[290,255],[520,65],[520,235],[760,150]],"edges":[[0,5],[0,2],[1,4],[0,3],[0,1],[5,6],[4,6],[2,5],[2,4]],"exit":6,"enemy":4,"name":"三つ又の回廊"},{"points":[[100,150],[290,45],[290,150],[290,255],[520,65],[520,235],[760,150]],"edges":[[3,5],[0,4],[2,6],[0,3],[4,6],[5,6],[2,3],[2,4],[0,2],[0,1]],"exit":6,"enemy":5,"name":"枝分かれの広間"},{"points":[[100,150],[290,45],[290,150],[290,255],[520,65],[520,235],[760,150]],"edges":[[5,6],[2,6],[0,5],[0,1],[0,2],[1,4],[2,4],[1,2],[3,5],[0,3],[4,6]],"exit":6,"enemy":4,"name":"二重の抜け道"},{"points":[[100,150],[290,45],[290,150],[290,255],[520,65],[520,235],[760,150]],"edges":[[2,5],[1,4],[3,5],[2,3],[2,6],[4,6],[0,1],[0,3],[5,6],[2,4]],"exit":6,"enemy":2,"name":"交わる分岐"}],"8":[{"points":[[100,150],[280,40],[280,150],[280,260],[500,55],[500,245],[660,150],[800,150]],"edges":[[3,5],[2,3],[6,7],[5,6],[2,6],[4,7],[1,4],[5,7],[0,2],[4,6],[2,5],[0,4]],"exit":3,"enemy":5,"name":"分かれ道の罠"},{"points":[[100,150],[280,40],[280,150],[280,260],[500,55],[500,245],[660,150],[800,150]],"edges":[[0,4],[3,4],[0,2],[5,6],[3,5],[1,4],[6,7],[4,7],[0,1],[5,7],[3,6],[2,3]],"exit":2,"enemy":3,"name":"三角の抜け道"},{"points":[[100,150],[280,40],[280,150],[280,260],[500,55],[500,245],[660,150],[800,150]],"edges":[[2,6],[0,1],[0,3],[1,2],[4,7],[2,4],[5,7],[1,4],[6,7],[0,5],[2,5],[4,6]],"exit":7,"enemy":4,"name":"誘いの回廊"},{"points":[[100,150],[280,40],[280,150],[280,260],[500,55],[500,245],[660,150],[800,150]],"edges":[[1,5],[4,6],[2,3],[1,4],[2,5],[3,5],[5,7],[6,7],[1,2],[0,2]],"exit":7,"enemy":6,"name":"遠回りの広間"},{"points":[[100,150],[280,40],[280,150],[280,260],[500,55],[500,245],[660,150],[800,150]],"edges":[[5,6],[0,2],[5,7],[4,7],[3,5],[1,4],[0,3],[1,6],[2,6],[1,2],[4,6],[6,7],[0,1],[2,3]],"exit":7,"enemy":4,"name":"網目の広間"},{"points":[[100,150],[280,40],[280,150],[280,260],[500,55],[500,245],[660,150],[800,150]],"edges":[[5,7],[5,6],[0,5],[1,2],[0,3],[4,7],[0,1],[2,6],[4,6],[1,4],[1,6]],"exit":7,"enemy":4,"name":"袋小路と迂回路"},{"points":[[100,150],[280,40],[280,150],[280,260],[500,55],[500,245],[660,150],[800,150]],"edges":[[3,5],[1,4],[4,7],[1,2],[2,5],[0,3],[0,2],[1,6],[2,3],[2,6],[5,7],[5,6],[0,1]],"exit":7,"enemy":6,"name":"二重の回廊"},{"points":[[100,150],[280,40],[280,150],[280,260],[500,55],[500,245],[660,150],[800,150]],"edges":[[6,7],[1,2],[2,3],[3,6],[3,5],[4,7],[0,1],[3,4],[5,6],[1,4]],"exit":7,"enemy":3,"name":"橋と分岐"}]};
class Game{
 constructor(random=Math.random,flavorRandom=Math.random,difficulty='hard'){this.difficulty=difficulty==='normal'?'normal':'hard';this.random=random;this.flavorRandom=flavorRandom;this.floor=1;this.turn=0;this.maxHp=100;this.hp=100;this.regen=0;this.score=0;this.kills=0;this.currentLevel=1;this.levelKills=0;this.charges=[0,0,0,0];this.logs=[];this.sounds=[];this.dead=false;this.won=false;this.emblem=false;this.emblemFloor=this.int(15,24);this.debug=false;this.playerFrozen=false;this.freezeGrace=false;this.confused=0;this.wandsAcquired=0;this.megaCriticalsReceived=0;this.lastAction=null;this.lastDamage=null;this.defeatCategory=null;this.generate();}
 classifyDefeat(){const hit=this.lastDamage;
  if(hit?.critical&&hit.mega&&hit.megaCriticalNumber===1)return 'D';
  if(hit?.critical&&this.charges.some(n=>n>0)&&hit.hpBefore>hit.normalMax)return 'C';
  if(hit&&!hit.magic&&!hit.critical&&this.wandsAcquired>0&&this.charges.every(n=>n===0))return 'B';
  if(hit&&!hit.magic&&this.lastAction==='move'&&hit.stationary)return 'E';
  if(this.floor<=2)return 'A';return 'default';
 }
 sound(name){this.sounds.push(name);}
 takeSounds(){return this.sounds.splice(0);}
 get ended(){return this.dead||this.won;}
 get secondLoop(){return this.floor>25;}
 get level(){return this.currentLevel;}
 get killsToLevel(){return this.level<10?this.level+2:this.level-7;}
 get swordBase(){return 17+Math.floor((this.level-1)*3/2);}
 get swordRange(){return this.level>=15?5:this.level>=5?4:3;}
 enemyName(enemy){return enemy.decoy?'身代わり':enemy.phantom?'量子の幻影':enemy.builder?'迷宮殺しのミノタウロス':enemy.quantum?'量子メガタウロス':enemy.mage?'ミノタウロスメイジ':enemy.underworld?'冥界のミノタウロス':enemy.immortal?'不死のミノタウロス':enemy.hero?'豪傑のミノタウロス':enemy.mega?'メガタウロス':'ミノタウロス';}
 enemyInfo(enemy){
  const original=this.enemyName({...enemy,decoy:false}),lines=[enemy.decoy?`身代わり @（元：${original}）`:original,`HP ${enemy.immortal?'∞':enemy.hp} / ${enemy.immortal?'∞':enemy.maxHp??(enemy.mega?90:45)}`];
  const scale=(enemy.damageScale??1)*(this.emblem?1.2:1),bonus=enemy.hero?this.heroBonus():0,range=(low,high)=>`${Math.floor((low+bonus)*scale)}〜${Math.floor((high+bonus)*scale)}`;
  if(enemy.decoy)lines.push('不規則に移動する囮。敵はこちらを追い、あなたを見失う。');
  else if(enemy.phantom)lines.push('攻撃しない幻影。一撃で消滅。得点・経験値なし。');
  else if(enemy.underworld)lines.push('接触すると次の階へ強制転送。身代わりへの攻撃で両者消滅。');
  else lines.push(`対あなた：通常 ${range(enemy.mega?30:17,enemy.mega?50:23)}／痛恨 ${range(enemy.mega?71:51,enemy.mega?89:69)}（16%）${this.emblem?' · 紋章×1.2込み':''}`);
  if(enemy.mage)lines.push(`杖：${enemy.wand.type===3?'混乱（5ターン）':WANDS[enemy.wand.type]} · 残り${enemy.wand.charges}回`);
  if(enemy.immortal)lines.push('不死。剣・衝突ではHPが減らず、ダメージ得点なし。杖は有効。');
  if(enemy.builder)lines.push(enemy.build?`工事：ノード${enemy.build.from+1} → ${enemy.build.to+1}／残り${enemy.build.remaining}行動`:'4行動かけて交差しない通路を新設。工事中は移動・攻撃しない。');
  if(enemy.quantum&&!enemy.phantom)lines.push(`分裂・転移／幻影生成。攻撃倍率×${enemy.damageScale??1}。能力待ち：${enemy.cooldown??0}行動。`);
  if(enemy.frozen)lines.push('状態：金縛り（攻撃を受けるまで停止）');else if(enemy.skip)lines.push('状態：次の行動を休む');
  if(!enemy.immortal&&!enemy.phantom)lines.push(`討伐：300 pt／経験値 ${this.level<10?(enemy.mega?3:1)*(enemy.hero?2:1)+'体分':enemy.mega?(enemy.hero?2:1)+'メガ体分':'対象外（LV10以降）'}`);
  const kind=enemy.decoy?'infoDecoy':enemy.phantom?'infoPhantom':enemy.underworld?'infoUnderworld':enemy.immortal?'infoImmortal':enemy.builder?'infoBuilder':enemy.quantum?'infoQuantum':enemy.mage?'infoMage':enemy.hero?'infoHero':enemy.mega?'infoMega':'infoNormal';
  const flavor=(FLAVOR[kind]||[]).filter(text=>typeof text==='string'&&text.trim());if(flavor.length)lines.push('',flavor[Math.abs(enemy.id??0)%flavor.length]);
  return lines.join('\n');
 }
 createEnemy(id,pos){const mega=this.floor>=10&&this.random()<Math.min(1,1/3+(this.floor-10)/15);const hero=mega&&this.secondLoop&&this.random()<Math.min(1,(this.floor-25)/5),hp=(mega?90:45)+(hero?this.heroBonus():0);return {id,pos,mega,hero,maxHp:hp,hp,frozen:false,decoy:false};}
 startDebug(floor,level,puzzle=null){if(!Number.isInteger(floor)||floor<1||floor>999||!Number.isInteger(level)||level<1||level>999)throw new Error('階層・レベルは1〜999の整数で指定してください。');
  if(puzzle&&(![6,7,8].includes(puzzle.size)||!Number.isInteger(puzzle.layout)||puzzle.layout<0||puzzle.layout> (puzzle.size===6?3:7)||typeof puzzle.mirror!=='boolean'))throw new Error('小階層の配置を選び直してください。');
  this.debug=true;this.emblem=true;this.floor=floor;this.currentLevel=level;this.levelKills=0;this.maxHp=100+10*(level-1);this.hp=this.maxHp;this.regen=0;this.charges=[5,5,5,2];this.generate(puzzle?'puzzle':undefined,puzzle);this.log('DEBUG：この探索はランキング対象外です。','important');
 }
 createMage(id,pos){const type=this.int(0,3);return {id,pos,mage:true,mega:false,maxHp:45,hp:45,frozen:false,decoy:false,wand:{type,charges:type===3?this.int(1,3):this.int(2,5)}};}
 dropWand(enemy){if(!enemy.mage||!enemy.wand?.charges)return;const item={kind:'wand',...enemy.wand};const existing=this.items.get(enemy.pos);if(existing){existing.stack??=[];existing.stack.push(item);}else this.items.set(enemy.pos,item);this.log(`${this.enemyName(enemy)}が${WANDS[item.type]}の杖（残り${item.charges}回）を落とした。`,'important');enemy.wand.charges=0;}
 beginAction(){if(this.confused>0)this.confused--;if(!this.playerFrozen){this.freezeGrace=false;return true;}this.lastAction='frozen';this.aim=null;this.log('金縛りで動けない。敵の行動が先に進む。','danger');this.finishTurn();return false;}
 hurtPlayer(damage,hit){if(damage>0){this.floorDamaged=true;if(!hit?.magic)this.sound('ax_attack');}this.lastDamage=hit;this.hp-=damage;if(this.playerFrozen&&damage>0){this.playerFrozen=false;this.freezeGrace=true;this.log('攻撃を受け、金縛りが解けた。次の1行動までは再び金縛りにならない。','important');}}
 awardKill(enemy,credit=true){if(enemy.phantom){this.log('量子の幻影がほどけて消えた。');return;}this.dropWand(enemy);if(!credit){this.log(`${this.enemyName(enemy)}が倒れた。`);this.bread(this.enemyName(enemy));return;}const before=this.level;this.kills++;if(this.level<10||enemy.mega){this.levelKills+=(this.level<10&&enemy.mega?3:1)*(enemy.hero?2:1);if(this.levelKills>=this.killsToLevel){this.levelKills=0;this.currentLevel++;}}this.score+=300;this.log(`${this.enemyName(enemy)}を倒した。+300 pt`,'important');this.bread(this.enemyName(enemy));this.flavor('ariadne');
  if(this.level>before){const gain=10*(this.level-before);this.maxHp+=gain;this.hp=Math.min(this.maxHp,this.hp+gain);this.log(`LV.${this.level}！ 最大HP ${this.maxHp}（HP +${gain}）、剣の基本ダメージ ${this.swordBase}。${[5,15].includes(this.level)?` 乱数が±${this.swordRange}、+3以上で追加攻撃！`:''}`,'important');}
 }
 heroBonus(){return Math.floor(10+(this.level+this.floor)/1.4142);}
 enemyDamage(enemy,critical=false,againstPlayer=false){if(enemy.phantom)return 0;const base=critical?(enemy.mega?80:60)+this.int(-3,3)+this.int(-3,3)+this.int(-3,3):enemy.mega?40+(this.random()<.5?-1:1)*this.int(1,10):20+this.int(-3,3);return Math.floor((base+(enemy.hero?this.heroBonus():0))*(enemy.damageScale??1)*(againstPlayer&&this.emblem?1.2:1));}
 enemyNormalMax(enemy){return Math.floor(((enemy.mega?50:23)+(enemy.hero?this.heroBonus():0))*(enemy.damageScale??1)*(this.emblem?1.2:1));}
 createSpecial(id,pos,type){const hp=type==='immortal'?Infinity:45;return {id,pos,[type]:true,hp,maxHp:hp,frozen:false,decoy:false};}
 buildFork(){this.mapKind='fork';this.nodes=[[440,265],[440,175],[275,105],[120,40],[605,105],[760,40]].map(([x,y],id)=>({id,x,y,links:[]}));for(const [a,b] of [[0,1],[1,2],[2,3],[1,4],[4,5]])this.link(a,b);this.exit=5;this.door=3;this.visited.add(0);this.playerFrozen=false;this.confused=0;this.log(`地下 ${this.floor} 階。糸の分かれ道。右はアリアドネの糸を結んだ出口、左は鍵付きの扉。`,'important');this.log('右の出口に乗って > で帰還し、+300,000 pt。左の扉に乗って > で紋章を使い、さらに深くへ。','important');}
 escape(){if(this.ended)return false;this.flushWait();this.won=true;this.score+=300000;this.aim=null;this.log('アリアドネの糸は、朝の光へ続いていた。迷宮から生還！ ☆ +300,000 pt','important');return true;}
 forceNextFloor(){this.flushWait();this.log('冥界のミノタウロスに触れた！ 次の階へ強制転送された。','danger');this.floor++;this.score+=1000;this.playerFrozen=false;this.confused=0;this.sound('step');this.generate();}
 spawnUnderworld(){if(!this.secondLoop||this.floor<40||this.mapKind==='fork')return;const due=Math.floor(this.floorTurns/30);while(this.underworldSpawned<due){const distances=this.distances(this.player),free=this.nodes.filter(n=>n.id!==this.player&&n.id!==this.exit&&!this.enemyAt(n.id)).sort((a,b)=>distances[b.id]-distances[a.id]||a.id-b.id);if(!free.length)return;this.enemies.push(this.createSpecial(Math.max(-1,...this.enemies.map(e=>e.id))+1,free[0].id,'underworld'));this.underworldSpawned++;this.log('黒い影が白い輪郭をまとった。冥界のミノタウロスが現れた！ 触れられると次の階へ。','danger');}}
 int(a,b){return a+Math.floor(this.random()*(b-a+1));}
 log(text,type=''){if(this.waitCount&&type!=='flavor')this.flushWait();this.logs.unshift({turn:this.turn,text,type});this.logs=this.logs.slice(0,150);}
 flushWait(){const count=this.waitCount||0;this.waitCount=0;if(count>1)this.log(`合計 ${count} ターン、続けて待機した。`);}
 selectDirection(direction){
  const paths=this.aim!==null?this.shotPaths():null;
  const options=paths?paths.map((_,i)=>i):[...this.nodes[this.player].links];
  const angle=choice=>this.angle(this.player,paths?paths[choice].at(-1):choice);
  options.sort((a,b)=>this.diff(angle(a),direction)-this.diff(angle(b),direction));
  const suitable=options.filter(n=>this.diff(angle(n),direction)<=Math.PI/3);
  const pool=suitable.length?suitable:options.slice(0,1);if(!pool.length)return;
  const current=paths?this.shotIndex:this.selected;
  const next=pool[(pool.indexOf(current)+1)%pool.length];
  if(paths)this.shotIndex=next;else this.selected=next;
 }
 flavor(kind,variables={}){const choices=(FLAVOR[kind]||[]).filter(text=>typeof text==='string'&&text.trim());if(!choices.length)return;let index=Math.floor(this.flavorRandom()*choices.length);if(this.lastFlavor?.[kind]===index)index=(index+1)%choices.length;this.lastFlavor??={};this.lastFlavor[kind]=index;this.log(choices[index].replace(/\{(\w+)\}/g,(match,key)=>variables[key]??match),'flavor');}
 bread(name){this.flavor('bread',{name});}
 nearbyFlavor(){if(this.waitCount>1)return;const near=this.enemies.filter(e=>!e.decoy&&this.nodes[this.player].links.includes(e.pos));const fresh=near.some(e=>!this.lastNear.has(e.id));if(near.length&&(fresh||this.turn-this.lastNearTurn>=3)){this.flavor(near.every(e=>e.frozen)?'frozen':this.enemies.some(e=>e.decoy)?'hidden':'near');this.lastNearTurn=this.turn;}this.lastNear=new Set(near.map(e=>e.id));}
 generate(kind,puzzle=null){
  this.floorDamaged=false;this.floorTurns=0;this.underworldSpawned=0;this.door=null;
  const cols=9,rows=5;this.nodes=[];this.edges=[];this.enemies=[];this.visited=new Set();this.items=new Map();this.player=0;this.selected=null;this.aim=null;this.shotIndex=0;this.ray=[];
  this.lastNear=new Set();this.lastNearTurn=-3;this.puzzleLayout=null;
  if(this.floor%25===0){this.buildFork();return;}
  // One scheduled emblem per 25-floor block. Preserve its date across saves.
  const block=Math.floor((this.floor-1)/25),end=(block+1)*25;
  if(Math.floor((this.emblemFloor-1)/25)!==block)this.emblemFloor=this.int(Math.max(this.floor,end===100?80:end-10),end-1);
  const choice=this.random();this.mapKind=kind||(this.floor>1&&choice<.15?'puzzle':choice<.60?'irregular':'lattice');
  const stagger=this.floor%3===2;
  if(this.mapKind==='lattice'){
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)this.nodes.push({id:y*cols+x,x:55+x*89+(stagger&&y%2?24:0),y:40+y*55,links:[]});
  const link=(a,b)=>{if(this.nodes[a].links.includes(b))return;this.nodes[a].links.push(b);this.nodes[b].links.push(a);this.edges.push([a,b]);};
  // Randomized spanning tree guarantees connectivity. Extra lattice edges provide loops.
  const seen=new Set([0]),stack=[0];
  const neighbors=id=>{const x=id%cols,y=Math.floor(id/cols);return [x>0?id-1:-1,x<cols-1?id+1:-1,y>0?id-cols:-1,y<rows-1?id+cols:-1].filter(n=>n>=0);};
  while(stack.length){const a=stack.at(-1),options=neighbors(a).filter(n=>!seen.has(n));if(!options.length){stack.pop();continue;}const b=options[this.int(0,options.length-1)];link(a,b);seen.add(b);stack.push(b);}
  for(const n of this.nodes)for(const b of neighbors(n.id))if(b>n.id&&this.random()<.42)link(n.id,b);
  // Two complete horizontal corridors give each floor useful wand sightlines.
  for(const row of [1,3])for(let x=0;x<cols-1;x++)link(row*cols+x,row*cols+x+1);
  if(!stagger)for(let y=0;y<rows-1;y++)for(let x=0;x<cols-1;x++)if(this.random()<.18)link(y*cols+x,(y+1)*cols+x+1);
  }else if(this.mapKind==='irregular')this.buildIrregular();else this.buildPuzzle(puzzle);
  const distances=this.distances(0);if(this.mapKind!=='puzzle')this.exit=distances.indexOf(Math.max(...distances));this.visited.add(0);
  const available=this.nodes.map(n=>n.id).filter(id=>id!==0&&id!==this.exit&&!this.enemyAt(id));
  const take=filter=>{const ids=available.filter(filter);if(!ids.length)return null;const id=ids[this.int(0,ids.length-1)];available.splice(available.indexOf(id),1);return id;};
  if(this.mapKind!=='puzzle')for(let i=0;i<Math.min(2+Math.floor(this.floor/2),6);i++){const id=take(id=>distances[id]>=(this.mapKind==='irregular'?3:5));if(id!==null)this.enemies.push(this.createEnemy(i,id));}
  if(this.floor>=15)for(let i=0;i<(this.secondLoop&&this.mapKind!=='puzzle'?2:1);i++){const pos=take(id=>distances[id]>=2)??take(()=>true);if(pos!==null)this.enemies.push(this.createMage(Math.max(-1,...this.enemies.map(e=>e.id))+1,pos));}
  if(this.secondLoop){const pos=take(id=>distances[id]>=2)??take(()=>true);if(pos!==null)this.enemies.push(this.createSpecial(Math.max(-1,...this.enemies.map(e=>e.id))+1,pos,'immortal'));}
  if(this.floor>=35&&this.mapKind!=='puzzle'){const roll=this.random(),type=roll<.3?'builder':roll<.6?'quantum':null;if(type){const pos=take(id=>distances[id]>=2);if(pos!==null){const id=Math.max(-1,...this.enemies.map(e=>e.id))+1;this.enemies.push(type==='quantum'?{...this.createSpecial(id,pos,type),mega:true,hp:90,maxHp:90,damageScale:1,quantumGroup:id,cooldown:0}:this.createSpecial(id,pos,type));}}}
  const wandCount=this.random()<.10?2:1;
  for(let i=0;i<wandCount;i++){const pos=take(()=>true);if(pos!==null)this.items.set(pos,this.rollWand());}
  for(let i=0;i<(this.mapKind==='puzzle'?1:7);i++){const pos=take(id=>!this.items.has(id));if(pos!==null)this.items.set(pos,{kind:'gold',value:this.int(2,200)*(this.secondLoop?20:1)});}
  if(this.floor===this.emblemFloor&&!this.emblem){const pos=take(()=>true)??this.exit;this.items.set(pos,{kind:'emblem'});}
  this.log(`地下 ${this.floor} 階。アリアドネの糸をたどり、階段 > を目指せ。`,'important');
  this.flavor('floor');if(this.floor===26)this.flavor('ariadne26');if(this.mapKind==='puzzle'){this.sound('bell');this.log(`${this.nodes.length}つの結び目の間。急がず、待つ一手と遠回りを読もう。敵の射線にも気をつけよう。`,'important');this.log('小階層チャレンジ！ この階で一度もダメージを受けずに階段を降りると、LV +1のボーナス！','important');}
 }
 rollWand(){const roll=this.int(0,6),type=roll===6?3:Math.floor(roll/2);return {kind:'wand',type,charges:type===3?this.int(1,3):this.int(2,5)};}
 link(a,b){if(this.nodes[a].links.includes(b))return;this.nodes[a].links.push(b);this.nodes[b].links.push(a);this.edges.push([a,b]);}
 crosses(a,b,c,d){const orient=(p,q,r)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);return orient(a,b,c)*orient(a,b,d)<0&&orient(c,d,a)*orient(c,d,b)<0;}
 buildIrregular(){
  // Random points, a Euclidean spanning tree, then non-crossing local loops.
  const count=this.int(24,30);this.nodes=[{id:0,x:65,y:150,links:[]},{id:1,x:165,y:150,links:[]},{id:2,x:265,y:150,links:[]}];
  for(let tries=0;this.nodes.length<count&&tries<5000;tries++){const x=this.int(45,825),y=this.int(35,260);if(this.nodes.every(n=>Math.hypot(n.x-x,n.y-y)>=54))this.nodes.push({id:this.nodes.length,x,y,links:[]});}
  const candidates=[];for(let a=0;a<this.nodes.length;a++)for(let b=a+1;b<this.nodes.length;b++)candidates.push({a,b,length:Math.hypot(this.nodes[a].x-this.nodes[b].x,this.nodes[a].y-this.nodes[b].y)});candidates.sort((a,b)=>a.length-b.length);
  const parents=this.nodes.map(n=>n.id),find=a=>parents[a]===a?a:(parents[a]=find(parents[a]));
  for(const edge of candidates){const a=find(edge.a),b=find(edge.b);if(a!==b){parents[a]=b;this.link(edge.a,edge.b);}}
  for(const edge of candidates){const {a,b,length}=edge;if(this.nodes[a].links.includes(b)||length>180||this.nodes[a].links.length>=4||this.nodes[b].links.length>=4||this.random()>.40)continue;
   const p=this.nodes[a],q=this.nodes[b];if(this.edges.some(([c,d])=>c!==a&&c!==b&&d!==a&&d!==b&&this.crosses(p,q,this.nodes[c],this.nodes[d])))continue;
   if(this.nodes.some(n=>{if(n.id===a||n.id===b)return false;const t=((n.x-p.x)*(q.x-p.x)+(n.y-p.y)*(q.y-p.y))/(length*length);return t>0&&t<1&&Math.hypot(n.x-p.x-t*(q.x-p.x),n.y-p.y-t*(q.y-p.y))<24;}))continue;
   this.link(a,b);
  }
 }
 buildPuzzle(puzzle=null){
  const size=puzzle?.size??this.int(6,8);
  const layouts=size===6?[{extra:[],exit:1,enemy:2},{extra:[],exit:2,enemy:3},{extra:[[0,2]],exit:2,enemy:3},{extra:[[0,2]],exit:3,enemy:4}]:[];
  layouts.push(...(BRANCH_PUZZLES[size]||[]));
  const index=puzzle?.layout??this.int(0,layouts.length-1),layout=layouts[index],mirror=puzzle?.mirror??(this.random()<.5),flip=mirror?-1:1;
  this.puzzleLayout={size,layout:index,mirror};
  this.nodes=layout.points?layout.points.map(([x,y],id)=>({id,x:mirror?880-x:x,y,links:[]})):Array.from({length:size},(_,id)=>({id,x:440+flip*320*Math.cos(Math.PI+id*2*Math.PI/size),y:150+112*Math.sin(Math.PI+id*2*Math.PI/size),links:[]}));
  for(const [a,b]of (layout.edges||[...Array.from({length:size},(_,id)=>[id,(id+1)%size]),...layout.extra]))this.link(a,b);
  this.exit=layout.exit;this.enemies=[this.createEnemy(0,layout.enemy)];
 }
 distances(start){const d=this.nodes.map(()=>Infinity),q=[start];d[start]=0;for(let i=0;i<q.length;i++)for(const next of this.nodes[q[i]].links)if(d[next]===Infinity){d[next]=d[q[i]]+1;q.push(next);}return d;}
 enemyAt(pos){return this.enemies.find(e=>e.pos===pos);}
 visit(){if(!this.visited.has(this.player)){this.visited.add(this.player);this.score+=10;}const item=this.items.get(this.player);if(!item)return;this.sound('money');this.items.delete(this.player);for(const pickup of [item,...(item.stack||[])]){if(pickup.kind==='emblem'){this.emblem=true;this.log('謎の紋章を手に入れた！ 分かれ道の扉の鍵。所持中は敵の直接攻撃ダメージが1.2倍になる。','important');}else if(pickup.kind==='gold'){this.score+=pickup.value;this.log(`ゴールド $${pickup.value} を拾った。+${pickup.value} pt`,'important');}else{this.wandsAcquired++;this.charges[pickup.type]+=pickup.charges;this.score+=pickup.charges*10;this.log(`${WANDS[pickup.type]}の杖を拾った。使用回数 +${pickup.charges} / +${pickup.charges*10} pt`,'important');}}}
 move(to){if(!this.ended&&to===this.player){this.wait();return true;}if(this.ended)return false;if(this.aim!==null)return this.fire(to);if(!this.nodes[this.player].links.includes(to))return false;const confused=this.confused>0;if(!this.beginAction())return true;if(confused){const choices=this.nodes[this.player].links;to=choices[this.int(0,choices.length-1)];this.log('混乱で足元がふらついた。');}this.flushWait();this.ray=[];const enemy=this.enemyAt(to);if(enemy?.underworld&&!enemy.decoy){this.turn++;this.forceNextFloor();return true;}this.lastAction=enemy?'attack':'move';if(enemy?.immortal){this.sound('sword_attack');enemy.frozen=false;this.log('剣は不死のミノタウロスを傷つけられない。杖で道を開こう。','important');this.finishTurn();return true;}if(enemy){this.sound('sword_attack');let total=0,actual=0,hits=0,roll;do{hits++;roll=this.int(-this.swordRange,this.swordRange);const damage=this.swordBase+roll,loss=Math.min(enemy.hp,damage);enemy.hp-=loss;total+=damage;actual+=loss;}while(roll>=3&&enemy.hp>0);if(!enemy.phantom)this.score+=actual;enemy.frozen=false;this.log(`剣で${this.enemyName(enemy)}に ${total} ダメージ。${hits>1?` ${hits}回ヒット！`:''}`,'important');if(enemy.hp<=0){this.enemies=this.enemies.filter(e=>e!==enemy);this.awardKill(enemy);}}else{this.player=to;this.recover();this.visit();}this.finishTurn();return true;}
 angle(a,b){return Math.atan2(this.nodes[b].y-this.nodes[a].y,this.nodes[b].x-this.nodes[a].x);}
 diff(a,b){return Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));}
 trace(from,next,stopAtEnemy=true){const initial=this.angle(from,next),path=[from,next],seen=new Set(path);let previous=initial;while(path.length<this.nodes.length){const at=path.at(-1);if(stopAtEnemy&&this.enemyAt(at))break;const options=this.nodes[at].links.filter(n=>!seen.has(n)).map(n=>({n,a:this.angle(at,n)})).filter(o=>this.diff(o.a,initial)<=Math.PI/6+1e-9&&this.diff(o.a,previous)<=Math.PI/9+1e-9).sort((a,b)=>this.diff(a.a,previous)-this.diff(b.a,previous));if(!options.length)break;previous=options[0].a;path.push(options[0].n);seen.add(options[0].n);}return path;}
 get recoveryRate(){return this.maxHp/100+(this.difficulty==='normal'?4:0);}
 recover(){this.regen+=this.recoveryRate;const heal=Math.floor(this.regen);this.regen-=heal;this.hp=Math.min(this.maxHp,this.hp+heal);}
 shotCandidates(path){
  if(path.length<2)return [];
  const at=path.at(-1),initial=this.angle(path[0],path[1]),previous=this.angle(path.at(-2),at);
  return this.nodes[at].links.filter(n=>!path.includes(n)).map(n=>{const direction=this.angle(at,n),turn=this.diff(direction,previous),launch=this.diff(direction,initial);const reasons=[];
   if(turn>Math.PI/9+1e-9)reasons.push('曲がり角20°超過');if(launch>Math.PI/6+1e-9)reasons.push('射出方向から30°超過');
   return {node:n,turnDegrees:turn*180/Math.PI,launchDegrees:launch*180/Math.PI,reasons};
  });
 }
 shotPaths(from=this.player){
  const result=[];
  const extend=(path,initial,previous)=>{const at=path.at(-1);const choices=this.shotCandidates(path).filter(candidate=>!candidate.reasons.length).map(candidate=>candidate.node);
   if(!choices.length){result.push(path);return;}for(const next of choices)extend([...path,next],initial,this.angle(at,next));};
  for(const next of this.nodes[from].links){const angle=this.angle(from,next);extend([from,next],angle,angle);}return result;
 }
 shotPreview(path,type=this.aim){
  const hitIndex=path.findIndex((n,i)=>i>0&&this.enemyAt(n));const enemy=hitIndex<0?null:this.enemyAt(path[hitIndex]);
  const result={path,enemy,hit:enemy?.pos??null,landing:null,collision:null,damage:0,otherDamage:0};
  if(!enemy||type!==1)return result;
  const otherIndex=path.findIndex((n,i)=>i>hitIndex&&this.enemyAt(n));const other=otherIndex<0?null:this.enemyAt(path[otherIndex]);
  result.damage=enemy.immortal?0:Math.min(10,enemy.hp);result.collision=other;result.otherDamage=other&&!other.immortal?Math.min(10,other.hp):0;
  if(enemy.hp<=10)return result;
  if(!other||other.hp<=10){result.landing=other?other.pos:path.at(-1);return result;}
  // Prefer a free side node; otherwise use the preceding node of the fixed ray.
  const previous=path[otherIndex-1];const free=this.nodes[other.pos].links.filter(n=>n!==this.player&&(!this.enemyAt(n)||this.enemyAt(n)===enemy));
  free.sort((a,b)=>(a===previous)-(b===previous)||a-b);result.landing=free[0]??enemy.pos;return result;
 }
 damageEnemy(enemy,amount,credit=true){if(!this.enemies.includes(enemy))return;const damage=enemy.immortal?0:Math.min(enemy.hp,amount);enemy.hp-=damage;enemy.frozen=false;if(credit&&!enemy.phantom)this.score+=damage;
  if(enemy.hp<=0){this.enemies=this.enemies.filter(e=>e!==enemy);this.awardKill(enemy,credit);}
 }
 equip(type){if(this.ended||this.charges[type]<=0)return;this.aim=this.aim===type?null:type;this.selected=null;this.shotIndex=0;this.ray=[];}
 fire(to){
  const type=this.aim;if(this.ended||type===null||!this.charges[type])return false;
  const paths=this.shotPaths();const preferred=paths[this.shotIndex];const path=preferred?.at(-1)===to?preferred:paths.find(p=>p.at(-1)===to);if(!path)return false;if(!this.beginAction())return true;this.flushWait();this.lastAction='wand';
  const preview=this.shotPreview(path),enemy=preview.enemy;this.ray=path;this.charges[type]--;this.sound('magic_cast');this.aim=null;
  if(!enemy)this.log(`${WANDS[type]}の魔法は選んだ突き当たりまで進み、消えた。`);else{
   if(type===0){enemy.frozen=true;this.log('金縛り！ ダメージを与えるまで動けない。','important');}
   if(type===1){
    enemy.skip=true;if(preview.collision){preview.collision.skip=true;this.log(`吹き飛ばした敵が別の敵に衝突！ 対象に${enemy.immortal?0:10}、衝突相手に${preview.collision.immortal?0:10}ダメージ。`,'important');this.damageEnemy(preview.collision,10);}else this.log(`吹き飛ばした敵が突き当たりの壁に衝突！ ${enemy.immortal?0:10}ダメージ。`,'important');
    this.damageEnemy(enemy,10);if(this.enemies.includes(enemy))enemy.pos=preview.landing;
   }
   if(type===2){const old=this.player;this.player=enemy.pos;enemy.pos=old;enemy.skip=true;this.visit();this.log('場所替え！ 糸の両端が入れ替わった。','important');}
   if(type===3){enemy.decoy=true;enemy.frozen=false;enemy.skip=true;this.log('身代わり @ が現れた。敵はあなたを見失っている。','important');}
  }this.finishTurn();return true;
 }
 finishTurn(){if(this.ended)return;this.turn++;this.floorTurns++;this.selected=null;const floor=this.floor;this.enemyTurn();if(this.floor!==floor)return;if(this.hp<=0){this.hp=0;this.dead=true;this.sound('gameover');this.defeatCategory=this.classifyDefeat();this.log('あなたの探索は、ここでひと休み。','danger');this.bread('あなた');this.flavor('defeat');}else{this.spawnUnderworld();this.nearbyFlavor();}}
 wait(){if(this.ended)return;if(!this.beginAction())return;this.lastAction='wait';this.aim=null;this.ray=[];this.recover();if(!this.waitCount)this.log('息をひそめ、体を休めながら敵の動きを待った。');this.waitCount=(this.waitCount||0)+1;this.finishTurn();}
 castMage(mage,target){
  if(!mage.wand?.charges)return false;const type=mage.wand.type,isPlayer=target.pos===this.player;if(type===3&&!isPlayer)return false;
  if(type===0&&(isPlayer?(this.playerFrozen||this.freezeGrace):target.frozen)||type===3&&(isPlayer?this.confused>0:target.frozen))return false;
  const path=this.shotPaths(mage.pos).find(p=>{const hit=p.slice(1).find(n=>n===this.player||this.enemyAt(n));return hit===target.pos;});if(!path)return false;
  mage.wand.charges--;this.sound('magic_cast');this.log(`${this.enemyName(mage)}が${type===3?'混乱':WANDS[type]}の杖を振った！（残り${mage.wand.charges}回）`,'danger');
  this.flavor(['mageFreeze','mageBlow','mageSwap','mageConfuse'][type]);
  if(type===0){if(isPlayer)this.playerFrozen=true;else target.frozen=true;}
  if(type===3){if(isPlayer)this.confused=5;else target.frozen=true;}
  if(type===2){const old=mage.pos;mage.pos=target.pos;if(isPlayer){this.player=old;this.visit();}else {target.pos=old;target.skip=true;}}
  if(type===1){if(!isPlayer){const playerIndex=path.indexOf(this.player);const safePath=playerIndex>path.indexOf(target.pos)?path.slice(0,playerIndex):path;const preview=this.shotPreview(safePath,1);if(preview.collision){preview.collision.skip=true;this.damageEnemy(preview.collision,10,false);}this.damageEnemy(target,10,false);if(this.enemies.includes(target)){target.pos=preview.landing;target.skip=true;}}else{
    const index=path.indexOf(this.player),otherIndex=path.findIndex((n,i)=>i>index&&this.enemyAt(n)),other=otherIndex<0?null:this.enemyAt(path[otherIndex]);
    let landing=other?other.pos:path.at(-1);if(other){other.skip=true;this.damageEnemy(other,10,false);if(this.enemies.includes(other)){const previous=path[otherIndex-1];const free=this.nodes[other.pos].links.filter(n=>!this.enemyAt(n));free.sort((a,b)=>(a===previous)-(b===previous)||a-b);landing=free[0]??this.player;}}
    this.hurtPlayer(10,{critical:false,magic:true,mega:false,hpBefore:this.hp,normalMax:23,stationary:true});this.log(other?'敵に衝突！ 双方に10ダメージ。':'壁に衝突！ HP −10','danger');if(this.hp>0){this.player=landing;this.visit();}
   }}return true;
 }
 canConnect(a,b){if(a===b||this.nodes[a].links.includes(b))return false;const p=this.nodes[a],q=this.nodes[b],length=Math.hypot(q.x-p.x,q.y-p.y);if(length>320||length<1)return false;if(this.edges.some(([c,d])=>![a,b].includes(c)&&![a,b].includes(d)&&this.crosses(p,q,this.nodes[c],this.nodes[d])))return false;return !this.nodes.some(n=>{if(n.id===a||n.id===b)return false;const t=((n.x-p.x)*(q.x-p.x)+(n.y-p.y)*(q.y-p.y))/(length*length);return t>0&&t<1&&Math.hypot(n.x-p.x-t*(q.x-p.x),n.y-p.y-t*(q.y-p.y))<24;});}
 buildPassage(enemy){if(enemy.build){const task=enemy.build;if(enemy.pos!==task.from||!this.canConnect(task.from,task.to)){enemy.build=null;this.log('迷宮殺しの工事が中断された。');return true;}task.remaining--;if(task.remaining===0){this.link(task.from,task.to);enemy.build=null;this.log(`迷宮殺しが通路を開いた！ ノード ${task.from+1} と ${task.to+1} がつながった。`,'danger');}return true;}const candidates=this.nodes.filter(n=>this.canConnect(enemy.pos,n.id));if(!candidates.length)return false;const to=candidates[this.int(0,candidates.length-1)].id;enemy.build={from:enemy.pos,to,remaining:3};this.log(`迷宮殺しがノード ${enemy.pos+1} → ${to+1} の工事を開始。4ターンで接続する。`,'important');return true;}
 quantumAction(enemy){if(enemy.cooldown>0){enemy.cooldown--;return false;}if(this.random()>=.25)return false;const free=this.nodes.filter(n=>n.id!==this.player&&n.id!==this.exit&&!this.enemyAt(n.id));if(!free.length)return false;const group=enemy.quantumGroup??enemy.id,kin=this.enemies.filter(e=>e.quantumGroup===group),id=Math.max(-1,...this.enemies.map(e=>e.id))+1;const pos=free.splice(this.int(0,free.length-1),1)[0].id;
  if(enemy.hp>=12&&kin.filter(e=>!e.phantom).length<4&&this.random()<.5){const hp=Math.floor(enemy.hp/2),maxHp=Math.floor(enemy.maxHp/2),scale=(enemy.damageScale??1)/2;enemy.hp-=hp;enemy.maxHp-=maxHp;enemy.damageScale=scale;const clone={...enemy,id,pos,hp,maxHp,frozen:false,skip:false,cooldown:4,quantumGroup:group};this.enemies.push(clone);if(free.length)enemy.pos=free[this.int(0,free.length-1)].id;enemy.cooldown=4;this.log('量子メガタウロスがHPと攻撃力を二分し、別々の場所へ転移した！','danger');return true;}
  if(kin.filter(e=>e.phantom).length>=2)return false;this.enemies.push({id,pos,quantum:true,phantom:true,quantumGroup:group,mega:true,hp:1,maxHp:1,damageScale:0,frozen:false,decoy:false});enemy.cooldown=4;this.log('量子メガタウロスが幻影を出した。幻影は攻撃せず、一撃で消える。','important');return true;
 }
 enemyTurn(){
  const startingPositions=new Map(this.enemies.map(e=>[e.id,e.pos]));
  // Decoys wander before pursuers choose targets. Frozen creatures remain valid targets.
  for(const e of this.enemies.filter(e=>e.decoy)){if(e.skip){e.skip=false;continue;}if(e.frozen)continue;const choices=[e.pos,...this.nodes[e.pos].links.filter(n=>n!==this.player&&!this.enemyAt(n))];e.pos=choices[this.int(0,choices.length-1)];}
  for(const e of [...this.enemies.filter(e=>!e.decoy)]){if(this.hp<=0)break;if(!this.enemies.includes(e))continue;if(e.skip){e.skip=false;continue;}if(e.frozen)continue;const decoys=this.enemies.filter(d=>d.decoy);const ed=this.distances(e.pos);const target=decoys.length?decoys.reduce((a,b)=>ed[a.pos]<ed[b.pos]?a:b):{pos:this.player};
   if(e.phantom)continue;
   if(e.builder&&this.buildPassage(e))continue;
   if(e.quantum&&this.quantumAction(e))continue;
   if(e.mage&&this.castMage(e,target))continue;
   if(this.nodes[e.pos].links.includes(target.pos)){if(target.pos===this.player){if(e.underworld){this.forceNextFloor();return;}let damage;const critical=this.random()<.16;if(critical){damage=this.enemyDamage(e,true,true);this.log(`${this.enemyName(e)}の痛恨の一撃！ HP −${damage}`,'danger');}else{damage=this.enemyDamage(e,false,true);this.log(`${this.enemyName(e)}の攻撃。HP −${damage}`,'danger');}if(critical&&e.mega)this.megaCriticalsReceived++;
    this.lastDamage={critical,mega:!!e.mega,megaCriticalNumber:this.megaCriticalsReceived,hpBefore:this.hp,normalMax:this.enemyNormalMax(e),stationary:startingPositions.get(e.id)===e.pos};this.hurtPlayer(damage,this.lastDamage);}else{if(e.underworld){this.enemies=this.enemies.filter(d=>d!==e&&d!==target);this.log('冥界のミノタウロスが身代わりに触れ、両者とも消滅した！','important');continue;}target.hp-=this.enemyDamage(e);target.frozen=false;this.log(`${this.enemyName(e)}が身代わりを攻撃した。`);if(target.hp<=0){this.enemies=this.enemies.filter(d=>d!==target);this.dropWand(target);this.log('身代わりが倒れた。あなたの姿が再び見える。','danger');this.bread('身代わり');}}continue;}
   const direct=this.distances(target.pos);const toExit=this.distances(this.exit);const predictions=this.nodes[target.pos].links.filter(n=>!this.enemyAt(n)).sort((a,b)=>toExit[a]-toExit[b]);const forecast=predictions[0]??target.pos, predicted=this.distances(forecast);
   const allies=this.enemies.filter(other=>other!==e&&!other.decoy);const options=this.nodes[e.pos].links.filter(n=>n!==this.player&&!this.enemyAt(n));
   // Alternate chase and interception; avoid clustering with another pursuer.
   const value=n=>direct[n]+(e.id%2?.65: .2)*predicted[n]+allies.reduce((sum,a)=>sum+(this.nodes[n].links.includes(a.pos)?.45:0),0);
   options.sort((a,b)=>value(a)-value(b));if(options.length)e.pos=options[0];
  }
 }
 descend(){if(this.ended)return false;if(this.mapKind==='fork'){if(this.player!==this.exit&&this.player!==this.door)return false;if(this.player===this.door&&!this.emblem){this.log('扉は閉ざされている。謎の紋章が必要だ。','important');return false;}if(!this.beginAction())return false;this.turn++;if(this.player===this.exit)return this.escape();this.emblem=false;this.log('謎の紋章が扉に溶け、さらに深い迷宮への道が開いた。','important');this.floor++;this.score+=1000;this.sound('step');this.generate();return true;}if(this.player!==this.exit)return false;if(!this.beginAction())return false;this.flushWait();this.sound('step');this.score+=1000;this.floor++;this.turn++;this.log('階段を降りた。+1,000 pt','important');if(this.mapKind==='puzzle'&&!this.floorDamaged){this.currentLevel++;this.levelKills=0;this.maxHp+=10;this.hp=Math.min(this.maxHp,this.hp+10);this.log(`小階層ノーダメージ突破！ ボーナスで LV.${this.level} に上昇！ 最大HP・現在HP +10、剣の基本ダメージ +${this.level%2===0?1:2}（基本値 ${this.swordBase}）。${[5,15].includes(this.level)?` 乱数が±${this.swordRange}、+3以上で追加攻撃！`:''}`,'important');}this.generate();return true;}
}
root.AriadneGame=Game;root.ARIADNE_WANDS=WANDS;if(typeof module!=='undefined')module.exports={Game,WANDS};
})(typeof globalThis!=='undefined'?globalThis:window);

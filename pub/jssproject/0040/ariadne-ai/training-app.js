'use strict';
const T=AriadneTraining,$=id=>document.getElementById(id),KEY='ariadne-trained-model-v1';let model=T.fresh(),busy=false,cancelled=false,game,memory,watching=false,timer,practiceCourse='small';
try{const saved=localStorage.getItem(KEY);if(saved)model=T.validate(JSON.parse(saved));}catch{}
const text=(tag,value)=>{const e=document.createElement(tag);e.textContent=value;return e;};
function showModel(){ $('weights').replaceChildren(...T.FEATURES.map((name,i)=>text('span',`${name}: ${model.weights[i].toFixed(2)}${i===9?'（保存のみ・固定減点）':''}　`)));$('training-status').textContent=`保存モデル：${model.generations}世代 / ${model.weights.length}項目（旧11＋配置7）`;}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(model));return true;}catch{return false;}}
function controls(){for(const id of ['train','load','reset','train-seed','generations','course','practice','next','auto'])$(id).disabled=busy;$('cancel').disabled=!busy;}
function stop(){watching=false;clearTimeout(timer);$('auto').textContent='▶ 観戦';}
function draw(){
 const svg=$('map');svg.replaceChildren();
 const add=(tag,attrs,label)=>{const e=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);if(label)e.textContent=label;svg.append(e);};
 for(const [a,b]of game.edges){const p=game.nodes[a],q=game.nodes[b];add('line',{x1:p.x,y1:p.y,x2:q.x,y2:q.y,stroke:'#65816c','stroke-width':3});}
 for(const n of game.nodes){const enemy=game.enemyAt(n.id),item=game.items.get(n.id),player=n.id===game.player,small=game.nodes.length>10;
 let symbol=item?(item.kind==='gold'?String.fromCharCode(36):item.kind==='wand'?'/':String.fromCharCode(34)):'·';if(practiceCourse==='campaign'&&n.id===game.exit)symbol='>';if(enemy)symbol=enemy.decoy?'@':'M';if(player)symbol='@';
 add('circle',{cx:n.x,cy:n.y,r:small?9:18,fill:'#263c2e',stroke:'#65816c'});
 add('text',{x:n.x,y:n.y,fill:player?'#f4d68e':enemy?.frozen?'#9cc6dc':enemy?.decoy?'#b9b2da':enemy?.mage?'#78db86':enemy?'#e58e7e':'#dfc789','font-size':small?14:24},symbol);
 add('text',{x:n.x,y:n.y+(small?17:30),fill:'#afc3b4','font-size':small?8:12},enemy?'HP '+enemy.hp:String(n.id+1));}
 $('practice-status').textContent='F'+game.floor+'　LV '+game.level+'　HP '+game.hp+'/'+game.maxHp+'　T '+game.turn+'/'+T.turnLimit(practiceCourse)+'　残り'+game.enemies.length+'体　杖 '+game.charges.join(' / ')+'　'+(game.dead?'敗北':T.completed(game,practiceCourse)?'課題クリア':game.turn>=T.turnLimit(practiceCourse)?'ターン上限':'');
 $('logs').replaceChildren(...game.logs.slice(0,30).map(l=>text('p','T'+l.turn+' '+l.text)));
}
function practice(){stop();practiceCourse=$('course').value||'small';game=T.task(Number($('practice-seed').value)>>>0,practiceCourse);memory=new Map();$('practice-action').textContent='このモデルで戦闘を観戦します。';draw();}
function step(){if(game.dead||T.completed(game,practiceCourse)||game.turn>=T.turnLimit(practiceCourse)){stop();return;}const d=T.play(game,model,memory,practiceCourse),key=game.floor+':'+game.player;$('practice-action').textContent=AriadneAI.label(game,d.action);memory.set(key,(memory.get(key)||0)+1);AriadneAI.apply(game,d.action);draw();if(game.dead||T.completed(game,practiceCourse)||game.turn>=T.turnLimit(practiceCourse))stop();}
$('practice').onclick=practice;$('next').onclick=step;$('auto').onclick=()=>{if(watching){stop();return;}watching=true;$('auto').textContent='Ⅱ 一時停止';const tick=()=>{if(!watching)return;step();if(watching)timer=setTimeout(tick,300);};tick();};
$('train').onclick=async()=>{stop();busy=true;cancelled=false;controls();$('validation').textContent='学習前の評価と候補の戦闘を実行中…';try{const result=await T.train({model,course:$('course').value||'small',generations:Number($('generations').value),seed:Number($('train-seed').value)>>>0,cancel:()=>cancelled,yieldControl:()=>new Promise(resolve=>setTimeout(resolve,0)),onProgress:r=>{model=r.model;showModel();const saved=persist();$('training-status').textContent=`${r.generation}世代 ｜ 学習課題クリア ${(r.clearRate*100).toFixed(0)}% ｜ 評価 ${r.reward.toFixed(1)}${saved?'':'（保存不可：JSONで保存してください）'}`;}});model=result.model;const saved=persist();showModel();if(result.after)$('validation').textContent=`評価用8課題：クリア ${(result.before.clearRate*100).toFixed(0)}% → ${(result.after.clearRate*100).toFixed(0)}% ／ 平均評価 ${result.before.reward.toFixed(1)} → ${result.after.reward.toFixed(1)}。${saved?'':'ブラウザーに保存できません。JSONで保存してください。'}`;else $('validation').textContent='停止しました。完了した世代までのモデルを保持しています。';}catch(e){$('validation').textContent=e.message;}finally{busy=false;controls();}};
$('cancel').onclick=()=>{cancelled=true;$('training-status').textContent='停止処理中…';};
$('reset').onclick=()=>{stop();model=T.fresh();persist();showModel();$('validation').textContent='';practice();};
$('save').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(model,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='ariadne-trained-model.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('load').onchange=async e=>{const file=e.target.files[0];if(!file)return;stop();try{if(file.size>100000)throw Error('モデルファイルが大きすぎます。');const next=T.validate(JSON.parse(await file.text()));model=next;const saved=persist();showModel();$('validation').textContent=saved?'モデルを読み込みました。':'読み込みました。ブラウザー保存はできません。';practice();}catch(err){$('validation').textContent=err.message;}finally{e.target.value='';}};
showModel();practice();

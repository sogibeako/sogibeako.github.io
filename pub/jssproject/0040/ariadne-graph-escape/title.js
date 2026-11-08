'use strict';
(function(){
const saveKey=AriadneSaves.KEY;
function download(name,text){const url=URL.createObjectURL(new Blob([text],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function save(){if(!playStarted)return;try{if(game.ended){localStorage.removeItem(saveKey);$('save-status').textContent='探索終了';}else{localStorage.setItem(saveKey,AriadneSaves.encode(game,music));$('save-status').textContent='自動保存済み';}}catch{$('save-status').textContent='自動保存不可：JSON保存を利用';}$('export-save').disabled=game.ended;}
function stopGameAudio(){music.audio.pause();for(const clip of playingSounds){clip.pause();playingSounds.delete(clip);}}
function enter(next,savedMusic){game=next;scoreRegistered=false;inspectedGame=null;creditsGame=null;heldKeys.clear();playStarted=true;$('title-screen').hidden=true;$('game-shell').hidden=false;document.body.classList.remove('at-title');
 if(savedMusic){const available=[...music.order],order=[...new Set(savedMusic.order)].filter(t=>available.includes(t));const current=savedMusic.order[savedMusic.index];music.order=[...order,...available.filter(t=>!order.includes(t))];music.index=Math.max(0,music.order.indexOf(current));music.floor=savedMusic.floor;music.run=game;music.dead=false;music.load();}
 music.unlocked=true;render();$('map').focus();
}
function readSave(){const text=localStorage.getItem(saveKey);return text?AriadneSaves.decode(text):null;}
$('title-new').onclick=()=>{let exists=false;try{exists=!!localStorage.getItem(saveKey);}catch{}if(exists&&!confirm('保存済みの探索を上書きして、初めから始めますか？'))return;enter(new AriadneGame(undefined,undefined,$('new-difficulty').value==='hard'?'hard':'normal'));};
$('to-title').onclick=()=>{save();playStarted=false;heldKeys.clear();stopGameAudio();$('game-shell').hidden=true;$('title-screen').hidden=false;document.body.classList.remove('escaped');document.body.classList.add('at-title');$('title-new').focus();};
$('title-continue').onclick=()=>{$('load-status').textContent='';try{const stored=readSave();$('load-browser').disabled=!stored;$('save-summary').textContent=stored?`${stored.game.difficulty==='normal'?'ノーマル':'ハード'} · 地下 ${stored.game.floor} 階 · LV.${stored.game.level} · ${stored.game.turn}ターン · ${stored.game.score.toLocaleString()} pt${stored.game.debug?'（DEBUG）':''}`:'ブラウザーに途中の探索はありません。JSONから読み込むこともできます。';}catch(error){$('load-browser').disabled=true;$('save-summary').textContent='保存データを読み取れません。JSON読み込みをお試しください。';}$('continue-dialog').showModal();};
$('close-continue').onclick=()=>$('continue-dialog').close();
$('load-browser').onclick=()=>{try{const stored=readSave();if(!stored)throw Error('保存データがありません。');enter(stored.game,stored.music);$('continue-dialog').close();}catch(error){$('load-status').textContent=error.message;}};
$('load-json').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>2000000)throw Error('ファイルが大きすぎます（上限2MB）。');const stored=AriadneSaves.decode(await file.text());enter(stored.game,stored.music);$('continue-dialog').close();}catch(error){$('load-status').textContent=error.message;}finally{e.target.value='';}};
$('export-save').onclick=()=>{try{download(`ariadne-${game.floor}F-${game.turn}T.json`,AriadneSaves.encode(game,music));$('save-status').textContent='JSONを書き出しました';}catch(error){$('save-status').textContent=error.message;}};
const audio=$('test-audio');audio.volume=.35;let testStopped=true;
function syncLoop(){const all=$('test-kind').value==='bgm'&&$('test-all-loop').checked;audio.loop=!!$('test-loop').checked&&!all;$('test-all-loop-label').hidden=$('test-kind').value!=='bgm';}
audio.addEventListener('play',()=>{testStopped=false;});
const filename=()=>decodeURIComponent(($('test-track').value||'').split('/').at(-1));
function selectTrack(){testStopped=true;audio.pause();syncLoop();const src=$('test-track').value;if(src){audio.src=src;audio.load();}$('test-comment').textContent=ARIADNE_SOUND_COMMENTS[filename()]??'この曲のコメントは、まだありません。';$('test-status').textContent='再生ボタンで試聴できます。';}
function populate(){const kind=$('test-kind').value,tracks=kind==='bgm'?music.order:[...soundBank.keys()].map(name=>`../material/se/${name}.wav`);$('test-track').replaceChildren();for(const path of tracks){const option=document.createElement('option');option.value=path;option.textContent=decodeURIComponent(path.split('/').at(-1));$('test-track').append(option);}selectTrack();}
$('title-sound').onclick=()=>{stopGameAudio();populate();$('sound-dialog').showModal();};
$('test-kind').onchange=populate;$('test-track').onchange=selectTrack;
$('test-stop').onclick=()=>{testStopped=true;audio.pause();audio.currentTime=0;};
$('test-loop').onchange=()=>{if($('test-loop').checked)$('test-all-loop').checked=false;syncLoop();};
$('test-all-loop').onchange=()=>{if($('test-all-loop').checked)$('test-loop').checked=false;syncLoop();};
audio.addEventListener('ended',()=>{if(testStopped||!$('sound-dialog').open||$('test-kind').value!=='bgm'||!$('test-all-loop').checked)return;const tracks=Array.from($('test-track').children);if(!tracks.length)return;const index=tracks.findIndex(option=>option.value===$('test-track').value);$('test-track').value=tracks[(index+1)%tracks.length].value;selectTrack();$('test-status').textContent='連続再生中：'+filename();audio.play().catch(()=>{$('test-status').textContent='再生ボタンを押すと連続再生を再開します。';});});
$('test-volume').oninput=e=>{audio.volume=Number(e.target.value)/100;$('test-volume-value').textContent=e.target.value+'%';};
$('close-sound').onclick=()=>$('sound-dialog').close();$('sound-dialog').addEventListener('close',()=>{testStopped=true;audio.pause();audio.currentTime=0;});audio.addEventListener('error',()=>{$('test-status').textContent='音源を読み込めませんでした。ファイルの配置を確認してください。';});
globalThis.AriadneTitle={save};
})();

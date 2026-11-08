(function(root){
'use strict';
const KEY='ariadne-top10-v1';
const validName=name=>typeof name==='string'&&/^[A-Za-z0-9]{1,10}$/.test(name);
function normalize(entries){return (Array.isArray(entries)?entries:[]).filter(e=>e&&validName(e.name)&&Number.isSafeInteger(e.score)&&e.score>=0&&Number.isSafeInteger(e.floor)&&e.floor>=1&&Number.isSafeInteger(e.turn)&&e.turn>=0).map(e=>({name:e.name,score:e.score,floor:e.floor,turn:e.turn,...(e.difficulty==='normal'?{difficulty:'normal'}:{}),...(e.won===true?{won:true}:{})})).sort((a,b)=>b.score-a.score).slice(0,10);}
function qualifies(entries,score){const list=normalize(entries);return list.length<10||score>list.at(-1).score;}
function register(entries,name,run){if(!validName(name))throw new Error('名前は半角英数字1〜10文字で入力してください。');if(run.debug)throw new Error('デバッグ探索は登録できません。');if(!run.dead&&!run.won)throw new Error('探索終了後に登録できます。');if(!qualifies(entries,run.score))throw new Error('今回はベスト10の得点に届きませんでした。');return normalize([...entries,{name,score:run.score,floor:run.floor,turn:run.turn,...(run.difficulty==='normal'?{difficulty:'normal'}:{}),...(run.won?{won:true}:{})}]);}
const api={KEY,validName,normalize,qualifies,register};root.AriadneScores=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:window);

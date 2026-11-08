/* セリフの追加・変更は lines の配列を編集してください。空配列でその状況を無言にできます。
   d = 犬、c = 猫。pass = すれ違い、near = そば、その他は行動名。
   物理的な接続と視線で近さを判断します。セリフ選択は動物の乱数を消費しません。 */
(function(root){'use strict';
const lines={
 d:{pass:['わん！','とことこ……すっ。'],near:['ふんふん……。','わふ？'],wander:['とことこ、とことこ。'],sleep:['すぴー……'],eat:['はぐはぐ。'],food:['くんくん！'],chase:['わんわん！'],flee:['たたたっ！'],leap:['わふっ！？'],playChase:['待て待て、わん！'],playFlee:['こっちだよ、わん！'],invite:['遊ぼう、わふ！']},
 c:{pass:['にゃ。','するり。'],near:['にゃあ？','じー……。'],wander:['てくてく……。'],sleep:['すう……すう……。','むにゃ……'],eat:['もぐもぐ……。'],food:['くん……にゃ！'],flee:['ふしゃー！'],playChase:['にゃにゃっ！'],playFlee:['ぴゅーっ。'],invite:['……にゃ？']}
};
function update(s,a,before,sees){
 const memo=s.dialogue??={lastPlayer:null,pets:{}};
 for(const pet of s.pets){const old=before.get(pet.kind),m=memo.pets[pet.kind]??={last:-100,near:false};
  const near=(pet.id===a.player||a.edges(a.player).some(e=>e.to===pet.id))&&sees(a,a.player,pet.id);
  const pass=pet.id===a.player||old?.id===a.player;
  const changed=old?.mode!==pet.mode||old?.phase!==pet.phase;
  const event=pass?'pass':changed?pet.mode:near&&(!m.near||s.turn-m.last>=18)?'near':null;
  const choices=lines[pet.kind]?.[event];
  if(choices?.length&&s.turn-m.last>=4){const text=choices[(s.turn+(pet.kind==='c'?1:0))%choices.length];s.log.push({turn:s.turn,text:(pet.kind==='c'?'猫 f':'犬 d')+'「'+text+'」'});m.last=s.turn;}
  m.near=near;
 }
 memo.lastPlayer=a.player;
}
const api={lines,update};if(typeof module==='object')module.exports=api;else root.WildlifeDialogue=api;
})(globalThis);

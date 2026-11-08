/* Add strings to these arrays to extend the experimental pet dialogue. */
(function(root){'use strict';
const lines={
 c:{boundary:['f「……にゃ？」何もない方をじっと見ています。','f「ふるる……」尻尾の先が、空中の何かを探っています。','f「にゃっ」見えない継ぎ目を気にしているようです。'],ordinary:['f「……にゃ？」何もない方をじっと見ています。','f「ふぁ……」小さくあくびをしました。']},
 d:{boundary:['d「くん、くん……？」空気の匂いを確かめています。','d「わふ？」一歩進もうとして、首をかしげました。','d「くぅん……」どこからか来る気配を探しています。'],ordinary:['d「くん、くん……？」空気の匂いを確かめています。','d「ふすっ」鼻を鳴らして立ち止まりました。']}
};
if(typeof module==='object')module.exports=lines;else root.WandDialogue=lines;
})(globalThis);

"use strict";
ChoiwaruKanji.init({ dictionary: "dictionary.json" }).catch(error => {
  document.getElementById("demo-status").textContent = `辞書を読み込めませんでした。代替テキストを表示しています。HTTPサーバー経由で開いてください。${error.message}`;
});

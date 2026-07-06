# Mizuhara Mahjong Learning Data

学習データは `tools/train_learning_batch.js` で一括生成できます。

```powershell
$node = "C:\Users\ks_ar\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
& $node pub/project/mizuhara_mahjong/tools/train_learning_batch.js --iterations 50000 --strength 5
```

よく使う確認コマンド:

```powershell
& $node pub/project/mizuhara_mahjong/tools/train_learning_batch.js --list
& $node pub/project/mizuhara_mahjong/tools/train_learning_batch.js --dry-run
& $node pub/project/mizuhara_mahjong/tools/train_learning_batch.js --rules basic,cosmic --iterations 1000
```

- 1つのJSONには、1ルールセットの4キャラ分の学習プロファイルが入ります。
- `catalog.js` は自動更新され、Web版のプルダウンに反映されます。
- `--rules` には `--list` で表示されるIDをカンマ区切りで指定できます。
- 大きな反復回数は時間がかかるため、まず `--dry-run` や `--iterations 1000` で確認してください。

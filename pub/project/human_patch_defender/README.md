# Human Patch Defender

ブラウザ上で動くCLI風リアルタイム防衛ゲームです。

## 起動

ローカルサーバーが `pub` を配信している場合:

```text
http://127.0.0.1:8030/project/human_patch_defender/index.html
```

## チュートリアル

まずはゲーム画面で次を入力します。

```text
tutorial
```

固定のフィッシング防衛ドリルが始まります。ランダム事件は発生しないので、落ち着いて次の流れを練習できます。

```text
status
alerts
inspect T01
logs mail
grep urgent mail
verify sender
block sender
tea
```

## 本編

標準難易度の10分セッション:

```text
start 3
```

短く試す場合:

```text
start 3 1
```

## 主要コマンド

```text
help
help <command>
tutorial
start <difficulty> [minutes]
status
alerts
inspect <id>
logs <target>
grep <word> <target>
count <word> <target>
trace <id>
verify <target>
block <target>
rate-limit <service>
enable mfa
patch <target>
tea
```

## 難易度

```text
1 お茶つき保守
2 夜間当番
3 研究室防衛
4 炎上メンテ
5 人間型ゼロデイ
```

## 安全メモ

このゲームは防衛シミュレーションです。実在ネットワークへの通信、スキャン、攻撃、侵入操作は行いません。

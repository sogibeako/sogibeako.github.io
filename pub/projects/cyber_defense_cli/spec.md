# CLI Game Spec: Human Patch Defender

## 目的

JavaScript(Node.js)で動作する、ハッキング防衛風のリアルタイムCLIゲームを試作する。
プレイ時間は1セッション約8-10分。プレイヤーは小さな研究室サーバーの保守担当として、ログを読み、怪しい通信や人間系トラップを見抜き、被害が広がる前に対処する。

このゲームは防衛・学習・フィクションを目的とし、実在システムへの攻撃手順や侵入方法は扱わない。コマンドはゲーム内シミュレーション専用とする。

## 元会話から採用するモチーフ

- ハッカー的思考は「正面突破」ではなく「前提や仕様を疑う」こと。
- 盤面そのものを疑う、ログや仕様の隙間を見る、という研究者型の感覚。
- 人間型ゼロデイ脆弱性、焦燥は最大のバックドア、自分というサーバーの保守管理者。
- `grep`, `wc`, `sort`, `uniq`, `cat`, `curl` など、文字列の流れを加工して読むCLI感。
- パスワード使い回し、2段階認証、怪しいリンクを踏まない、焦ったら一呼吸置く、という防衛寄りの題材。

## タイトル案

`Human Patch Defender`

サブタイトル: `自分というサーバーを守れ`

## 想定実行環境

- Node.js 18以上
- 外部npm依存なしで動作することを優先
- 起動例: `node game.js`
- オプション例:
  - `node game.js --difficulty 3`
  - `node game.js --seed 12345`
  - `node game.js --tutorial`

## ゲーム概要

画面はテキストベースの司令室。時間経過でイベントが発生し、プレイヤーはコマンドを入力して調査・防御・復旧を行う。

1. サーバー群、アカウント、ログ、アラート、メンタル負荷が常時変化する。
2. イベントは「ログ異常」「フィッシング」「認証失敗連発」「サービス過負荷」「設定ミス」「誤検知」など。
3. プレイヤーは限られた時間と集中力の中で、調査コマンドと防御コマンドを使い分ける。
4. 10分経過、または重要資産が侵害されると終了。
5. 終了時にスコア、守れた資産、判断ログ、改善メモが表示される。

## コアループ

1ターンはリアルタイム約5秒。入力中も時間は進む。

- システムがイベントを生成する。
- 画面上部にステータスを表示する。
- 画面中央に最新アラートと短いログを表示する。
- プレイヤーはコマンドを入力する。
- コマンドの実行には即時または数秒のクールダウンがある。
- 対処が遅れると被害・負荷・焦燥が増える。

## 勝敗条件

### 勝利

10分間、以下のいずれも破綻させずに耐えきる。

- `core` サーバーの侵害度が100未満
- `accounts` の漏洩度が100未満
- `trust` が0より大きい
- `panic` が100未満

### 敗北

以下のどれかを満たすと即終了。

- `core` 侵害度100
- `accounts` 漏洩度100
- `trust` 0
- `panic` 100

## ステータス

- `time`: 残り時間または経過時間
- `integrity`: サービス健全性。0で停止
- `core`: 重要サーバー侵害度。100で敗北
- `accounts`: アカウント漏洩度。100で敗北
- `trust`: 利用者信頼。0で敗北
- `panic`: 焦燥。100で敗北
- `focus`: コマンド実行リソース。強力な行動で消費し、時間で回復
- `tickets`: 未対応アラート数

## 難易度

5段階。

| 難易度 | 名称 | 想定 |
| --- | --- | --- |
| 1 | お茶つき保守 | チュートリアル向け。イベント少なめ、ヒント多め |
| 2 | 夜間当番 | 標準より少し易しい。誤検知が少ない |
| 3 | 研究室防衛 | 標準。10分完走が適度に難しい |
| 4 | 炎上メンテ | イベント頻度高め。焦燥管理が重要 |
| 5 | 人間型ゼロデイ | 複合イベント多め。誤操作のペナルティ大 |

難易度で変化する値:

- イベント発生間隔
- 複合イベントの確率
- 誤検知率
- 被害進行速度
- `focus` 回復速度
- ヘルプ表示の詳しさ
- 初期 `panic`

## イベント種別

### phishing

件名や本文に煽り文句がある。放置すると `accounts` と `panic` が上がる。

対処例:

- `inspect mail`
- `verify sender`
- `block sender`
- `train user`

### brute_force

ログイン失敗が急増する。放置すると `accounts` が上がる。

対処例:

- `grep auth fail`
- `rate-limit login`
- `enable mfa`
- `lock account <id>`

### suspicious_log

ログ内に不自然な行が混ざる。真の脅威か誤検知かを調べる必要がある。

対処例:

- `logs app`
- `grep error app`
- `sort ip`
- `trace <id>`

### overload

サービス負荷が高まる。放置すると `integrity` と `trust` が下がる。

対処例:

- `status`
- `restart edge`
- `throttle traffic`
- `isolate service <name>`

### misconfig

設定ミスによる公開範囲や認証設定の問題。放置すると `core` が上がる。

対処例:

- `audit config`
- `patch config`
- `rollback config`

### social_pressure

「急いでクリック」「今だけ限定」など、プレイヤーの `panic` を上げるイベント。

対処例:

- `tea`
- `verify official`
- `ignore lure`

## コマンド仕様

入力は小文字コマンド中心。略語も一部許可する。

### 基本

- `help`: コマンド一覧
- `help <command>`: 個別ヘルプ
- `status`: 現在ステータス
- `alerts`: 未対応アラート一覧
- `logs <target>`: 対象ログを見る
- `pause`: チュートリアルまたは難易度1のみ一時停止
- `quit`: 終了

### 調査

- `inspect <id>`: アラート詳細を見る
- `grep <word> <target>`: ログから語を含む行を拾う
- `count <word> <target>`: 語の出現回数を見る
- `sort <field>`: IP、ユーザー、時刻などでログを並べる
- `uniq <field>`: 同一要素の件数を見る
- `trace <id>`: 関連イベントを追跡する
- `verify <target>`: メール送信元、公式経路、設定差分などを検証する

### 防御

- `block <ip|sender>`: IPまたは送信元を遮断
- `rate-limit <service>`: サービスにレート制限
- `enable mfa`: 2段階認証を有効化
- `lock <account>`: アカウントを一時ロック
- `patch <target>`: 設定やサービスを修正
- `rollback <target>`: 直近の危険な変更を戻す
- `isolate <service>`: サービスを隔離して被害拡大を止める

### 回復・人間系

- `tea`: 焦燥を下げる。短いクールダウンあり
- `train user`: フィッシング耐性を上げる
- `memo <text>`: 終了時に表示されるメモを残す

## ヘルプ表示方針

`help` はプレイ中に邪魔にならない短さにする。

例:

```text
Commands:
  status              show server state
  alerts              list active incidents
  inspect <id>        read incident detail
  logs <target>       show recent logs
  grep <word> <log>   filter log lines
  block <ip>          block suspicious source
  patch <target>      fix known weakness
  tea                 lower panic
  help <command>      command detail
```

`help grep` の例:

```text
grep <word> <target>
  Finds log lines containing <word>.
  Example: grep fail auth
  Good for: brute_force, suspicious_log
  Cost: 1 focus
```

## 画面レイアウト

```text
Human Patch Defender   difficulty: 3   time: 06:42
integrity 82  core 18  accounts 27  trust 74  panic 31  focus 6/10

ACTIVE ALERTS
  A12  phishing        "Important notice: account anomaly"
  A13  brute_force     auth failures from 203.0.113.42

RECENT LOG
  06:41 auth fail user=kazuya ip=203.0.113.42
  06:41 mail lure sender=promo.example subject="今だけ限定"

> 
```

## スコア

基本スコア:

- 生存秒数
- 残り `integrity`, `trust`
- 低い `core`, `accounts`, `panic`
- 正しく対処したイベント数
- 誤遮断や過剰隔離の少なさ

称号例:

- `正面玄関卒業`
- `ログを読む人`
- `自分サーバー保守者`
- `研究者型ディフェンダー`
- `焦燥バックドア封鎖班`

## 実装方針

### ファイル構成案

```text
pub/projects/cyber_defense_cli/
  spec.md
  game.js
  README.md
```

試作では単一 `game.js` にまとめる。拡張時に以下へ分割する。

```text
src/
  engine.js
  events.js
  commands.js
  renderer.js
  difficulty.js
```

### 技術メモ

- `readline` と `process.stdin.setRawMode(false)` を使う通常入力方式から始める。
- 画面更新は `setInterval` で1秒ごと。
- イベント進行は5秒ごとのtick。
- 入力中も時間は進める。
- `console.clear()` で再描画する。
- 乱数は簡易seed対応にし、デバッグ可能にする。

## 初回試作の範囲

必須:

- 10分ゲームループ
- 難易度5段階
- `help` と `help <command>`
- 6種類以上のイベント
- 10個以上のコマンド
- 勝敗判定
- スコア表示

余裕があれば:

- チュートリアルモード
- キャラクター風の短い掛け合い
- seed指定
- 終了後の改善アドバイス

## 安全上の境界

- 実在サービスへのアクセス、攻撃、スキャン、侵入、認証回避は行わない。
- `curl` などの語はゲーム内概念としてのみ扱い、実際のネットワーク通信はしない。
- IP、ドメイン、メールはドキュメント用予約例または架空値を使う。
- 防衛と観察、判断練習、CLI操作の雰囲気を中心にする。

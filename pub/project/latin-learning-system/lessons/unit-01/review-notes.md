# 第1単元 人間レビュー資料

## 状態

M5の人間レビュー候補である。`editorial-approved` と `expert-reviewed` は付与していない。自動検査の成功は、内容・日本語・発音・正答一意性の人間承認を意味しない。

## 学習目標

### 1A

- 初級で使う文字と基本音価を区別する。
- `i/j`、`u/v` の表記差を説明する。
- 短い語を基本音価に沿って読む手順を使う。

新出技能：`orth.alphabet.classical-basic`、`orth.i-j.variant-recognize`、`orth.u-v.variant-recognize`、`phon.letter-sound.classical-basic`、`phon.word.read-aloud.basic`。

### 1B

- 長母音記号を見分ける。
- 初級語を音節に分ける。
- 母音の長短と音節量、本性による長さと位置による長さを区別する。

新出技能：`orth.macron.recognize`、`phon.syllable.divide-basic`、`phon.syllable.quantity.basic`。1Aの音価と音読を復習する。

### 1C

- 基本アクセント規則を使う。
- マクロンを編集・学習上の補助表示として認識する。
- 語尾が文法情報を担うという概念を説明する。
- 古典散文を初級・中級の基準範囲として区別する。

新出技能：`phon.accent.rule.basic`、`phon.macron-editorial-aid.recognize`、`morph.ending.grammatical-information`、`register.classical-prose.scope-recognize`。曲用・活用、格名、語形生成は未習のままである。

## 読み方と操作

`dist/unit-01/index.html` をブラウザで開く。各小節末の「この小節を練習する」または本文末の「単元確認へ進む」から `drill.html` へ移る。ドリルの「説明へ戻る」で本文へ戻れる。進捗は端末内のlocalStorageへ保存され、利用不能時は画面を閉じるまでメモリへ保持する。

## 主要説明と出典

| 説明 | 根拠 | 直接確認範囲 |
| --- | --- | --- |
| 古典期のI/V、現代版のi/j・u/v | `src-lat-ag-dcc` | DCC版A&G §1 Alphabet |
| 復元発音の位置づけ、c・g・s・子音i・v等の基本音価 | `src-lat-ag-dcc` | §8 Vowel and Consonant Pronunciation |
| 音節数と初歩の区切り | `src-lat-ag-dcc` | §7 Syllables |
| 母音長、音節量、本性・位置による長さ、長母音表示 | `src-lat-ag-dcc` | §§9–11 Quantity of Syllables |
| 二音節語・三音節以上の基本アクセント | `src-lat-ag-dcc` | §12 Accents |
| 語尾概念と古典散文の課程範囲 | M2技能仕様、GOALS、DEC-0014 | プロジェクト設計判断 |

上記DCCページとcredits/reuseは2026-08-25にCodexが本文を直接確認した。長い引用は保存せず、教材本文は要約・独自記述である。`Vox Latina` は出版社メタデータだけを確認した資料であり、今回の確認済み根拠には使っていない。

## 問題構成と代表例

全21問：1A 6問、1B 4問、1C 5問、累積確認6問。

- 選択式：文字と音価、表記差、音節区切り、音節量、アクセント、語尾概念、レジスター。
- 短文入力：`Rōma` のマクロン必須／任意の対照、i/j・u/vの指定字形。
- 自己評価式発音：2問。音声自動判定をせず、チェック項目と人間確認の必要性を示す。
- 誤答フィードバック：英語式音価の転移、発音体系の混在、母音長と音節量の混同、予告を習得済みとみなす誤り等を区別する。

## 技能カバレッジ

`coverage.json` に12新出技能ごとの説明、短い例、誘導練習、独立確認、後の復習を記録した。問題数を増やすための同型反復は避け、複数技能を統合する累積確認を置いた。音読の独立確認は自動採点せず、自己評価と人間確認へ分離した。

## 自動検査結果

- `validate.py all`：エラー0。既存警告8件、新規警告2件。
- JSON Schema：3教材メタデータ、6注釈例、7語彙、21問題を検査対象に追加。
- Pythonテスト、fixture、Python/JavaScript正規化、決定的ビルド：実行結果は最終反復ログを正本とする。
- `file://` 実ブラウザ試験：この環境では未実行。`tests/browser/m5-unit-01.spec.mjs` を人間がWindows PowerShellから実行する必要がある。

## 警告

既存8件（Unit 2以降）：`LOAD_2B_SIX_SKILLS`、`LOAD_3A_CASE_NUMBER`、`LOAD_CONJUGATION_CLASSES` 2件、`LOAD_SIX_SKILLS_WARNING`、`LOAD_4C_ADJECTIVE_AGREEMENT`、`LOAD_5C_DICTIONARY_INTRO`、`LOAD_5C_TEN_LEXEMES`。M5の技術的失敗ではない。

新規2件：

- `M5_EDITORIAL_REVIEW_PENDING`：日本語、構成、問題の意味的一意性が人間編集確認前。
- `M5_VOCABULARY_SOURCE_REVIEW_PENDING`：7語の個別辞書項目（属格・性・長母音等）を直接辞書本文と照合していない。

## Codexが判断した箇所

- 仮名を正確な発音表記として使わず、IPAと注意書きを優先した。
- `dominus / dominum` は固定比較形とし、格名・曲用表・生成を問わない。
- 指定字形問題は `orthography-strict`、長母音問題は `macron-sensitive`、意味問題は `meaning-default` とした。
- 発音問題を `self-assessed-pronunciation` として追加し、自動採点を禁止した。
- 例はすべて教材制作例であり、古典作品からの引用とは表示していない。

## 未確認事項と人間に確認してほしい項目

1. 中学生でも読み直さず理解できる日本語か。特に「音価」「音節量」「本性」「位置」「ペヌルティマ」。
2. 1Aの基本音価表が初回負荷として適切か。`qu` を残すか。
3. `Rōma`、`terra`、`amīcus` の音節・量・アクセント説明に専門的な誤りや過度の簡略化がないか。
4. `dominus / dominum` が格を先取りしすぎず、語尾概念だけを示しているか。
5. 21問すべてについて、設問文だけで意図が限定され、正答集合と不正答集合が意味上も分離しているか。
6. 7語の見出し形、属格、性、長母音を信頼できる辞書の個別項目と照合すること。
7. 音読チェック項目の妥当性。可能ならラテン語音韻の知識を持つ人間が発音を確認すること。
8. Windows上でM4回帰とM5 `file://` ブラウザ試験を実行し、表示、保存、フォールバック、キーボード、フォーカス、印刷、コンソールを確認すること。M5の正確なコマンドは `& 'C:\Users\ks_ar\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' tests/browser/m5-unit-01.spec.mjs`。

## 承認時に更新する記録

- 各教材・例・問題の対象 `content_version` に対する `editorial-approved` 記録。
- 問題の意味的一意性を確認した範囲と確認者。
- 個別辞書照合後の `source-checked` 記録。確認した資料IDとlocatorを必須とする。
- 人間専門家が参加した場合だけ `expert-reviewed`。Codex確認をここへ記録しない。
- `PLANS.md` のM5状態。ブラウザ試験だけでM5完了にはしない。

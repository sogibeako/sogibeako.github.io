# 問題制作規約

## 1. 対応形式

- `feature-identification`：形から格・数・性・人称・時制等を選ぶ。
- `inflection`：指定特徴に合う形を生成する。
- `fill-blank`：限定された文脈の空所を補う。
- `matching`：語、訳、形態情報等を対応させる。
- `ordering`：指定された制約下で語句を並べる。
- `selected-response`：一つまたは明示された複数の選択肢を選ぶ。
- `short-input`：短い文字列または構造化特徴を入力する。
- `reading-analysis`：短文の構造・機能を選択または構造化入力する。
- `self-assessed-translation`：模範分析とチェック項目による自己評価。自動一意採点しない。
- `self-assessed-composition`：制約、模範例、チェック項目による自己評価。自動一意採点しない。
- `self-assessed-pronunciation`：音声入力・音声判定を行わず、読み方の手順と自己確認項目によって自己評価する。人間による発音確認の代用にしない。

## 2. 必須データ

問題はID、schema/content version、単元、形式、prompt、stimulus、対象技能、語彙、前提技能、answer mode、accepted answers、拒否解衝突検査、正規化プロファイル、feedback、misconception tags、evidence、review、automatic scoring可否を持つ。

`skills` は少なくとも `target`、`prerequisite`、`review`、`preview` を区別する。`vocabulary` は使用語彙と採点対象語彙を区別する。未習技能・未導入語彙を、誤答排除に必要な知識として使わない。

## 3. 正答一意性

「正答が一意」とは正答文字列が一個という意味ではない。指定された正規化・採点規則の下で、妥当な正答集合が漏れなく表現され、正答集合と不正答集合が衝突せず、問題文だけで必要な解釈が限定されることをいう。

複数表記が同じ文法解答を表す場合は複数accepted answerを持てる。正規化後の重複は許容解内部では統合できるが、拒否解、別選択肢、異なる文法特徴との衝突は失敗である。

## 4. 自動採点しない条件

- 文脈なしでは複数解析がある語形。
- 複数の自然な訳がある翻訳。
- 複数の妥当な語順・表現がある作文。
- 複数の構文解析が成立し、設問が限定しない問題。
- 正規化で正答と不正解が衝突する問題。
- 出題文だけでは必要解釈を限定できない問題。
- 出典・文法・正答一意性の人間確認が未完了な本番問題。

`self-assessed-translation`、`self-assessed-composition`、`self-assessed-pronunciation` は常に `automatic_scoring: false` とする。

## 5. 形式別条件

### 選択肢

- `correct_choice_count` を持ち、単一選択か複数選択かを明示する。
- 生の値と正規化後の両方で重複・衝突を禁止する。
- 誤答選択肢には既習の誤概念タグを付ける。
- 意味不明な文字列を数合わせに使わない。
- 未習事項を知らなければ排除できない誤答を置かない。

### 語形生成・短入力

- 採点対象の特徴、許容表記、拒否すべき近接形を記録する。
- `morphology-default` は異なる語尾を同一視しない。
- 長母音そのものを問う場合は `macron-sensitive` を使う。

### ordering

語順が複数妥当なら、許容順をすべて列挙できる小規模問題に限るか、自動採点を行わない。「通常語順」を唯一の文法正解としない。

### reading-analysis

採用解析と検討した別解析を刺激データに持たせる。形態的多義性が文脈で解消される理由をfeedbackで示す。

## 6. 衝突検査

automatic scoringをtrueにするには、`collision_check.result` が `pass` でなければならない。これは制作時の宣言であり、M4は実際に全accepted/rejected/choiceを同じプロファイルで正規化して再計算する。宣言と計算が異なれば失敗する。

## 7. フィードバック

正答だけでなく、可能な範囲で次を示す。

- 誤りの種類：形態、統語、語彙、正書法、設問理解。
- `misconception_tags`。
- 確認すべき既習技能ID。
- 正解を考える次の一手。

未習規則を使って誤りを説明しない。自由訳・作文は、構造、形態、語彙、自然さを別項目で自己評価する。

## 8. 承認

Schema通過だけでは本番化できない。ラテン語刺激、解析、正答集合、拒否解、正規化、feedback、未習境界、意味的一意性を人間が確認し、review履歴を現在のcontent versionへ結びつける。

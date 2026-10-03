# Latin Learning System

日本語母語話者向けの古典ラテン語教材を、少量ずつ制作、検査、評価、修正できるようにするプロジェクトである。

## 現在の状態

- 完了したマイルストーン：M0「プロジェクト統治の確立」、M1「参考資料と学習原則」、M2「技能依存関係と課程仕様」、M3「制作・検査規則」、M4「最小ツールチェーン」
- M2の成果：58技能の依存グラフ、5単元15小単元の課程マップ、各単元仕様、復習配置、暫定負荷上限
- M3の成果：制作・承認・正規化・翻訳・問題・品質規約、JSON Schema 11件、検証fixture 23件
- M4の状態：完了。検査CLI、意味検査、正規化、fixture 31件、決定的静的ビルド、検査専用デモドリル、自動テストを実装した。DEC-0023案Bの限定修正後、全非ブラウザ検査とビルドが成功し、依頼者によるWindows PowerShellでの `file://` ブラウザ回帰試験も成功した。
- M5「第1単元の試作」は人間レビュー待ちである。第1単元1A～1Cの本文候補、7語、6注釈例、21問、技能カバレッジ、静的本文・ドリル、レビュー資料を作成した。編集承認・専門家承認は未付与で、M5実ブラウザ回帰も人間実行待ちである。
- M6と第2～第5単元の教材本文は未着手である。

## 最初に読む文書

1. `AGENTS.md`：作業時に必ず守る規則
2. `GOALS.md`：対象学習者、到達目標、対象範囲、成功条件
3. `PLANS.md`：M0～M6、現在位置、次の候補
4. `standards/data-conventions.md`：初期データ規約
5. `logs/decisions.md`：確定した設計判断
6. `logs/iteration-log.md`：各反復と検査結果
7. `sources/source-policy.md`：出典の確認・引用・利用条件の規則
8. `curriculum/english-reference.md` と `curriculum/learning-principles.md`：M1の観察と設計原則
9. `sources/latin-source-comparison.md` と `sources/bibliography.json`：資料候補と暫定書誌
10. `curriculum/latin-skill-map.yml` と `curriculum/curriculum-map.yml`：M2の技能DAGと課程仕様
11. `lessons/unit-01/`～`unit-05/` の `unit-spec.yml`：本文ではない小単元仕様
12. `standards/data-schema.md` と各M3規約：正本分担と制作・検査上の意味規則
13. `schemas/` と `tests/fixtures/`：構造規則とM4へ引き継ぐ検証境界

## ディレクトリ

- `curriculum/`：英語教育参照、学習原則、技能・課程マップ
- `standards/`：本文、問題、品質、データの規約
- `sources/`：出典方針、書誌情報、許容される最小限の引用
- `vocabulary/`：語彙データ
- `lessons/`：教材本文と単元仕様
- `drills/`：問題データ、表示プログラム、生成物
- `schemas/`：構造化データのスキーマ
- `scripts/`：M4の検査CLI、正規化、静的生成
- `tests/`：自動検査、回帰試験、ブラウザ試験
- `logs/`：判断記録と反復記録
- `dist/`：M4検査専用デモとM5第1単元候補の静的生成物（編集上の正本ではない）

## ライセンス

ライセンスは未確定であり、現時点では著作権を留保する。第三者素材を使用する場合は、出典と利用条件を個別に記録する。公開・配布前に、プログラム、教材本文、問題データ、引用・翻案、外部素材を分けて検討する。

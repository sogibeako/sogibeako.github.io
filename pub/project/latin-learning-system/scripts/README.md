# scripts

M4の検査・静的生成コードを置く。Python側は標準ライブラリだけを使い、Draft-07 Schema検証にはM3で確認済みのPowerShell 7 `Test-Json`を呼び出す。新しい依存関係は追加していない。

## 検査CLI

入口は `python scripts/validate.py <command>` である。`all`、`schema`、`references`、`dag`、`curriculum`、`exercises`、`reviews`、`normalization`、`fixtures` を提供する。`--format text|json`、`--strict`、`--path`、`--fail-on-warning` を受け付ける。`--strict` はM4時点では全定義済み検査を行う互換オプションである。`--path` は対象外パスを拒否する安全境界であり、絞り込みは将来拡張とする。

終了コードは、0がエラーなし、1が対象データのエラー（`--fail-on-warning`時の警告を含む）、2が使用法・環境・設定エラーである。診断は `severity`、安定コード、ファイル、record ID、field path、related ID、修正提案を持つ。

主要な安定コード：

- Schema・環境：`SCHEMA_JSON_INVALID`、`SCHEMA_ID_DUPLICATE`、`SCHEMA_REF_UNRESOLVED`、`SCHEMA_VALIDATION_FAILED`、`ENV_SCHEMA_VALIDATOR_UNAVAILABLE`
- 参照：`REF_UNKNOWN_SKILL`、`REF_UNKNOWN_VOCABULARY`、`REF_UNKNOWN_SOURCE`、`REF_UNKNOWN_UNIT`、`REF_UNKNOWN_NORMALIZATION_PROFILE`、`REF_UNKNOWN_SCHEMA`、`REF_WRONG_TARGET_TYPE`、`REF_DUPLICATE`
- DAG：`DAG_REQUIRES_CYCLE`、`DAG_SELF_REFERENCE`、`DAG_UNKNOWN_SKILL`、`DAG_DUPLICATE_EDGE`、`DAG_COREQUISITE_ASYMMETRIC`、`DAG_STRONG_DEPENDENCY_ON_BOUNDARY`
- 課程：`CURRICULUM_SKILL_BEFORE_PREREQUISITE`、`CURRICULUM_REVIEW_BEFORE_INTRO`、`CURRICULUM_DUPLICATE_INTRODUCTION`、`CURRICULUM_LEARNING_PHASE_ORDER`、`UNIT_SPEC_CURRICULUM_MISMATCH`
- 教材意味：`SKILL_USED_BEFORE_INTRODUCED`、`SKILL_REQUIRED_PREREQUISITE_UNAVAILABLE`、`VOCAB_USED_BEFORE_AVAILABLE`、`ANSWER_NORMALIZATION_COLLISION`、`PREVIEW_FORMAL_SKILL_MIXED`、`PREVIEW_REQUIRED_BY_STRONG_GRAPH`
- 確認：`REVIEW_STALE_CONTENT_VERSION`、`REVIEW_EXPERT_REQUIRES_HUMAN`、`REVIEW_SOURCE_EVIDENCE_MISSING`、`REVIEW_SUPERSEDED_ACTIVE`、`REVIEW_STATUS_CURRENT|STALE|SUPERSEDED|INVALID`
- 負荷：`LOAD_2B_SIX_SKILLS`、`LOAD_3A_CASE_NUMBER`、`LOAD_CONJUGATION_CLASSES`、`LOAD_4C_ADJECTIVE_AGREEMENT`、`LOAD_5C_DICTIONARY_INTRO`、`LOAD_5C_TEN_LEXEMES`

## ビルド

`python scripts/build.py [--clean] [--output dist] [--fail-on-warning]` を使う。生成前に `validate.py all` を実行し、エラーなら生成を始めない。出力先は解決後に `dist/` 内であることを確認する。`--clean` は `.build-manifest.json` に列挙された生成ファイルだけを削除し、`dist/README.md` 等の管理外ファイルを保持する。JSONはコードとして連結せず `application/json` 要素へ埋め込み、`<`、`>`、`&`等をエスケープする。現在時刻を入れず、同じ入力から同じSHA-256を生成する。

## 今回実際に成功したコマンド

- `python scripts/validate.py schema`
- `python scripts/validate.py fixtures`
- `python scripts/validate.py references`
- `python scripts/validate.py normalization`
- `python scripts/validate.py reviews --format json`
- `python -m unittest discover -s tests -p "test_*.py" -v`
- 同梱Node 24.19.0による `tests/js/normalization-test.js`

DEC-0023案Bの限定修正後、`python scripts/validate.py all --format json` はエラー0・人間確認警告8で終了コード0となった。実データでは `PREVIEW_REQUIRED_BY_STRONG_GRAPH` が解消し、同型のsemantic-invalid fixtureでは同コードを引き続き検出する。`python scripts/build.py --clean` を二回実行し、manifestのSHA-256一致を確認した。2026-08-25に依頼者がWindows PowerShellからブラウザ回帰試験を実行し、成功を確認した。このブラウザ結果は人間実行として記録する。

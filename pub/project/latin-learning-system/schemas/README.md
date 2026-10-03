# schemas

M3で確定したJSON Schema Draft-07を置く。構造・型・必須項目・列挙値・局所条件の正本であり、教育的意味の正本は `standards/` にある。

- 共通・確認・出典：`common.schema.json`、`review.schema.json`、`source.schema.json`
- 教材レコード：`vocabulary.schema.json`、`example.schema.json`、`exercise.schema.json`、`lesson.schema.json`
- M2互換：`skill-map.schema.json`、`curriculum-map.schema.json`、`unit-spec.schema.json`
- 正規化：`normalization-profile.schema.json`

`$id` はこのディレクトリ内で一意とし、相対 `$ref` は同ディレクトリ基準で解決する。主要教材レコードは `additionalProperties: false`、M2の可変説明オブジェクトだけ移行互換のため限定的にtrueとする。意味的な参照実在性、時系列、正規化後衝突、現行版承認はM4検査の責任である。

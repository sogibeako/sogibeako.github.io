# fixtures

Schemaと意味規則の境界を試す最小データであり、本番教材ではない。`manifest.json` が各fixtureの期待結果、Schema、検査層、安定エラーコード、意図した規則、注記の正本である。ファイル名から期待結果を推測しない。

- valid：11件。対応Schemaを通る。
- json-schema-invalid：9件。意味検査前にSchemaで拒否される。
- semantic-invalid：11件。Schemaを通過した後、指定された意味検査だけで拒否される。

意味負例は、正規化衝突、参照欠落、古い版の承認、requires循環、存在しない依存技能、未習技能、利用開始前語彙、初出以前の復習、curriculum-mapとunit-specの不一致、2C予告と第4単元正式技能の混同、任意予告を下流技能の強い前提にする不整合を覆う。Codexによるexpert-reviewedと予告提示の習得済み扱いはSchema負例で覆う。

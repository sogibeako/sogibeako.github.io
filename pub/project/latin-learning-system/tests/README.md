# tests

M4の自動検査を置く。全データは構造・境界の確認用であり、本番教材へ流用しない。

- `fixtures/`：valid 11件、Schema-invalid 9件、semantic-invalid 11件。manifestが検査層、期待コード、対象規則を正本として示す。
- `normalization-vectors.json`：PythonとJavaScriptが共有する13検査（11比較形、2不一致条件）。
- `unit/`：正規化、DAG、課程、意味負例、fixture manifest。
- `integration/`：安全な埋め込み、出力境界、管理外ファイルを残すclean、決定的ビルド。
- `js/`：ブラウザ側と同じJavaScript正規化処理。
- `browser/`：既存Playwrightが利用可能な環境向けの実ブラウザ回帰試験。

M5では第1単元のSchema・意味・カバレッジ・決定的生成テストと `browser/m5-unit-01.spec.mjs` を追加した。後者は `file://` で本文とドリルの往復、長母音採点、自己評価式発音、保存、レスポンシブ、印刷、フォールバック、コンソールを確認する。

Pythonテストは `python -m unittest discover -s tests -p "test_*.py" -v`。ブラウザ試験は、既存PlaywrightとChromeがある環境で同梱Nodeから `tests/browser/m4-drill.spec.mjs` を実行する。依存はインストールしない。

Codexのアプリ内ブラウザではURLポリシーが `file://` 遷移を拒否した。2026-08-25に依頼者がWindows PowerShellから同試験を実行し、`Browser drill regression: passed.` を確認した。この結果は人間による外部実行であり、Codex自身による実行として扱わない。assertionとM4合格条件の対応は `browser/README.md` に記録する。

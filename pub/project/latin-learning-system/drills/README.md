# drills

M4の静的ドリル実証版と、M5の第1単元レビュー候補を置く。`data/demo.json` はツールチェーン確認専用で、本番教材・本番例文・本番語彙・本番問題ではない。`data/unit-01/` の個別JSONが第1単元問題の正本である。

- `src/index.html`：意味構造、フォーム、aria-live、エラー領域、埋め込みJSONの置換点
- `src/styles.css`：320pxからデスクトップまでのレスポンシブ表示、明示的なフォーカス、色以外の正誤記号、印刷、reduced-motion
- `src/normalization.js`：正規化プロファイルの処理順を実行するブラウザ側エンジン
- `src/app.js`：選択式・短文入力・構造化特徴、結果・解説、次問・再挑戦、進捗、保存・復元・確認つきリセット、メモリフォールバック
- `data/demo.json`：M4専用デモ。`</script>`を含む安全埋め込みprobeも持つ

ビルド後は `dist/index.html` を相対パスのまま配置でき、閲覧にNode.jsやサーバーを要求しない。保存キーはschema/content versionと単元IDを含み、不一致・破損時は初期化する。`?storage=fail` は保存失敗時のメモリフォールバックを検査するためだけのM4テストフックである。

未対応問題形式は例外を安全な日本語エラー領域へ表示し、黙って採点しない。データ由来文字列は `textContent` またはDOM属性で設定し、`innerHTML`へ渡さない。

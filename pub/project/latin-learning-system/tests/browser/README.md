# browser tests

`m4-drill.spec.mjs` は、既存PlaywrightとChromeを使い、生成済み `dist/index.html` を `file://` で開くM4回帰試験である。3問題形式、正答・不正答、再挑戦、次問、Enter操作、問題見出しへのフォーカス、保存・再読込、破損・版不一致保存の破棄、確認つきリセット、保存失敗時のメモリフォールバック、320/768/1280px、200%相当拡大、印刷、特殊文字埋め込み、コンソールエラーを検査する。

## M4合格条件とassertionの対応

| M4合格条件 | `m4-drill.spec.mjs` の確認箇所 | 判定 |
|---|---|---|
| `file://` からの起動と実操作 | `pathToFileURL(dist/index.html)` でURLを作り、`page.goto(url)` 後にreadyを待つ。以後の回答操作が同じページで成功する。 | 対応 |
| 回答、正誤表示、解説、再挑戦 | 選択式で不正解表示、再挑戦、正解表示を確認し、短文入力・構造化特徴にも回答する。結果領域には正誤文とfixtureのfeedbackが同時に表示される。 | 対応 |
| localStorageへの進捗保存と再読込 | `localStorage.length > 0`、reload後の正答数、破損JSON・版不一致データの安全な初期化、確認つきリセットを確認する。 | 対応 |
| localStorage利用不能時のフォールバック | `?storage=fail` でmemory modeを確認し、その状態でも回答と正答数更新が継続することを確認する。 | 対応 |
| キーボード操作とフォーカス管理 | 回答・再挑戦・次問をEnterで操作し、次問後に問題見出しが `document.activeElement` になることを確認する。 | 対応 |
| 320px、768px、1280pxでの表示 | 各幅で横方向overflowがないことを確認する。加えて320px・200%相当拡大も確認する。 | 対応 |
| 印刷表示 | print mediaで回答ボタンが非表示になることを確認する。 | 対応 |
| コンソールエラーの不存在 | `page.on("console")` でerrorを収集し、終了前に0件であることを確認する。 | 対応 |

正誤・進捗通知のアクセシビリティは、生成元 `drills/src/index.html` の `role="status"`、`aria-live="assertive"`、`aria-live="polite"` と、上記実操作・フォーカス試験を組み合わせて確認する。色以外の正誤記号は `drills/src/styles.css` の `✓ 正解` と `✗ 要確認` で確認する。

## 人間によるWindows実行記録

- 実行日：2026-08-25
- 環境：Windows、PowerShell、既存PlaywrightおよびChrome
- 対象コマンド：`node tests/browser/m4-drill.spec.mjs`
- 結果：`Browser drill regression: passed.`
- 確認者：依頼者（人間）
- 記録上の区別：このブラウザ試験はCodex自身が実行したものではない。依頼者から提供された実行結果を記録した。

## M5第1単元ブラウザ試験

`m5-unit-01.spec.mjs` は `dist/unit-01/index.html` と `drill.html` を `file://` で開き、本文1A～1C、本文から単元確認への導線、選択式、長母音に敏感な入力、正誤・解説・再挑戦、フォーカス、保存・再読込、自己評価式発音、320/768/1280px、印刷、localStorage失敗時のメモリフォールバック、コンソールエラーを検査する。M4回帰とは独立して両方を実行する。

Windows PowerShellでの実行例（NodeがPATHにある環境）：

`node tests/browser/m4-drill.spec.mjs`

`node tests/browser/m5-unit-01.spec.mjs`

期待結果は順に `Browser drill regression: passed.` と `Browser unit-01 regression: passed.` である。M5試験は現時点で人間による実ブラウザ実行待ちであり、成功したとは記録しない。

このWindows環境でPATH上にNodeがない場合の正確なM5コマンド：

`& 'C:\Users\ks_ar\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' tests/browser/m5-unit-01.spec.mjs`

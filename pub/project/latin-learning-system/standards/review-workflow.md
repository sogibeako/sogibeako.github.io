# 確認・承認ワークフロー

## 1. 独立した状態

- `draft`：制作状態。`draft`、`ready-for-review`、`published-candidate`、`retired` を取り得る。
- `source-checked`：記述と根拠資料の該当箇所を確認した記録。
- `editorial-approved`：依頼者等が教材構成、日本語、対象学習者への適合を確認した記録。
- `expert-reviewed`：人間のラテン語専門家が対象範囲を確認した記録。
- `automated-validation`：スキーマや検査規則を機械が通した記録。

後四者は順序付きの一状態ではなく、独立した履歴である。自動検査成功は人間承認ではない。編集承認は文法専門家の承認を意味しない。Codexは `expert-reviewed` を付与できない。

## 2. 確認記録

各記録は次を持つ。

- `kind`
- `result`：`pass`、`fail`、`not-reviewed`、`stale`
- `reviewer_type`
- `reviewer_id` または `reviewer_display_name`
- `reviewed_at`
- `reviewed_content_version`
- `scope`
- `notes`
- `evidence_refs`
- `active`
- 任意の `supersedes`

一部だけ確認した場合は `scope` にフィールド、段落、問題ID等を列挙する。古い記録を無言で上書きせず、後続記録から `supersedes` で参照する。

## 3. 有効性判定

合格記録が現在有効なのは、少なくとも次を満たす場合だけである。

1. `result` が `pass`、`active` がtrue。
2. `reviewed_content_version` が対象の現在の `content_version` と一致する。
3. 確認範囲が判定対象を含む。
4. 後続のfail・stale記録に置き換えられていない。
5. 種別に適切な確認者である。

この判定はJSON Schemaだけでは保証できないためM4で検査する。

## 4. `source-checked` の追加条件

資料IDがあるだけでは付与できない。`source-policy.md` に従い、該当版と箇所を実際に確認し、claim scope、locator、確認注記、引用・要約・生成の別、権利条件を記録する。本文未確認資料、検索スニペット、一般的な参考文献一覧だけではpassにしない。

## 5. 変更と失効

| 変更 | 必ず再確認する記録 | 維持できる記録 |
|---|---|---|
| ラテン語本文、語形、解析、訳、正答 | source、editorial、expert、automatic | なし。ただし無関係scopeの記録は別途判定 |
| 解説の意味・適用範囲 | source、editorial、automatic | expertはscopeにより再確認 |
| 問題の許容解、拒否解、正規化、採点対象 | editorial、automatic、意味的一意性の人間確認 | 出題文のsourceは無変更scopeなら維持可能 |
| 出典locator、引用、利用形態 | source、rights確認、automatic | 内容に無関係なeditorialは維持可能 |
| 表示だけの修正、誤字、句読点 | automatic | 内容が同一であると変更記録に明記すれば内容承認を維持可能 |
| レイアウト・CSSだけ | accessibilityのautomatic/human | 教材内容の確認は維持可能 |

「誤字修正」を口実に語義・係り受け・長母音・語尾・正答が変わった場合は実質変更である。実質変更時は `content_version` を更新し、旧記録を `stale` または版不一致として扱う。

## 6. 版の運用

- 意味、正答、解析、許容範囲が変わる変更は `content_version` を上げる。
- 表示だけの変更でも `updated_at` と反復ログを更新する。
- 旧承認履歴は削除しない。
- current approvalを直接保存せず、履歴と現在版から導出する。
- 承認済み内容を部分変更した場合、scope単位で失効させ、無関係な部分まで一律承認済みにしない。

## 7. 自動検査記録

validator名・版、スキーマID、検査日時、対象content version、結果、失敗概要を記録する。Schema検証のpassは参照先の存在、ラテン語の正確性、意味的一意性、人間承認を保証しない。

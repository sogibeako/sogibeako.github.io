# ラテン語資料候補の比較

## 1. 評価方法

`adopt` は根拠として優先的に参照する候補、`supplement` は相互確認・補足用、`hold` は権利・アクセス・適合性の確認待ち、`do-not-adopt` は現在の用途には用いない提案である。採用提案は転載許可を意味しない。各版の直接確認状態と権利情報は [暫定書誌](bibliography.json) に記録する。

表中の「無料」は、調査時点でリンク先の該当公開範囲を登録なしで閲覧できたことだけを示し、再利用許可を意味しない。「有料」は書籍購入または購読アクセスが必要な候補で、公開メタデータの閲覧には通常登録を要しない。所属機関契約や個人登録の要否が提供経路で変わる資料は、その旨を注記し、教材制作前に再確認する。

## 2. 文法書・統語論

| 資料ID | 名称・主体 | 時代・得意分野 | 確認・アクセス | 権利と商用上の注意 | 提案・判断 |
|---|---|---|---|---|---|
| `src-lat-ag-dcc` | Allen and Greenough's *New Latin Grammar*、DCC版 | 古典語の伝統的体系、形態・統語の索引性 | DCC本文とcreditsを直接確認、無料 | DCC編集版はCC BY-SA。原著は1903年。韻律章607–629は古いとしてDCC版から除外 | `adopt`：開放的な基礎参照。古い分析は現代統語論と照合 |
| `src-lat-bennett-gutenberg` | Bennett, *New Latin Grammar*、Project Gutenberg | 簡潔な伝統文法 | 電子本文を直接確認、無料 | 米国でpublic domain表示。取得地域と電子化条件を再確認 | `supplement`：説明比較に有用、古さに注意 |
| `src-lat-gildersleeve-lodge` | Gildersleeve & Lodge, *Latin Grammar* | 詳細な伝統文法・統語 | 公開スキャンの書誌と本文を確認、無料 | 原著public domain。ホストのファイル条件・版を記録 | `supplement`：高度な照合用、初学者説明の唯一の根拠にしない |
| `src-lat-pinkster-ols1` | Harm Pinkster, *Oxford Latin Syntax*, Vol. 1 | 前250年～後450年、記述的統語、文体・通時差 | 出版社の概要・目次を確認、本文は未確認、有料 | 著作権保護中。短い適法な参照のみ、転載・データ化不可 | `adopt`（人間参照候補）：現代統語論の主要照合先。購入または該当箇所提供が必要 |
| `src-lat-woodcock` | E. C. Woodcock, *A New Latin Syntax* | 歴史的観点を含む統語解説 | 出版社メタデータのみ、有料 | 著作権保護中、再利用条件未確認 | `hold`：本文確認後に補助採用を判断 |

## 3. 辞書・語彙頻度

| 資料ID | 名称・主体 | 得意分野 | 確認・アクセス | 権利と商用上の注意 | 提案・判断 |
|---|---|---|---|---|---|
| `src-lat-lewis-short-logeion` | Lewis & Short / Logeion（University of Chicago） | 古典から後代を含む英語大型辞書、相互辞書検索 | Logeionのaboutと項目表示を確認、無料 | 原著のpublic domainと、電子化・修訂・サイト機能の権利を分離。大量取得不可と扱う | `adopt`：語義・用例所在の参照。教材用語義は独自執筆し出典を付す |
| `src-lat-old2` | *Oxford Latin Dictionary*, 2nd ed., OUP | 古典期中心の現代的な大型辞書 | 出版社書誌のみ、有料 | 著作権保護中。項目転載・データ抽出不可 | `adopt`（人間参照候補）：重要語義の照合。Codex未確認範囲を根拠扱いしない |
| `src-lat-tll-open` | *Thesaurus Linguae Latinae* Open Access | 全ラテン語史の用例に基づく語義史 | 公式OA案内と公開範囲を確認 | 無料閲覧と再配布許可は別。PDFの利用条件を項目ごとに確認 | `supplement`：語義史・後期用法の高度な照合 |
| `src-lat-dcc-core-vocab` | Dickinson College Commentaries Core Latin Vocabulary | 約1000語の中核語彙、頻度資料の統合 | 方法・ダウンロード・ライセンスを直接確認、無料 | CC BY-SA 3.0。派生物の表示・継承条件に注意 | `adopt`：初期語彙候補の一資料。頻度順位を単独で単元順にしない |

## 4. 注釈コーパス・形態論資源

| 資料ID | 名称・主体 | 時代・注釈 | 確認・アクセス | 権利と商用上の注意 | 提案・判断 |
|---|---|---|---|---|---|
| `src-lat-lasla` | LASLA, University of Liège | 古典作品約170万語、手作業の形態注釈 | 公式Dataverse説明を確認、無料 | CC BY-NC-SA 4.0。NCのため将来商用教材へのデータ組込み不可 | `hold`（研究参照）：検証には有力だが直接再配布しない |
| `src-lat-ud-overview` | Universal Dependencies Latin treebanks | 古典、後期、中世を含む複数ツリーバンク | 公式一覧と各ライセンスを確認、無料 | 大半がCC BY-NC-SA。LLCTはCC BY-SAだが後期勅書。コーパスごとに異なる | `hold`：研究・検査候補を個別評価し、混合ライセンスを一括扱いしない |
| `src-lat-proiel` | PROIEL Treebank | 新約、ウルガタ等の形態・依存統語注釈 | 公式サイトを確認、無料 | CC BY-NC-SA 4.0。商用再利用不可 | `supplement`（参照限定）：後期・教会ラテン語への差異確認。初級古典の正本にはしない |
| `src-lat-lemlat3` | LEMLAT 3 / CIRCSE | ラテン語形態分析・見出し語化 | 公式リポジトリ群とコードライセンスを確認、無料 | コードのApache-2.0と、辞書・語彙データの由来・権利を分けて確認する必要 | `hold`：M3でコンポーネント単位の権利監査後に検査利用を判断 |
| `src-lat-lila` | LiLa Knowledge Base | ラテン語資源のLinked Data相互運用 | 公式説明を確認、無料 | メタデータはCC BY-SA表示。リンク先データは各ライセンス | `supplement`：資料ID・見出し語連携の設計参考 |

## 5. 校訂本文・注釈資料

| 資料ID | 名称・主体 | 内容 | 確認・アクセス | 権利と商用上の注意 | 提案・判断 |
|---|---|---|---|---|---|
| `src-lat-perseus-canonical` | Perseus Digital Library canonical texts | TEI形式のギリシア・ラテン語原典 | 公式GitHubの概要とライセンス方針を確認、無料 | repository既定はCC BY-SA 3.0だが、各ファイル・版の表示を優先。原典PDでも電子化・校訂を確認 | `adopt`：原文候補の所在。作品・版ごとに権利とテキストを固定する |
| `src-lat-phi5` | Packard Humanities Institute Classical Latin Texts | 古典ラテン語本文の広範な検索 | サイトと利用表示を確認、無料閲覧 | 個人研究・fair use向け。本文コピーや再配布の基盤にしない | `supplement`（照合限定）：所在・用例確認のみ |
| `src-lat-dcc-commentaries` | Dickinson College Commentaries | 査読済み注釈、語彙、テキスト | about、credits、複数教材構成を直接確認、無料 | 原則CC BY-SAだが個別ページのcreditsを確認 | `adopt`：初学者注釈の設計参考と許諾範囲内の資料候補 |
| `src-lat-llpsi` | Hans H. Ørberg, *Lingua Latina per se illustrata* | ラテン語による段階的読本 | 出版社概要・シリーズ構成のみ、有料 | 著作権保護中。本文・配列・問題を転載しない | `supplement`（比較限定）：累積読本の慣行を観察するだけ |
| `src-lat-cambridge-course` | Cambridge Latin Course | 物語中心の初学者教材 | 公式概要・著作権表示のみ | 著作権保護中、個人参照と教材再利用を区別 | `supplement`（比較限定）：本文・問題を保存しない |

## 6. 発音・音韻・韻律

| 資料ID | 名称・主体 | 得意分野 | 確認・アクセス | 権利と商用上の注意 | 提案・判断 |
|---|---|---|---|---|---|
| `src-lat-vox-latina` | W. Sidney Allen, *Vox Latina*, 2nd ed. | 復元古典式発音、母音長、アクセント、音節量 | 出版社概要・目次のみ、有料 | 著作権保護中。内容を確認していない箇所は根拠にしない | `adopt`（人間参照候補）：第1単元前に該当箇所確認が必要 |
| `src-lat-dcc-scansion` | DCC Latin Metrics / reference works | 音節量・韻律の公開解説 | DCCの参照ページと再利用条件を確認、無料 | CC BY-SA。A&Gの古い韻律章をそのまま採らない | `supplement`：初歩説明と将来の韻文課程の照合 |

## 7. 後期・教会・中世への橋渡し

| 資料ID | 名称・主体 | 対象 | 確認・アクセス | 権利と商用上の注意 | 提案・判断 |
|---|---|---|---|---|---|
| `src-lat-nova-vulgata` | Vatican, *Nova Vulgata* | 教会の現代公式ラテン語聖書本文 | 公式本文索引と法的表示を確認、無料閲覧 | Vaticanサイト内容は著作権表示あり。大量取得・再配布不可と扱う | `hold`：発展課程の比較参照。古典用法の根拠に混ぜない |
| `src-lat-dmlbs` | Dictionary of Medieval Latin from British Sources | 6～16世紀の英国ラテン語 | 公式概要は登録なしで無料、本文提供経路は契約条件による | 著作権保護・ライセンス提供。Logeion表示も独自条件 | `supplement`（後期段階）：中世差異の所在確認、初期版対象外 |
| `src-lat-proiel` | PROIEL Vulgate component | ウルガタの注釈付き本文 | 上記の確認範囲 | CC BY-NC-SA 4.0 | `supplement`（非商用参照）：古典コーパスと区別して用法差を調べる |

## 8. 採用ポートフォリオ案

### 優先採用候補

- 開放的な基礎文法：`src-lat-ag-dcc`
- 現代統語論の人間確認先：`src-lat-pinkster-ols1`
- 辞書照合：`src-lat-lewis-short-logeion` と、利用可能なら `src-lat-old2`
- 初期語彙候補：`src-lat-dcc-core-vocab`
- 原文候補：`src-lat-perseus-canonical`（各版の権利確認必須）
- 注釈設計：`src-lat-dcc-commentaries`
- 発音の専門照合：`src-lat-vox-latina`（本文確認前は未確認扱い）

単一資料を正本にせず、伝統文法・現代統語・辞書・実際の用例を相互照合する。

### 保留する主要候補

- LASLA、UDの多く、PROIEL：研究価値は高いが非商用ライセンスが将来公開方針と衝突しうる。
- LEMLAT 3：コードと語彙資産の権利範囲を分けて監査する必要がある。
- PHI：閲覧・個人研究用であり教材本文の取得元にしない。
- 有料の現代文法・辞書・発音資料：該当本文を未確認のまま `source-checked` の根拠にしない。
- Nova Vulgata：公式閲覧はできるが再利用条件が開放ライセンスではなく、古典課程とも時代を分ける。

## 9. M2以降への引継ぎ

- 文法技能を定義するたび、伝統文法、現代資料、辞書、時代の一致する実例のどこまで確認したかを記録する。
- 古典期、韻文、後期・教会、中世を同じ `scope` で扱わない。
- コーパス自動検査を導入する前に、ライセンス、版、タグ体系、誤解析率を個別評価する。
- 例文候補は作品・箇所・版・電子化元・利用形態を保持し、ウェブ上の表示を転載許可と解釈しない。
- 本文未確認の `src-lat-pinkster-ols1`、`src-lat-old2`、`src-lat-vox-latina` は、該当箇所が提供・購入確認されるまで教材項目の `source-checked` を単独で支えない。

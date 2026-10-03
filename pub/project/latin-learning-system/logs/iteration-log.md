# Iteration Log

各反復について、範囲、変更、検査、結果、発見事項、残件を記録する。結果は成功・失敗を含めて記録し、失敗を削除して履歴を整えない。

## ITER-0001：M0 プロジェクト統治の確立

- 日付：2026-08-24
- 対象マイルストーン：M0
- 状態：完了
- 範囲：フォルダ骨格、統治文書、計画、初期データ規約の作成
- 対象外：M1以降の調査・設計・実装、教材本文、例文、問題、技能グラフ、Python/JavaScript、外部依存関係、Gitコミット、公開、デプロイ
- 事前確認：
  - 指定した親フォルダは存在した。
  - `latin-learning-system` は存在せず、同名作業との衝突はなかった。
  - 既存Gitリポジトリは `mizuhara_hp` ルートに存在した。
  - リポジトリ内に適用対象となる既存 `AGENTS.md` は見つからなかった。
  - Gitは所有者安全性検査により通常の状態確認を拒否した。グローバル設定は変更していない。
- 変更：
  - `AGENTS.md`、`GOALS.md`、`PLANS.md`、`README.md` を作成した。
  - 判断記録と反復記録を作成した。
  - `standards/data-conventions.md` に、正本形式、分離、ID、独立した確認記録、出典、技能・語彙、正書法、採点、変更互換性の初期骨格を作成した。
  - 将来の課程、規約、出典、語彙、単元、ドリル、スキーマ、スクリプト、テスト、配布物のフォルダ骨格をREADMEつきで作成した。
- 検査：
  - 作成ファイルの絶対パスがすべて指定ディレクトリ以下にあることを検査した。
  - 必須ファイル7件と予定したディレクトリ26件の存在を検査した。
  - M1以降の実ファイル、Python、JavaScript、JSON、YAML、HTML、CSSが作成されていないことを検査した。
  - `AGENTS.md` と `GOALS.md` の必須事項、`PLANS.md` のM0～M6と各合格条件を文字列および見出し数で検査した。
  - 全新規ファイルの末尾空白と競合マーカーを検査した。
  - コマンド単位の `safe.directory` 指定でGit状態を読み取り、対象内の変更が新規ファイルだけであることを確認した。グローバルGit設定は変更していない。
  - リポジトリ全体の `git diff --check` を実行した。
- 結果：
  - 作成ファイル32件はすべて指定ディレクトリ内にあった。
  - 必須ファイルとディレクトリ骨格に欠落はなかった。
  - M1以降の成果物、教材、問題、技能グラフ、コード、外部依存関係は作成されていなかった。
  - M0～M6の見出しは7件、合格条件は7件あり、必須方針の欠落はなかった。
  - 新規ファイルの末尾空白と競合マーカーは0件だった。
  - Git状態では対象内の32件がすべて新規未追跡ファイルとして表示され、既存ファイルの変更は対象内になかった。
  - リポジトリ全体の `git diff --check` は、指定範囲外の既存追跡済み変更にある末尾空白により終了コード2で失敗した。既存ファイルは変更していない。扱いは `DEC-0006` に記録した。
- 結果判定：M0合格。リポジトリ全体の既存空白問題は本マイルストーンの範囲外であり、今回の成果物には同種の問題がない。
- 残件：M1は未着手。依頼者から明示的な開始指示があるまで進まない。

## ITER-0002：M1 参考資料と学習原則

- 日付：2026-08-24
- 対象マイルストーン：M1
- 状態：完了
- 範囲：出典運用方針、英語教育資料整理、一般的学習原則、ラテン語資料候補比較、暫定書誌データ
- 対象外：技能グラフ、正式な単元仕様、教材本文、例文・問題、正式JSON Schema、Python/JavaScript、ドリル画面、ライセンス最終決定、Git操作、公開、デプロイ
- 開始時確認：M0の必須文書、初期データ規約、判断・反復ログ、各対象ディレクトリのREADMEを読み直した。M0完了、M1開始承認、M2以降未着手を確認した。
- 文書保守：
  - `AGENTS.md` の現在位置を、M0完了・M1が次候補・各マイルストーンは明示指示時のみ実行へ更新した。
  - `README.md` の教材等について、禁止事項ではなく「現時点ではまだ制作していない」という現在状態へ修正した。
  - `PLANS.md` のM1を実施中へ更新し、M2以降を未着手のまま維持した。
- 調査・変更：
  - M1-A：`sources/source-policy.md` に情報源の優先順位、確認状態、引用・要約・翻案、書誌、権利、リンク・版、記述との対応、`source-checked`、短い引用の保存範囲を定めた。
  - M1-B：`curriculum/english-reference.md` に中高学習指導要領解説、CEFR/CEFR-J、出版社公開資料からの観察を、公式方針・教材慣行・推論に分けて整理した。英語の語数・五領域・単元順はラテン語へ直接移植しないとした。
  - M1-C：`curriculum/learning-principles.md` に14原則を、説明、根拠、英語教育での現れ方、ラテン語への適用、限界、将来検査、資料IDつきで記録した。
  - M1-D：`sources/latin-source-comparison.md` で文法・統語、辞書・頻度、注釈コーパス、校訂本文・注釈、発音・韻律、後期・教会資料を比較した。
  - M1-E：`sources/bibliography.json` に暫定書誌39件を登録した。内訳は英語教育・能力枠組み・公開教材8件、学習研究8件、ラテン語資料23件である。
  - M1開始時の現在位置修正と、完了時の `AGENTS.md`、`README.md`、`PLANS.md` 更新を行った。M2は未着手のまま維持した。
  - 設計判断を `DEC-0007`～`DEC-0010` に記録した。
- 確認範囲：
  - 文科省中学校解説PDFは公式URLをブラウザで直接開き、公開抽出された該当記述を確認したが、ブラウザ内PDFから全文抽出できなかったため `relevant-section-verified` とした。
  - 高等学校解説は公式掲載ページ・PDF所在と必要な公開該当記述を確認したが、全科目・全ページの通読とはしていない。
  - CEFR公式PDF、CEFR-J論文、出版社公開計画は必要箇所を直接確認した。
  - Pinkster、OLD第2版、Vox Latina等の有料資料は出版社メタデータだけを確認し、本文確認済みとはしていない。
- 検査：
  - 暫定書誌をPowerShell `ConvertFrom-Json` で解析し、必須18項目、資料ID、参照整合を検査した。
  - 3調査文書の資料IDを抽出し、書誌との欠落・余剰・重複を検査した。
  - 14原則すべてに7つの必須記録欄があることを数えた。
  - M1必須ファイル、作業範囲、末尾空白、競合マーカー、コードファイル、M2成果物の不存在を検査した。
  - リポジトリ全体の `git diff --check` と、指定フォルダに限定したGit状態確認を実行した。
- 結果：
  - 暫定書誌39件はJSONとして有効で、資料ID重複0、必須項目欠落0だった。
  - 調査文書で参照する39資料IDはすべて書誌に存在し、未参照書誌0、参照欠落0だった。
  - 学習原則14件は、平易な説明、根拠、英語での現れ方、ラテン語適用、限界、将来反映、資料を各14件保持した。
  - ラテン語資料23件の提案は `adopt` 8件、`supplement` 10件、`hold` 5件で、確認状態は該当箇所確認16件、メタデータのみ7件だった。
  - プロジェクト内37ファイルはすべて指定フォルダ以下にあり、必須ファイル欠落0、末尾空白0、競合マーカー0、Python/JavaScript/HTML/CSSの新規実装0だった。
  - `curriculum/latin-skill-map.yml` と `curriculum/curriculum-map.yml` は存在せず、M2へ着手していない。
  - 指定フォルダのGit状態は全体が未追跡ディレクトリとして表示され、コミット・プッシュは行っていない。
  - リポジトリ全体の `git diff --check` は、M0時点と同じく指定範囲外の多数の既存変更にある末尾空白で終了コード1となった。指定範囲外は変更せず、本プロジェクト内を直接検査して同種の問題0件を確認した。扱いは `DEC-0006` に従う。
- M1合格条件の確認：
  - 英語教育の実内容、教材設計上の方法、一般原則、ラテン語での翻案、非適用事項を `english-reference.md` と `learning-principles.md` で区別した。
  - 現行中高課程、公式解説、CEFR/CEFR-J、公開教材資料の主要記述を資料IDへ結びつけた。
  - ラテン語の全指定資料種別を、得意分野、弱点、確認範囲、料金・アクセス、権利、再利用、商用性、提案、理由で比較した。
  - 紙・有料・アクセス制限資料を確認済みとせず、7件を `metadata-only` とした。
  - 著作権、電子化データの別権利、非商用条項、将来商用公開との衝突を記録した。
  - 主要記述と書誌の参照整合、原則の根拠区分、出典方針との項目整合、資料IDの一意性を機械検査した。
- 結果判定：M1合格。`PLANS.md` のM1を完了へ更新した。
- 残件：M2では技能記述の条件・対象・行動・合格水準、受容／分析／限定産出の分離、既習境界、再出タグを設計する。発音単元の制作前に `Vox Latina` 等の該当本文を人間が確認する。M2は未着手であり、明示的な開始指示まで進まない。

## ITER-0003：M2 技能依存関係と課程仕様

- 日付：2026-08-24
- 対象マイルストーン：M2
- 状態：完了
- 範囲：技能モデル、技能DAG、課程マップ、第1～第5単元仕様、復習配置、構造検査
- 対象外：教材本文、完成例文、本番問題、本番語彙集、正式スキーマ、自動採点、HTML、Python・JavaScriptのプロジェクトコード、M3以降、外部依存関係、Git操作、公開、デプロイ
- 開始時確認：指定された統治文書、M1成果物、暫定書誌、判断・反復ログ、`curriculum/`、`lessons/`、`vocabulary/` のREADMEを読み直した。M1完了、M2開始承認、M3以降未着手を確認した。
- 資料上の制約：本文未確認のPinkster、OLD第2版、Vox Latina、Woodcock等を具体的根拠として用いない。非商用・混合・不明ライセンスのコーパスデータを取り込まない。
- 環境確認：標準PythonとバンドルPythonのいずれにもPyYAMLはなく、PowerShellの `ConvertFrom-Yaml`、Ruby、通常PATH上のNodeも利用できなかった。外部依存関係は追加しない。YAML 1.2がJSONを包含することを利用し、M2のYAMLをJSON互換構文で記述して、既存Python標準ライブラリのJSONパーサーで構文・構造を検査する方針とした。
- 設計・変更：
  - `DEC-0011` で技能ノード、`requires`、`recommended_before`、`co_requisites`、課程側の学習段階、導出される `enables` の意味を決定した。
  - `curriculum/latin-skill-map.yml` に58技能を作成した。第1～第5単元で導入する53技能と、韻律・韻文・後期教会・複文・機能語の将来境界5技能である。
  - `DEC-0012` により、提示された14小単元案を15小単元へ変更した。2Bの述語名詞と述語形容詞を分離して2Cを追加し、三人称複数は3Bから5Aへ送った。
  - `curriculum/curriculum-map.yml` に5単元15小単元、負荷上限、語彙方針、文構造上限、必須練習形式、累積読解、出口条件、15技能群の復習配置を記録した。
  - `lessons/unit-01/`～`unit-05/` に `unit-spec.yml` を作成し、各小単元の観察可能な目標、前提、新出、復習、語彙条件、許可・禁止構造、説明項目、練習形式、累積読解への寄与、出口条件、人間確認事項、根拠、暫定承認状態を記録した。
  - `DEC-0013` で1小単元45～70分、新出技能3～5件を原則とする負荷仮説、新出語彙0～10件の類型別上限、初期2～5語・統合3～7語・累積最大8語の文長仮説を記録した。2Bの6技能は明示的な例外・人間確認対象である。
  - `DEC-0014` により、具体的出典箇所未確認のため全技能の `source_checked`、`editorial_approved`、`expert_reviewed` をfalseとした。
  - `curriculum/`、`lessons/`、`vocabulary/` のREADMEをM2現在状態へ更新した。
- YAML検証方法：
  - PyYAML、PowerShell `ConvertFrom-Yaml`、Ruby、通常PATH上のNodeはいずれも利用できなかった。外部依存関係は追加しなかった。
  - YAML 1.2がJSONを包含するため、7個の `.yml` をJSON互換YAMLとして記述し、PowerShell標準の `ConvertFrom-Json` で構文と構造を検査した。
  - 検証は一時的なPowerShellコマンドだけで行い、一時ファイルは作成しなかった。
- 構造検査：
  - 7 YAMLファイルの構文、技能ID58件、親単元ID5件、小単元ID15件、単元仕様5件の一意性を検査した。
  - 技能・単元・書誌の存在参照、自己参照、`recommended_before` と `co_requisites` の参照、`requires` DAGの循環を検査した。
  - 全新出技能の初出時点と強い前提の時系列、単元前提の先行、復習技能の初出先行、無断重複を検査した。
  - 技能マップ、課程マップ、5単元仕様の新出・復習技能リストを相互照合した。
  - 復習配置が導入技能53件を重複・欠落なく覆い、初出、同一小単元誘導、次小単元再使用、間隔復習、累積使用、出口確認を区別することを検査した。
  - M1書誌にない `src-` 参照、許可されない根拠接頭辞、レビューtrueを検査した。
  - `reading.cumulative.short-prose` の全強い前提が5B以前に導入済みであることを検査した。
  - 禁止された教材本文・問題・語彙データ・Python・JavaScript・HTML・CSS、末尾空白、競合マーカー、指定範囲外ファイルを検査した。
- 検査中の修正：`co_requisites` の非対称3件を検出し、音節分けと音節量、格概念と主格、第二変化男性語幹と主対格形の関係を対称化して再検査した。
- 最終結果：
  - 構造エラー0、YAML解析エラー0、技能・単元ID重複0、欠落参照0、自己参照0、`requires`循環0だった。
  - `requires` 113辺、`recommended_before` 27辺、`co_requisites` 22組44方向を確認した。
  - 第2～第5単元の新出技能で強い前提が空のものは0件だった。
  - 復習配置は導入技能53件すべてを1回ずつ覆った。最終小単元5Cだけは次小単元・間隔復習をnullとし、M2範囲外で確定する理由を明示した。
  - M1書誌にない資料参照0、不正な根拠区分0、三確認trueの技能0だった。
  - 末尾空白0、競合マーカー0、禁止コード0、教材本文・本番問題・本番語彙データ0だった。
  - リポジトリ全体の `git diff --check` は指定範囲外の既存変更の末尾空白により終了コード1だった。対象外は変更せず、本プロジェクト内の直接検査は0件だった。`DEC-0006` の扱いを継続する。
- M2合格条件の確認：
  - 技能DAGに循環・欠落・自己参照がない。
  - 全単元に前提・新出・復習と学習段階がある。
  - 順序は格・語形・統語機能の強い前提から説明され、英語単元順を転用していない。
  - 第1単元の各小単元は新出技能5件以下で暫定上限内にある。
  - 第2～第5単元の全新出技能に1件以上の強い前提がある。
  - 強い前提、推奨順、並行導入、習熟段階、導出可能な逆索引を混同していない。
  - 負荷値はM2暫定と明記し、根拠、時間、過大・過小兆候、M3・M6再検討条件がある。
  - 本文未確認資料を具体的確認根拠にせず、全確認状態をfalseとして独立保持した。
  - 15小単元は教材本文・問題なしで目標、許可範囲、出口、人間確認事項を評価できる。
  - M3で確定する8項目を課程マップに明示した。
- 結果判定：M2合格。`PLANS.md` のM2を完了へ更新した。
- 人間確認事項：2Cの追加、2Bの6技能負荷、3Aの主格対格単複同時導入、3B・5Aの活用類数、4Cの形容詞負荷、5Cの語彙上限・辞書導入時期・累積読解の自然さを依頼者が確認する必要がある。
- 残件：M3で正式スキーマ、本文・問題・訳・正書法・一意性・レビュー記録・品質上限を確定する。M3は未着手であり、明示的な開始指示まで進まない。

## ITER-0004：M3 制作・検査規則

- 日付：2026-08-24
- 対象マイルストーン：M3
- 状態：完了
- 範囲：正本分担、本文・例文・語彙・正書法・翻訳・問題・品質・確認規約、JSON Schema、正規化プロファイル、検証fixture
- 対象外：本番教材・例文・問題・語彙、HTML/CSS/JavaScript、Python検査プログラム、ドリル、M4以降、外部依存関係、Git操作、公開、デプロイ
- 開始時確認：指定された統治文書、M1成果物、M2技能・課程マップ、5単元仕様、出典方針・比較・書誌、判断・反復ログ、対象READMEを読み直した。M2の58技能、requires 113、recommended 27、co-requisites 22組44方向、5単元15小単元、暫定負荷、人間確認事項を確認し、M2データを変更しなかった。
- 環境確認：標準PythonとバンドルPythonに `jsonschema` はなかった。新規依存は追加せず、既存PowerShell 7.6.4の `Test-Json` がJSON Schema Draft-07、`if`/`then`、`const`、ローカル外部 `$ref` を扱えることを小さな試験で確認した。
- 規約：
  - `standards/data-schema.md` に正本、派生情報、整合性検査、共通データ、Schema/M4/人間の責任境界を定めた。
  - `standards/review-workflow.md` に独立確認履歴、content version、scope、失効、履歴保持を定めた。
  - `standards/textbook-style.md` に平易な日本語、説明構成、表示、未習・予告、2C、例文・token・出典・アクセシビリティを定めた。
  - `standards/orthography-policy.md` と `standards/normalization-profiles.json` に四形式、NFC、処理順、5プロファイル、衝突禁止を定めた。
  - `standards/translation-policy.md`、`standards/exercise-rules.md`、`standards/quality-rubric.md` に訳の役割、10問題形式、集合としての一意性、自動採点禁止、必須ゲート、観察可能な1～5尺度、M2負荷の警告運用を定めた。
  - `standards/data-conventions.md` をM3正本への案内とISO 8601・ID確定内容へ更新した。
- Schema：Draft-07へ統一し、`common`、`review`、`source`、`normalization-profile`、`vocabulary`、`example`、`exercise`、`lesson`、`skill-map`、`curriculum-map`、`unit-spec` の11件を作成した。主要教材レコードは原則 `additionalProperties: false`、M2可変説明部分だけ移行互換のため限定的にtrueとした。
- fixture：`tests/fixtures/` にvalid 11件、invalid 12件、manifestとREADMEを作成した。invalidのうち9件はSchemaで拒否し、3件はSchemaを通過する `semantic-invalid`（正規化衝突、存在しない参照、古い版承認）としてM4の責任を示した。
- 検査中の修正：
  - `common.schema.json` の正規表現に不正なJSONエスケープ2件を検出し、修正した。
  - `example.schema.json` と `curriculum-map.schema.json` の括弧構造を修正した。
  - `curriculum-map.schema.json` を実際のM2課程マップ構造へ合わせた。M2データ自体の意味、配列、順序、依存は変更していない。
  - valid例文fixtureで句読点を語tokenから分離し、本文規約と整合させた。
- 構造検査：
  - JSON 37件の構文を `ConvertFrom-Json` で確認した。
  - 11 valid fixtureがすべて通過し、9 Schema-invalid fixtureがすべて拒否され、3 semantic-invalid fixtureが意図どおりSchemaを通過することを確認した（全23件期待一致）。
  - M2のJSON互換YAML 7件が対応Schemaをすべて通過した。
  - Schema `$id` 11件の一意性、全 `$ref` のファイル・JSON Pointer解決、外部参照18辺、参照循環0を確認した。
  - 技能58件、単元20 ID（親5・小15）、書誌39件、正規化5 ID、fixture pathの一意性と参照整合を確認した。
  - M2技能の `source_checked: true` が0件であることを確認した。本文未確認資料を確認済み根拠に昇格していない。
  - valid fixtureの技能・語彙・資料参照が、M2またはfixture内定義・M1書誌に存在することを確認した。
  - reviewのsource/editorial/expert/automatedが独立配列であること、古いcontent versionの承認を意味検査対象にするfixtureがあることを確認した。
  - 正規化プロファイル5件のID一意性、末尾空白0、競合マーカー0、`.py`・`.js`・`.html`・`.css` 0を確認した。
  - `git diff --check -- pub/project/latin-learning-system` は終了コード0だった。ただし対象ディレクトリ全体が未追跡のため、末尾空白は別途全ファイルを直接検査した。コミット・プッシュは行っていない。
- M3合格条件の確認：
  - 構造対応訳と自然訳の目的・評価、自動採点しない完全訳を分離した。
  - 問題は採点対象、許容・拒否解、正規化、別解析、feedback、根拠、確認を表現でき、正答一意性を集合の分離として定義した。
  - 長母音問題は `macron-sensitive` をSchemaで要求し、通常問題と切替可能にした。
  - 文脈なしの多義形、翻訳、自由作文、複数構文・語順、衝突、限定不足を自動一意採点しない規則にした。
  - source、editorial、expert、automatedを独立履歴とし、対象content version、scope、確認者へ結びつけた。
  - source refsの存在とsource-checked passを分離し、実質変更後の旧承認を有効扱いしない規則にした。
  - 2Cの予告を未分析・非習得・非生成としてSchemaと規約で正式導入から分離した。
  - 必須ゲートと1～5尺度を分離し、M2負荷値を通常・警告・原則不合格・例外承認へ分類した。
  - JSON Schema、M4意味検査、人間判断の限界を `data-schema.md` と各規約に明記した。
  - 代表fixtureとM2データが実際のSchema検査を通過し、意図的invalidが予定どおり失敗した。
- 結果判定：M3合格。`PLANS.md` のM3を完了へ更新した。M4は未着手。
- 人間確認事項：2Bの6技能、3Aの格×数、3B/5Aの活用類数、4Cの形容詞と一致、5Cの辞書初導入・新語上限10は規約上の警告対象であり、最終承認していない。説明の平易さ、ラテン語・訳・例文の妥当性、教育的価値、負荷、アクセシビリティ、権利判断も人間ゲートである。
- M4への引継ぎ：Schema以外の参照実在、導入時系列、未習使用、DAG、重複正本、正規化実処理と衝突、選択肢衝突、現行版承認、負荷警告を実装する。`semantic-invalid` 3件を最初の失敗試験に用い、M3規約を実装都合で無断変更しない。
- 最終再検査：集約用PowerShellコマンドの初回実行は `foreach` の空白欠落による構文エラーで検査を開始できなかった。コマンドだけを修正して再実行し、JSON 37件、fixture 23/23、M2 7/7、統治状態、末尾空白・競合・禁止コードを再確認してエラー0だった。一時ファイルは作成していない。

## ITER-0005：M4 最小ツールチェーン

- 日付：2026-08-25
- 対象マイルストーン：M4
- 状態：要修正
- 範囲：検査CLI、意味検査、正規化、fixture回帰、決定的静的ビルド、検査専用デモドリル、自動テスト、ブラウザ検証準備
- 対象外：第1単元本文、本番例文・語彙・問題、M2配列再設計、M3規約弱体化、M5以降、外部依存追加、アカウント、クラウド、サーバー、音声、公開、Git commit/push
- 開始時確認：統治文書、全standards、全Schema、全M3 fixture、技能・課程マップ、5単元仕様、39書誌、対象README、判断・反復ログを読み直した。M3の正本分担、Schema責任、M4意味検査、人間ゲート、禁止成果物を確認し、M2・M3の意味規則を変更しなかった。
- 環境：Python 3.12.2、PowerShell 7.6.4 `Test-Json`、同梱Node 24.19.0、Playwright 1.62.1、Chrome、Edgeを確認した。Pythonのjsonschema/PyYAML/pytest/playwrightとPATH上のNode/npm/npxはなかった。新規依存を追加していない。Gitリポジトリには対象外の既存変更があり、対象プロジェクトは未追跡の独立ディレクトリだった。
- 実装：
  - `scripts/validate.py` に9サブコマンド、終了コード0/1/2、text/JSON診断、Schema、参照、DAG、課程、未習技能・語彙、正規化衝突、承認版、負荷警告、fixture期待照合を実装した。
  - M2のJSON互換YAML 7件を既存Schemaで検証し、requires循環経路、自己・欠落・重複辺、co-requisite対称性、境界技能依存、単元時系列、学習段階、親子、unit-spec重複、5C読解前提を検査するようにした。
  - `scripts/normalization.py` とブラウザ側 `normalization.js` が同じ5プロファイル・処理順を実行する。共有13ベクトルを追加した。
  - fixture manifestへID、期待層、期待コード、規則、注記を追加した。M3の23件を維持し、6件の意味負例を追加して計29件（valid 11、Schema-invalid 9、semantic-invalid 9）にした。
  - `scripts/build.py` は検査成功後だけ `dist/` へ生成し、安全なJSON埋め込み、相対パス、決定的SHA-256 manifest、dist外拒否、管理外ファイルを残すcleanを実装した。
  - Vanilla HTML/CSS/JavaScriptの検査専用デモに、3形式、結果・解説、次問・再挑戦、進捗、保存・復元、版不一致・破損対応、確認つきリセット、メモリフォールバック、安全エラーを実装した。見出し、label、button、aria-live、フォーカス、色以外の記号、44px操作域、320px CSS、印刷、reduced-motionを含めた。
- 検査中の修正：Windows CP932で診断のem dashが出力不能となったためASCII hyphenへ変更した。未習技能fixtureの誤った技能IDと、fixture単独課程で正本時系列を参照できない判定を修正した。5C検査が辞書技能まで「累積読解の強い前提」と誤って対象化したため、正本である `reading.cumulative.short-prose` のrequires閉包だけへ限定した。
- 成功した自動検査：
  - `python scripts/validate.py schema`：Schema JSON、11 `$id`、ローカル `$ref`、M2 7データの実Schema検証がエラー0。
  - `python scripts/validate.py fixtures`：29/29期待一致。valid 11成功、Schema-invalid 9がSchema段階で拒否、semantic-invalid 9がSchema通過後に指定コードだけで拒否。
  - `python scripts/validate.py all --format json`：エラー0、M3指定の人間確認警告8。
  - Python unittest：12件成功。DAG、課程、衝突、stale review、fixture、正規化、埋め込み、出力境界、clean、決定性を確認した。
  - JavaScript：13共有正規化ベクトル成功。Python側も同じ13件に成功した。
  - `python scripts/build.py --clean`：成功。`dist/index.html`、`dist/assets/app.js`、`dist/assets/styles.css` と決定的manifestを生成した。
  - `python scripts/build.py --fail-on-warning`：8警告により生成前停止を確認した。
  - Python compile、Node `--check` 3件、JSON 46件の構文は成功した。
- ブラウザ阻害：アプリ内ブラウザで生成済み `dist/index.html` の `file://` URLを開こうとしたところ、Browser URL Policyが拒否した。結果メッセージが同一結果を別ブラウザ面・raw CDP等で迂回しないよう要求したため、既存Playwright/Chromeを別経路で実行しなかった。`tests/browser/m4-drill.spec.mjs` は作成・構文確認済みだが未実行である。
- 未完了の必須確認：file起動、3形式の実操作、正誤・解説・次問・再挑戦、保存・再読込・リセット・保存失敗フォールバック、キーボードとフォーカス、320/768/1280px、印刷、実コンソールエラーの確認。
- 人間確認警告：2Bの6技能、3Aの主格・対格単複、3B/5Aの活用類数、4Cの形容詞と一致、5Cの辞書初導入・技能負荷・新語10を自動承認していない。ラテン語正確性、日本語平易さ、訳、教育価値、意味上一意性、権利、最終アクセシビリティも人間ゲートのままである。
- 結果判定：非ブラウザ検査は成功したが、PLANSの「サーバーなしで基本動作」「PC・スマートフォン幅」「キーボード」「aria-live」の実物確認を完了できないためM4を `要修正` とした。M5は未着手のまま維持する。
- 次の再開条件：許可された `file://` ブラウザ環境で `tests/browser/m4-drill.spec.mjs` 相当の全操作を成功させ、結果を本ログへ追記する。失敗時はM4範囲で修正して全検査を再実行する。
- ファイル衛生：Pythonテストが作った3個の `__pycache__` を対象ディレクトリ内で確認して削除した。対象内のテキストを直接走査し、末尾空白0、競合マーカー0、`innerHTML` 0を確認した。Gitは所有者警告が出たため一回限りの `-c safe.directory=...` を使って読み取り専用で確認し、対象は全体が未追跡、`git diff --check` は終了コード0だった。未追跡をGit差分検査できない部分は前記の直接走査で補った。Git設定、commit、pushは行っていない。

## ITER-0006：M4 継続監査と意味検査の補強

- 日付：2026-08-25
- 対象マイルストーン：M4（要修正からの継続）
- 状態：要修正
- 追加実装：Schema 11件を各valid fixtureでコンパイル試験する検査、型つき参照・重複参照、正規化プロファイル・Schema ID、確認履歴のcurrent/stale/superseded/invalid分類、supersedes整合、予告技能と正式技能の分離、予告省略可能性、選択式正答数、許容解収束警告、demoデータ検査、Python側不一致ベクトルを追加した。
- fixture：2C予告に第4単元正式技能を混在させるSchema-valid意味負例を追加した。現在はvalid 11、Schema-invalid 9、semantic-invalid 10、合計30件で、30/30がmanifestの期待層・期待コードと一致した。
- テスト：Python unittestを12件から22件へ拡張し、22/22成功した。参照型違い、previewモデル、4種のreview評価、固有負荷警告、demo、ビルド停止、安全cleanを追加で覆った。JavaScript共通正規化13ベクトルとNode構文検査も成功した。
- ブラウザ回帰：未実行のPlaywright試験へ、不正答、再挑戦、Enter操作、フォーカス、破損・版不一致保存、200%相当拡大、特殊文字、メモリフォールバック中の回答継続を追加した。URLポリシー阻害のため実行状態は変わらない。
- 新規検出：`translation.natural-japanese.basic` が `syntax.predicate-adjective.preview` を強く要求し、自然訳技能が5B・5C・累積読解へ伝播するため、2Cを省略するとrequiresグラフが破綻する。`PREVIEW_REQUIRED_BY_STRONG_GRAPH` として正本上の1エラーを検出した。
- 個別検査：`schema`、`references`、`fixtures`、`normalization`、`reviews` はエラー0。`curriculum` と `all` は上記1エラーを返す。M3指定の人間確認は、2B、3A、3B、4C、5A、5C辞書、5C新語10の固有コード7件として警告する。
- ビルド：`python scripts/build.py --clean` は検査の1エラーを受け、生成開始前に終了コード2で停止した。現在のdistは検査追加前の入力と一致するが、矛盾解消後に正規clean buildを再実行する必要がある。
- 判断：M4でM2技能配列を無断変更せず、エラーを維持した。修正候補と推奨案を `DEC-0023` に記録した。依頼者判断とブラウザ実行環境が必要であるためM4を完了にせず、M5へ進まない。
- 最終衛生検査：JSON 47件、Python AST 8件、Node構文4件、生成manifest SHA-256、編集元とdist JavaScript一致、末尾空白、競合マーカー、`innerHTML`、対象限定Git差分を確認し、衛生エラー0だった。テスト生成の `__pycache__` 3ディレクトリは対象内で確認後に削除した。Git commit、push、設定変更は行っていない。

## ITER-0007：DEC-0023案Bの限定修正

- 日付：2026-08-25
- 対象：M2成果物の承認済み限定修正とM4回帰検査。M4の状態は要修正、M5は未着手。
- 変更：`translation.natural-japanese.basic` の正式導入を2Cから3Cへ移し、`syntax.predicate-adjective.preview` への強い `requires` を削除した。2Cは予告技能1件だけの任意小単元とし、親単元集計、unit-02/03仕様、復習配置を同じ意味へ同期した。技能総数、他の技能配列、単元順は変更していない。
- 負荷：3Cは新出5技能から6技能となった。暫定上限を6へ同期し、`LOAD_SIX_SKILLS_WARNING` と単元の人間確認ゲートを追加した。これは承認ではなく警告域である。
- 回帰：修正前と同型の `preview-required-strong-graph-semantic.json` を追加し、実データでは `PREVIEW_REQUIRED_BY_STRONG_GRAPH` が0件、negative fixtureでは同コードが1件となる単体試験を追加した。fixtureはvalid 11、Schema-invalid 9、semantic-invalid 11、合計31件。
- 検証：`validate.py all --format json` はエラー0・警告8、fixture検査は31/31期待一致、Python unittestは23/23成功、Python正規化検査は成功、JavaScript正規化13ベクトルも成功した。
- ビルド：`build.py --clean` を二回成功させ、`.build-manifest.json` のSHA-256が両方 `9680EADAAC299DAFBA758C7BD15FD815071088B3B6D3E1ED4618021A63125999` で一致した。
- 未完了：アプリ内ブラウザのURLポリシー阻害は変わらず、`tests/browser/m4-drill.spec.mjs` の実物操作試験は未完了である。このためM4を要修正のまま維持し、M5へ進まない。

## ITER-0008：M4最終ブラウザ確認と完了判定

- 日付：2026-08-25
- 対象マイルストーン：M4のみ。M5は未着手。
- ブラウザ実行記録：依頼者が人間としてWindows PowerShellから `node tests/browser/m4-drill.spec.mjs` を実行し、`Browser drill regression: passed.` を確認した。Codex自身が実行した結果ではない。assertionと合格条件の対応は `tests/browser/README.md` に記録した。
- assertion対応：`file://` 起動と実操作、回答・正誤・feedback・再挑戦、localStorage保存・再読込・破損および版不一致処理・リセット、保存不能時のmemory fallback、Enter操作・問題見出しフォーカス、320/768/1280pxと200%相当拡大、印刷制御、コンソールエラー0を覆う。`role=status`、`aria-live`、色以外の正誤記号は生成元HTML/CSSと実操作結果を組み合わせて確認した。
- DEC-0023最終確認：実データの `PREVIEW_REQUIRED_BY_STRONG_GRAPH` は0件、negative fixtureでは同コードを検出した。2Cは予告技能1件だけの省略可能な任意予告で、必須累積読解へ算入しない。3Cは新出6技能、暫定上限6、`LOAD_SIX_SKILLS_WARNING`、unit-03人間確認ゲートを維持する。
- 自動検査：`validate.py all --format json` はエラー0・警告8、Python unittestは23/23成功、fixtureは31/31期待一致、Python正規化検査はエラー0、JavaScript正規化は13/13成功した。
- 決定的ビルド：`build.py --clean` を二回成功させ、`.build-manifest.json` のSHA-256は両方 `9680EADAAC299DAFBA758C7BD15FD815071088B3B6D3E1ED4618021A63125999` で一致した。
- 警告の扱い：8件はいずれもM3で定めた設計上の人間確認であり、特に3Cの6技能はM5制作・M6試用で評価する。M4の技術的失敗には数えない。
- 最終衛生検査：状態文書更新後の `validate.py all` もエラー0・警告8だった。末尾空白、競合マーカー、実装コード内の `innerHTML`、`__pycache__`、対象限定 `git diff --check` はすべて問題なし。最初の `innerHTML` 走査は「使用しない」と記したREADME本文を拾ったため、実装拡張子へ対象を限定して再検査した。
- 完了判定：M4の全合格条件を満たしたためM4を完了とする。M5は未着手のまま維持する。

## ITER-0009：M5 第1単元レビュー候補

- 日付：2026-08-25
- 対象マイルストーン：M5のみ。状態は人間レビュー待ちで、完了ではない。M6と第2～第5単元本文は未着手。
- 開始時確認：統治文書、M2技能・課程・unit-01仕様、M1学習原則と出典、全M3規約・関係Schema、M4検査・生成・テストを読み直した。開始時 `validate.py all` はエラー0、Unit 2以降の既存設計警告8件だった。
- 1A：文字、復元古典式の基本音価、i/j・u/vについて平易な本文、メタデータ、4新語、2注釈例、6問を作成した。音読は自己評価とし、自動採点しない。
- 1B：母音長、マクロン、音節区切り、母音長と音節量、本性・位置による長さについて本文、2新語、2注釈例、4問を作成した。`macron-sensitive` と `meaning-default` の対照問題を置いた。
- 1C：基本アクセント、マクロンの編集補助、語尾の情報性、古典散文の範囲について本文、1新語、2注釈例、5問と、1A～1Cの累積確認6問を作成した。格名・曲用・活用・語形生成は要求していない。
- データ：教材メタデータ3件、語彙7件、注釈例6件、問題21件、用語9件、12技能のカバレッジ表を作成した。例はすべて制作例で、古典作品からの引用ではない。個別語彙の形態情報は辞書本文との人間照合待ち。
- 出典：DCC版Allen & Greenoughのcredits/reuse、§1、§7、§8、§§9–11、§12を2026-08-25に直接確認し、claim locatorを記録した。`src-lat-ag-dcc` の確認範囲を更新した。Vox Latinaはmetadata-only、Lewis & Short/Logeionは個別項目未確認のままで、確認済み根拠に使っていない。
- M5最小拡張：`self-assessed-pronunciation` をSchema・規約・検査・表示へ追加した。埋め込み問題レコードの実Schema検証、Unit 1参照・時系列・カバレッジ・マクロンプロファイル・未習形態・到達可能性検査を追加した。M2配列は変更していない。
- 静的生成：M4デモを維持し、`dist/unit-01/index.html` と `drill.html` を追加した。本文・問題JSONからビルド時に生成し、本文とドリルの相互導線、localStorage、メモリフォールバック、キーボード・フォーカス、aria-live、320px CSS、印刷を維持した。
- 自動検査：`validate.py all` はエラー0・警告10（既存8＋M5新規2）。fixture 31/31、Python unittest 28/28、Python正規化13件、JavaScript正規化13件、M4/M5ブラウザspecとappのNode構文検査が成功した。
- 決定的ビルド：Markdown表の表示修正後に `build.py --clean` を二回実行し、manifest SHA-256は両方 `65D62538F994AD8440F81B37E0A6725170F276B0FDADE450FD3C0AF794CB3985` で一致した。
- 生成物確認：生成対象5ファイル、本文3小節、埋め込み問題21件、本文・ドリルの相互リンクをテキスト検査した。Markdown表の区切り行が本文表へ出ていたため、生成器だけを修正し再ビルド対象とした。
- 新規警告：`M5_EDITORIAL_REVIEW_PENDING` と `M5_VOCABULARY_SOURCE_REVIEW_PENDING`。前者は日本語・構成・問題の意味的一意性、後者は7語の見出し・属格・性・長母音の個別辞書照合を求める。既存8警告と区別する。
- ブラウザ：既知のアプリ内URL方針により `file://` 実ブラウザ試験を迂回実行しなかった。`tests/browser/m5-unit-01.spec.mjs` を作成し、Windows PowerShellでM4回帰とともに実行するコマンド・期待結果を `tests/browser/README.md` とレビュー資料へ記録した。M5ブラウザ成功は未記録。
- 人間確認：日本語の平易さ、音価・音節量・アクセントの専門的妥当性、語尾予告の負荷、21問の意味的一意性、個別語彙、音読、実画面・アクセシビリティを `lessons/unit-01/review-notes.md` に列挙した。editorial/expertは空である。
- 停止判定：候補成果物と非ブラウザ検査は揃ったが、人間編集確認前であるためM5を完了にしない。状態を「人間レビュー待ち」とし、M6へ進まない。
- 最終衛生：対象内テキスト142件を直接検査し、末尾空白0、競合マーカー0、実装コードの `innerHTML` 0、`__pycache__` 0だった。対象限定 `git diff --check` は終了コード0で、プロジェクト全体が未追跡のため直接検査を併用した。コミット・プッシュ・公開・デプロイは行っていない。

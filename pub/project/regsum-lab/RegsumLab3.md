# RegSum Lab 仕様メモ

## Phase 2 alpha 保存版に対する設計整理

### 対象
- `RegSum Lab v0.5 / Phase 1 Prototype` (RegsumLab2.htm) を土台にした、現在の保存版の設計方針整理
- ここでは **すぐに実装へ入らず**、
  1. 各計算法の意味と、向いている式の提案
  2. 各計算法の精度改善方針
  3. Hurwitz 系の検出力拡張方針
  を、**md仕様書スタイル**で整理する

---

# 1. 目的

## 1.1 このツールの役割
このツールは、数列
\[
a_1,a_2,a_3,\dots
\]
に対して、その通常和が発散していても、

- 骨格を見抜く
- 適切な正則化手法を選ぶ
- 「有限部」「時間平均」「解析接続的な値候補」などを返す
- ただし無理な場合は `not_applicable` や `exploratory` で止まる

ことを目的とする。

## 1.2 現状の強み
現状コードから見て、特に強いのは次の領域。

- 多項式列、準多項式列
- 単項の冪則列 `n^α`
- 単純な振動列 `(-1)^n`, `sin(n)`, `cos(n)` など
- 有界な Fourier 的列の DC 成分推定
- `log(n)` や `n log n` を「extended」として危険表示つきで扱う方針

## 1.3 現状の難所
難所は主に次。

- mixed power の検出が弱い
- extended 系の有限部抽出が繊細
- Abel / Exp / Window の基底選択が「賢すぎると危険、単純すぎると弱い」
- Hurwitz が「単一骨格」には強いが、「複合骨格」にはまだ弱い

---

# 2. 各計算法の意味と、おすすめの式

---

## 2.1 Hurwitz regularization

### 2.1.1 意味
Hurwitz は、この実装では主に

- 準多項式
- 単純な冪則 `c n^α`

に対して、

- Bernoulli 多項式
- Hurwitz zeta
- zeta の解析接続

を使って、**かなり強い意味での値**を返す経路になっている。

これは単なる数値フィットではなく、かなり「理論に寄った」値であり、Summary 上の `exact-ish` に最も近い位置づけ。

### 2.1.2 向いている式
#### A. 定数・多項式
- `1`
- `n`
- `n^2`
- `n^29`
- `1 + n`
- `3*n`

**意味**:
- 典型的な zeta 正則化
- Bernoulli 数との接続が見えやすい
- ツールの理論コアの確認に向く

#### B. 分数冪
- `n^1.5`
- `n^(7/5)`
- `2*n^(3/2)`

**意味**:
- `ζ(-α)` を通じて、整数以外の冪にも解析接続が効く
- 「多項式の外へ Hurwitz を延ばす」第一歩として非常に重要

#### C. 周期付き多項式
- `(n % 2 == 0) ? n : 0`
- `(n % 3 == 1) ? n^2 : 0`
- `(-1)^n * n`

**意味**:
- residue class ごとの寄与
- Hurwitz zeta と準多項式の接続がはっきり出る
- 「周期構造つき発散」の教材として良い

### 2.1.3 あまり向かない式
- `sin(n)`
- `sin(cos(n))`
- `log(n)`
- `floor(sqrt(n))`

**理由**:
- これらは Hurwitz の「骨格が明示的に zeta/Hurwitz zeta に乗る」領域から外れやすい
- 無理に Hurwitz で値を主張すると危ない

---

## 2.2 Exp Cutoff regularization

### 2.2.1 意味
\[
S(\varepsilon)=\sum_{n\ge1} a_n e^{-\varepsilon n}
\]
を考え、\(\varepsilon\to 0^+\) のときの発散項を引いて有限部を読む手法。

この実装では、

- 骨格を引いた residual に対する fit
- 発散項基底と有限部をまとめて fit
- 複数窓での安定性確認

をしていて、**現実的な主力の数値手法**になっている。

### 2.2.2 向いている式
#### A. Hurwitz でも読めるが数値検証もしたいもの
- `1`
- `n`
- `n^2`
- `n^1.5`

**意味**:
- 理論値と数値値の照合
- 実装の整合性チェック

#### B. extended 系
- `log(n)`
- `n*log(n)`

**意味**:
- 現在の保存版で最重要の用途
- Hurwitz では今すぐ扱いにくいが、Exp Cutoff なら有限部候補を探れる
- ただし強く言い切らず `exploratory` / `success` を慎重に分けるべき

#### C. 骨格 + 微小摂動
- `n + 0.001*sin(n)`
- `1 + 0.001*sin(n)`

**意味**:
- 骨格 subtraction が効くかを見る
- 本体の有限部がどれだけ安定に回収できるかを見る

### 2.2.3 注意点
- 基底の選び方で finite part が動きやすい
- `log(n)` や `n log n` は発散項同士の相関が強く、条件数が悪くなりやすい
- 「値が出た」だけで信用せず、
  - window spread
  - condition number
  - accepted / rejected windows
  を併読する必要がある

---

## 2.3 Window regularization

### 2.3.1 意味
窓関数をかけた有限和
\[
S_N=\sum_{n\le N} a_n\,w(n/N)
\]
を作り、その \(N\to\infty\) での発散部分と有限部を読む方法。

現状では、特に extended 系に対しては **診断器** としての役割が強い。

### 2.3.2 向いている式
#### A. 補助診断向け
- `floor(sqrt(n))`
- `log(n)`
- `n*log(n)`

**意味**:
- Hurwitz や Abel に載せにくい列の「大域的な成長の雰囲気」を見る
- finite part の断定ではなく、tail のまとまり具合を見る

#### B. polynomial 系の比較用
- `1`
- `n`
- `n^2`

**意味**:
- Exp Cutoff や Hurwitz と大きくズレないか確認する
- 窓の設計が暴れていないか見る

### 2.3.3 現時点での位置づけ
- 主推定器ではなく補助線
- 特に extended に対しては `diagnostic-only` が妥当
- 値そのものより、
  - 窓間の合意
  - spread
  - pairwise finite part の一貫性
  を見るのが本筋

---

## 2.4 Cesàro regularization

### 2.4.1 意味
部分和列
\[
s_N = \sum_{n=1}^N a_n
\]
の平均
\[
\frac{1}{N}\sum_{k=1}^N s_k
\]
を見る方法。

「普通の和は揺れるが、平均すると落ち着く」タイプに向く。

### 2.4.2 向いている式
- `(-1)^n`
- `(n % 2 == 0) ? 1 : 0`
- bounded oscillation の一部

**意味**:
- 交代列の平均値
- 時間平均
- 信号処理っぽい直感と相性が良い

### 2.4.3 向かない式
- `n`
- `n^2`
- `log(n)`
- `n^1.5`

**理由**:
- 増大列には弱い
- 平均してもなお発散成分が強すぎる

---

## 2.5 Abel regularization

### 2.5.1 意味
\[
A(x)=\sum_{n\ge1} a_n x^n,\qquad x\to1^-
\]
の極限を見る方法。

Fourier 的・振動的な列の「収束に近い影」を捉えるのに強い。

### 2.5.2 向いている式
- `(-1)^n`
- `sin(n)`
- `cos(n)`
- `sin(2*n)`
- 一部の bounded Fourier 系

**意味**:
- 生成関数的な極限
- 振動列の平均的な値
- 周波数成分との対応が見えやすい

### 2.5.3 現実的な読み方
- 単一周波数ならかなり強い
- multi-peak や DC dominant のときは暴れやすく、今のコードも安全側に止まる設計になっている
- bounded Fourier 系では `dcEstimate` の方が自然な場合がある

---

## 2.6 Fourier / dcEstimate

### 2.6.1 意味
列を
- DC 成分
- 周期成分

に分けて考え、特に有界振動列では **DC 成分を時間平均候補** として使う。

### 2.6.2 向いている式
- `sin(n)`
- `cos(n)`
- `sin(cos(n))`
- `cos(sin(n))`
- `abs(sin(n))`

**意味**:
- 「和」よりも「平均値」を見たいケース
- 有界だが複雑に揺れる列の読み取り
- Abel よりも直感的な場合がある

---

# 3. 各計算法の精度を上げる方法

---

## 3.1 Hurwitz の精度改善

### 3.1.1 方向性
Hurwitz は本質的には数値精度より **検出精度** が重要。
一度モデルが正しく認識されれば値そのものはかなり強く出せる。

### 3.1.2 改善案
#### A. 検出モデルを「単項」から「線形結合」へ
現状は `powerLaw` が単項 `c n^α` に強いが、
次を直接扱えると一気に広がる。

- `c1*n^a1 + c2*n^a2`
- `Σ c_j n^{α_j}`

#### B. 残差再帰による peeling
大きい成分から順に剥がす。

1. もっとも支配的な冪 `α1` を推定
2. `c1 n^α1` を引く
3. 残差から次の冪 `α2` を推定
4. 繰り返す

これは鉱脈をスコップで一枚ずつ剥がす感じで、かなり筋が良い。

#### C. Mellin 的な発想を取り入れる
`S(ε)=Σ a_n e^{-εn}` の小 ε 展開を見ると、
\[
a_n \sim \sum_j c_j n^{\alpha_j}
\]
なら
\[
S(\varepsilon)\sim \sum_j c_j \Gamma(\alpha_j+1)\varepsilon^{-(\alpha_j+1)} + \cdots
\]
の形が出る。

この指数を読むことで、混合冪を復元できる可能性がある。

#### D. residue class × mixed power への拡張
例えば
- `(-1)^n * n^(3/2)`
- `(n % 3 == 1) ? n^(7/5) : 0`

のような列も、最終的には
- 周期成分
- 冪成分
の積として扱えれば Hurwitz / Lerch 方向へ伸びる。

---

## 3.2 Exp Cutoff の精度改善

### 3.2.1 もっとも重要な改善対象
現状の本命。

### 3.2.2 改善案
#### A. 基底の自動切り替えをもっと厳密にする
今は
- quasiPolynomial
- powerLaw
- extended log
- extended nlogn

をざっくり切っているが、
さらに次を考えると強い。

- `n^α log(n)`
- `log(n)^2`
- `n^α + d log(n)`
- `n^α + n^β`

#### B. ε 範囲の自動最適化
今は固定窓 + variant だが、今後は

- 小さすぎる ε では数値不安定
- 大きすぎる ε では漸近が出ない

という板挟みを、自動診断したい。

具体的には、
- curve の局所曲率
- 再フィット時の有限部変動
- condition number
を同時に見て「最も素直な ε 帯」を選ぶ。

#### C. 係数の正則化
発散基底どうしが強く相関するので、
通常の least squares だけでなく

- ridge 的な微弱正則化
- SVD ベースの打ち切り

を検討するとよい。

#### D. skeleton subtraction の高度化
現在は quasi/powerLaw に有効だが、extended では本体ごと消しやすい。
したがって今後は

- 骨格 contribution を理論式で別管理
- 残差 fit と骨格 finite part を合成

の二層構造にした方がよい。

---

## 3.3 Window の精度改善

### 3.3.1 基本方針
Window は「値を当てる武器」より、「変な挙動を炙るライト」の方が向いている。

### 3.3.2 改善案
#### A. 窓関数の family 比較
今は `hann` と `blackman` だけだが、
比較用に

- Tukey
- Kaiser
- smooth compact support 型

などを加えると、窓依存性が診断しやすい。

#### B. tail basis の理論化
`log(n)` と `n log n` 向けの basis はあるが、
ここも混合成分へ伸ばせる。

#### C. pairwise finite part の表現改善
いま pairwise は面白いが、UI 上の意味づけをもう少し強くしたい。

- 近い窓どうし
- 遠い窓どうし
- 高品質窓どうし

で分けて可視化すると、より診断器として使いやすい。

---

## 3.4 Abel の精度改善

### 3.4.1 改善案
#### A. tail extrapolation の次数自動化
現状は 2 次程度の fit だが、
列の性質に応じて
- 線形
- 2 次
- Padé 風
を切り替える余地がある。

#### B. Fourier 情報との統合
すでにかなりやっているが、さらに
- 単一周波数なら exact route
- 複数周波数なら Fourier 再構成から Abel を補助
という流れを強められる。

#### C. DC dominant 時の説明強化
今の `not_applicable` は誠実だが、
UI 上でも
- 「Abel ではなく dcEstimate を見るべき理由」
をもう少し明示すると分かりやすい。

---

## 3.5 Fourier / dcEstimate の精度改善

### 3.5.1 改善案
#### A. 周波数分解の精密化
- peak refinement の高精度化
- 近接ピークの分離
- multi-peak の安定推定

#### B. bounded 判定の改善
今は range ratio と mean shift だが、
さらに
- rolling average
- 局所分散
- 窓ごとの DC 推定
を入れると良い。

#### C. DC component の信頼度指標
今の `dcStability` は筋が良い。
今後は
- window ごとの DC 一致度
- peak energy に対する DC 比率
も見たい。

---

# 4. Hurwitz の検出力を上げる方針
## 4.1 目標
次のような式を扱いたい。

- `n^(3/2) + n^(7/5)`
- `2*n^(3/2) - 5*n^(1/3)`
- `n^(3/2) + 0.01*sin(n)`
- `(-1)^n * n^(7/5)`
- `(n % 2 == 0 ? 1 : 3) * n^(3/2)`

つまり、**単一の冪ではなく、複数の成分が混ざる列**。

---

## 4.2 推奨する拡張順序

### 4.2.1 第一段階: mixed power-law detector
まずは
\[
a_n \approx \sum_{j=1}^k c_j n^{\alpha_j}
\]
を直接検出する層を作る。

#### 推奨仕様
- `k_max = 2` または `3` から開始
- 係数 `c_j`
- 指数 `α_j`
- 相対 residual
- 安定度
を返す

#### 推奨手順
1. `log-log` 的な粗い指数推定
2. 主項を引く
3. 残差の指数を再推定
4. 最後に全係数を同時再フィット

### 4.2.2 第二段階: Hurwitz summation for mixtures
mixed power が取れたら、
\[
\sum_j c_j n^{\alpha_j}
\quad\mapsto\quad
\sum_j c_j \zeta(-\alpha_j)
\]
で足し合わせる。

これは理論的にも自然で、実装も比較的素直。

### 4.2.3 第三段階: periodic-amplitude mixed power
さらに
\[
a_n = \sum_{r \bmod m} 1_{n\equiv r} \sum_j c_{r,j} n^{\alpha_j}
\]
まで行くと、かなり強い。

このときは各 residue class ごとに mixed power を当て、
最後に Hurwitz zeta の和に落とす。

---

## 4.3 具体的な検出候補

### 4.3.1 peeling 型
もっとも実装しやすく、今の構造に噛み合う。

#### 手順
1. sequence から最大成長の exponent を推定
2. 係数を推定
3. その成分を引く
4. 残差に対して再帰
5. 最後に全パラメータを joint fit

#### 長所
- 実装が比較的簡単
- 現在の `detectPowerLaw` を拡張しやすい

#### 短所
- 近い exponent が並ぶと誤差伝播しやすい

---

### 4.3.2 dictionary fit 型
あらかじめ exponent 候補の辞書を作り、
\[
n^{\alpha_1},n^{\alpha_2},\dots
\]
の線形結合として sparse fit する方法。

#### 長所
- 複数成分を同時に見つけやすい
- `3/2`, `7/5` など候補が見えているなら強い

#### 短所
- 連続 exponent には弱い
- 候補格子設計が必要

---

### 4.3.3 Mellin / ExpCutoff 逆解析型
`S(ε)` の発散次数から exponent を読む方法。

#### 長所
- 理論的にはかなり美しい
- Hurwitz と ExpCutoff をつなぐ橋になる

#### 短所
- 数値実装は繊細
- いきなり入れるには重い

---

## 4.4 推奨方針
現段階では、次の順がもっとも筋が良い。

### 優先順位
1. **peeling 型 mixed power-law detector**
2. **mixed power の Hurwitz summation**
3. **periodic × mixed power への拡張**
4. Mellin 的な高度化

### 理由
- 既存コードと親和性が高い
- 実装量に対して得られる果実が大きい
- `n^(3/2) + n^(7/5)` という要求に最短で届く

---

# 5. おすすめの式セット
## 5.1 手法ごとの代表デモ式

### Hurwitz
- `1`
- `n`
- `n^2`
- `n^1.5`
- `n^(7/5)`
- `1 + n`
- `(-1)^n * n`  ※将来拡張向け

### Exp Cutoff
- `n^1.5`
- `n + 0.001*sin(n)`
- `log(n)`
- `n*log(n)`
- `n^(3/2) + n^(7/5)`  ※将来本命

### Window
- `floor(sqrt(n))`
- `log(n)`
- `n*log(n)`

### Cesàro
- `(-1)^n`
- `(n % 2 == 0) ? 1 : 0`

### Abel
- `(-1)^n`
- `sin(n)`
- `cos(n)`
- `sin(2*n)`

### Fourier / dcEstimate
- `sin(cos(n))`
- `cos(sin(n))`
- `abs(sin(n))`

---

# 6. 今後の設計上の結論

## 6.1 まず強化すべき場所
最優先は次の2本柱。

### A. extended-aware Exp Cutoff の安定化
理由:
- 現在の実用上の難所
- `log(n)`, `n log n` は教材価値も高い
- Summary の誠実さを保ったまま進化できる

### B. Hurwitz の mixed power 拡張
理由:
- `n^(3/2) + n^(7/5)` を扱いたい要求に直結
- 理論的にも綺麗
- ツール全体の格が一段上がる

## 6.2 その次
- Fourier multi-peak 精密化
- Window の診断器としての完成度向上
- Ensemble の説明可能な重み付け

---

# 7. 最終まとめ

## 7.1 各手法の役割整理
- **Hurwitz**: 理論寄りの主砲。準多項式・冪則に強い
- **Exp Cutoff**: 数値主力。extended を扱う中心
- **Window**: 補助診断器。特に extended では診断向け
- **Cesàro**: 交代・平均化向き
- **Abel**: 振動列向き
- **Fourier / dcEstimate**: bounded oscillation の時間平均候補

## 7.2 精度改善の主眼
- Exp Cutoff は **基底・窓・条件数管理**
- Hurwitz は **検出力拡張**
- Window は **値当てより診断品質**
- Abel/Fourier は **周波数理解の深化**

## 7.3 Hurwitz 拡張の核心
`n^(3/2) + n^(7/5)` を扱うには、
まず **mixed power-law detector** を入れ、
そのあとで
\[
\sum_j c_j n^{\alpha_j}
\mapsto
\sum_j c_j \zeta(-\alpha_j)
\]
へ落とすのが、もっとも自然で実装しやすい。

# 実装位相論メモ  
## ファミコンRPG風2Dマップにおけるモデル化・大域整合性・rotによる非対称隣接空間

---

## 0. はじめに

ファミコンRPGの2Dタイルマップは、一見すると単なる有限格子に見える。  
しかし実装の観点から見ると、そこで重要なのは「点がどこにあるか」そのものではなく、

- 各マスからどこへ移動できるか
- 画面端でどのようにラップするか
- 特殊タイルやイベントが接続規則をどう変えるか
- 向きや反転状態や世界位相モードがどう保存・変換されるか

といった **遷移規則** の方である。

この立場では、空間はあらかじめ幾何学的に与えられているのではなく、  
**実装された接続規則から立ち上がるもの** とみなされる。  
本メモでは、このような見方を「実装位相論」と呼び、ファミコンRPG的2Dマップ上でのモデルを整理する。

---

## 1. 基本視点
### 1.1 空間ではなく遷移系として見る

通常の2Dマップは、座標集合 $X$ の上で考えられる。  
しかし、実際のゲーム内では座標だけでは状態を記述しきれない。

例えば、

- プレイヤーの向き
- 左右反転・上下反転の有無
- 回転状態
- 季節や位相モード
- 乗り物状態
- 世界の表裏
- 呪い・特殊フラグ

などが移動結果に影響する。

そのため、真の状態空間を

\[
\mathcal{S} = X \times F
\]

あるいは時間変化・位相モードも含めて

\[
\mathcal{S} = X \times F \times Q
\]

とする。

- $X$: マップ座標
- $F$: 向き・反転・回転などの内部状態
- $Q$: 季節や世界位相モードなどの大域状態

各移動方向 $d \in \{\uparrow,\downarrow,\leftarrow,\rightarrow\}$ に対して、遷移写像

\[
T_d : \mathcal{S} \to \mathcal{S}
\]

を定義することで、世界全体をひとつの離散力学系として扱える。

---

## 2. ファミコンRPG的マップにおける実装位相論モデル

ここでは、2Dタイルマップ上で起こりうる「空間的に変なこと」を、実装位相論的に分類する。

---

### 2.1 位相の動的変化

#### (a) 季節で変わる境界接続
通常時は東端から西端へそのまま出るが、冬だけ南北反転して出る。

- 通常:
  \[
  (W-1,y) \mapsto (0,y)
  \]
- 冬:
  \[
  (W-1,y) \mapsto (0,H-1-y)
  \]

見た目は同じマップでも、冬だけメビウス的なねじれが生じる。

---

#### (b) ボス生存時のみ非可換な世界
東端通過で回転、北端通過で反転、などを導入すると、  
「先に東へ行くか、先に北へ行くか」で結果が変わる。

これは、境界通過作用が非可換になる例であり、  
閉路順序が意味を持つ「呪われた世界」を作る。

---

#### (c) 周回に応じて位相が変わるダンジョン
塔や迷宮が周回ごとに接続規則を変える。

- 1周目: 円筒型
- 3周目: メビウス型
- 5周目: クライン瓶型

などとすると、ダンジョンそのものが有限状態機械として振る舞う。

---

#### (d) 時間でラップ先がずれていく世界
東端通過先が時間 $t$ に応じて

\[
(W-1,y) \mapsto (0, y+k(t) \bmod H)
\]

のように変化する。

これは「空間が呼吸する」「世界そのものに潮汐がある」ようなモデルになる。

---

### 2.2 ラップ命令への干渉

#### (a) 特殊タイルが局所ラップ規則を持つ
神殿の床や虹の橋など、特定地点だけ別の接続規則を持たせる。

例:
- 北へ出ると180度回転
- 通過時に世界層が反転
- 橋を渡ると表世界から裏世界へ切り替わる

これはタイルが単なる床ではなく、**局所接続演算子** になっている例である。

---

#### (b) アイテムや呪文によるラップ規則の改変
「裏返しの杖」「空間ねじれの宝玉」などを使うと、  
境界ラップ規則に変換が加わる。

例えば、
- flipY を付加
- rot を加算
- ラップ先オフセットを反転

など。

これにより、世界の見かけだけでなく大域ねじれ自体が変化する。

---

#### (c) OOB領域からの干渉
マップ外へ出た結果、意図しないメモリ領域を踏み、  
そこに置かれていた「境界接続テーブル」が書き換わる。

プレイヤー体験としては、
- 外海の果てで禁断の敵を倒した
- 帰還後、世界の継ぎ目がおかしくなった

という神話的現象になるが、実装的にはテーブル破壊である。

---

### 2.3 その他の拡張

#### (a) マップ切り替えを貼り合わせとして見る
町、フィールド、塔内部がそれぞれ別の位相を持ち、  
出入口はその間の貼り合わせ写像になっている。

つまり「マップ切り替え」は、単なる場面転換ではなく、  
局所チャートの貼り合わせとして読める。

---

#### (b) 主体ごとに異なる空間
プレイヤー、NPC、亡霊、船などで使う接続規則を変える。

- プレイヤーには行けない道を亡霊が歩く
- 老賢者だけ別位相の道を見ている
- 船だけ海上トーラスを移動できる

これは主体依存空間である。

---

#### (c) セーブ/ロードによる位相差
地形・座標は保存されるが、ラップ規則や位相モードだけが保存漏れする。

すると、ロード後に
- 見た目は同じ
- 現在地も同じ
- しかし世界の貼り合わせだけが変わっている

という「宇宙の微妙なズレ」が起きる。

---

## 3. 数学的に大域整合した形への再構成

アイデアとして面白いだけではなく、「ひとつの数学モデルとして整合している」形に再構成するには、以下の条件が重要である。

---

### 3.1 大域整合性とは何か

ここでは、大域整合性を次のように考える。

#### (1) 一歩移動が well-defined
どの状態からどの方向へ押しても、遷移先が一意に定まる。

#### (2) 経路合成が well-defined
2歩、3歩、1周と移動を合成した結果が、写像の合成として定まる。

#### (3) 世界全体が統一的に読める
局所的な接続変更やイベント変化があっても、  
それらが全体としてひとつの規則系に収まる。

---

### 3.2 状態空間を拡張する

位置だけでなく、向き・反転・回転・位相モード・歩数カウンタなども含めて状態にする。

\[
\mathcal{S} = X \times F \times Q
\]

これにより、時間変化やイベント変化も、  
「別世界への切り替え」ではなく、**同じ巨大な状態機械の中の遷移** として扱える。

---

### 3.3 未定義を残さない

端で「外へ出て未定義」になるのではなく、

- ラップして戻る
- その場に留まる
- 内部状態だけ変える

などにより、各移動方向作用を全域写像として定義する。

\[
T_d(\mathcal{S}) \subseteq \mathcal{S}
\]

これがまず基本となる。

---

### 3.4 境界接続を群作用で表す

反転・回転を含む接続規則を、有限群 $G$ の作用として記述する。

例えば、正方形の対称群 $D_4$ を用いると、

- 90度回転
- 左右反転
- 上下反転

などをひとつの枠組みで扱える。

端通過は

\[
(x,f) \mapsto (x', g \cdot f)
\]

という形になり、ラップ命令は単なる例外処理ではなく、  
**群作用を伴う貼り合わせ** になる。

---

### 3.5 閉路ホロノミーで大域ねじれを測る

閉路に沿って移動したとき、内部状態にどんな変換が蓄積するかを見る。

例えば、横一周・縦一周に対応するホロノミーを

\[
H_x,\quad H_y
\]

とすると、

- \(H_x = e, H_y = e\): ねじれなし
- \(H_x \neq e\): 横一周で反転や回転が入る
- \(H_y \neq e\): 縦一周でねじれが入る

となる。

つまり「一周して元に戻る」とは、位置だけでなく内部状態も含めて考える必要がある。

---

### 3.6 非可換性と局所曲率

東端通過作用 $g_E$ と北端通過作用 $g_N$ が可換でないとき、

\[
g_E g_N \neq g_N g_E
\]

が成り立つ。

このとき矩形ループに沿う交換子

\[
[g_E,g_N] = g_E g_N g_E^{-1} g_N^{-1}
\]

が恒等でなければ、そこに「離散的な曲率」が存在すると考えられる。

したがって、経路順序によって結果が異なる現象は、  
単なる矛盾ではなく、**局所曲率やねじれの存在** として整合的に理解できる。

---

## 4. rot による非対称隣接空間

ここが非常に重要である。  
`rot` を導入すると、「移動」だけでなく「隣接」「接触」「描画」までもが対称性を失うことがある。

具体的には、

- 犬がこちらに触れられる
- こちらからは犬に触れられない
- こちらからは犬が見えない
- しかし遠くに、犬に隣接されている自分の姿だけが見える

という、奇妙な現象が起こりうる。

これは単なる演出ではなく、**異なる位相構造が分裂した結果** として理解できる。

---

### 4.1 何が分裂しているのか

通常、ゲームでは「隣接している」とは次のような複数の意味を暗黙に共有している。

1. **移動隣接**  
   1歩で到達できる

2. **接触隣接**  
   当たり判定が成立する

3. **描画隣接**  
   画面上で近くに見える

普通の空間では、この3つはほぼ一致している。  
しかし `rot` が入ると、それぞれが別のグラフに従ってしまうことがある。

- 移動グラフ \(G_{\mathrm{move}}\)
- 接触グラフ \(G_{\mathrm{touch}}\)
- 描画グラフ \(G_{\mathrm{draw}}\)

この3つが一致しないと、  
**存在しているが見えない敵**  
**見えているが触れられない自分**  
**向こうからだけ攻撃できる一方通行隣接**  
などが自然に発生する。

---

### 4.2 一方通行隣接

`rot` の作用が、ある主体に対してのみ適用されたり、  
適用タイミングがプレイヤーと敵で食い違ったりすると、

- 犬から見たプレイヤーの隣接判定は真
- プレイヤーから見た犬の隣接判定は偽

という現象が起こる。

これは「隣接関係」が対称関係ではなく、  
有向関係になっていることを意味する。

通常の隣接は
\[
A \sim B \Rightarrow B \sim A
\]
だが、ここでは
\[
A \to B \quad \text{だが} \quad B \not\to A
\]
が起こる。

つまり、空間そのものが**有向グラフ化**している。

---

### 4.3 蜃気楼としての自己像

「遠くに犬に隣接されている自分の姿が見える」という現象は、  
描画系だけが別の貼り合わせ規則を参照していると理解できる。

たとえば、

- 接触判定は現在の `rot` 状態で計算
- 描画は1フレーム前、あるいは別座標系で計算
- ラップ先計算と sprite 配置が違う群作用を使っている

とすると、実空間にいる自分とは別に、  
**別の貼り合わせ規則のもとで計算された「自己像」** が可視化される。

これは「バグった残像」というより、  
**異なる位相層をかすかに覗き見ている** 現象として解釈できる。

---

### 4.4 非可換性との関係

`rot` を含む境界通過作用が非可換である場合、  
「どの順序で境界を抜けたか」によって内部状態が異なる。

そのため、

- プレイヤーがたどった経路
- 犬がたどった経路

が違うと、同じ見かけの座標にいても、内部状態が一致しない。

結果として、

- プレイヤー系では犬が別層にいる
- 犬系ではプレイヤーが接触可能位置にいる

という食い違いが起こる。

つまり、この一方通行隣接空間は、  
**非可換ホロノミーが主体ごとの状態差として現れたもの** と考えられる。

---

### 4.5 解釈

この現象は、単なる「おかしな判定」ではなく、次のように理解できる。

- 世界には複数の隣接構造がある
- `rot` はその貼り合わせを揺らす
- 非可換な境界通過が主体ごとの位相状態を分岐させる
- 結果として、見える空間・触れる空間・移動できる空間が一致しなくなる

これにより、  
**犬には追われているのに犬は見えない**  
**自分の蜃気楼だけが別の層に見える**  
という怪異が、大変まっとうな数学的帰結として現れる。

---

## 5. まとめ

本メモでの要点は次の通りである。

### 5.1 実装位相論の基本
ファミコンRPG的2Dマップでは、空間は座標の集合ではなく、  
**遷移規則・境界貼り合わせ・内部状態変換** から構成される。

---

### 5.2 モデル化
次のような現象が実装位相論的に記述できる。

- 季節やイベントによる位相の動的変化
- ラップ命令そのものへの干渉
- 特殊タイルや橋による局所接続
- 主体依存の位相
- セーブ/ロードによる世界のズレ

---

### 5.3 大域整合性
モデルを数学的に整合させるには、

- 状態空間を拡張する
- 遷移を全域写像にする
- 接続規則を群作用で記述する
- 閉路ホロノミーで大域ねじれを測る
- 非可換性を局所曲率として管理する

ことが重要である。

---

### 5.4 rot による怪異
`rot` を含む非可換な接続規則は、

- 一方通行隣接
- 見えないが触れられる敵
- 蜃気楼のような自己像
- 主体ごとに異なる接触位相

を生みうる。

これは「移動空間」「接触空間」「描画空間」が分裂した結果であり、  
非可換ホロノミーの自然な表れとみなせる。

---

## 6. おわりに

ファミコンRPGの2Dマップは、表面的には素朴な格子である。  
しかしその内部では、

- 端の貼り合わせ
- 状態付き遷移
- 主体依存の隣接
- 非可換な境界作用
- 局所曲率
- 異なる位相層の重なり

といった、驚くほど豊かな構造が発生しうる。

この意味で、古典的な2Dマップは単なる古い実装ではなく、  
**離散的で、状態依存で、時に怪異を含んだ宇宙論の実験場** である。

実装位相論とは、その継ぎ目を眺める学問である。

----

もちろんです……！
以下、そのまま **Markdown** として使える形で、**Topologue を実装例として読んだときにわかること**を、関数例つきでまとめます。

````md
# Topologue 実装読解メモ  
## 実装位相論の実装例として見たときにわかること

---

## 0. はじめに

Topologue は、単なる「トポロジー切り替え付き2Dマップ」ではない。  
実装を読むと、そこでは少なくとも次の三つが分離している。

- **真世界の接続**
- **プレイヤーが現在歩いている位相状態**
- **プレイヤーから見た局所空間**

さらに、犬や猫などの NPC は、プレイヤーと完全には同じ空間を共有していない。  
そのため Topologue は、実装位相論における非常に良い実装例になっている。

特に重要なのは、`rot` が単なる見た目の回転ではなく、  
**境界通過によって蓄積する内部位相状態** として働いている点である。

---

## 1. 基本構造
### 1.1 空間は座標ではなく状態付き遷移系として実装されている

Topologue の世界を単純に表すなら、見かけ上は `BaseMap(width, height, tiles)` という矩形タイルマップである。

```js
class BaseMap {
  constructor(width, height, tiles) {
    this.width = width;
    this.height = height;
    this.tiles = tiles;
  }
}
````

しかし、実際に移動や描画を決めているのは座標だけではない。
プレイヤーは `PlayerState` を持ち、その中に

* `nodeId`
* `topoState`
* `facing`

が入っている。

```js
class PlayerState {
  constructor(nodeId, topoState = {}, facing = "N") {
    this.nodeId = nodeId;
    this.topoState = topoState;
    this.facing = facing;
  }
}
```

ここで重要なのは `topoState` である。
つまり Topologue では、「プレイヤーがどこにいるか」だけでなく、
**どの位相状態でそこにいるか** が状態の一部になっている。

この意味で Topologue の真の状態空間は、

[
\mathcal{S} = X \times F
]

の形をしていると読める。

* (X): ノード（座標）
* (F): `rot`, `flipX`, `flipY` などの内部位相状態

---

## 2. `rot` の正体

### 2.1 `rot` は向きではなく、境界通過履歴の蓄積である

`QuarterTurnTopology` は、端を抜けるたびに接続先の辺を 90 度回転させる位相である。

```js
class QuarterTurnTopology {
  constructor({ turn = "clockwise", twist = false, name = "quarter-turn" } = {}) {
    this.turn = turn;
    this.twist = twist;
    this.name = name;
  }

  initialState() {
    return { rot: 0 };
  }

  resolveStep(x, y, dir, topoState, width, height) {
    ...
    const toEdge = this.turn === "clockwise"
      ? rotateDir(fromEdge, 1)
      : rotateDir(fromEdge, -1);

    ({ x: nx, y: ny } = this.placeOnEdge(toEdge, t, width, height));

    nextTopoState.rot =
      this.turn === "clockwise"
        ? (nextTopoState.rot + 3) % 4
        : (nextTopoState.rot + 1) % 4;
    ...
  }
}
```

ここでは、境界を抜けるごとに `rot` が変化する。
つまり `rot` は「今どちらを向いているか」よりも、

**どんな境界の貼り合わせを経て、今ここに来たか**

を記録している。

したがって `rot` は、
単なる視覚回転ではなく、**ホロノミー変数** とみなせる。

---

### 2.2 境界通過は内部状態を更新する

通常の移動では、範囲内ならそのまま進む。

```js
if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
  return {
    blocked: false,
    x: nx,
    y: ny,
    topoState: nextTopoState,
    transform: { type: "normal" },
  };
}
```

しかし境界を抜けると、

1. 出た辺 `fromEdge` を決める
2. 辺上パラメータ `t` を求める
3. twist があれば反転する
4. 接続先辺 `toEdge` を回転で決める
5. 新しい位置へ再配置する
6. `rot` を更新する

という段階を踏む。

この構造はまさに、

* 座標の貼り替え
* 内部フレームの更新
* 接続則の適用

を同時に行うものであり、
**境界が局所的な接続演算子になっている** といえる。

---

## 3. 入力と観測は逆向きの変換を使っている

### 3.1 プレイヤー入力は `rot` を順方向に使う

入力方向は、まず `mapInputDirToGraphDir()` によって世界グラフ上の方向へ変換される。

```js
function mapInputDirToGraphDir(inputDir, topoState) {
  let dir = inputDir;

  const flipX = !!topoState?.flipX;
  const flipY = !!topoState?.flipY;
  const rot = topoState?.rot ?? 0;

  if (flipY) {
    if (dir === "N") dir = "S";
    else if (dir === "S") dir = "N";
  }

  if (flipX) {
    if (dir === "E") dir = "W";
    else if (dir === "W") dir = "E";
  }

  dir = rotateDir(dir, rot);
  return dir;
}
```

つまり、プレイヤーが「上へ行こう」と思っても、
現在の `rot` に応じて、実際にはグラフ上の別方向へ進む。

これは
**操作系がプレイヤーの現在位相に従って曲がっている**
ことを意味する。

---

### 3.2 局所描画は `rot` を逆方向に使う

一方、局所地図上の方向投影は `projectDirToLocalOffset()` で行われる。

```js
function projectDirToLocalOffset(dir, topoState) {
  const rot = topoState?.rot ?? 0;
  const flipX = !!topoState?.flipX;
  const flipY = !!topoState?.flipY;

  let localDir = rotateDir(dir, -rot);

  if (flipX) {
    if (localDir === "E") localDir = "W";
    else if (localDir === "W") localDir = "E";
  }

  if (flipY) {
    if (localDir === "N") localDir = "S";
    else if (localDir === "S") localDir = "N";
  }

  switch (localDir) {
    case "N": return { dx: 0, dy: -1 };
    case "E": return { dx: 1, dy: 0 };
    case "S": return { dx: 0, dy: 1 };
    case "W": return { dx: -1, dy: 0 };
    default: return { dx: 0, dy: 0 };
  }
}
```

ここでは `rotateDir(dir, -rot)` が使われている。
つまり入力とは逆に、**世界方向を局所視点へ引き戻す** ための変換になっている。

よって Topologue では、

* 入力: 主観から世界へ押し出す変換
* 描画: 世界から主観へ引き戻す変換

が実装上きれいに分かれている。

---

## 4. 真世界グラフと主観位相空間

### 4.1 `buildWorldGraph()` は静的な世界骨格を作る

世界の基本グラフは `buildWorldGraph()` で作られる。

```js
function buildWorldGraph(baseMap, topology) {
  const graph = new WorldGraph(baseMap);

  for (let y = 0; y < baseMap.height; y++) {
    for (let x = 0; x < baseMap.width; x++) {
      if (!baseMap.isFloor(x, y)) continue;
      const nodeId = makeNodeId(x, y, baseMap.width);
      graph.addNode(new WorldNode({ id: nodeId, x, y, terrain: "floor" }));
    }
  }

  for (const node of graph.nodes.values()) {
    for (const dir of DIRS) {
      const result = topology.resolveStep(
        node.x,
        node.y,
        dir,
        topology.initialState(),
        baseMap.width,
        baseMap.height
      );
      ...
      node.neighbors[dir] = {
        to: toNodeId,
        transform: result.transform,
      };
    }
  }

  return graph;
}
```

ここで決定的なのは、隣接を構築するときに常に

```js
topology.initialState()
```

を使っていることである。

つまり worldGraph は、**動的な `rot` を持たない初期位相世界** を土台として構築される。

したがってこれは、

* 真世界の骨格
* 客観的な接続表
* 初期位相を基準としたマップ構造

として読める。

---

### 4.2 プレイヤー移動は動的 `topoState` を使う

プレイヤー移動は `movePlayer()` で行われる。

```js
function movePlayer(playerState, graph, topology, dir) {
  const currentNode = graph.getNode(playerState.nodeId);
  if (!currentNode) return false;

  const result = topology.resolveStep(
    currentNode.x,
    currentNode.y,
    dir,
    playerState.topoState,
    graph.baseMap.width,
    graph.baseMap.height
  );

  if (result.blocked || !graph.baseMap.isFloor(result.x, result.y)) {
    return false;
  }

  const nextNodeId = makeNodeId(result.x, result.y, graph.baseMap.width);
  if (!graph.hasNode(nextNodeId)) return false;

  playerState.nodeId = nextNodeId;
  playerState.topoState = result.topoState;
  playerState.facing = dir;
  return true;
}
```

つまりプレイヤーは、
**現在の動的な `topoState` を持ったまま `resolveStep()` を通る。**

このため、プレイヤーが歩いている空間は、

* 同じ nodeId 世界を土台にしつつ
* 現在の `rot` によって接続の読み方が変わる

という、**主観位相付き空間** になっている。

---

## 5. Topologue における二層構造

### 5.1 真世界と局所地図が分かれている

Topologue には、少なくとも次の二つの表示層がある。

#### 真世界描画

```js
function renderTrueWorld(game) {
  ...
}
```

これは baseMap / worldGraph に近い「世界そのもの」を描く。

#### 局所地図描画

```js
function renderChart(localChart, playerState, explorationState, actors = {}, foods = [], renderOptions = {}) {
  ...
}
```

こちらは `buildLocalChart()` によって作られた、
**プレイヤーの現在位相から見た局所空間** を描く。

つまり Topologue では、もともと

* 客観世界
* 主観世界

が分離されている。

---

### 5.2 `buildLocalChart()` は主観空間を再構築する

局所チャートは `buildLocalChart()` によって BFS 的に生成される。

概念的には、これは単なる「近傍の抜き出し」ではない。
ここでは状態として

* `nodeId`
* `localX`
* `localY`
* `topoState`

を持ちながら展開している。

つまり同じ `nodeId` であっても、

* 別の `topoState`
* 別の局所座標

で再登場しうる。

この意味で局所チャートは、
**nodeId の近傍図ではなく、主観位相付き被覆空間の一断面** に近い。

---

## 6. NPC はプレイヤーと同じ空間を歩いていない

### 6.1 犬や猫は静的 `worldGraph` を使って移動する

犬や猫の移動は、`getValidNeighborNodeIds()` や `findDistance()` に基づいている。

```js
function getValidNeighborNodeIds(graph, nodeId) {
  ...
}

function findDistance(graph, startNodeId, targetNodeId, blockedSet = new Set(), maxDistance = Infinity) {
  ...
}
```

そして犬の追跡 `updateDog()` や猫の徘徊 `updateCat()` では、
これらを `game.worldGraph` 上で使っている。

```js
const playerDist = findDistance(game.worldGraph, dog.nodeId, game.playerState.nodeId, new Set(), 3);
...
const nextNodeId = findNextStepToward(game.worldGraph, dog.nodeId, targetNodeId, blocked);
```

```js
const neighbors = getValidNeighborNodeIds(game.worldGraph, cat.nodeId)
  .filter(id => id !== game.playerState.nodeId && id !== game.actors.dog?.nodeId);
```

ここで重要なのは、NPC が使うのは **静的に構築された worldGraph** であり、
プレイヤーの現在 `rot` を共有していないことだ。

したがって、

* プレイヤーは動的位相空間を歩く
* 犬や猫は静的世界骨格で行動する

というズレが発生する。

---

## 7. 接触空間と可視空間の分離

### 7.1 接触判定は nodeId ベースである

プレイヤーの移動候補先が犬や猫の `nodeId` と一致すると、接触処理が起こる。

```js
if (game.actors.dog && nextNodeId === game.actors.dog.nodeId) {
  petActor(game, "dog");
  if (swapWithActor(game, "dog")) {
    ...
  }
  ...
}
```

```js
if (nextNodeId === game.playerState.nodeId) {
  actorTouchesPlayer(game, "dog");
  ...
}
```

これは、接触が主に **nodeId 一致** によって決まることを意味する。

---

### 7.2 描画は局所チャートベースである

一方、描画はプレイヤーの `topoState` 付き `localChart` を通して行われる。

よって同じ nodeId に犬がいても、

* 接触空間では「いる」
* 可視空間では「見えない」

ということが起こりうる。

これは

* **移動空間**
* **接触空間**
* **描画空間**

が一致していないことを意味する。

Topologue はここで、非常に面白い実装位相論的現象を見せる。

---

## 8. rot が生む非対称隣接空間

### 8.1 一方通行隣接

`rot` をプレイヤーだけが持ち、NPC が共有しないと、

* 犬から見るとプレイヤーは隣接している
* プレイヤーから見ると犬は隣接していない

ということが起こりうる。

通常の隣接は対称関係だが、ここでは

[
A \to B \quad \text{だが} \quad B \not\to A
]

が起こる。

つまり Topologue の一部空間では、
隣接関係が**無向グラフではなく有向グラフ**になっている。

---

### 8.2 見えないが触れられる存在

この構造の結果として、

* 犬はプレイヤーに到達できる
* プレイヤーは犬をその位相層で可視化できない
* しかし接触だけは発生する

という「見えないが触れられる敵」が自然に発生する。

これはバグというより、

**接触位相と描画位相が分裂した結果**

と読むのが正しい。

---

### 8.3 蜃気楼としての自己像

局所チャートは、同じ `nodeId` が異なる `topoState`・異なる局所座標で再出現しうる構造を持つ。
そのため、位相状態の違いが描画層へ漏れると、

* 自分の別像
* 遠方にいるはずのない影
* 自分が別の存在に接触されているような像

が現れる余地がある。

これは「同一ノードの多重局所像」として理解できる。

---

## 9. 数学的に見た Topologue

### 9.1 実装されているもの

Topologue を数学的に要約すると、おおむね次のような構造になっている。

#### 状態空間

[
\mathcal{S} = X \times F
]

* (X): nodeId で表される真世界ノード
* (F): `rot`, `flipX`, `flipY` などの内部位相状態

#### 境界作用

`resolveStep()` が境界通過時に
座標と内部状態を同時に更新する。

#### 主観変換

* `mapInputDirToGraphDir()`
* `projectDirToLocalOffset()`

により、世界方向と主観方向の間の変換が実装されている。

#### 客観骨格

`buildWorldGraph()` が初期位相基準の世界接続表を作る。

#### 主観空間

`buildLocalChart()` が現在の `topoState` に基づいて局所宇宙を再構成する。

#### 主体依存位相

NPC は worldGraph 側、プレイヤーは動的 topoState 側を主に使う。

---

### 9.2 何がわかるか

Topologue の実装から読み取れる重要なことは次の通りである。

1. **空間はタイル配列ではなく遷移則である**
2. **`rot` は見た目の回転ではなく、境界通過履歴の蓄積である**
3. **世界には真世界と主観空間の二層がある**
4. **NPC とプレイヤーは同一位相を共有していない**
5. **接触・描画・移動の空間が一致しない**
6. **その結果、非対称隣接や怪異が自然に発生する**

---

## 10. まとめ

Topologue は、実装位相論の実装例として非常に豊かである。

それは単に「トーラス」「メビウス」「quarter-turn」などのトポロジーを切り替えているからではない。
むしろ本質は、

* 境界通過が内部状態を変える
* 操作と描画が逆向き変換を持つ
* 真世界と主観空間が分離している
* NPC が別の位相骨格で動く
* 接触判定と可視判定が一致しない

という実装設計にある。

このため Topologue では、
**同じ nodeId にいること**
**同じ空間で見えていること**
**互いに触れられること**
が、必ずしも同値ではない。

これはまさに、
**離散的・状態依存・主体依存の空間論** の実装であり、
Topologue を単なるゲーム試作ではなく、
**実装位相論の実験装置** として読むことを可能にしている。

---

## 付記: 実装位相論的に特に重要な関数一覧

* `QuarterTurnTopology.resolveStep()`
  境界貼り合わせと `rot` 更新の中心

* `mapInputDirToGraphDir()`
  主観入力から世界方向への変換

* `projectDirToLocalOffset()`
  世界方向から局所描画方向への変換

* `buildWorldGraph()`
  初期位相基準の客観世界グラフ構築

* `movePlayer()`
  動的 `topoState` を持つ主観移動

* `buildLocalChart()`
  現在位相から見た局所宇宙の再構築

* `getValidNeighborNodeIds()` / `findDistance()`
  NPC が使う静的接続空間

* `renderTrueWorld()`
  真世界の表示

* `renderChart()`
  主観局所世界の表示

* `step()`
  入力、接触、移動、更新の接続点

---

```

必要でしたら次に、これをさらに整えて **「Topologue 実装位相論ノート」風の、章立て付き・数式少し増し版** にもできます。
```

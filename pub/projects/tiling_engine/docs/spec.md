# 置換タイル共通JavaScriptエンジン 仕様書草案

## 1. 概要

本仕様は、置換型タイル張りを共通のJavaScriptエンジンで描画するためのデータ構造および設計方針を定めるものである。

対象は主として以下のようなタイル系を想定する。

- 三角形を原型とする置換タイル
- 非周期タイル
- 自己相似的な置換規則を持つタイル
- 将来的には三角形分割された多角形タイル

また、本エンジンは以下の描画モードを想定する。

- 単色塗りつぶし
- 共通画像 + 個別UV
- 個別画像

さらに、画像描画において以下の全体補正を持てるものとする。

- サイズ
- ズーム
- Xオフセット
- Yオフセット

---

## 2. 設計方針

### 2.1 基本方針

本エンジンでは、情報を以下のレイヤに分離する。

1. metadata  
   タイリング名や説明などの付帯情報
2. geometry  
   原型タイル、置換規則、初期配置などの幾何情報
3. styles  
   色、画像、UV、描画モードなどの見た目情報
4. images  
   利用する画像リソース定義
5. render  
   世代数、背景色、画像全体補正などの表示制御情報

### 2.2 重要原則

- 幾何情報と見た目情報を混在させない
- 回転角を直接管理せず、アフィン変換または3点対応で扱う
- タイルごとの個別設定を乱用せず、基本はプリセット方式とする
- 将来的な多角形対応のため、内部表現は三角形ベースを維持する

---

## 3. タイル表現

### 3.1 原型タイル

原型タイルは局所座標系における頂点列として定義する。

三角形の場合、以下の形式を基本とする。

```js
{
  kind: "triangle",
  points: [
    [x1, y1],
    [x2, y2],
    [x3, y3]
  ]
}
```

### 3.2 推奨事項

- 三角形はできるだけ規格化して持つ
  - 例として、底辺を `[0,0] -> [1,0]` に置くと扱いやすい
- 各タイル型ごとに原型を1つずつ定義する

---

## 4. 置換規則

### 4.1 基本方式

置換規則は、親タイルの局所座標系の中で、子タイルの頂点座標を直接記述する方式を基本とする。

```js
{
  childType: "B",
  points: [
    [x1, y1],
    [x2, y2],
    [x3, y3]
  ]
}
```

### 4.2 この方式の利点

- 行列を直接記述するより人間に分かりやすい
- 三角形3点からアフィン変換を一意に復元できる
- 回転や反転を別パラメータに分けずに済む

### 4.3 subdivisionRules の構造

```js
subdivisionRules: {
  A: [
    { childType: "B", points: [...] },
    { childType: "C", points: [...] }
  ],
  B: [
    ...
  ],
  C: [
    ...
  ]
}
```

---

## 5. 初期配置

### 5.1 seed

第0世代のタイル群を seed とする。

```js
seed: [
  {
    tileType: "A",
    points: [
      [x1, y1],
      [x2, y2],
      [x3, y3]
    ]
  }
]
```

### 5.2 方針

- 最初は1枚または少数枚のタイルから始める
- 初期配置も `transform` ではなく `points` で持つことを推奨する
  - 手作業での確認がしやすいためである

---

## 6. 拡大率

### 6.1 inflation

置換タイルに必要な拡大率は、数式表現と数値表現の両方を持てるものとする。

```js
inflation: {
  value: "1 + sin(2*pi/7)/sin(pi/7)",
  numeric: 2.2469796037
}
```

### 6.2 用途

- `value` : UI表示や説明用
- `numeric` : 実計算用

---

## 7. 見た目の設計

### 7.1 基本方針

見た目は `style preset` 方式で定義する。
タイルごとに細かい設定を直接持たせるのではなく、まずプリセットを作り、それをタイル型へ割り当てる。

### 7.2 描画モード

以下の3モードを想定する。

- `fill` : 単色塗りつぶし

  ```js
  {
    mode: "fill",
    fillColor: "#f1d66b",
    strokeColor: "#222222",
    strokeWidth: 1
  }
  ```

- `sharedTexture` : 共通画像を使うが、UVは個別に指定できる

  ```js
  {
    mode: "sharedTexture",
    imageId: "flower",
    uvMap: "triA"
  }
  ```

- `texture` : 個別画像を使う

  ```js
  {
    mode: "texture",
    imageId: "orangeTile",
    uvMap: "triC"
  }
  ```

---

## 8. style preset

### 8.1 presets

```js
styles: {
  presets: {
    goldFill: {
      mode: "fill",
      fillColor: "#f1d66b",
      strokeColor: "#222222",
      strokeWidth: 1
    },

    sharedFlowerA: {
      mode: "sharedTexture",
      imageId: "flower",
      uvMap: "triA",
      zoom: 1.0,
      offsetX: 0,
      offsetY: 0,
      rotationPolicy: "followTile"
    },

    orangePiece: {
      mode: "texture",
      imageId: "orangeTile",
      uvMap: "triC",
      zoom: 1.2,
      offsetX: 12,
      offsetY: -5,
      rotationPolicy: "followTile"
    }
  }
}
```

### 8.2 設計意図

- プリセット名を介して見た目を管理する
- 同じ設定の重複記述を防ぐ
- UIや設定ファイルを簡潔に保つ

---

## 9. タイル型へのスタイル割り当て

```js
tileStyleMap: {
  A: "goldFill",
  B: "sharedFlowerA",
  C: "orangePiece"
}
```

### 9.1 方針

- 通常はタイル型単位でスタイルを割り当てる
- 個別タイル単位の設定は例外扱いとする
  - これによりパラメータ地獄を防ぐ

---

## 10. 個別上書き

### 10.1 overrides

将来的な拡張として、個別タイルへの上書き設定を許容できるようにする。

```js
overrides: {
  "seed-0": {
    stylePreset: "sharedFlowerA",
    zoom: 1.3
  },
  "A/2/1/3": {
    stylePreset: "orangePiece",
    offsetX: 8
  }
}
```

### 10.2 運用方針

- 初期実装では未対応でもよい
- 設計上の拡張枠として確保しておく
- 常用せず、例外処理用とする

---

## 11. 画像リソース

### 11.1 images

```js
images: {
  flower: {
    src: "images/flower.png",
    smoothing: true
  },
  orangeTile: {
    src: "images/orange.png",
    smoothing: true
  }
}
```

### 11.2 最低限必要な項目

- `src`
- `smoothing`

### 11.3 将来的な拡張候補

- 読み込み状態
- 自然サイズ
- キャッシュ制御
- アルファ処理
- クロスオリジン対応

---

## 12. UV定義

### 12.1 基本方針

UVは `style` に直接ベタ書きせず、名前付き定義として管理する。

### 12.2 uvMaps

```js
uvMaps: {
  triA: {
    kind: "triangle",
    points: [
      [0.0, 0.0],
      [1.0, 0.0],
      [0.3, 0.9]
    ]
  },

  triB: {
    kind: "triangle",
    points: [
      [0.1, 0.1],
      [0.9, 0.1],
      [0.5, 0.8]
    ]
  }
}
```

### 12.3 方針

- UV座標は通常 `0〜1` の正規化座標とする
- 実画像サイズへの変換は描画時に行う
- 共通画像 + 別UV の実現に必須

---

## 13. 画像回転の扱い

### 13.1 rotationPolicy

画像の向きの扱いは、以下のようなポリシーで管理する。

- `followTile`
- `fixed`
- `extraRotation`

### 13.2 意味

- **followTile**: タイルの変換に合わせて画像も回転・反転する
- **fixed**: 画像は画面に対して固定する
- **extraRotation**: タイル変換に従ったうえで追加回転を加える

### 13.3 追加回転の例

```js
{
  rotationPolicy: "extraRotation",
  extraRotationDegrees: 180
}
```

---

## 14. 全体描画設定

### 14.1 render

```js
render: {
  generations: 4,
  backgroundColor: "#111111",
  showStroke: true,
  antialias: true,

  textureGlobal: {
    enabled: true,
    size: 1.0,
    zoom: 1.0,
    offsetX: 0,
    offsetY: 0
  },

  viewport: {
    fitMode: "contain",
    padding: 24
  }
}
```

---

## 15. 画像の全体補正

### 15.1 textureGlobal

画像利用全体に対して、以下の補正を持てるものとする。

```js
textureGlobal: {
  enabled: true,
  size: 1.0,
  zoom: 1.0,
  offsetX: 0,
  offsetY: 0
}
```

### 15.2 意味

- `size` : 画像利用の基準倍率
- `zoom` : 全体の追加拡大縮小
- `offsetX` / `offsetY` : 画像の参照位置の平行移動

### 15.3 合成方針

グローバル設定とプリセット設定は合成して使う。

例:
- `finalZoom = globalZoom × presetZoom`
- `finalOffsetX = globalOffsetX + presetOffsetX`
- `finalOffsetY = globalOffsetY + presetOffsetY`

---

## 16. 描画処理の概略

末端タイル1枚を描画する際の処理は、おおむね以下とする。

1. 幾何情報から画面上の三角形を求める
2. タイル型を取得する
3. `tileStyleMap` から対応する `style preset` を取得する
4. `override` があれば上書きする
5. `style` の `mode` を確認する
   - `fill` なら塗りつぶし描画を行う
   - `sharedTexture` または `texture` なら以下を解決する
     - `imageId`
     - `uvMap`
     - `textureGlobal`
     - `preset` ごとの `zoom` / `offset`
     - `rotationPolicy`
6. 画像を三角形へ貼り付ける

---

## 17. 多角形対応の将来拡張

### 17.1 基本方針

多角形対応は、内部的には三角形分割で扱う。

### 17.2 想定形式

```js
{
  kind: "polygon",
  points: [
    [x1, y1],
    [x2, y2],
    [x3, y3],
    [x4, y4],
    [x5, y5]
  ],
  triangulation: [
    [0, 1, 2],
    [0, 2, 3],
    [0, 3, 4]
  ]
}
```

### 17.3 方針

- 見た目は多角形でも、内部描画は三角形単位で行う
- 画像貼りも各三角形に対して適用する
- 共通エンジンは三角形中心の構造を維持する

---

## 18. 最小実装フェーズ

- **Phase 1**
  - 三角形のみ
  - `fill`
  - `sharedTexture`
  - `uvMaps`
  - `tileStyleMap`
  - `textureGlobal`

- **Phase 2**
  - `texture`
  - `rotationPolicy`
  - `preset` ごとの `zoom` / `offset`
  - 画像個別設定の強化

- **Phase 3**
  - `polygon`対応
  - `triangulation`
  - `overrides` (個別タイル上書き)

---

## 19. サンプル全体構造

```js
const tilingDef = {
  metadata: {
    id: "danzer7",
    name: "Danzer 7-fold",
    version: "0.1"
  },

  geometry: {
    prototiles: {
      A: {
        kind: "triangle",
        points: [[0,0],[1,0],[0.32,0.88]]
      },
      B: {
        kind: "triangle",
        points: [[0,0],[1,0],[0.47,0.64]]
      },
      C: {
        kind: "triangle",
        points: [[0,0],[1,0],[0.18,0.96]]
      }
    },

    inflation: {
      value: "1 + sin(2*pi/7)/sin(pi/7)",
      numeric: 2.2469796037
    },

    subdivisionRules: {
      A: [
        {
          childType: "B",
          points: [[0,0],[0.4,0],[0.2,0.24]]
        },
        {
          childType: "C",
          points: [[0.4,0],[1,0],[0.63,0.3]]
        }
      ],
      B: [],
      C: []
    },

    seed: [
      {
        tileType: "A",
        points: [[0,0],[500,0],[160,420]]
      }
    ]
  },

  styles: {
    presets: {
      goldFill: {
        mode: "fill",
        fillColor: "#f2d76b",
        strokeColor: "#1e1e1e",
        strokeWidth: 1
      },

      sharedPetal: {
        mode: "sharedTexture",
        imageId: "flower",
        uvMap: "triA",
        zoom: 1.0,
        offsetX: 0,
        offsetY: 0,
        rotationPolicy: "followTile"
      },

      orangePiece: {
        mode: "texture",
        imageId: "orangeTile",
        uvMap: "triC",
        zoom: 1.1,
        offsetX: 6,
        offsetY: -3,
        rotationPolicy: "followTile"
      }
    },

    tileStyleMap: {
      A: "goldFill",
      B: "sharedPetal",
      C: "orangePiece"
    }
  },

  uvMaps: {
    triA: {
      kind: "triangle",
      points: [[0,0],[1,0],[0.3,0.95]]
    },
    triC: {
      kind: "triangle",
      points: [[0.1,0.1],[0.9,0.2],[0.55,0.95]]
    }
  },

  images: {
    flower: {
      src: "images/flower.png",
      smoothing: true
    },
    orangeTile: {
      src: "images/orange.png",
      smoothing: true
    }
  },

  render: {
    generations: 4,
    backgroundColor: "#111111",
    showStroke: true,

    textureGlobal: {
      enabled: true,
      size: 1.0,
      zoom: 1.0,
      offsetX: 0,
      offsetY: 0
    },

    viewport: {
      fitMode: "contain",
      padding: 24
    }
  }
};
```

---

## 20. 結論

本エンジンの設計上の核は、以下の5点である。

1. 幾何と見た目を分離する
2. 置換規則は親局所座標内の子三角形3点で記述する
3. 見た目は `style preset` 方式で管理する
4. 画像利用は共通画像 + 名前付きUV を基本とする
5. 多角形は将来的に三角形分割で拡張する

この方針により、初期実装の単純さと、将来拡張のしやすさを両立できる。

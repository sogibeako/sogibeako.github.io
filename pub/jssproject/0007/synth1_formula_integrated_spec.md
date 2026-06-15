# Synth1 + Formula Synth 統合版 仕様書

作成日: 2026-06-03

## 目的

`0007_20260216.htm` の数式波形・倍音合成・スケール機能を土台に、Synth1的なバーチャルアナログ音作りを統合する。目標は「Synth1の全パラメータ完全再現」ではなく、ブラウザ上で軽く動き、数式シンセの自由度を保ったまま、Synth1の主要な音作り手順を扱える統合シンセにすること。

## 参照情報

- Synth1 公式マニュアル: https://daichilab.sakura.ne.jp/softsynth/synmanu/readmeeng.html
- Synth1 非公式インタラクティブマニュアル: https://robertheaton.com/2019/04/21/synth1-unofficial-manual/
- 現行実装: `pub/jssproject/0007/0007_20260216.htm`

## Synth1 機能まとめ

Synth1はNord Lead系の構成を持つ軽量なバーチャルアナログシンセとして扱う。統合版では、下記を「Synth1レイヤー」として設計する。

### Oscillator

- Oscillator 1: sine / triangle / saw / square。
- Oscillator 2: triangle / saw / square / noise。
- Sub oscillator: Oscillator 1に重ねる補助発振器。0 octave または -1 octave。
- Oscillator 2 pitch / fine pitch / keyboard tracking。
- Oscillator mix: Oscillator 1 と Oscillator 2 の音量バランス。
- Pulse width: square/pulse系波形の幅。
- Oscillator phase: Oscillator間の位相関係。
- Key shift / fine tune。

### Modulation

- FM: Oscillator 2でOscillator 1を周波数変調する。
- Ring modulation: Oscillator 2側の音色変化を中心にしたAM/RM。
- Sync: Oscillator 1周期でOscillator 2をリトリガする。
- Modulation envelope: Attack / Decay / Amount / Destination。DestinationはOsc2 pitch、FM、pulse width。

### Amp / Filter

- Amp ADSR、master gain、velocity response。
- Filter: LP12 / LP24 / HP12 / BP12、cutoff、resonance、saturation。
- Filter ADSR、envelope amount、keyboard tracking、velocity response。

### LFO

- LFO 1 / LFO 2。
- Wave: saw / square / triangle / sine / stepped random / smoothed random。
- Speed、amount、tempo sync、key sync。
- Destination: osc2 pitch、osc1+2 pitch、filter cutoff、amp、pulse width、FM、pan。

### Voice / Performance

- Poly / Mono / Legato。
- Polyphony。
- Portamento / auto portamento。
- Unison: on/off、voice count、detune、phase、spread、pitch。
- Arpeggiator: on/off、updown / up / down / random、octave range、beat、gate。
- MIDI control: pitch bend、controller source/target/sensitivity。

### Effects

- Distortion系: analog distortion 1/2、digital distortion、bit crusher/decimator。
- Phaser: 1/2/4/6 stage相当。
- Ring modulation effect。
- Compressor。
- EQ / tone / pan。
- Tempo delay: stereo / cross-feedback / ping-pong、tempo synced time、spread、feedback、tone、dry/wet。
- Chorus / flanger: type、delay time、depth、rate、feedback、level。

## 現行 `0007_20260216.htm` 機能まとめ

### Formula

数式から2048サンプルのwavetableを生成し、そのテーブルをAudioWorkletへ配布する。

- 入力変数: `ph`, `t`, `sr`, `pi`, `e`。
- 代入行をサポートし、最後の非代入行を出力式として扱う。
- コメントは `#` と `//`。
- 許可関数: `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `exp`, `log`, `pow`, `sqrt`, `abs`, `sign`, `floor`, `ceil`, `round`, `min`, `max`, `tanh`, `step`。
- ビット演算系: `i32`, `u32`, `band`, `bor`, `bxor`, `bnot`, `shl`, `shr`, `ushr`, `rol`, `ror`。
- 論理・比較: `<`, `<=`, `>`, `>=`, `==`, `!=`, `and`, `or`, `not`。
- 安全性:
  - `new Function` は使わず、math.js ASTを検証して評価する。
  - 禁止ノード: accessor、index、range、array、object、assignment、function assignment、block、updateなど。
  - 式文字数・行数・変数数・ASTノード数に上限あり。
- 安全処理:
  - soft: `tanh` によるソフトサチュレーション。
  - clip: `[-1, 1]` へのハードクリップ。
- DC block: wavetable平均値を引く。
- Sampling: 仮想サンプルレートを指定し、再生時にsample & holdを反映。
- Generateでテーブル生成、Revertで最後に成功した式へ戻す。

### Partials

複数の部分音を `ratio amp` の行で指定し、各partialを合成する。

- 入力形式: 1行につき `ratio amp`。
- 区切り: 空白またはカンマ。
- コメント: `#` と `//`。
- `ratio` と `amp` は数式評価できる。
- partials用追加シンボル:
  - `i`: 0始まり行番号。
  - `k`: 1始まり行番号。
  - `K`: 有効行数。
- `ratio <= 0`、`amp < 0`、非有限値は無効。
- 有効partialが0件なら `[1, 1]` にフォールバック。
- 合成後はamp合計で正規化する。
- Nyquist以上のpartialはスキップする。
- `partialWave`:
  - `table`: Formulaで作ったwavetableを各partialの波形として使う。
  - `sine`: 純サインpartialを使い、Formulaは音声上は無効になる。

### Scale

Scala風のスケールデータを解析し、キーボード入力とWAV書き出しの音高へ反映する。

- 入力形式:
  - `p/q`: 周波数比。
  - 数値: cents。例 `100.` は100 cents。
- 最後の行を周期比として扱う。通常は `1200.` = `2/1`。
- 本体に `1/1` がない場合は自動追加する。
- `noteFreq(step)` は度数配列と周期比から周波数を計算する。
- `baseHz` と基準キー `a` を持つ。
- キーボード割当:
  - `a` から右へ基本度数。
  - `q` 段は +5。
  - `1` 段は +10。
  - `z` 段は -5。
- Scale Tableにratioとcentsを表示する。

### 既存の周辺機能

- AudioWorkletによる最大8ボイス再生。
- Amp ADSR: Attack / Decay / Sustain / Release。
- SVF filter: LPF / HPF / BPF / Off、cutoff、Q。
- 波形プレビューとスペクトラム表示。
- WAV Export:
  - step、duration、sample rate、normalize、fade。
  - Formula、Partials、Scale、Filter、ADSR、Samplingを反映。
- Share URL / sessionStorageによる状態保存。
- Stop All / Panic。

## 統合版コンセプト

統合版は3つの音源レイヤーを持つ。

1. `Formula Osc`: 現行Formula wavetable。
2. `Synth1 Osc`: Synth1風の標準VA oscillator。
3. `Partials`: Formulaまたはsineをpartialとして加算する倍音レイヤー。

各レイヤーは個別にon/off、level、pan、tuneを持つ。最終的にMixerで合算し、Filter、Amp、FXへ送る。

## MVP仕様

### MVPで実装するもの

- 既存Formula / Partials / Scaleを維持。
- Synth1風Oscillator 1 / Oscillator 2 / Sub oscillatorを追加。
- Oscillator波形:
  - Osc1: sine / triangle / saw / square。
  - Osc2: triangle / saw / square / noise。
  - Sub: sine / triangle / saw / square。
- Oscillator操作:
  - osc mix。
  - osc2 pitch / fine。
  - sub level / octave。
  - key shift / fine tune。
  - pulse width。
- Modulation:
  - FM amount。
  - ring modulation on/off。
  - sync on/off。
  - mod envelope A/D/amount/destination。
- Amp:
  - 既存ADSRをSynth1 Amp ADSRとして扱う。
  - velocityは将来MIDI対応までUIだけ保留。
- Filter:
  - 既存SVFを拡張し、LP12 / HP12 / BP12 / Offを扱う。
  - LP24はMVPではLP12 2段直列で近似する。
  - cutoff / resonance / saturation。
  - filter envelope A/D/S/R/amount。
- Voice:
  - Polyのみ継続。
  - polyphonyは既存8ボイス固定からUI化する。
- Preview / Export:
  - Synth1 Osc、Formula、Partials、Scale、ADSR、Filterを同じ信号経路で反映。

### MVPでは見送るもの

- 完全なSynth1プリセット互換。
- VSTホスト連携。
- MIDI CC学習。
- Tempo sync LFO / delay / arpeggiator。
- Chorus / flanger / phaser / compressorの完全実装。
- Mono / legato / portamento / unisonの完全実装。

## 信号フロー

```text
Note + Scale
  -> Pitch Core
  -> Formula Osc
  -> Synth1 Osc 1 / Osc 2 / Sub
  -> Partials
  -> Mixer
  -> Mod Envelope destinations
  -> Filter + Filter Envelope
  -> Amp ADSR
  -> Safety / Output Gain
  -> Preview / AudioWorklet / WAV Export
```

## パラメータ仕様

### Global

| Parameter | Default | Range / Values |
| --- | --- | --- |
| masterGain | 0.25 | 0..1 |
| safety | soft | soft / clip |
| virtSR | 48000 | 48000, 24000, 16000, 12000, 8000, 6000, 4000, 2000 |
| baseHz | 440 | 1..20000 |
| polyphony | 8 | 1..16 |

### Formula Osc

| Parameter | Default | Notes |
| --- | --- | --- |
| enabled | true | Formulaレイヤーon/off |
| expr | `tanh(3*(2*ph-1))` | 既存DSL |
| dcBlock | true | wavetable平均値除去 |
| level | 1 | Mixer入力 |

### Partials

| Parameter | Default | Notes |
| --- | --- | --- |
| enabled | true | Partialsレイヤーon/off |
| partialWave | table | table / sine |
| partials | `1 1` | `ratio amp` |
| level | 1 | Mixer入力 |

### Synth1 Osc

| Parameter | Default | Notes |
| --- | --- | --- |
| synthOscEnabled | false | 既存音を壊さないため初期値はoff |
| osc1Wave | saw | sine / triangle / saw / square |
| osc2Wave | saw | triangle / saw / square / noise |
| subWave | square | sine / triangle / saw / square |
| oscMix | 0.5 | 0=osc1, 1=osc2 |
| subLevel | 0 | 0..1 |
| subOctave | -1 | 0 / -1 |
| osc2Semi | 0 | -24..24 |
| osc2Fine | 0 | -100..100 cents |
| pulseWidth | 0.5 | 0.05..0.95 |
| fmAmount | 0 | 0..1 |
| ring | false | boolean |
| sync | false | boolean |

### Filter

| Parameter | Default | Notes |
| --- | --- | --- |
| type | LP12 | LP12 / LP24 / HP12 / BP12 / Off |
| cutoff | 2000 | 20..20000 Hz |
| resonance | 1 | 0.1..20 |
| saturation | 0 | 0..1 |
| envA/D/S/R | 0.01/0.1/0.5/0.3 | seconds / level |
| envAmount | 0 | -1..1 |

## UI仕様

- 画面上部にタブまたは折りたたみセクションを置く。
  - Osc
  - Formula
  - Partials
  - Filter / Amp
  - Scale
  - Export
- 既存のFormula、Partials、Scaleは入力面積を確保する。
- Synth1 Oscはノブ風ではなく、ブラウザ実装しやすいslider/select/checkboxで構成する。
- `partialWave=sine` のときFormulaを薄く表示する既存挙動は残す。ただしFormulaレイヤーon/off追加後は状態表示を明確化する。
- Scale TableとPreviewは常時見える位置に残す。

## 実装方針

- まず巨大HTML内のロジックを分割せず、現行ファイルの近くに統合版HTMLを新規作成する。
  - 候補: `pub/jssproject/0007/0007_integrated_20260603.htm`
- 既存版 `0007_20260216.htm` は保存版として変更しない。
- AudioWorkletとWAV Exportは同じレンダリング関数・同じパラメータ構造を使う方向へ寄せる。
- Preview、Realtime、Exportの音がズレないよう、共通の「voice render core」を作る。
- 状態保存は既存のShare URL / sessionStorageを拡張する。

## 実装順

1. 既存状態を壊さず統合版HTMLを複製する。
2. パラメータ状態オブジェクトを整理する。
3. Synth1 Oscillator生成関数を追加する。
4. MixerでFormula / Partials / Synth1 Oscを合算する。
5. FilterをLP12 / LP24 / HP12 / BP12対応に拡張する。
6. Mod envelopeを追加する。
7. Preview、AudioWorklet、WAV Exportを同じ仕様に合わせる。
8. Share URL / sessionStorageを拡張する。
9. Playwrightまたはブラウザで表示・操作・非blank canvasを確認する。

## 注意点・リスク

- 現行HTMLは一部文字化けしている。統合版では表示文言をUTF-8で整理する。
- 現行コードには重複イベントリスナがある。統合版では挙動確認しながら整理する。
- Synth1のアナログ的な挙動、特にfilter saturation、sync、unison、effectsは完全一致より「操作感の近似」を優先する。
- ブラウザAudioWorkletで重い処理を避けるため、Formula DSLの評価はwavetable生成時のみ行う。
- Partials数が増えるとボイス数と掛け算でCPU負荷が増える。MVPではpartial上限または警告表示を検討する。

## 完了条件

- 既存Formula/Partials/Scaleの基本挙動が統合版でも動く。
- Synth1 Oscをonにすると標準波形・mix・sub・FM/ring/syncの基本操作で音が変化する。
- Scale入力がリアルタイム再生・Preview・WAV Exportに反映される。
- Formula/Partials/Synth1 Oscの各レイヤーを個別にon/offできる。
- Waveform/Spectrumプレビューが空白にならない。
- WAV Exportで統合音源の結果を保存できる。

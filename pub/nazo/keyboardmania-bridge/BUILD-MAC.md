# Mac版をビルドする方法

この手順では、Apple Silicon搭載MacとIntel Macの両方で動く
Universal Binaryを作成します。

## 必要なもの

- macOS 11以降
- インターネット接続
- 約1 GB以上の空き容量
- Xcode Command Line Tools
- CMake 3.21以降

ビルド中にHIDAPIとRtMidiのソースを自動的にダウンロードします。

## 1. ソースZIPを展開する

`keyboardmania-midi-bridge-source.zip` をダブルクリックして展開します。

展開すると、`keyboardmania-midi-bridge-source` フォルダーが作られます。

## 2. Xcode Command Line Toolsを準備する

「ターミナル」を開いて、次を実行します。

```sh
xcode-select --install
```

すでにインストール済みの場合は、そのことを知らせるメッセージが表示されます。

## 3. CMakeを準備する

[Homebrew](https://brew.sh/)を使用している場合:

```sh
brew install cmake
```

Homebrewを使わない場合は、
[CMake公式ダウンロードページ](https://cmake.org/download/)から
macOS版をインストールしてください。

次のコマンドでバージョンが表示されれば準備完了です。

```sh
cmake --version
```

## 4. ビルドする

ソースフォルダーが「ダウンロード」にある場合は、次を実行します。

```sh
cd ~/Downloads/keyboardmania-midi-bridge-source
sh scripts/build-macos.sh
```

ソースフォルダーを別の場所へ移動した場合は、
`cd` の後ろを実際の場所に合わせてください。

ビルドには数分かかることがあります。依存ライブラリの取得中は
ターミナルを閉じないでください。

## 5. 完成したファイル

成功すると、次のZIPが作られます。

```text
dist/keyboardmania-midi-bridge-macos-universal.zip
```

このZIPには、Apple Silicon／Intel両対応の実行ファイルと
日本語README、ライセンスが入っています。

## 6. 起動する

完成したZIPを展開し、ターミナルでそのフォルダーへ移動して実行します。

```sh
xattr -dr com.apple.quarantine keyboardmania-midi-bridge
chmod +x keyboardmania-midi-bridge
./keyboardmania-midi-bridge
```

macOSが実行を止めた場合は、
「システム設定」→「プライバシーとセキュリティ」に表示される
「このまま開く」を選んでください。

利用可能なMIDI出力先がない場合は、`Keyboardmania` という
仮想MIDIポートが自動的に作成されます。

## ビルドに失敗した場合

### `cmake: command not found`

CMakeがインストールされていないか、ターミナルから見つけられない状態です。
ターミナルを開き直してから `cmake --version` を確認してください。

### C/C++コンパイラが見つからない

次を実行して、Xcode Command Line Toolsをインストールしてください。

```sh
xcode-select --install
```

### ダウンロードに失敗する

ビルド中はGitHubから依存ライブラリを取得します。
インターネット接続を確認してから、同じビルドコマンドをもう一度実行してください。

### Intel／Apple Silicon片方のビルドで失敗する

macOSとXcode Command Line Toolsを更新してから、もう一度実行してください。
このスクリプトはmacOS 11以降を対象にしています。

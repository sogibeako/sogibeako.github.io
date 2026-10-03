# Keyboardmania MIDI Bridge 配布ページ

このフォルダーは、家族向けの非公式な配布ページです。

- `index.html`: 配布ページ
- `keyboardmania-midi-bridge-windows-x64.zip`: Windows 10／11・64bit版
- `keyboardmania-midi-bridge-source.zip`: Windows／Mac共通のソース一式
- `BUILD-MAC.md`: Mac版の詳しいビルド手順

詳しい使い方は、配布ZIP内の `README.md` を確認してください。

## Mac版を作る

Mac版は、Apple Silicon／Intel両対応のUniversal Binaryとしてビルドできます。

1. `keyboardmania-midi-bridge-source.zip` を展開します。
2. Xcode Command Line ToolsとCMakeを準備します。
3. 展開したフォルダーで `sh scripts/build-macos.sh` を実行します。

詳しくは [BUILD-MAC.md](BUILD-MAC.md) を確認してください。

## 元プロジェクト

この配布物は、Heelさん（GitHub: has207）による
[keyboardmania-midi-bridge](https://github.com/has207/keyboardmania-midi-bridge)
を基にした非公式の改良版です。

元プロジェクトと本配布物はMIT Licenseです。
著作権表示とライセンス全文は配布ZIP内の `LICENSE` に収録しています。

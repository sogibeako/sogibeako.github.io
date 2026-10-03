# dist

M4の決定的な静的生成物を置く。`index.html` と `assets/` は `scripts/build.py` が生成し、`.build-manifest.json` が生成対象とSHA-256を記録する。このREADMEは生成管理外であり、`--clean`でも削除されない。

現在の内容はM4ツールチェーン確認専用デモであり、本番教材ではない。相対パスだけを使い、サーバー不要の `file://` と静的ホスティングの双方を意図した構成である。

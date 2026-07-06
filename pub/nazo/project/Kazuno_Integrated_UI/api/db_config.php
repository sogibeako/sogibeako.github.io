<?php
// データベースタイプ設定 ('mysql' または 'sqlite')
// ローカルで手軽に試す場合は 'sqlite'、リトルサーバーなどの本番環境では 'mysql' に設定してください。
define('DB_TYPE', 'sqlite');

// MySQL データベース接続設定 (DB_TYPE = 'mysql' の場合に使用)
define('DB_HOST', '127.0.0.1');
define('DB_PORT', '3306');
define('DB_NAME', 'mizuhara_kazuno_ui');
define('DB_USER', 'root');
define('DB_PASS', '');

// SQLite データベース設定 (DB_TYPE = 'sqlite' の場合に使用、api/ ディレクトリ内にファイルが作られます)
define('SQLITE_FILE', __DIR__ . '/kazuno_db.sqlite');

// ダッシュボードへのログイン用パスワード
define('LOGIN_PASSWORD', 'kazuno123');


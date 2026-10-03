<?php
define('DB_TYPE', 'sqlite');

// MySQLを使う場合は mysql に変更
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'your_database_name');
define('DB_USER', 'your_database_user');
define('DB_PASS', 'your_database_password');

define('SQLITE_FILE', __DIR__ . '/kazuno_db.sqlite');

define('LOGIN_PASSWORD', 'change_this_password');
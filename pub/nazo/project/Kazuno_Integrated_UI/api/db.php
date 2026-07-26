<?php
require_once __DIR__ . '/db_config.php';

// セッション開始（まだ開始されていない場合）
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// データベース接続取得
function get_db_connection() {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    try {
        if (DB_TYPE === 'sqlite') {
            // SQLite 接続
            $pdo = new PDO("sqlite:" . SQLITE_FILE, null, null, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]);
            // テーブル自動生成
            init_tables($pdo, 'sqlite');
        } else {
            // MySQL 接続
            $dsn_without_db = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";charset=utf8mb4";
            $temp_pdo = new PDO($dsn_without_db, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]);

            // データベース作成
            $db_name = DB_NAME;
            $temp_pdo->exec("CREATE DATABASE IF NOT EXISTS `$db_name` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

            // データベース指定で再接続
            $dsn_with_db = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
            $pdo = new PDO($dsn_with_db, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]);
            // テーブル自動生成
            init_tables($pdo, 'mysql');
        }

        return $pdo;
    } catch (PDOException $e) {
        header('Content-Type: application/json; charset=utf-8', true, 500);
        echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
        exit;
    }
}

// テーブル初期化
function init_tables($pdo, $type) {
    if ($type === 'sqlite') {
        // todos テーブル (SQLite)
        $pdo->exec("CREATE TABLE IF NOT EXISTS todos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            memo TEXT NULL,
            done INTEGER NOT NULL DEFAULT 0,
            priority INTEGER NOT NULL DEFAULT 0,
            due_date TEXT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NULL
        );");

        // events テーブル (SQLite)
        $pdo->exec("CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            memo TEXT NULL,
            event_date TEXT NOT NULL,
            start_time TEXT NULL,
            end_time TEXT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NULL
        );");

        // settings テーブル (SQLite)
        $pdo->exec("CREATE TABLE IF NOT EXISTS settings (
            setting_key TEXT PRIMARY KEY,
            setting_value TEXT NULL,
            updated_at DATETIME NULL
        );");

        // pomodoro_sessions テーブル (SQLite)
        $pdo->exec("CREATE TABLE IF NOT EXISTS pomodoro_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            started_at DATETIME NOT NULL,
            ended_at DATETIME NULL,
            duration_minutes INTEGER NOT NULL,
            type TEXT NOT NULL,
            memo TEXT NULL
        );");

        // vfs_files テーブル (SQLite)
        $pdo->exec("CREATE TABLE IF NOT EXISTS vfs_files (
            path TEXT PRIMARY KEY,
            content TEXT NULL,
            is_dir INTEGER NOT NULL DEFAULT 0,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );");

        // done_items テーブル (SQLite)
        $pdo->exec("CREATE TABLE IF NOT EXISTS done_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            done_date TEXT NOT NULL,
            title TEXT NOT NULL,
            points INTEGER NOT NULL DEFAULT 0,
            source TEXT NULL,
            source_id TEXT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );");
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_done_items_date ON done_items (done_date);");
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_done_items_source ON done_items (done_date, source, source_id);");
    } else {
        // todos テーブル (MySQL)
        $pdo->exec("CREATE TABLE IF NOT EXISTS todos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            memo TEXT NULL,
            done TINYINT(1) NOT NULL DEFAULT 0,
            priority INT NOT NULL DEFAULT 0, -- 0: 低, 1: 中, 2: 高
            due_date DATE NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

        // events テーブル (MySQL)
        $pdo->exec("CREATE TABLE IF NOT EXISTS events (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            memo TEXT NULL,
            event_date DATE NOT NULL,
            start_time TIME NULL,
            end_time TIME NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

        // settings テーブル (MySQL)
        $pdo->exec("CREATE TABLE IF NOT EXISTS settings (
            setting_key VARCHAR(100) PRIMARY KEY,
            setting_value TEXT NULL,
            updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

        // pomodoro_sessions テーブル (MySQL)
        $pdo->exec("CREATE TABLE IF NOT EXISTS pomodoro_sessions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            started_at DATETIME NOT NULL,
            ended_at DATETIME NULL,
            duration_minutes INT NOT NULL,
            type VARCHAR(50) NOT NULL,
            memo TEXT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

        // vfs_files テーブル (MySQL)
        $pdo->exec("CREATE TABLE IF NOT EXISTS vfs_files (
            path VARCHAR(255) PRIMARY KEY,
            content LONGTEXT NULL,
            is_dir TINYINT(1) NOT NULL DEFAULT 0,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

        // done_items テーブル (MySQL)
        $pdo->exec("CREATE TABLE IF NOT EXISTS done_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            done_date DATE NOT NULL,
            title VARCHAR(255) NOT NULL,
            points INT NOT NULL DEFAULT 0,
            source VARCHAR(50) NULL,
            source_id VARCHAR(100) NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_done_items_date (done_date),
            INDEX idx_done_items_source (done_date, source, source_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");
    }
}

// 認証チェック
function check_auth() {
    if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
        header('Content-Type: application/json; charset=utf-8', true, 401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
}

// JSONレスポンス出力用ヘルパー
function send_json($data, $status_code = 200) {
    header('Content-Type: application/json; charset=utf-8', true, $status_code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

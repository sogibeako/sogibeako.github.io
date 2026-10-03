<?php
require_once __DIR__ . '/db.php';

$action = $_GET['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // ログイン処理
    $input = json_decode(file_get_contents('php://input'), true);
    $password = $input['password'] ?? '';

    if ($password === LOGIN_PASSWORD) {
        $_SESSION['logged_in'] = true;
        send_json(['success' => true]);
    } else {
        send_json(['error' => 'パスワードが正しくありません'], 400);
    }
} else {
    // GET処理
    if ($action === 'logout') {
        $_SESSION = [];
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }
        session_destroy();
        send_json(['success' => true]);
    } elseif ($action === 'status') {
        $logged_in = isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true;
        send_json(['logged_in' => $logged_in]);
    } else {
        send_json(['error' => '無効なアクションです'], 400);
    }
}

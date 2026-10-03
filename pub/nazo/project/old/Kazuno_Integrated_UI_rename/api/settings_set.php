<?php
require_once __DIR__ . '/db.php';
check_auth();

$input = json_decode(file_get_contents('php://input'), true);
$key = $input['key'] ?? '';
$value = $input['value'] ?? null;

if (empty($key)) {
    send_json(['error' => '設定キーが指定されていません'], 400);
}

$db = get_db_connection();
try {
    $stmt = $db->prepare("REPLACE INTO settings (setting_key, setting_value, updated_at) VALUES (:key, :value, CURRENT_TIMESTAMP)");
    $stmt->execute([
        ':key' => $key,
        ':value' => $value
    ]);
    
    send_json(['success' => true]);
} catch (PDOException $e) {
    send_json(['error' => $e->getMessage()], 500);
}

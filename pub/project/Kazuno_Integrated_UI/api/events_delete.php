<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/backup_lib.php';
check_auth();

$input = json_decode(file_get_contents('php://input'), true);
$id = intval($input['id'] ?? 0);

if ($id <= 0) {
    send_json(['error' => '無効なIDです'], 400);
}

$db = get_db_connection();
try {
    $stmt = $db->prepare("SELECT * FROM events WHERE id = :id");
    $stmt->execute([':id' => $id]);
    if (!$stmt->fetch()) {
        send_json(['error' => '指定されたイベントが見つかりません'], 404);
    }

    $stmt = $db->prepare("DELETE FROM events WHERE id = :id");
    $stmt->execute([':id' => $id]);

    backup_try_create_snapshot($db, 'events_delete');

    send_json(['success' => true]);
} catch (PDOException $e) {
    send_json(['error' => $e->getMessage()], 500);
}

<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/backup_lib.php';
check_auth();

$input = json_decode(file_get_contents('php://input'), true);
$reason = $input['reason'] ?? 'manual';

try {
    $db = get_db_connection();
    $backup = backup_create_snapshot($db, $reason);
    send_json(['success' => true, 'backup' => $backup]);
} catch (Throwable $e) {
    send_json(['error' => $e->getMessage()], 500);
}


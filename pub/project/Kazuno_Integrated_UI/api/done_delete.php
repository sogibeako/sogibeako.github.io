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
    $stmt = $db->prepare("SELECT * FROM done_items WHERE id = :id");
    $stmt->execute([':id' => $id]);
    if (!$stmt->fetch()) {
        send_json(['error' => '指定された記録が見つかりません'], 404);
    }

    $stmt = $db->prepare("DELETE FROM done_items WHERE id = :id");
    $stmt->execute([':id' => $id]);

    $sum_stmt = $db->query("SELECT COALESCE(SUM(points), 0) AS total_points FROM done_items");
    $sum = $sum_stmt->fetch();

    backup_try_create_snapshot($db, 'done_delete');

    send_json([
        'success' => true,
        'total_points' => intval($sum['total_points'] ?? 0)
    ]);
} catch (PDOException $e) {
    send_json(['error' => $e->getMessage()], 500);
}

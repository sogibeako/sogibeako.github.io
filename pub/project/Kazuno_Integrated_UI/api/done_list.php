<?php
require_once __DIR__ . '/db.php';
check_auth();

$db = get_db_connection();

try {
    $stmt = $db->query("SELECT * FROM done_items ORDER BY done_date DESC, created_at DESC, id DESC");
    $items = $stmt->fetchAll();

    $sum_stmt = $db->query("SELECT COALESCE(SUM(points), 0) AS total_points FROM done_items");
    $sum = $sum_stmt->fetch();

    send_json([
        'items' => $items,
        'total_points' => intval($sum['total_points'] ?? 0)
    ]);
} catch (PDOException $e) {
    send_json(['error' => $e->getMessage()], 500);
}

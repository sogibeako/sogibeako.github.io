<?php
require_once __DIR__ . '/db.php';
check_auth();

$db = get_db_connection();
try {
    $stmt = $db->query("SELECT * FROM vfs_files");
    $items = $stmt->fetchAll();
    send_json($items);
} catch (PDOException $e) {
    send_json(['error' => $e->getMessage()], 500);
}

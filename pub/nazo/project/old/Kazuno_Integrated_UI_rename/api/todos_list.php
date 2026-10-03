<?php
require_once __DIR__ . '/db.php';
check_auth();

$db = get_db_connection();
try {
    $stmt = $db->query("SELECT * FROM todos ORDER BY done ASC, priority DESC, due_date ASC, id DESC");
    $todos = $stmt->fetchAll();
    send_json($todos);
} catch (PDOException $e) {
    send_json(['error' => $e->getMessage()], 500);
}

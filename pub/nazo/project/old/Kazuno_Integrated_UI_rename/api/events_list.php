<?php
require_once __DIR__ . '/db.php';
check_auth();

$db = get_db_connection();
try {
    $stmt = $db->query("SELECT * FROM events ORDER BY event_date ASC, start_time ASC");
    $events = $stmt->fetchAll();
    send_json($events);
} catch (PDOException $e) {
    send_json(['error' => $e->getMessage()], 500);
}

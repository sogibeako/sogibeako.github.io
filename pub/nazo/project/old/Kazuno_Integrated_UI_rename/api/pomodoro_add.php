<?php
require_once __DIR__ . '/db.php';
check_auth();

$input = json_decode(file_get_contents('php://input'), true);
$started_at = $input['started_at'] ?? '';
$ended_at = $input['ended_at'] ?? '';
$duration_minutes = intval($input['duration_minutes'] ?? 0);
$type = $input['type'] ?? 'work';
$memo = $input['memo'] ?? '';

if (empty($started_at)) {
    send_json(['error' => '開始日時を指定してください'], 400);
}

$db = get_db_connection();
try {
    $stmt = $db->prepare("INSERT INTO pomodoro_sessions (started_at, ended_at, duration_minutes, type, memo) VALUES (:started_at, :ended_at, :duration_minutes, :type, :memo)");
    $stmt->execute([
        ':started_at' => $started_at,
        ':ended_at' => empty($ended_at) ? null : $ended_at,
        ':duration_minutes' => $duration_minutes,
        ':type' => $type,
        ':memo' => $memo
    ]);
    
    send_json(['success' => true]);
} catch (PDOException $e) {
    send_json(['error' => $e->getMessage()], 500);
}

<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/backup_lib.php';
check_auth();

$input = json_decode(file_get_contents('php://input'), true);
$title = $input['title'] ?? '';
$memo = $input['memo'] ?? '';
$event_date = $input['event_date'] ?? '';
$start_time = $input['start_time'] ?? null;
$end_time = $input['end_time'] ?? null;

if (empty($title)) {
    send_json(['error' => 'タイトルを入力してください'], 400);
}
if (empty($event_date) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $event_date)) {
    send_json(['error' => '有効な日付を指定してください (YYYY-MM-DD)'], 400);
}

if (!empty($start_time) && !preg_match('/^\d{2}:\d{2}(:\d{2})?$/', $start_time)) {
    $start_time = null;
}
if (!empty($end_time) && !preg_match('/^\d{2}:\d{2}(:\d{2})?$/', $end_time)) {
    $end_time = null;
}

$db = get_db_connection();
try {
    $stmt = $db->prepare("INSERT INTO events (title, memo, event_date, start_time, end_time) VALUES (:title, :memo, :event_date, :start_time, :end_time)");
    $stmt->execute([
        ':title' => $title,
        ':memo' => $memo,
        ':event_date' => $event_date,
        ':start_time' => $start_time ? $start_time : null,
        ':end_time' => $end_time ? $end_time : null
    ]);
    $new_id = $db->lastInsertId();

    $stmt = $db->prepare("SELECT * FROM events WHERE id = :id");
    $stmt->execute([':id' => $new_id]);
    $event = $stmt->fetch();

    backup_try_create_snapshot($db, 'events_add');

    send_json($event);
} catch (PDOException $e) {
    send_json(['error' => $e->getMessage()], 500);
}

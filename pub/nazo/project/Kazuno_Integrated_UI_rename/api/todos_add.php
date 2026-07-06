<?php
require_once __DIR__ . '/db.php';
check_auth();

$input = json_decode(file_get_contents('php://input'), true);
$title = $input['title'] ?? '';
$memo = $input['memo'] ?? '';
$priority = intval($input['priority'] ?? 0);
$due_date = $input['due_date'] ?? null;

if (empty($title)) {
    send_json(['error' => 'タイトルを入力してください'], 400);
}

if (!empty($due_date)) {
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $due_date)) {
        $due_date = null;
    }
} else {
    $due_date = null;
}

$db = get_db_connection();
try {
    $stmt = $db->prepare("INSERT INTO todos (title, memo, priority, due_date) VALUES (:title, :memo, :priority, :due_date)");
    $stmt->execute([
        ':title' => $title,
        ':memo' => $memo,
        ':priority' => $priority,
        ':due_date' => $due_date
    ]);
    $new_id = $db->lastInsertId();
    
    $stmt = $db->prepare("SELECT * FROM todos WHERE id = :id");
    $stmt->execute([':id' => $new_id]);
    $todo = $stmt->fetch();
    
    send_json($todo);
} catch (PDOException $e) {
    send_json(['error' => $e->getMessage()], 500);
}

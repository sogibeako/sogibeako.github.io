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
    $stmt = $db->prepare("SELECT * FROM todos WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $todo = $stmt->fetch();
    if (!$todo) {
        send_json(['error' => '指定されたToDoが見つかりません'], 404);
    }

    $done = isset($input['done']) ? intval($input['done']) : $todo['done'];
    $title = isset($input['title']) ? $input['title'] : $todo['title'];
    $memo = isset($input['memo']) ? $input['memo'] : $todo['memo'];
    $priority = isset($input['priority']) ? intval($input['priority']) : $todo['priority'];
    
    $due_date = $todo['due_date'];
    if (array_key_exists('due_date', $input)) {
        $due_date = $input['due_date'];
        if (!empty($due_date)) {
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $due_date)) {
                $due_date = null;
            }
        } else {
            $due_date = null;
        }
    }

    $stmt = $db->prepare("UPDATE todos SET title = :title, memo = :memo, done = :done, priority = :priority, due_date = :due_date WHERE id = :id");
    $stmt->execute([
        ':title' => $title,
        ':memo' => $memo,
        ':done' => $done,
        ':priority' => $priority,
        ':due_date' => $due_date,
        ':id' => $id
    ]);

    $stmt = $db->prepare("SELECT * FROM todos WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $todo = $stmt->fetch();

    backup_try_create_snapshot($db, 'todos_update');
    
    send_json($todo);
} catch (PDOException $e) {
    send_json(['error' => $e->getMessage()], 500);
}

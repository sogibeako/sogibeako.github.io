<?php
require_once __DIR__ . '/db.php';
check_auth();

$input = json_decode(file_get_contents('php://input'), true);
$title = trim($input['title'] ?? '');
$points = intval($input['points'] ?? 0);
$done_date = $input['date'] ?? date('Y-m-d');
$source = $input['source'] ?? null;
$source_id = isset($input['source_id']) ? strval($input['source_id']) : null;

if ($title === '') {
    send_json(['error' => '内容を入力してください'], 400);
}

if ($points < 1) {
    $points = 1;
}

if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $done_date)) {
    send_json(['error' => '日付は YYYY-MM-DD 形式で指定してください'], 400);
}

$db = get_db_connection();

try {
    if ($source !== null && $source_id !== null && $source_id !== '') {
        $stmt = $db->prepare("SELECT * FROM done_items WHERE done_date = :done_date AND source = :source AND source_id = :source_id LIMIT 1");
        $stmt->execute([
            ':done_date' => $done_date,
            ':source' => $source,
            ':source_id' => $source_id
        ]);
        $existing = $stmt->fetch();
        if ($existing) {
            $sum_stmt = $db->query("SELECT COALESCE(SUM(points), 0) AS total_points FROM done_items");
            $sum = $sum_stmt->fetch();
            send_json([
                'item' => $existing,
                'total_points' => intval($sum['total_points'] ?? 0),
                'duplicate' => true
            ]);
        }
    }

    $stmt = $db->prepare("INSERT INTO done_items (done_date, title, points, source, source_id) VALUES (:done_date, :title, :points, :source, :source_id)");
    $stmt->execute([
        ':done_date' => $done_date,
        ':title' => $title,
        ':points' => $points,
        ':source' => $source,
        ':source_id' => $source_id
    ]);

    $new_id = $db->lastInsertId();
    $stmt = $db->prepare("SELECT * FROM done_items WHERE id = :id");
    $stmt->execute([':id' => $new_id]);
    $item = $stmt->fetch();

    $sum_stmt = $db->query("SELECT COALESCE(SUM(points), 0) AS total_points FROM done_items");
    $sum = $sum_stmt->fetch();

    send_json([
        'item' => $item,
        'total_points' => intval($sum['total_points'] ?? 0)
    ]);
} catch (PDOException $e) {
    send_json(['error' => $e->getMessage()], 500);
}

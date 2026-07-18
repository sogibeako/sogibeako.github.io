<?php
require_once __DIR__ . '/db.php';
check_auth();

$input = json_decode(file_get_contents('php://input'), true);
$path = $input['path'] ?? '';

if (empty($path)) {
    send_json(['error' => 'path is required'], 400);
}

$db = get_db_connection();
try {
    $stmt = $db->prepare("SELECT path, content, is_dir, updated_at, LENGTH(content) AS size FROM vfs_files WHERE path = :path");
    $stmt->execute([':path' => $path]);
    $item = $stmt->fetch();

    if (!$item) {
        send_json(['error' => 'file not found'], 404);
    }

    if (intval($item['is_dir']) === 1) {
        send_json(['error' => 'path is a directory'], 400);
    }

    send_json($item);
} catch (PDOException $e) {
    send_json(['error' => $e->getMessage()], 500);
}

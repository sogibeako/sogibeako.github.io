<?php
require_once __DIR__ . '/db.php';
check_auth();

$input = json_decode(file_get_contents('php://input'), true);
$path = $input['path'] ?? '';
$content = $input['content'] ?? null;
$is_dir = intval($input['is_dir'] ?? 0);

if (empty($path)) {
    send_json(['error' => 'パスを指定してください。'], 400);
}

$db = get_db_connection();
try {
    $stmt = $db->prepare("REPLACE INTO vfs_files (path, content, is_dir) VALUES (:path, :content, :is_dir)");
    $stmt->execute([
        ':path' => $path,
        ':content' => $content,
        ':is_dir' => $is_dir
    ]);
    send_json(['success' => true]);
} catch (PDOException $e) {
    send_json(['error' => $e->getMessage()], 500);
}

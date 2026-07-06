<?php
require_once __DIR__ . '/db.php';
check_auth();

$input = json_decode(file_get_contents('php://input'), true);
$path = $input['path'] ?? '';
$recursive = intval($input['recursive'] ?? 0);

if (empty($path)) {
    send_json(['error' => 'パスを指定してください。'], 400);
}

$db = get_db_connection();
try {
    if ($recursive) {
        $stmt = $db->prepare("DELETE FROM vfs_files WHERE path = :path OR path LIKE :like_path");
        $stmt->execute([
            ':path' => $path,
            ':like_path' => $path . '/%'
        ]);
    } else {
        $stmt = $db->prepare("DELETE FROM vfs_files WHERE path = :path");
        $stmt->execute([':path' => $path]);
    }
    send_json(['success' => true]);
} catch (PDOException $e) {
    send_json(['error' => $e->getMessage()], 500);
}

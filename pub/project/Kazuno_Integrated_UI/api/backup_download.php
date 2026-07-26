<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/backup_lib.php';
check_auth();

$filename = $_GET['file'] ?? '';
$path = backup_find_file($filename);
if (!$path) {
    send_json(['error' => '指定されたバックアップが見つかりません'], 404);
}

header('Content-Type: application/json; charset=utf-8');
header('Content-Disposition: attachment; filename="' . basename($path) . '"');
header('Content-Length: ' . filesize($path));
readfile($path);
exit;


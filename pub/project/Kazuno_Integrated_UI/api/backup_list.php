<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/backup_lib.php';
check_auth();

try {
    send_json(['backups' => backup_list_files()]);
} catch (Throwable $e) {
    send_json(['error' => $e->getMessage()], 500);
}


<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/backup_lib.php';
check_auth();

try {
    $db = get_db_connection();
    $state = backup_collect_state($db);
    $current_hash = backup_state_hash($state);
    $current = [
        'data_hash' => $current_hash,
        'counts' => backup_state_counts($state),
        'latest_data_timestamp' => backup_state_latest($state)
    ];
    $backups = backup_list_files();
    $latest = $backups[0] ?? null;
    send_json([
        'current' => $current,
        'latest_backup' => $latest,
        'matches_latest' => $latest ? hash_equals($latest['data_hash'], $current_hash) : false
    ]);
} catch (Throwable $e) {
    send_json(['error' => $e->getMessage()], 500);
}


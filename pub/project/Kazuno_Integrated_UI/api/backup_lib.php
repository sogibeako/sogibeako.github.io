<?php

function backup_dir_path() {
    return __DIR__ . '/backups';
}

function backup_ensure_dir() {
    $dir = backup_dir_path();
    if (!is_dir($dir)) {
        if (!mkdir($dir, 0755, true) && !is_dir($dir)) {
            throw new RuntimeException('バックアップディレクトリを作成できません');
        }
    }
    $htaccess = $dir . '/.htaccess';
    if (!is_file($htaccess)) {
        file_put_contents($htaccess, "Require all denied\nDeny from all\n", LOCK_EX);
    }
    $index = $dir . '/index.html';
    if (!is_file($index)) {
        file_put_contents($index, "", LOCK_EX);
    }
    return $dir;
}

function backup_fetch_all($db, $sql) {
    $stmt = $db->query($sql);
    return $stmt->fetchAll();
}

function backup_collect_state($db) {
    return [
        'schema' => 'kazuno-backup-v1',
        'tables' => [
            'todos' => backup_fetch_all($db, "SELECT * FROM todos ORDER BY id ASC"),
            'events' => backup_fetch_all($db, "SELECT * FROM events ORDER BY event_date ASC, start_time ASC, id ASC"),
            'done_items' => backup_fetch_all($db, "SELECT * FROM done_items ORDER BY done_date ASC, id ASC")
        ]
    ];
}

function backup_state_hash($state) {
    return hash('sha256', json_encode($state, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
}

function backup_state_counts($state) {
    return [
        'todos' => count($state['tables']['todos'] ?? []),
        'events' => count($state['tables']['events'] ?? []),
        'done_items' => count($state['tables']['done_items'] ?? [])
    ];
}

function backup_latest_timestamp($rows, $date_keys) {
    $latest = null;
    foreach ($rows as $row) {
        foreach ($date_keys as $key) {
            if (!empty($row[$key]) && ($latest === null || strcmp($row[$key], $latest) > 0)) {
                $latest = $row[$key];
            }
        }
    }
    return $latest;
}

function backup_state_latest($state) {
    $candidates = [
        backup_latest_timestamp($state['tables']['todos'] ?? [], ['updated_at', 'created_at']),
        backup_latest_timestamp($state['tables']['events'] ?? [], ['updated_at', 'created_at']),
        backup_latest_timestamp($state['tables']['done_items'] ?? [], ['created_at'])
    ];
    $latest = null;
    foreach ($candidates as $candidate) {
        if ($candidate !== null && ($latest === null || strcmp($candidate, $latest) > 0)) {
            $latest = $candidate;
        }
    }
    return $latest;
}

function backup_safe_reason($reason) {
    $clean = preg_replace('/[^a-zA-Z0-9._-]+/', '_', strval($reason));
    $clean = trim($clean, '_');
    return $clean !== '' ? substr($clean, 0, 48) : 'manual';
}

function backup_create_snapshot($db, $reason = 'manual') {
    $dir = backup_ensure_dir();
    $state = backup_collect_state($db);
    $hash = backup_state_hash($state);
    $created_at = gmdate('Y-m-d\TH-i-s\Z');
    $safe_reason = backup_safe_reason($reason);
    $filename = "{$created_at}_{$safe_reason}_{$hash}.json";
    $path = $dir . '/' . $filename;
    $payload = [
        'meta' => [
            'created_at' => gmdate('c'),
            'reason' => $reason,
            'data_hash' => $hash,
            'hash_algorithm' => 'sha256',
            'counts' => backup_state_counts($state),
            'latest_data_timestamp' => backup_state_latest($state)
        ],
        'data' => $state
    ];
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    if ($json === false || file_put_contents($path, $json, LOCK_EX) === false) {
        throw new RuntimeException('バックアップファイルを書き込めません');
    }
    backup_prune(80);
    return [
        'filename' => $filename,
        'created_at' => $payload['meta']['created_at'],
        'reason' => $reason,
        'data_hash' => $hash,
        'counts' => $payload['meta']['counts'],
        'latest_data_timestamp' => $payload['meta']['latest_data_timestamp'],
        'size' => filesize($path)
    ];
}

function backup_try_create_snapshot($db, $reason = 'manual') {
    try {
        return backup_create_snapshot($db, $reason);
    } catch (Throwable $e) {
        error_log('Kazuno backup failed: ' . $e->getMessage());
        return null;
    }
}

function backup_prune($keep) {
    $files = backup_list_files();
    if (count($files) <= $keep) return;
    $old = array_slice($files, $keep);
    foreach ($old as $file) {
        $path = backup_dir_path() . '/' . $file['filename'];
        if (is_file($path)) {
            unlink($path);
        }
    }
}

function backup_list_files() {
    $dir = backup_ensure_dir();
    $paths = glob($dir . '/*.json') ?: [];
    $items = [];
    foreach ($paths as $path) {
        $filename = basename($path);
        if (!preg_match('/^[0-9T\-Z]+_[a-zA-Z0-9._-]+_[a-f0-9]{64}\.json$/', $filename)) {
            continue;
        }
        $meta = backup_read_meta($path);
        $items[] = [
            'filename' => $filename,
            'created_at' => $meta['created_at'] ?? date('c', filemtime($path)),
            'reason' => $meta['reason'] ?? '',
            'data_hash' => $meta['data_hash'] ?? '',
            'counts' => $meta['counts'] ?? null,
            'latest_data_timestamp' => $meta['latest_data_timestamp'] ?? null,
            'size' => filesize($path)
        ];
    }
    usort($items, function ($a, $b) {
        return strcmp($b['filename'], $a['filename']);
    });
    return $items;
}

function backup_read_meta($path) {
    $json = json_decode(file_get_contents($path), true);
    return is_array($json) ? ($json['meta'] ?? []) : [];
}

function backup_find_file($filename) {
    if (!preg_match('/^[a-zA-Z0-9._-]+\.json$/', $filename)) {
        return null;
    }
    $path = backup_dir_path() . '/' . $filename;
    return is_file($path) ? $path : null;
}

<?php
require_once __DIR__ . '/db.php';
check_auth();

$input = json_decode(file_get_contents('php://input'), true);
$url = trim($input['url'] ?? '');
$order = strtolower(trim($input['order'] ?? 'old'));

if ($url === '') {
    send_json(['error' => 'url is required'], 400);
}

if (!preg_match('/^https?:\/\/([^\/]+\.)?(nicovideo\.jp|nico\.ms)\//i', $url)) {
    send_json(['error' => 'Niconico playlist URL is required'], 400);
}

$type = null;
$id = null;

if (preg_match('/\/series\/(\d+)/i', $url, $m)) {
    $type = 'series';
    $id = $m[1];
} elseif (preg_match('/\/mylist\/(\d+)/i', $url, $m)) {
    $type = 'mylist';
    $id = $m[1];
} elseif (preg_match('/\/user\/\d+\/mylist\/(\d+)/i', $url, $m)) {
    $type = 'mylist';
    $id = $m[1];
}

if (!$type || !$id) {
    send_json(['error' => 'series or mylist URL is required'], 400);
}

function nico_http_get($url) {
    $headers = [
        'User-Agent: KazunoIntegratedUI/1.0',
        'Accept: application/json,text/html;q=0.9,*/*;q=0.8',
        'X-Frontend-Id: 6',
        'X-Frontend-Version: 0',
        'Referer: https://www.nicovideo.jp/'
    ];

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT => 12,
            CURLOPT_CONNECTTIMEOUT => 6,
            CURLOPT_HTTPHEADER => $headers
        ]);
        $body = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($body !== false && $status >= 200 && $status < 300) {
            return $body;
        }
        return null;
    }

    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'timeout' => 12,
            'header' => implode("\r\n", $headers)
        ]
    ]);
    $body = @file_get_contents($url, false, $context);
    return $body === false ? null : $body;
}

function nico_find_first_string($value, $keys) {
    if (!is_array($value)) return null;
    foreach ($keys as $key) {
        if (isset($value[$key]) && is_string($value[$key]) && $value[$key] !== '') {
            return $value[$key];
        }
    }
    foreach ($value as $child) {
        if (is_array($child)) {
            $found = nico_find_first_string($child, $keys);
            if ($found !== null) return $found;
        }
    }
    return null;
}

function nico_collect_video_items($value, &$items, &$seen) {
    if (!is_array($value)) return;

    $watchId = nico_find_first_string($value, ['watchId', 'watch_id', 'contentId', 'content_id', 'id']);
    if (is_string($watchId) && preg_match('/^(sm|nm|so)\d+$/i', $watchId)) {
        $watchId = strtolower($watchId);
        if (!isset($seen[$watchId])) {
            $seen[$watchId] = true;
            $items[] = [
                'id' => $watchId,
                'title' => nico_find_first_string($value, ['title', 'name']) ?? $watchId,
                'registered_at' => nico_find_first_string($value, ['registeredAt', 'registered_at', 'createdAt', 'created_at', 'publishedAt', 'published_at'])
            ];
        }
    }

    foreach ($value as $child) {
        if (is_array($child)) {
            nico_collect_video_items($child, $items, $seen);
        }
    }
}

function nico_items_from_json($body) {
    $json = json_decode($body, true);
    if (!is_array($json)) return [];
    $items = [];
    $seen = [];
    nico_collect_video_items($json, $items, $seen);
    return $items;
}

function nico_items_from_html($body) {
    $items = [];
    $seen = [];
    if (preg_match_all('/(?:\/watch\/|watchId["\']?\s*[:=]\s*["\']|data-watch[_-]id=["\'])((?:sm|nm|so)\d+)/i', $body, $matches)) {
        foreach ($matches[1] as $watchId) {
            $watchId = strtolower($watchId);
            if (isset($seen[$watchId])) continue;
            $seen[$watchId] = true;
            $items[] = [
                'id' => $watchId,
                'title' => $watchId,
                'registered_at' => null
            ];
        }
    }
    return $items;
}

$apiUrl = $type === 'series'
    ? "https://nvapi.nicovideo.jp/v2/series/{$id}?pageSize=500&page=1"
    : "https://nvapi.nicovideo.jp/v2/mylists/{$id}?pageSize=500&page=1";

$body = nico_http_get($apiUrl);
$items = $body ? nico_items_from_json($body) : [];
$source = 'nvapi';

if (count($items) === 0) {
    $fallbackUrl = $type === 'series'
        ? "https://www.nicovideo.jp/series/{$id}"
        : "https://www.nicovideo.jp/mylist/{$id}";
    $html = nico_http_get($fallbackUrl);
    $items = $html ? nico_items_from_html($html) : [];
    $source = 'html';
}

if ($order === 'old' || $order === 'asc') {
    usort($items, function ($a, $b) {
        $aTime = !empty($a['registered_at']) ? strtotime($a['registered_at']) : false;
        $bTime = !empty($b['registered_at']) ? strtotime($b['registered_at']) : false;
        if ($aTime !== false && $bTime !== false && $aTime !== $bTime) {
            return $aTime <=> $bTime;
        }
        $aNum = intval(preg_replace('/\D+/', '', $a['id']));
        $bNum = intval(preg_replace('/\D+/', '', $b['id']));
        return $aNum <=> $bNum;
    });
}

send_json([
    'type' => $type,
    'id' => $id,
    'source' => $source,
    'order' => $order,
    'count' => count($items),
    'items' => $items
]);

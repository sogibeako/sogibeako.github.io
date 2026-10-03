<?php
require_once __DIR__ . '/db.php';
check_auth();

$db = get_db_connection();
try {
    $stmt = $db->query("SELECT * FROM settings");
    $settings_list = $stmt->fetchAll();
    
    $settings = [];
    foreach ($settings_list as $row) {
        $settings[$row['setting_key']] = $row['setting_value'];
    }
    
    send_json($settings);
} catch (PDOException $e) {
    send_json(['error' => $e->getMessage()], 500);
}

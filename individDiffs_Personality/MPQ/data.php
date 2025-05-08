<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

include('../../php_include/dbcreds_IndDiffsPers.php');

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Get the POST data
    $data = json_decode(file_get_contents('php://input'), true);

    // Get table columns
    $stmt = $conn->prepare("SHOW COLUMNS FROM `MPQ`");
    $stmt->execute();
    $col_names = array();
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $col_names[] = $row['Field'];
    }

    // Filter data - only keep keys that match column names and aren't numeric
    $filtered_data = array_filter(
        $data,
        function($key) use ($col_names) {
            return !is_numeric($key) && in_array($key, $col_names);
        },
        ARRAY_FILTER_USE_KEY
    );

    // Prepare INSERT statement
    $columns = array_keys($filtered_data);
    $placeholders = array_map(function($col) { return ":$col"; }, $columns);

    $sql = "INSERT INTO `MPQ` (`" . implode("`, `", $columns) . "`)
            VALUES (" . implode(", ", $placeholders) . ")";

    $stmt = $conn->prepare($sql);

    // Bind values
    foreach ($filtered_data as $key => $value) {
        if (is_array($value)) {
            $stmt->bindValue(":$key", json_encode($value), PDO::PARAM_STR);
        } else {
            $stmt->bindValue(":$key", $value);
        }
    }

    // Execute
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Insert failed']);
    }

} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
} catch (Exception $e) {
    error_log("General error: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
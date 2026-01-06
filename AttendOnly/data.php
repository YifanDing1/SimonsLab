<?php
include('../php_include/dbcreds.php'); // Database connection file

// Decoding the JSON data into an associative array
$data_array = json_decode(file_get_contents('php://input'), true);

// Log received data for debugging
error_log("Received data: " . print_r($data_array, true));

try {
    $conn = new PDO("mysql:host=$servername;port=$port;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Get all column names from the table and store them in an array
    $stmt = $conn->prepare("SHOW COLUMNS FROM `IB_AttendOnly`");
    $stmt->execute();
    $col_names = array();
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $col_names[] = $row['Field'];
    }

    // Prepare INSERT statement with column names and values
    $columns = [];
    $values = [];
    $placeholders = [];

    foreach ($data_array as $key => $value) {
        if (in_array($key, $col_names)) {
            $columns[] = $key;
            $values[] = $value;
            $placeholders[] = ":$key";
        }
    }

    $sql = "INSERT INTO `IB_AttendOnly` (" . implode(", ", $columns) . ")
            VALUES (" . implode(", ", $placeholders) . ")";

    // Log the SQL query for debugging
    error_log("SQL Query: " . $sql);

    $stmt = $conn->prepare($sql);

    // Binding values with appropriate type handling
    foreach ($columns as $index => $column) {
        // Special handling for subject_code
        if ($column === 'subject_code') {
            error_log("Binding subject_code: " . $values[$index]);
            $stmt->bindValue(":{$column}", $values[$index], PDO::PARAM_STR);
        }
        // Special handling for numeric values
        else if (is_numeric($values[$index]) && !is_array($values[$index])) {
            $stmt->bindValue(":{$column}", $values[$index], PDO::PARAM_INT);
        }
        // JSON encode arrays and objects
        else if (is_array($values[$index]) || is_object($values[$index])) {
            $stmt->bindValue(":{$column}", json_encode($values[$index]));
        }
        // Regular string values
        else {
            $stmt->bindValue(":{$column}", $values[$index], PDO::PARAM_STR);
        }
    }

    // Execute the statement
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        echo '{"success": true, "message": "Data inserted successfully"}';
    } else {
        echo '{"success": false, "message": "No data was inserted"}';
    }
} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    echo '{"success": false, "message": "Database error: ' . $e->getMessage() . '"}';
} catch (Exception $e) {
    error_log("General error: " . $e->getMessage());
    echo '{"success": false, "message": "General error: ' . $e->getMessage() . '"}';
}

// Closing the connection
$conn = null;
?>
<?php
include('../../php_include/dbcreds_IndDiffsPers.php'); // Database connection file

// Decoding the JSON data into an associative array
$data_array = json_decode(file_get_contents('php://input'), true);

// Log received data for debugging
error_log("Received data: " . print_r($data_array, true));

try {
    $conn = new PDO("mysql:host=$servername;port=$port;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Begin transaction
    $conn->beginTransaction();

    // First, update end_time in metaDataPers if subject_code and end_time exist
    if (isset($data_array['subject_code']) && isset($data_array['end_time'])){
        $update_sql = "UPDATE metaDataPers SET end_time = :end_time WHERE subject_code = :subject_code";
        $update_stmt = $conn->prepare($update_sql);
        $update_stmt->bindValue(':end_time', $data_array['end_time'], PDO::PARAM_STR);
        $update_stmt->bindValue(':subject_code', $data_array['subject_code'], PDO::PARAM_STR);
        $update_stmt->execute();

        error_log("Updated end_time for subject_code: " . $data_array['subject_code']);
    }

    // Get all column names from the demographicsPers table
    $stmt = $conn->prepare("SHOW COLUMNS FROM `demographicsPers`");
    $stmt->execute();
    $col_names = array();
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $col_names[] = $row['Field'];
    }

    // Prepare INSERT statement for demographicsPers
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

    $sql = "INSERT INTO `demographicsPers` (" . implode(", ", $columns) . ")
            VALUES (" . implode(", ", $placeholders) . ")";

    // Log the SQL query for debugging
    error_log("SQL Query for demographicsPers: " . $sql);

    $stmt = $conn->prepare($sql);

    // Binding values with appropriate type handling
    foreach ($columns as $index => $column) {
        if ($column === 'subject_code') {
            error_log("Binding subject_code: " . $values[$index]);
            $stmt->bindValue(":{$column}", $values[$index], PDO::PARAM_STR);
        }
        else if (is_numeric($values[$index]) && !is_array($values[$index])) {
            $stmt->bindValue(":{$column}", $values[$index], PDO::PARAM_INT);
        }
        else if (is_array($values[$index]) || is_object($values[$index])) {
            $stmt->bindValue(":{$column}", json_encode($values[$index]));
        }
        else {
            $stmt->bindValue(":{$column}", $values[$index], PDO::PARAM_STR);
        }
    }

    // Execute the statement
    $stmt->execute();

    // Commit the transaction
    $conn->commit();

    if ($stmt->rowCount() > 0) {
        echo '{"success": true, "message": "Data inserted and updated successfully"}';
    } else {
        echo '{"success": false, "message": "No data was inserted"}';
    }
} catch (PDOException $e) {
    // Rollback the transaction on error
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    error_log("Database error: " . $e->getMessage());
    echo '{"success": false, "message": "Database error: ' . $e->getMessage() . '"}';
} catch (Exception $e) {
    // Rollback the transaction on error
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    error_log("General error: " . $e->getMessage());
    echo '{"success": false, "message": "General error: ' . $e->getMessage() . '"}';
}

// Closing the connection
$conn = null;
?>
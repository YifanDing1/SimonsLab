<?php
include('../php_include/dbcreds.php'); // Database connection file

// Decoding the JSON data into an associative array
$data_array = json_decode(file_get_contents('php://input'), true);

try {
    $conn = new PDO("mysql:host=$servername;port=$port;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Get all column names from the table and store them in an array
    $stmt = $conn->prepare("SHOW COLUMNS FROM `IB_loadSearch_ST4`");
    $stmt->execute();
    $col_names = array();
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $col_names[] = $row['Field'];
    }

    // Prepare the SQL statement for inserting data into corresponding columns
    $sql = "INSERT INTO `IB_loadSearch_ST4` (";
    $placeholders = "";
    foreach ($col_names as $col_name) {
        if (isset($data_array[$col_name])) {
            $sql .= "$col_name, ";
            $placeholders .= ":$col_name, ";
        }
    }
    $sql = rtrim($sql, ', ');
    $placeholders = rtrim($placeholders, ', ');
    $sql .= ") VALUES (" . $placeholders . ")";

    $stmt = $conn->prepare($sql);

    // Binding values from $data_array to the prepared statement
    foreach ($col_names as $col_name) {
        if (isset($data_array[$col_name])) {
            $value = $data_array[$col_name];
            if ($col_name === 'subject_code') {
                $value = (int)$value; // Cast subject_code value to an integer
            } else {
                $value = json_encode($value);
            }
            $stmt->bindValue(":$col_name", $value);
        }
    }

    // Execute the statement
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        echo '{"success": true}';
    } else {
        echo '{"success": false, "message": "No rows inserted"}';
    }
} catch (PDOException $e) {
    echo '{"success": false, "message": "' . $e->getMessage() . '"}';
} catch (Exception $e) {
    echo '{"success": false, "message": "' . $e->getMessage() . '"}';
}

// Closing the connection
$conn = null;
?>
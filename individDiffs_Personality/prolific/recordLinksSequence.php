<?php
include('../../php_include/dbcreds_IndDiffsPers.php');

// Get the POST data
$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['taskSequence']) || !isset($data['subject_code'])) {
    error_log("Invalid data received in recordLinksSequence.php");
    exit("Invalid data received");
}

$task_sequence = json_encode($data['taskSequence']);
$subject_code = $data['subject_code'];

try {
    $conn = new PDO("mysql:host=$servername;port=$port;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // First verify the subject_code exists in metaDataPers
    $check_sql = "SELECT subject_code FROM metaDataPers WHERE subject_code = :subject_code";
    $check_stmt = $conn->prepare($check_sql);
    $check_stmt->bindParam(':subject_code', $subject_code, PDO::PARAM_STR);
    $check_stmt->execute();

    if ($check_stmt->rowCount() === 0) {
        // If no record exists, create one
        $insert_sql = "INSERT INTO metaDataPers (subject_code, taskSequence) VALUES (:subject_code, :taskSequence)";
        $insert_stmt = $conn->prepare($insert_sql);
        $insert_stmt->bindParam(':subject_code', $subject_code, PDO::PARAM_STR);
        $insert_stmt->bindParam(':taskSequence', $task_sequence, PDO::PARAM_STR);
        $insert_stmt->execute();
        echo "New record created successfully";
    } else {
        // If record exists, update it
        $update_sql = "UPDATE metaDataPers SET taskSequence = :taskSequence WHERE subject_code = :subject_code";
        $update_stmt = $conn->prepare($update_sql);
        $update_stmt->bindParam(':taskSequence', $task_sequence, PDO::PARAM_STR);
        $update_stmt->bindParam(':subject_code', $subject_code, PDO::PARAM_STR);
        $update_stmt->execute();
        echo "Record updated successfully";
    }

} catch (PDOException $e) {
    error_log("Database error in recordLinksSequence.php: " . $e->getMessage());
    echo "Error: " . $e->getMessage();
}
?>
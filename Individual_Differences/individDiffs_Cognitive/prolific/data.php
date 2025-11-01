<?php
include('../../php_include/dbcreds_IndDiffsCog.php');

try {
    $conn = new PDO("mysql:host=$servername;port=$port;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (\PDOException $e) {
    error_log("Connection failed: " . $e->getMessage());
    exit("Connection failed");
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $inputJSON = file_get_contents('php://input');
    $input = json_decode($inputJSON, TRUE);

    if ($input) {
        try {
            if (!isset($input['subject_id']) || !isset($input['subject_code'])) {
                throw new Exception("Missing required fields");
            }

            $prolific_id = $input['subject_id'];
            $study_id = $input['study_id'];
            $session_id = $input['session_id'];
            $subject_code = $input['subject_code'];
            $start_time = $input['start'];
            $browser = $input['browser'];

            // Check for duplicate Prolific ID
            $stmt = $conn->prepare("SELECT prolific_id FROM ProlificIDs WHERE prolific_id = ?");
            $stmt->execute([$prolific_id]);

            if ($stmt->fetchColumn() !== false) {
                echo "Duplicate Prolific ID";
                exit;
            }

            // Begin transaction
            $conn->beginTransaction();

            // Insert into ProlificIDs table
            $stmt = $conn->prepare("INSERT INTO ProlificIDs (prolific_id, subject_code, study_id, session_id) VALUES (?, ?, ?, ?)");
            $stmt->execute([$prolific_id, $subject_code, $study_id, $session_id]);

            // Insert into metaDataCog table
            $stmt = $conn->prepare("INSERT INTO metaDataCog (subject_code, start_time, browser) VALUES (?, ?, ?)");
            $stmt->execute([$subject_code, $start_time, $browser]);

            // Commit transaction
            $conn->commit();

            echo "Success";

        } catch (Exception $e) {
            // Rollback transaction on error
            if ($conn->inTransaction()) {
                $conn->rollBack();
            }
            error_log("Error in data.php: " . $e->getMessage());
            echo "Error: " . $e->getMessage();
        }
    } else {
        error_log("No data received in data.php");
        echo "No data received";
    }
}
?>
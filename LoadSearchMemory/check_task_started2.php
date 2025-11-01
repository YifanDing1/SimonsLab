<?php
include('../php_include/dbcreds.php'); // Database connection file

// Retrieve the subject_code from the URL parameter
$subjectCode = isset($_GET['subject_code']) ? $_GET['subject_code'] : '';

// Validate the subject_code
if (empty($subjectCode)) {
    // Subject code is missing
    http_response_code(400); // Set the status code to 400 (Bad Request)
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Subject code is required']);
    exit;
}

// Create a new PDO instance
$dsn = "mysql:host=$servername;port=$port;dbname=$dbname";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    $conn = new PDO($dsn, $username, $password, $options);
} catch (PDOException $e) {
    // Database connection error
    http_response_code(500); // Set the status code to 500 (Internal Server Error)
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

try {
    // Prepare the SQL statement to retrieve the taskStarted value for the subject
    $stmt = $conn->prepare("SELECT taskStarted FROM `ProlificIDs` WHERE subject_code = ?");
    $stmt->execute([$subjectCode]);
    $result = $stmt->fetch();

    if ($result) {
        $taskStarted = $result['taskStarted'];

        if ($taskStarted !== 1) {
            // Update the taskStarted value to 1 in the database
            $updateStmt = $conn->prepare("UPDATE `ProlificIDs` SET taskStarted = 1 WHERE subject_code = ?");
            $updateStmt->execute([$subjectCode]);

            // Send a response indicating that the subject can proceed
            header('Content-Type: application/json');
            echo json_encode(['taskStarted' => 0]);
        } else {
            // Send a response indicating that the subject should be redirected
            header('Content-Type: application/json');
            echo json_encode(['taskStarted' => 1]);
        }
    } else {
        // Subject not found in the database
        http_response_code(404); // Set the status code to 404 (Not Found)
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Subject not found']);
    }
} catch (PDOException $e) {
    // Database query error
    http_response_code(500); // Set the status code to 500 (Internal Server Error)
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Database query failed: ' . $e->getMessage()]);
}

// Close the database connection
$conn = null;
?>
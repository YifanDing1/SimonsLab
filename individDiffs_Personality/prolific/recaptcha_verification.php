<?php
// Get the token from the AJAX request
$data = json_decode(file_get_contents('php://input'), true);
$recaptchaToken = $data['recaptcha_token'];

// Define your reCAPTCHA secret key
$recaptchaSecretKey = '6Lcg7SkrAAAAAJdwCaNgjs_1jHgyOwOceuutRuBR';  // secret key

// Make the POST request to Google
$url = 'https://www.google.com/recaptcha/api/siteverify';
$data = [
    'secret' => $recaptchaSecretKey,
    'response' => $recaptchaToken
];

$options = [
    'http' => [
        'header' => "Content-type: application/x-www-form-urlencoded\r\n",
        'method' => 'POST',
        'content' => http_build_query($data)
    ]
];

$context = stream_context_create($options);
$verify = file_get_contents($url, false, $context);
$captchaSuccess = json_decode($verify);

// Return the result to the client
header('Content-Type: application/json');

if ($captchaSuccess->success) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error-codes' => $captchaSuccess->{'error-codes'}]);
}
?>
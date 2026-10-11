<?php

require dirname(__DIR__, 2).'/vendor/autoload.php';

$testRoot = dirname(__DIR__, 2);
$testStorage = $testRoot.'/.audit/phpunit-storage';
foreach (['app/public', 'app/private', 'framework/cache/data', 'framework/views', 'framework/sessions', 'logs'] as $directory) {
    if (!is_dir($testStorage.'/'.$directory)) mkdir($testStorage.'/'.$directory, 0777, true);
}
$_ENV['LARAVEL_STORAGE_PATH'] = $_SERVER['LARAVEL_STORAGE_PATH'] = $testStorage;
putenv('LARAVEL_STORAGE_PATH='.$testStorage);
foreach (['WAWAY_API_KEY', 'FIREBASE_CREDENTIALS', 'GOOGLE_APPLICATION_CREDENTIALS'] as $setting) {
    $_ENV[$setting] = $_SERVER[$setting] = '';
    putenv($setting.'=');
}
try {
    $testPdo = new PDO('mysql:host=127.0.0.1;port=33179;dbname=silab_audit_tests', 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $testDataDirectory = $testPdo->query('SELECT @@datadir')->fetchColumn();
    if (rtrim(str_replace('\\', '/', $testDataDirectory), '/') !== str_replace('\\', '/', $testRoot.'/.audit/mysql/data')) {
        throw new RuntimeException('MySQL is not using the isolated audit data directory.');
    }
} catch (Throwable $error) {
    throw new RuntimeException('Tests refused to use an unverified database. Start the isolated audit MySQL instance on port 33179; see docs/full-application-audit.md.', previous: $error);
}

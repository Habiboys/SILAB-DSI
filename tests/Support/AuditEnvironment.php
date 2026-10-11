<?php

// Only used by the isolated audit runner, never by the production entry point.
$auditRoot = dirname(__DIR__, 2);
$auditStorage = $auditRoot.'/.audit/storage';
$auditDatabase = PHP_SAPI === 'cli' && getenv('SILAB_AUDIT_DATABASE') === 'silab_audit_tests' ? 'silab_audit_tests' : 'silab_audit_e2e';
foreach (['framework/sessions', 'framework/views', 'framework/cache/data', 'logs', 'app/public', 'app/private'] as $directory) {
    if (!is_dir($auditStorage.'/'.$directory)) mkdir($auditStorage.'/'.$directory, 0777, true);
}
$auditEnvironment = [
    'APP_ENV' => 'audit', 'APP_DEBUG' => 'false', 'APP_URL' => 'http://127.0.0.1:8129',
    'APP_KEY' => 'base64:'.base64_encode(hash('sha256', 'silab-isolated-audit-only', true)),
    'APP_CONFIG_CACHE' => $auditRoot.'/.audit/config.php',
    'APP_ROUTES_CACHE' => $auditRoot.'/.audit/routes.php',
    'LARAVEL_STORAGE_PATH' => $auditStorage,
    'DB_CONNECTION' => 'mysql', 'DB_URL' => '', 'DB_HOST' => '127.0.0.1',
    'DB_PORT' => '33179', 'DB_DATABASE' => $auditDatabase, 'DB_USERNAME' => 'root', 'DB_PASSWORD' => '', 'DB_SOCKET' => '',
    'SESSION_DRIVER' => 'file', 'SESSION_COOKIE' => 'silab_isolated_audit', 'SESSION_DOMAIN' => '', 'SESSION_SECURE_COOKIE' => 'false',
    'SESSION_LIFETIME' => '10080',
    'CACHE_STORE' => 'array', 'QUEUE_CONNECTION' => 'database', 'MAIL_MAILER' => 'array',
    'LOG_CHANNEL' => 'single', 'BROADCAST_CONNECTION' => 'log',
    'FACE_SERVICE_URL' => 'http://127.0.0.1:1', 'FACE_SERVICE_TOKEN' => '',
    'WAWAY_API_KEY' => '', 'MICROSOFT_CLIENT_ID' => '', 'MICROSOFT_CLIENT_SECRET' => '',
    'UNAND_CLIENT_ID' => '', 'UNAND_CLIENT_SECRET' => '',
];
foreach ($auditEnvironment as $name => $value) {
    putenv($name.'='.$value);
    $_ENV[$name] = $_SERVER[$name] = $value;
}
require_once $auditRoot.'/vendor/autoload.php';
$auditApp = require $auditRoot.'/bootstrap/app.php';
$auditApp->useStoragePath($auditStorage);
if (PHP_SAPI === 'cli-server') {
    $auditApp->instance('request', Illuminate\Http\Request::capture());
    $auditApp->make(Illuminate\Contracts\Http\Kernel::class)->bootstrap();
} else {
    $auditApp->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
}
$auditDataDirectory = Illuminate\Support\Facades\DB::selectOne('SELECT @@datadir AS directory')->directory;
$expectedAuditDirectory = str_replace('\\', '/', $auditRoot.'/.audit/mysql/data');
if (rtrim(str_replace('\\', '/', $auditDataDirectory), '/') !== $expectedAuditDirectory) {
    throw new RuntimeException('Audit refused: MySQL data directory is not the isolated workspace directory.');
}
if (PHP_SAPI === 'cli-server' && ($_SERVER['HTTP_X_SILAB_AUDIT_WEEKDAY'] ?? '') === 'monday') {
    $auditMonday = Illuminate\Support\Carbon::now()->startOfWeek()->setTime(10, 0);
    Illuminate\Support\Carbon::setTestNow($auditMonday);
    Carbon\Carbon::setTestNow($auditMonday);
    Carbon\CarbonImmutable::setTestNow($auditMonday);
}
return $auditApp;

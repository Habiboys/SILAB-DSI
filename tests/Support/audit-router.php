<?php

if (PHP_SAPI !== 'cli-server' || !str_starts_with($_SERVER['HTTP_HOST'] ?? '', '127.0.0.1:8129')) {
    http_response_code(403);
    exit;
}
$auditPublic = dirname(__DIR__, 2).'/public';
$auditPath = rawurldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
$auditFile = realpath($auditPublic.$auditPath);
if ($auditFile && str_starts_with(str_replace('\\', '/', $auditFile), str_replace('\\', '/', $auditPublic).'/')
    && is_file($auditFile) && !str_contains($auditPath, '..') && preg_match('/\.(js|css|png|jpg|jpeg|svg|ico|woff2?|ttf)$/i', $auditFile)) {
    return false;
}
define('LARAVEL_START', microtime(true));
$auditApp = require __DIR__.'/AuditEnvironment.php';
$auditApp->handleRequest(Illuminate\Http\Request::capture());

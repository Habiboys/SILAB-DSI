<?php

$root = dirname(__DIR__, 2);
$count = 0;
$errors = [];
foreach (['app', 'database', 'routes', 'tests'] as $scope) {
    $files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root.'/'.$scope, FilesystemIterator::SKIP_DOTS));
    foreach ($files as $file) {
        if ($file->getExtension() !== 'php') continue;
        try {
            token_get_all(file_get_contents($file->getPathname()), TOKEN_PARSE);
        } catch (ParseError $error) {
            $errors[] = ['path' => $file->getPathname(), 'error' => $error->getMessage()];
        }
        $count++;
    }
}
$report = ['files_checked' => $count, 'errors' => $errors];
file_put_contents($root.'/.audit/syntax-results.json', json_encode($report, JSON_PRETTY_PRINT));
echo json_encode($report, JSON_PRETTY_PRINT)."\n";
exit($errors ? 1 : 0);

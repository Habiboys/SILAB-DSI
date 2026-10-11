<?php

require __DIR__.'/AuditEnvironment.php';
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

$columns = DB::select('SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ?', ['silab_audit_e2e']);
$tables = [];
foreach ($columns as $column) $tables[$column->TABLE_NAME][$column->COLUMN_NAME] = true;
$findings = [];
$checked = 0;
$files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator(dirname(__DIR__, 2).'/app/Models', FilesystemIterator::SKIP_DOTS));
foreach ($files as $file) {
    if ($file->getExtension() !== 'php') continue;
    $relative = substr($file->getPathname(), strlen(dirname(__DIR__, 2).'/app/Models') + 1, -4);
    $class = 'App\\Models\\'.str_replace(['/', '\\'], '\\', $relative);
    if (!class_exists($class) || !is_subclass_of($class, Model::class) || (new ReflectionClass($class))->isAbstract()) continue;
    $model = new $class;
    $checked++;
    $table = $model->getTable();
    if (!isset($tables[$table])) {
        $findings[] = ['model' => $class, 'table' => $table, 'issue' => 'missing_table'];
        continue;
    }
    foreach ($model->getFillable() as $field) {
        if (!isset($tables[$table][$field]) && !str_contains($field, '->')) $findings[] = ['model' => $class, 'table' => $table, 'field' => $field, 'issue' => 'fillable_without_column'];
    }
}
$report = ['models_checked' => $checked, 'findings' => $findings];
file_put_contents(dirname(__DIR__, 2).'/.audit/schema-findings.json', json_encode($report, JSON_PRETTY_PRINT));
echo json_encode($report, JSON_PRETTY_PRINT)."\n";

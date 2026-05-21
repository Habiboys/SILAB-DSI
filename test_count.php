<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$praktikums = \App\Models\Praktikum::withCount('praktikans')->get();
foreach($praktikums as $p) {
    $cnt = \App\Models\PraktikanPraktikum::where('praktikum_id', $p->id)->count();
    echo $p->mata_kuliah . ' | withCount: ' . $p->praktikans_count . ' | manual: ' . $cnt . "\n";
}

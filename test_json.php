<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$kepengurusanlab = \App\Models\KepengurusanLab::first();
$praktikumData = \App\Models\Praktikum::where('kepengurusan_lab_id', $kepengurusanlab->id)
                ->with([
                    'jadwalPraktikum',
                    'parentKelas.subKelas',
                    'mataKuliah',
                ])
                ->withCount('praktikans')
                ->get();
echo json_encode($praktikumData[0]->toArray(), JSON_PRETTY_PRINT);

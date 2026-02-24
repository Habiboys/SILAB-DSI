<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->boot();
foreach (\Illuminate\Support\Facades\DB::table('struktur')->select('struktur','jabatan_tunggal')->get() as $r) {
    echo $r->struktur . ' | tunggal=' . $r->jabatan_tunggal . "\n";
}

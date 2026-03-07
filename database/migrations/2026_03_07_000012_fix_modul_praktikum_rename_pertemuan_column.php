<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Rename kolom 'pertemuan' (nomor integer) → 'nomor_pertemuan'
        // untuk menghindari konflik dengan relationship method pertemuan()
        if (Schema::hasColumn('modul_praktikum', 'pertemuan') &&
            !Schema::hasColumn('modul_praktikum', 'nomor_pertemuan')) {
            Schema::table('modul_praktikum', function (Blueprint $table) {
                $table->renameColumn('pertemuan', 'nomor_pertemuan');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('modul_praktikum', 'nomor_pertemuan') &&
            !Schema::hasColumn('modul_praktikum', 'pertemuan')) {
            Schema::table('modul_praktikum', function (Blueprint $table) {
                $table->renameColumn('nomor_pertemuan', 'pertemuan');
            });
        }
    }
};

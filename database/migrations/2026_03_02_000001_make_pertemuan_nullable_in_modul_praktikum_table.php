<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('modul_praktikum', function (Blueprint $table) {
            if (Schema::hasColumn('modul_praktikum', 'pertemuan')) {
                $table->string('pertemuan')->nullable()->default(null)->change();
            }
        });
    }

    public function down(): void
    {
        Schema::table('modul_praktikum', function (Blueprint $table) {
            if (Schema::hasColumn('modul_praktikum', 'pertemuan')) {
                $table->string('pertemuan')->nullable(false)->change();
            }
        });
    }
};

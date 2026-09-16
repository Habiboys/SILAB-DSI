<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('modul_praktikum', function (Blueprint $table) {
            $table->text('deskripsi')->nullable()->after('judul');
            $table->unsignedInteger('jumlah_halaman')->nullable()->after('deskripsi');
        });
    }

    public function down(): void
    {
        Schema::table('modul_praktikum', function (Blueprint $table) {
            $table->dropColumn(['deskripsi', 'jumlah_halaman']);
        });
    }
};

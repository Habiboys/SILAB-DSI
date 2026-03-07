<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Fix pertemuan_praktikum: drop praktikum_id, make kelas_id NOT NULL
        Schema::table('pertemuan_praktikum', function (Blueprint $table) {
            if (Schema::hasColumn('pertemuan_praktikum', 'praktikum_id')) {
                // Drop FK if exists
                try {
                    $table->dropForeign(['praktikum_id']);
                } catch (\Exception $e) {}
                $table->dropColumn('praktikum_id');
            }

            // Make kelas_id NOT NULL (must already exist)
            if (Schema::hasColumn('pertemuan_praktikum', 'kelas_id')) {
                $table->uuid('kelas_id')->nullable(false)->change();
            }
        });

        // Fix modul_praktikum: drop praktikum_id column
        Schema::table('modul_praktikum', function (Blueprint $table) {
            if (Schema::hasColumn('modul_praktikum', 'praktikum_id')) {
                try {
                    $table->dropForeign(['praktikum_id']);
                } catch (\Exception $e) {}
                $table->dropColumn('praktikum_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('pertemuan_praktikum', function (Blueprint $table) {
            $table->uuid('praktikum_id')->nullable()->after('id');
            $table->foreign('praktikum_id')->references('id')->on('praktikum')->onDelete('cascade');
            $table->uuid('kelas_id')->nullable()->change();
        });

        Schema::table('modul_praktikum', function (Blueprint $table) {
            $table->uuid('praktikum_id')->nullable()->after('id');
            $table->foreign('praktikum_id')->references('id')->on('praktikum')->onDelete('cascade');
        });
    }
};

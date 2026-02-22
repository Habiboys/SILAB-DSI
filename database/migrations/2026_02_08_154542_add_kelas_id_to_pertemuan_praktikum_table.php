<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('pertemuan_praktikum', function (Blueprint $table) {
            if (!Schema::hasColumn('pertemuan_praktikum', 'kelas_id')) {
                $table->uuid('kelas_id')->after('praktikum_id')->nullable();
                $table->foreign('kelas_id')->references('id')->on('kelas')->onDelete('cascade');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pertemuan_praktikum', function (Blueprint $table) {
            if (Schema::hasColumn('pertemuan_praktikum', 'kelas_id')) {
                $table->dropForeign(['kelas_id']);
                $table->dropColumn('kelas_id');
            }
        });
    }
};

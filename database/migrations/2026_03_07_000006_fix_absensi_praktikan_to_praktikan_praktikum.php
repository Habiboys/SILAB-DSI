<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('absensi_praktikan', function (Blueprint $table) {
            // Drop old FK on praktikan_id
            $table->dropForeign(['praktikan_id']);
            $table->dropColumn('praktikan_id');

            // Add praktikan_praktikum_id FK
            $table->uuid('praktikan_praktikum_id')->after('pertemuan_id');
            $table->foreign('praktikan_praktikum_id')
                  ->references('id')
                  ->on('praktikan_praktikum')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('absensi_praktikan', function (Blueprint $table) {
            $table->dropForeign(['praktikan_praktikum_id']);
            $table->dropColumn('praktikan_praktikum_id');

            $table->uuid('praktikan_id')->after('pertemuan_id');
            $table->foreign('praktikan_id')->references('id')->on('praktikan')->onDelete('cascade');
        });
    }
};

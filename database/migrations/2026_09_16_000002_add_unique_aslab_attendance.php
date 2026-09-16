<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('absensi_aslab', function (Blueprint $table) {
            $table->unique(['pertemuan_id', 'aslab_praktikum_id'], 'absensi_aslab_pertemuan_aslab_unique');
        });
    }

    public function down(): void
    {
        Schema::table('absensi_aslab', function (Blueprint $table) {
            $table->dropUnique('absensi_aslab_pertemuan_aslab_unique');
        });
    }
};

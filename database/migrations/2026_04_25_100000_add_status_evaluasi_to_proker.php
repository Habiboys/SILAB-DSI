<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('proker', function (Blueprint $table) {
            // 'terlaksana' | 'sebagian' | 'tidak_terlaksana' | null
            $table->string('status_evaluasi')->nullable()->after('saran');
        });
    }

    public function down(): void
    {
        Schema::table('proker', function (Blueprint $table) {
            $table->dropColumn('status_evaluasi');
        });
    }
};

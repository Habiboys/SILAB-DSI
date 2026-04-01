<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('periode_piket', function (Blueprint $table) {
            // Lama piket dalam menit, default 120 (2 jam)
            $table->unsignedInteger('lama_piket')->default(120)->after('isactive');
        });
    }

    public function down(): void
    {
        Schema::table('periode_piket', function (Blueprint $table) {
            $table->dropColumn('lama_piket');
        });
    }
};

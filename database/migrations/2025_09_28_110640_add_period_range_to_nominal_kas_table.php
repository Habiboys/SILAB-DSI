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
        Schema::table('nominal_kas', function (Blueprint $table) {
            $table->date('periode_mulai')->nullable()->after('periode');
            $table->date('periode_berakhir')->nullable()->after('periode_mulai');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('nominal_kas', function (Blueprint $table) {
            $table->dropColumn(['periode_mulai', 'periode_berakhir']);
        });
    }
};

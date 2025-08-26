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
        Schema::table('pengumpulan_tugas', function (Blueprint $table) {
            // Drop existing foreign key constraints if they exist
            $table->dropForeign(['tugas_praktikum_id']);
            $table->dropForeign(['praktikan_id']);
            
            // Add proper foreign key constraints
            $table->foreign('tugas_praktikum_id')->references('id')->on('tugas_praktikum')->onDelete('cascade');
            $table->foreign('praktikan_id')->references('id')->on('praktikan')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pengumpulan_tugas', function (Blueprint $table) {
            $table->dropForeign(['tugas_praktikum_id']);
            $table->dropForeign(['praktikan_id']);
        });
    }
};

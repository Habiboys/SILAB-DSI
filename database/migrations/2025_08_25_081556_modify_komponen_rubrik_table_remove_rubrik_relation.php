<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('komponen_rubrik', function (Blueprint $table) {
            // Add tugas_praktikum_id column (nullable first)
            $table->uuid('tugas_praktikum_id')->nullable()->after('id');
        });
        
        // Update tugas_praktikum_id based on rubrik_penilaian relationship
        DB::statement("
            UPDATE komponen_rubrik kr 
            SET tugas_praktikum_id = (
                SELECT rp.tugas_praktikum_id 
                FROM rubrik_penilaian rp 
                WHERE rp.id = kr.rubrik_penilaian_id
            )
        ");
        
        Schema::table('komponen_rubrik', function (Blueprint $table) {
            // Make tugas_praktikum_id not nullable and add foreign key
            $table->uuid('tugas_praktikum_id')->nullable(false)->change();
            $table->foreign('tugas_praktikum_id')->references('id')->on('tugas_praktikum')->onDelete('cascade');
            
            // Drop foreign key constraint for rubrik_penilaian_id
            $table->dropForeign(['rubrik_penilaian_id']);
            
            // Drop the rubrik_penilaian_id column
            $table->dropColumn('rubrik_penilaian_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('komponen_rubrik', function (Blueprint $table) {
            // Drop foreign key and column for tugas_praktikum_id
            $table->dropForeign(['tugas_praktikum_id']);
            $table->dropColumn('tugas_praktikum_id');
            
            // Add back rubrik_penilaian_id column with foreign key
            $table->uuid('rubrik_penilaian_id')->after('id');
            $table->foreign('rubrik_penilaian_id')->references('id')->on('rubrik_penilaian')->onDelete('cascade');
        });
    }
};

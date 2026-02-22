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
        Schema::table('modul_praktikum', function (Blueprint $table) {
            if (!Schema::hasColumn('modul_praktikum', 'pertemuan_id')) {
                $table->uuid('pertemuan_id')->after('id')->nullable(); 
                // Make it nullable first to avoid errors with existing data, 
                // but since we are dev, we can try enforcing it or just leave nullable for now.
                // Actually, let's make it nullable or give default? 
                // Better: nullable for safety on existing rows, then maybe fill it?
                // For now, simple add.
                
                $table->foreign('pertemuan_id')->references('id')->on('pertemuan_praktikum')->onDelete('cascade');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('modul_praktikum', function (Blueprint $table) {
            if (Schema::hasColumn('modul_praktikum', 'pertemuan_id')) {
                $table->dropForeign(['pertemuan_id']);
                $table->dropColumn('pertemuan_id');
            }
        });
    }
};

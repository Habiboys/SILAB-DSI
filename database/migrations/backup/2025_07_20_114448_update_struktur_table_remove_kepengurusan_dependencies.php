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
        Schema::table('struktur', function (Blueprint $table) {
            // Drop foreign key constraint first
            $table->dropForeign(['kepengurusan_lab_id']);
            
            // Drop columns that are no longer needed
            $table->dropColumn([
                'kepengurusan_lab_id',
                'proker',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('struktur', function (Blueprint $table) {
            // Add back the columns
            $table->foreignId('kepengurusan_lab_id')->nullable()->constrained('kepengurusan_lab');
            $table->text('proker')->nullable();
        });
    }
};

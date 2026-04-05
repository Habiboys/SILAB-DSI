<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('praktikum', function (Blueprint $table) {
            $table->uuid('mata_kuliah_id')->nullable()->after('mata_kuliah');
            $table->foreign('mata_kuliah_id')
                ->references('id')
                ->on('mata_kuliah')
                ->nullOnDelete();
            $table->index('mata_kuliah_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('praktikum', function (Blueprint $table) {
            $table->dropForeign(['mata_kuliah_id']);
            $table->dropIndex(['mata_kuliah_id']);
            $table->dropColumn('mata_kuliah_id');
        });
    }
};

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
        Schema::table('praktikan', function (Blueprint $table) {
            // Only add foreign key constraint since columns already exist
            $table->foreign('kelas_id')->references('id')->on('kelas')->onDelete('set null');
            $table->index(['kelas_id', 'praktikum_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('praktikan', function (Blueprint $table) {
            $table->dropForeign(['kelas_id']);
            $table->dropIndex(['kelas_id', 'praktikum_id']);
        });
    }
};

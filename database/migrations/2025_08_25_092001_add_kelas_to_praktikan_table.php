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
            if (!Schema::hasColumn('praktikan', 'kelas_id')) {
                $table->uuid('kelas_id')->nullable();
            }
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

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
        if (!Schema::hasTable('mata_kuliah')) {
            Schema::create('mata_kuliah', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('kode_mata_kuliah', 30)->unique();
                $table->string('nama');
                $table->unsignedTinyInteger('sks');
                $table->unsignedTinyInteger('semester');
                $table->enum('status', ['aktif', 'nonaktif'])->default('aktif');
                $table->timestamps();

                $table->index(['status', 'nama']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mata_kuliah');
    }
};

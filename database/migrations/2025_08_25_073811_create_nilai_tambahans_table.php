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
        Schema::create('nilai_tambahan', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('tugas_praktikum_id');
            $table->string('praktikan_id');
            $table->decimal('nilai', 5, 2); // Nilai tambahan
            $table->string('kategori')->default('bonus'); // bonus, partisipasi, dll
            $table->text('keterangan')->nullable();
            $table->string('diberikan_oleh'); // User ID yang memberikan nilai
            $table->timestamp('diberikan_at')->useCurrent();
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('tugas_praktikum_id')->references('id')->on('tugas_praktikum')->onDelete('cascade');
            $table->foreign('praktikan_id')->references('id')->on('praktikan')->onDelete('cascade');
            $table->foreign('diberikan_oleh')->references('id')->on('users')->onDelete('cascade');
            
            // Index untuk pencarian yang efisien
            $table->index(['tugas_praktikum_id', 'praktikan_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('nilai_tambahan');
    }
};

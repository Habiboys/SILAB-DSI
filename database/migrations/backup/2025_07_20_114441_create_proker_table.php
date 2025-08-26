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
        Schema::create('proker', function (Blueprint $table) {
            $table->id();
            $table->foreignId('struktur_id')->constrained('struktur')->onDelete('cascade');
            $table->foreignId('kepengurusan_lab_id')->constrained('kepengurusan_lab')->onDelete('cascade');
            $table->text('deskripsi');
            $table->enum('status', ['belum_mulai', 'sedang_berjalan', 'selesai', 'ditunda'])->default('belum_mulai');
            $table->date('tanggal_mulai')->nullable();
            $table->date('tanggal_selesai')->nullable();
            $table->text('keterangan')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('proker');
    }
};

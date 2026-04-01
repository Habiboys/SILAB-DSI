<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('surat_keluar', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('kepengurusan_lab_id')
                  ->constrained('kepengurusan_lab')
                  ->cascadeOnDelete();
            $table->unsignedInteger('nomor_urut');
            $table->string('nomor_surat')->unique();
            $table->string('perihal');
            $table->string('tujuan');
            $table->date('tanggal_surat');
            $table->text('isi_ringkas')->nullable();
            $table->string('file_surat')->nullable();
            $table->string('kode_klasifikasi', 50)->nullable();
            $table->foreignUuid('dibuat_oleh')
                  ->constrained('users')
                  ->restrictOnDelete();
            $table->timestamps();

            // Ensure unique nomor_urut per kepengurusan_lab
            $table->unique(['kepengurusan_lab_id', 'nomor_urut']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('surat_keluar');
    }
};

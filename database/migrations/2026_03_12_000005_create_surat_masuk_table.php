<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('surat_masuk', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('kepengurusan_lab_id')
                  ->constrained('kepengurusan_lab')
                  ->cascadeOnDelete();
            $table->unsignedInteger('nomor_agenda');
            $table->string('nomor_surat_asal');
            $table->string('asal_surat');
            $table->string('perihal');
            $table->date('tanggal_surat');
            $table->date('tanggal_terima');
            $table->text('isi_ringkas')->nullable();
            $table->string('file_surat')->nullable();
            $table->foreignUuid('diterima_oleh')
                  ->constrained('users')
                  ->restrictOnDelete();
            $table->timestamps();

            // Ensure unique nomor_agenda per kepengurusan_lab
            $table->unique(['kepengurusan_lab_id', 'nomor_agenda']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('surat_masuk');
    }
};

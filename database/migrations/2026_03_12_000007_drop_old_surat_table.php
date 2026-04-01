<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Drop the old personal-messaging surat table.
     * The new official document system uses surat_keluar, surat_masuk, disposisi_surat.
     */
    public function up(): void
    {
        Schema::dropIfExists('surat');
    }

    public function down(): void
    {
        Schema::create('surat', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('pengirim_id');
            $table->uuid('penerima_id')->nullable();
            $table->string('perihal');
            $table->string('nomor_surat')->nullable();
            $table->date('tanggal_surat')->nullable();
            $table->text('isi');
            $table->string('file_surat')->nullable();
            $table->boolean('isread')->default(false);
            $table->enum('tipe_surat', ['pribadi', 'resmi'])->default('pribadi');
            $table->uuid('lab_id')->nullable();
            $table->string('penerima_nama_luar')->nullable();
            $table->timestamps();
        });
    }
};

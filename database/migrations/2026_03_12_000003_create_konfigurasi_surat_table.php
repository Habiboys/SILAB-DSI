<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('konfigurasi_surat', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('kepengurusan_lab_id')
                  ->unique()
                  ->constrained('kepengurusan_lab')
                  ->cascadeOnDelete();
            $table->string('inisial_lab', 20)->default('LAB');
            // Format tokens: {nomor}, {inisial_lab}, {bulan_romawi}, {tahun}
            $table->string('format_nomor', 200)
                  ->default('{nomor}/LAB.{inisial_lab}/{bulan_romawi}/{tahun}');
            $table->json('variabel_aktif')->nullable();
            $table->boolean('reset_tiap_tahun')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('konfigurasi_surat');
    }
};

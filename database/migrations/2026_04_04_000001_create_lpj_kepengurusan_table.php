<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lpj_kepengurusan', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('kepengurusan_lab_id')->constrained('kepengurusan_lab')->cascadeOnDelete();

            $table->string('judul');
            $table->string('nomor_dokumen')->nullable();
            $table->enum('status', ['draft', 'review', 'disetujui', 'terkunci'])->default('draft');
            $table->text('ringkasan')->nullable();

            $table->unsignedInteger('total_proker')->default(0);
            $table->unsignedInteger('proker_disetujui')->default(0);
            $table->unsignedInteger('proker_selesai')->default(0);
            $table->unsignedInteger('total_kegiatan')->default(0);
            $table->unsignedInteger('kegiatan_disetujui')->default(0);
            $table->unsignedInteger('total_laporan_kegiatan')->default(0);
            $table->unsignedInteger('total_dokumentasi_kegiatan')->default(0);
            $table->decimal('persentase_capaian_rata2', 5, 2)->nullable();

            $table->timestamp('generated_at')->nullable();
            $table->foreignUuid('generated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->foreignUuid('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('locked_at')->nullable();

            $table->timestamps();

            $table->index(['kepengurusan_lab_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lpj_kepengurusan');
    }
};

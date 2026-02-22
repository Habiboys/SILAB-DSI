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
        Schema::create('permohonan_aset', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_pemohon_id');
            $table->uuid('laboratorium_id');
            $table->string('nomor_permohonan', 100)->unique();
            $table->date('tanggal_permohonan');
            $table->text('alasan_umum_pengadaan');
            $table->enum('status_permohonan', ['diajukan', 'disetujui', 'ditolak'])->default('diajukan');
            $table->text('catatan_approval')->nullable();
            $table->uuid('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();

            $table->foreign('user_pemohon_id')->references('id')->on('users');
            $table->foreign('laboratorium_id')->references('id')->on('laboratorium');
            $table->foreign('approved_by')->references('id')->on('users');
        });

        Schema::create('wishlist_aset', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('permohonan_aset_id');
            $table->string('nama_barang');
            $table->string('jenis_barang', 100)->nullable();
            $table->text('spesifikasi_teknis')->nullable();
            $table->decimal('perkiraan_harga', 15, 2)->nullable();
            $table->integer('jumlah_diminta')->default(1);
            $table->string('satuan', 50)->nullable();
            $table->enum('urgensi', ['rendah', 'sedang', 'tinggi', 'sangat_tinggi'])->default('sedang');
            $table->string('referensi_url')->nullable();
            $table->enum('status_item', ['diajukan', 'disetujui', 'ditolak', 'dipesan', 'diterima'])->default('diajukan');
            $table->integer('jumlah_disetujui')->nullable();
            $table->text('catatan_item')->nullable();
            $table->timestamps();

            $table->foreign('permohonan_aset_id')->references('id')->on('permohonan_aset')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wishlist_aset');
        Schema::dropIfExists('permohonan_aset');
    }
};

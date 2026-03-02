<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tambah kolom untuk mendukung surat resmi atas nama lab:
     * - tipe_surat  : 'pribadi' (default) | 'resmi'
     * - lab_id      : FK ke laboratorium (nullable, diisi untuk tipe resmi)
     * - penerima_nama_luar : nama penerima eksternal (nullable, diisi jika penerima bukan user sistem)
     *
     * Kolom penerima (FK users) dibuat nullable karena surat resmi bisa dikirim
     * ke pihak luar yang tidak memiliki akun di sistem.
     */
    public function up(): void
    {
        Schema::table('surat', function (Blueprint $table) {
            // Jadikan penerima nullable (penerima luar sistem tidak punya user_id)
            $table->uuid('penerima')->nullable()->change();

            // Tipe surat: pribadi (user-to-user) atau resmi (atas nama lab)
            $table->enum('tipe_surat', ['pribadi', 'resmi'])->default('pribadi')->after('isread');

            // Lab pengirim — wajib diisi untuk tipe resmi
            $table->uuid('lab_id')->nullable()->after('tipe_surat');

            // Nama penerima untuk pihak luar (instansi, dosen luar, dsb.)
            $table->string('penerima_nama_luar')->nullable()->after('lab_id');

            $table->foreign('lab_id')
                  ->references('id')
                  ->on('laboratorium')
                  ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('surat', function (Blueprint $table) {
            $table->dropForeign(['lab_id']);
            $table->dropColumn(['tipe_surat', 'lab_id', 'penerima_nama_luar']);
            $table->uuid('penerima')->nullable(false)->change();
        });
    }
};

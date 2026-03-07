<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tambah kolom parent_kelas_id ke tabel kelas.
     *
     * Pola: self-referencing (hierarki parent–child satu level).
     *   Kelas A  (parent_kelas_id = null)  ← kelas asli, untuk penilaian akhir
     *     ├── Kelas A1 (parent_kelas_id = A.id)  ← sub-kelas, punya jadwal & tugas sendiri
     *     └── Kelas A2 (parent_kelas_id = A.id)
     *   Kelas B  (parent_kelas_id = null)  ← tidak dipecah, tetap normal
     *
     * Semua relasi (jadwal, tugas, pertemuan, praktikan) sudah ke kelas_id
     * sehingga sub-kelas otomatis bisa punya data sendiri tanpa perubahan
     * tabel lain.
     */
    public function up(): void
    {
        Schema::table('kelas', function (Blueprint $table) {
            if (!Schema::hasColumn('kelas', 'parent_kelas_id')) {
                // Nullable — kelas tanpa parent berarti kelas "asli" (parent_kelas_id = null)
                $table->uuid('parent_kelas_id')
                      ->nullable()
                      ->default(null)
                      ->after('praktikum_id');

                $table->foreign('parent_kelas_id')
                      ->references('id')
                      ->on('kelas')
                      ->onDelete('cascade'); // Jika parent dihapus, sub-kelas ikut terhapus

                $table->index('parent_kelas_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kelas', function (Blueprint $table) {
            if (Schema::hasColumn('kelas', 'parent_kelas_id')) {
                $table->dropForeign(['parent_kelas_id']);
                $table->dropIndex(['parent_kelas_id']);
                $table->dropColumn('parent_kelas_id');
            }
        });
    }
};

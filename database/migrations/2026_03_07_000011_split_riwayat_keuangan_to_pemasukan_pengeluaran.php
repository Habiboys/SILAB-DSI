<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Step 1: Create pemasukan_keuangan table
        Schema::create('pemasukan_keuangan', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->date('tanggal');
            $table->bigInteger('nominal');
            $table->string('deskripsi')->nullable();
            $table->string('bukti')->nullable();
            $table->uuid('user_id')->nullable();
            $table->uuid('kepengurusan_lab_id');
            $table->boolean('is_uang_kas')->default(false);
            $table->string('jenis_pembayaran_kas')->nullable();
            $table->string('catatan_pembayaran')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('kepengurusan_lab_id')->references('id')->on('kepengurusan_lab')->onDelete('cascade');
        });

        // Step 2: Create pengeluaran_keuangan table
        Schema::create('pengeluaran_keuangan', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->date('tanggal');
            $table->bigInteger('nominal');
            $table->string('deskripsi')->nullable();
            $table->string('bukti')->nullable();
            $table->uuid('user_id')->nullable();
            $table->uuid('kepengurusan_lab_id');
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('kepengurusan_lab_id')->references('id')->on('kepengurusan_lab')->onDelete('cascade');
        });

        // Step 3: Migrate data from riwayat_keuangan
        // Pemasukan (jenis = 'masuk')
        DB::statement("
            INSERT INTO pemasukan_keuangan
                (id, tanggal, nominal, deskripsi, bukti, user_id, kepengurusan_lab_id,
                 is_uang_kas, jenis_pembayaran_kas, catatan_pembayaran, created_at, updated_at)
            SELECT
                id, tanggal, nominal, deskripsi, bukti, user_id, kepengurusan_lab_id,
                COALESCE(is_uang_kas, 0), jenis_pembayaran_kas, catatan_pembayaran,
                created_at, updated_at
            FROM riwayat_keuangan
            WHERE jenis = 'masuk'
        ");

        // Pengeluaran (jenis = 'keluar')
        DB::statement("
            INSERT INTO pengeluaran_keuangan
                (id, tanggal, nominal, deskripsi, bukti, user_id, kepengurusan_lab_id,
                 created_at, updated_at)
            SELECT
                id, tanggal, nominal, deskripsi, bukti, user_id, kepengurusan_lab_id,
                created_at, updated_at
            FROM riwayat_keuangan
            WHERE jenis = 'keluar'
        ");

        // Step 4: Drop riwayat_keuangan table
        Schema::dropIfExists('riwayat_keuangan');
    }

    public function down(): void
    {
        // Re-create riwayat_keuangan
        Schema::create('riwayat_keuangan', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->date('tanggal');
            $table->bigInteger('nominal');
            $table->string('jenis'); // masuk | keluar
            $table->string('deskripsi')->nullable();
            $table->string('bukti')->nullable();
            $table->uuid('user_id')->nullable();
            $table->uuid('kepengurusan_lab_id');
            $table->boolean('is_uang_kas')->default(false);
            $table->string('jenis_pembayaran_kas')->nullable();
            $table->string('catatan_pembayaran')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('kepengurusan_lab_id')->references('id')->on('kepengurusan_lab')->onDelete('cascade');
        });

        // Restore from split tables
        DB::statement("
            INSERT INTO riwayat_keuangan
                (id, tanggal, nominal, jenis, deskripsi, bukti, user_id, kepengurusan_lab_id,
                 is_uang_kas, jenis_pembayaran_kas, catatan_pembayaran, created_at, updated_at)
            SELECT id, tanggal, nominal, 'masuk', deskripsi, bukti, user_id, kepengurusan_lab_id,
                   is_uang_kas, jenis_pembayaran_kas, catatan_pembayaran, created_at, updated_at
            FROM pemasukan_keuangan
        ");

        DB::statement("
            INSERT INTO riwayat_keuangan
                (id, tanggal, nominal, jenis, deskripsi, bukti, user_id, kepengurusan_lab_id,
                 created_at, updated_at)
            SELECT id, tanggal, nominal, 'keluar', deskripsi, bukti, user_id, kepengurusan_lab_id,
                   created_at, updated_at
            FROM pengeluaran_keuangan
        ");

        Schema::dropIfExists('pengeluaran_keuangan');
        Schema::dropIfExists('pemasukan_keuangan');
    }
};

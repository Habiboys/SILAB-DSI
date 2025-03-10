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
    
        Schema::create('laboratorium', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->string('logo')->nullable();
            $table->timestamps();
        });

        Schema::create('tahun_kepengurusan', function (Blueprint $table) {
            $table->id();
            $table->string('tahun');
            $table->boolean('isactive')->default(false);
            $table->string('mulai');
            $table->string('selesai');
            $table->timestamps();
        });

        Schema::create('kepengurusan_lab', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tahun_kepengurusan_id')->constrained('tahun_kepengurusan');
            $table->foreignId('laboratorium_id')->constrained('laboratorium');
            $table->string('sk');
            $table->timestamps();
        });

        Schema::create('struktur', function (Blueprint $table) {
            $table->id();
            $table->string('struktur');
            $table->foreignId('kepengurusan_lab_id')->constrained('kepengurusan_lab');
            $table->text('proker')->nullable();
            $table->timestamps();
        });

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->foreignId('struktur_id')->nullable()->constrained('struktur');
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('profile', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_induk');
            $table->enum('jenis_kelamin', ['laki-laki ', 'perempuan']);
            $table->string('foto_profile');
            $table->string('alamat');
            $table->string('no_hp');
            $table->string('tempat_lahir');
            $table->date('tanggal_lahir');
            $table->string('nomor_anggota')->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users');
            $table->timestamps();
        });
        

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });

        Schema::create('aset', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->text('deskripsi');
            $table->integer('jumlah');
            $table->foreignId('laboratorium_id')->constrained('laboratorium');
            $table->timestamps();
        });

        Schema::create('detail_aset', function (Blueprint $table) {
            $table->id();
            $table->foreignId('aset_id')->constrained('aset');
            $table->string('kode_barang');
            $table->enum('status', ['tersedia', 'dipinjam']);
            $table->enum('keadaan', ['baik', 'rusak']);
            $table->timestamps();
        });

        Schema::create('periode_piket', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->date('tanggal_mulai');
            $table->date('tanggal_selesai');
            $table->boolean('isactive')->default(false);
            $table->timestamps();
        });

        Schema::create('jadwal_piket', function (Blueprint $table) {
            $table->id();
            $table->string('hari');
            $table->foreignId('kepengurusan_lab_id')->constrained('kepengurusan_lab');
            $table->foreignId('user_id')->constrained('users');
            $table->timestamps();
        });

        Schema::create('absensi', function (Blueprint $table) {
            $table->id();
            $table->date('tanggal');
            $table->time('jam_masuk');
            $table->time('jam_keluar');
            $table->string('foto');
            $table->foreignId('jadwal_piket')->constrained('jadwal_piket');
            $table->text('kegiatan');
            $table->foreignId('periode_piket_id')->constrained('periode_piket');
            $table->timestamps();
        });

        Schema::create('jadwal_praktikum', function (Blueprint $table) {
            $table->id();
            $table->string('kelas');
            $table->time('jam_mulai');
            $table->time('jam_selesai');
            $table->string('ruangan');
            $table->timestamps();
        });

        Schema::create('praktikum', function (Blueprint $table) {
            $table->id();
            $table->string('mata_kuliah');
            $table->foreignId('jadwal_id')->constrained('jadwal_praktikum');
            $table->foreignId('kepengurusan_lab_id')->constrained('kepengurusan_lab');
            $table->timestamps();
        });

        Schema::create('modul_praktikum', function (Blueprint $table) {
            $table->id();
            $table->foreignId('praktikum_id')->constrained('praktikum');
            $table->string('judul');
            $table->string('modul');
            $table->timestamps();
        });

        Schema::create('surat', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_surat');
            $table->date('tanggal_surat');
            $table->foreignId('pengirim')->constrained('users');
            $table->foreignId('penerima')->constrained('users');
            $table->string('perihal');
            $table->string('file')->nullable();
            $table->boolean('isread')->default(false);
            $table->timestamps();
        });

        Schema::create('riwayat_keuangan', function (Blueprint $table) {
            $table->id();
            $table->date('tanggal');
            $table->integer('nominal');
            $table->enum('jenis', ['masuk', 'keluar']);
            $table->string('deskripsi')->nullable();
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('kepengurusan_lab_id')->constrained('kepengurusan_lab');
            $table->timestamps();
        });

        Schema::create('laporan_keuangan', function (Blueprint $table) {
            $table->id();
            $table->string('bulan');
            $table->foreignId('kepengurusan_lab_id')->constrained('kepengurusan_lab');
            $table->integer('pemasukan');
            $table->integer('pengeluaran');
            $table->integer('saldo_akhir');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('laporan_keuangan');
        Schema::dropIfExists('riwayat_keuangan');
        Schema::dropIfExists('surat');
        Schema::dropIfExists('modul_praktikum');
        Schema::dropIfExists('praktikum');
        Schema::dropIfExists('jadwal_praktikum');
        Schema::dropIfExists('absensi');
        Schema::dropIfExists('jadwal_piket');
        Schema::dropIfExists('periode_piket');
        Schema::dropIfExists('detail_aset');
        Schema::dropIfExists('aset');
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('struktur');
        Schema::dropIfExists('kepengurusan_lab');
        Schema::dropIfExists('tahun_kepengurusan');
        Schema::dropIfExists('laboratorium');
        Schema::dropIfExists('role');
    }
};
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
        // Create laboratorium table
        Schema::create('laboratorium', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nama');
            $table->string('logo')->nullable();
            $table->timestamps();
        });

        // Create tahun_kepengurusan table
        Schema::create('tahun_kepengurusan', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('tahun');
            $table->boolean('isactive')->default(false);
            $table->string('mulai');
            $table->string('selesai');
            $table->timestamps();
        });

        // Create kepengurusan_lab table
        Schema::create('kepengurusan_lab', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tahun_kepengurusan_id');
            $table->uuid('laboratorium_id');
            $table->string('sk');
            $table->timestamps();

            $table->foreign('tahun_kepengurusan_id')->references('id')->on('tahun_kepengurusan')->onDelete('cascade');
            $table->foreign('laboratorium_id')->references('id')->on('laboratorium')->onDelete('cascade');
        });

        // Create struktur table (as master data)
        Schema::create('struktur', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('struktur');
            $table->enum('tipe_jabatan', ['dosen', 'asisten'])->nullable();
            $table->boolean('jabatan_tunggal')->default(true);
            $table->enum('jabatan_terkait', ['kalab', 'dosen'])->nullable();
            $table->timestamps();
        });

        // Create users table
        Schema::create('users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->uuid('struktur_id')->nullable();
            $table->uuid('laboratory_id')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        // Create kepengurusan_user table
        Schema::create('kepengurusan_user', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('kepengurusan_lab_id');
            $table->uuid('user_id');
            $table->uuid('struktur_id');
            $table->boolean('is_active')->default(true);
            $table->date('tanggal_bergabung')->default(now());
            $table->date('tanggal_keluar')->nullable();
            $table->text('catatan')->nullable();
            $table->timestamps();

            $table->foreign('kepengurusan_lab_id')->references('id')->on('kepengurusan_lab')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('struktur_id')->references('id')->on('struktur')->onDelete('cascade');
            
            // Mencegah duplikasi user dalam kepengurusan yang sama
            $table->unique(['kepengurusan_lab_id', 'user_id']);
        });

        // Create sessions table
        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->uuid('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });

        // Create profile table
        Schema::create('profile', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nomor_induk');
            $table->enum('jenis_kelamin', ['laki-laki', 'perempuan']);
            $table->string('foto_profile');
            $table->string('alamat');
            $table->string('no_hp');
            $table->string('tempat_lahir');
            $table->date('tanggal_lahir');
            $table->string('nomor_anggota')->nullable();
            $table->uuid('user_id');
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        // Create aset table
        Schema::create('aset', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nama');
            $table->text('deskripsi');
            $table->uuid('laboratorium_id');
            $table->timestamps();

            $table->foreign('laboratorium_id')->references('id')->on('laboratorium')->onDelete('cascade');
        });

        // Create detail_aset table
        Schema::create('detail_aset', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('aset_id');
            $table->string('kode_barang');
            $table->string('foto');
            $table->enum('status', ['tersedia', 'dipinjam']);
            $table->enum('keadaan', ['baik', 'rusak']);
            $table->integer('jumlah')->default(1);
            $table->timestamps();

            $table->foreign('aset_id')->references('id')->on('aset')->onDelete('cascade');
        });

        // Create periode_piket table
        Schema::create('periode_piket', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('kepengurusan_lab_id');
            $table->string('nama');
            $table->date('tanggal_mulai');
            $table->date('tanggal_selesai');
            $table->boolean('isactive')->default(false);
            $table->timestamps();

            $table->foreign('kepengurusan_lab_id')->references('id')->on('kepengurusan_lab')->onDelete('cascade');
        });

        // Create jadwal_piket table
        Schema::create('jadwal_piket', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('hari');
            $table->uuid('kepengurusan_lab_id');
            $table->uuid('user_id');
            $table->timestamps();

            $table->foreign('kepengurusan_lab_id')->references('id')->on('kepengurusan_lab')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        // Create absensi table
        Schema::create('absensi', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->date('tanggal');
            $table->time('jam_masuk');
            $table->time('jam_keluar')->nullable();
            $table->string('foto');
            $table->uuid('jadwal_piket');
            $table->text('kegiatan');
            $table->uuid('periode_piket_id');
            $table->timestamps();

            $table->foreign('jadwal_piket')->references('id')->on('jadwal_piket')->onDelete('cascade');
            $table->foreign('periode_piket_id')->references('id')->on('periode_piket')->onDelete('cascade');
        });

        // Create praktikum table
        Schema::create('praktikum', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('mata_kuliah');
            $table->uuid('kepengurusan_lab_id');
            $table->timestamps();

            $table->foreign('kepengurusan_lab_id')->references('id')->on('kepengurusan_lab')->onDelete('cascade');
        });

        // Create jadwal_praktikum table
        Schema::create('jadwal_praktikum', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('kelas');
            $table->time('jam_mulai');
            $table->time('jam_selesai');
            $table->string('ruangan');
            $table->string('hari');
            $table->string('praktikum_id');
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('praktikum_id')->references('id')->on('praktikum')->onDelete('cascade');
        });

        // Create modul_praktikum table
        Schema::create('modul_praktikum', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('praktikum_id');
            $table->string('judul');
            $table->string('modul');
            $table->string('pertemuan');
            $table->boolean('is_public')->default(false);
            $table->string('hash')->nullable();
            $table->timestamps();

            $table->foreign('praktikum_id')->references('id')->on('praktikum')->onDelete('cascade');
        });

        // Create surat table
        Schema::create('surat', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nomor_surat');
            $table->date('tanggal_surat');
            $table->uuid('pengirim');
            $table->uuid('penerima');
            $table->string('perihal');
            $table->string('file')->nullable();
            $table->boolean('isread')->default(false);
            $table->timestamps();

            $table->foreign('pengirim')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('penerima')->references('id')->on('users')->onDelete('cascade');
        });

        // Create riwayat_keuangan table
        Schema::create('riwayat_keuangan', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->date('tanggal');
            $table->integer('nominal');
            $table->enum('jenis', ['masuk', 'keluar']);
            $table->string('deskripsi')->nullable();
            $table->string('bukti')->nullable();
            $table->uuid('user_id')->nullable();
            $table->uuid('kepengurusan_lab_id');
            $table->boolean('is_uang_kas')->default(false);
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('kepengurusan_lab_id')->references('id')->on('kepengurusan_lab')->onDelete('cascade');
        });

        // Create laporan_keuangan table
        Schema::create('laporan_keuangan', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('bulan');
            $table->uuid('kepengurusan_lab_id');
            $table->integer('pemasukan');
            $table->integer('pengeluaran');
            $table->integer('saldo_akhir');
            $table->timestamps();

            $table->foreign('kepengurusan_lab_id')->references('id')->on('kepengurusan_lab')->onDelete('cascade');
        });

        // Create proker table
        Schema::create('proker', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('struktur_id');
            $table->uuid('kepengurusan_lab_id');
            $table->text('deskripsi');
            $table->enum('status', ['belum_mulai', 'sedang_berjalan', 'selesai', 'ditunda'])->default('belum_mulai');
            $table->date('tanggal_mulai')->nullable();
            $table->date('tanggal_selesai')->nullable();
            $table->text('keterangan')->nullable();
            $table->string('file_proker')->nullable();
            $table->timestamps();

            $table->foreign('struktur_id')->references('id')->on('struktur')->onDelete('cascade');
            $table->foreign('kepengurusan_lab_id')->references('id')->on('kepengurusan_lab')->onDelete('cascade');
        });

        // Add foreign key constraints to users table
        Schema::table('users', function (Blueprint $table) {
            $table->foreign('struktur_id')->references('id')->on('struktur')->onDelete('set null');
            $table->foreign('laboratory_id')->references('id')->on('laboratorium')->onDelete('set null');
        });

        // Create praktikan table
        Schema::create('praktikan', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nim')->unique(); // NIM unik untuk identifikasi
            $table->string('nama');
            $table->string('email')->nullable();
            $table->string('no_hp')->nullable();
            $table->string('user_id')->nullable(); // Link ke user jika sudah ada akun (UUID)
            $table->string('lab_id'); // Lab mana yang dia ikuti (UUID)
            $table->string('praktikum_id'); // Praktikum mana yang dia ikuti (UUID)
            $table->enum('status', ['aktif', 'nonaktif'])->default('aktif');
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('lab_id')->references('id')->on('laboratorium')->onDelete('cascade');
            $table->foreign('praktikum_id')->references('id')->on('praktikum')->onDelete('cascade');
            
            // Unique constraint untuk mencegah duplikasi praktikan di praktikum yang sama
            $table->unique(['nim', 'praktikum_id']);
        });

        // Create tugas_praktikum table
        Schema::create('tugas_praktikum', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('praktikum_id');
            $table->string('judul_tugas');
            $table->text('deskripsi')->nullable();
            $table->string('file_tugas')->nullable(); // File tugas yang diberikan
            $table->date('deadline');
            $table->enum('status', ['aktif', 'nonaktif'])->default('aktif');
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('praktikum_id')->references('id')->on('praktikum')->onDelete('cascade');
        });

        // Create pengumpulan_tugas table
        Schema::create('pengumpulan_tugas', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('tugas_praktikum_id');
            $table->string('praktikan_id');
            $table->string('file_pengumpulan'); // File yang dikumpulkan
            $table->text('catatan')->nullable(); // Catatan dari praktikan
            $table->text('feedback')->nullable(); // Feedback dari aslab/dosen
            $table->decimal('nilai', 5, 2)->nullable(); // Nilai 0-100
            $table->enum('status', ['dikumpulkan', 'dinilai', 'terlambat'])->default('dikumpulkan');
            $table->timestamp('submitted_at')->useCurrent();
            $table->timestamp('dinilai_at')->nullable();
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('tugas_praktikum_id')->references('id')->on('tugas_praktikum')->onDelete('cascade');
            $table->foreign('praktikan_id')->references('id')->on('praktikan')->onDelete('cascade');
            
            // Unique constraint untuk mencegah duplikasi pengumpulan
            $table->unique(['tugas_praktikum_id', 'praktikan_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pengumpulan_tugas');
        Schema::dropIfExists('tugas_praktikum');
        Schema::dropIfExists('praktikan');
        Schema::dropIfExists('proker');
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
        Schema::dropIfExists('profile');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('users');
        
        Schema::dropIfExists('struktur');
        Schema::dropIfExists('kepengurusan_lab');
        Schema::dropIfExists('tahun_kepengurusan');
        Schema::dropIfExists('laboratorium');
    }
};

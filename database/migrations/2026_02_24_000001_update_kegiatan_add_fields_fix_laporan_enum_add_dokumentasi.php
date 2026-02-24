<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add lokasi, tipe_kegiatan, link_meeting to kegiatan
        Schema::table('kegiatan', function (Blueprint $table) {
            $table->string('tipe_kegiatan')->nullable()->after('deskripsi_kegiatan');
            $table->string('lokasi')->nullable()->after('tipe_kegiatan');
            $table->string('link_meeting')->nullable()->after('lokasi');
        });

        // 2. Fix jenis_laporan: change ENUM('bulanan','akhir') → VARCHAR(255)
        DB::statement('ALTER TABLE laporan_kegiatan MODIFY COLUMN jenis_laporan VARCHAR(255) NOT NULL');

        // 3. Create dokumentasi_kegiatan table for multiple file uploads per activity
        Schema::create('dokumentasi_kegiatan', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('kegiatan_id');
            $table->string('judul');
            $table->string('file_path');
            $table->uuid('uploaded_by')->nullable();
            $table->timestamps();

            $table->foreign('kegiatan_id')->references('id')->on('kegiatan')->onDelete('cascade');
            $table->foreign('uploaded_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dokumentasi_kegiatan');

        DB::statement("ALTER TABLE laporan_kegiatan MODIFY COLUMN jenis_laporan ENUM('bulanan','akhir') NOT NULL DEFAULT 'bulanan'");

        Schema::table('kegiatan', function (Blueprint $table) {
            $table->dropColumn(['tipe_kegiatan', 'lokasi', 'link_meeting']);
        });
    }
};

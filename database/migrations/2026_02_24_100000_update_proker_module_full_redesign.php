<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add new fields to proker table
        Schema::table('proker', function (Blueprint $table) {
            $table->string('nama_proker')->nullable()->after('kepengurusan_lab_id');
            $table->text('tujuan')->nullable()->after('nama_proker');
            $table->text('sasaran')->nullable()->after('tujuan');
            $table->text('output_kegiatan')->nullable()->after('sasaran');
            $table->string('status_pengajuan')->default('draft')->after('status');
            $table->text('kendala')->nullable()->after('keterangan');
            $table->text('solusi')->nullable()->after('kendala');
            $table->text('saran')->nullable()->after('solusi');
        });

        // Backfill nama_proker from deskripsi for existing records
        DB::statement("UPDATE proker SET nama_proker = deskripsi WHERE nama_proker IS NULL OR nama_proker = ''");

        // 2. Create proker_parameter table
        Schema::create('proker_parameter', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('proker_id')->constrained('proker')->cascadeOnDelete();
            $table->string('nama_parameter');
            $table->unsignedSmallInteger('bobot')->default(0); // 0-100 (%)
            $table->unsignedSmallInteger('capaian')->nullable(); // filled during LPJ
            $table->unsignedSmallInteger('urutan')->default(0);
            $table->timestamps();
        });

        // 3. Create proker_dokumentasi table
        Schema::create('proker_dokumentasi', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('proker_id')->constrained('proker')->cascadeOnDelete();
            $table->string('judul');
            $table->string('file_path');
            $table->foreignUuid('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // 4. Create proker_pj table (penanggung jawab)
        Schema::create('proker_pj', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('proker_id')->constrained('proker')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['proker_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('proker_pj');
        Schema::dropIfExists('proker_dokumentasi');
        Schema::dropIfExists('proker_parameter');

        Schema::table('proker', function (Blueprint $table) {
            $table->dropColumn([
                'nama_proker',
                'tujuan',
                'sasaran',
                'output_kegiatan',
                'status_pengajuan',
                'kendala',
                'solusi',
                'saran',
            ]);
        });
    }
};

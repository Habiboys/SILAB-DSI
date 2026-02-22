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
        if (!Schema::hasTable('pertemuan_praktikum')) {
            Schema::create('pertemuan_praktikum', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('praktikum_id');
                $table->string('judul');
                $table->text('deskripsi')->nullable();
                $table->dateTime('tanggal')->nullable();
                $table->timestamps();
                
                $table->foreign('praktikum_id')->references('id')->on('praktikum')->onDelete('cascade');
            });
        }

        if (!Schema::hasTable('modul_praktikum')) {
            Schema::create('modul_praktikum', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('pertemuan_id');
                $table->string('judul');
                $table->string('file_path');
                $table->boolean('is_published')->default(true);
                $table->timestamps();

                $table->foreign('pertemuan_id')->references('id')->on('pertemuan_praktikum')->onDelete('cascade');
            });
        }

        if (!Schema::hasTable('absensi_praktikan')) {
            Schema::create('absensi_praktikan', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('pertemuan_id');
                $table->uuid('praktikan_id');
                $table->enum('status', ['hadir', 'sakit', 'izin', 'alpa'])->default('alpa');
                $table->dateTime('waktu_absen')->nullable();
                $table->string('keterangan')->nullable();
                $table->timestamps();

                $table->foreign('pertemuan_id')->references('id')->on('pertemuan_praktikum')->onDelete('cascade');
                $table->foreign('praktikan_id')->references('id')->on('praktikan')->onDelete('cascade');
            });
        }

        if (!Schema::hasTable('absensi_aslab')) {
            Schema::create('absensi_aslab', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('pertemuan_id');
                $table->uuid('user_id');
                $table->enum('status', ['hadir', 'sakit', 'izin', 'alpa'])->default('alpa');
                $table->dateTime('waktu_absen')->nullable();
                $table->string('keterangan')->nullable();
                $table->timestamps();

                $table->foreign('pertemuan_id')->references('id')->on('pertemuan_praktikum')->onDelete('cascade');
                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('absensi_aslab');
        Schema::dropIfExists('absensi_praktikan');
        Schema::dropIfExists('modul_praktikum');
        Schema::dropIfExists('pertemuan_praktikum');
    }
};

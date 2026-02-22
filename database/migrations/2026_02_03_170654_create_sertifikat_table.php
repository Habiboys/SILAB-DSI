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
        Schema::create('sertifikat', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nomor_sertifikat')->unique();
            $table->enum('jenis_sertifikat', ['asisten', 'praktikan', 'kepengurusan']);
            $table->uuid('user_id');
            $table->uuid('kepengurusan_lab_id')->nullable();
            $table->uuid('praktikum_id')->nullable(); // Jika sertifikat praktikum
            $table->date('tanggal_terbit');
            $table->string('file_path');
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('user_id')->references('id')->on('users');
            $table->foreign('kepengurusan_lab_id')->references('id')->on('kepengurusan_lab');
            $table->foreign('praktikum_id')->references('id')->on('praktikum');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sertifikat');
    }
};

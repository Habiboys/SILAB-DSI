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
        Schema::create('sertifikat_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nama');
            $table->string('file_path');
            $table->enum('kategori', ['kegiatan', 'praktikum', 'aslab', 'umum']);
            $table->uuid('ref_id')->nullable(); // Reference ID (e.g., lab_id, praktikum_id, kegiatan_id)
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sertifikat_templates');
    }
};

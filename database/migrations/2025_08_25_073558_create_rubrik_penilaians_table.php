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
        Schema::create('rubrik_penilaian', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('tugas_praktikum_id');
            $table->string('nama_rubrik');
            $table->text('deskripsi')->nullable();
            $table->decimal('bobot_total', 5, 2)->default(100.00); // Total bobot semua komponen
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            // Foreign key
            $table->foreign('tugas_praktikum_id')->references('id')->on('tugas_praktikum')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rubrik_penilaian');
    }
};

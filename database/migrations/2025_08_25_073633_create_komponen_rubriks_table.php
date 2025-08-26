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
        Schema::create('komponen_rubrik', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('rubrik_penilaian_id');
            $table->string('nama_komponen');
            $table->text('deskripsi')->nullable();
            $table->decimal('bobot', 5, 2); // Bobot dalam persen (0-100)
            $table->decimal('nilai_maksimal', 5, 2)->default(100.00);
            $table->integer('urutan')->default(1);
            $table->timestamps();
            
            // Foreign key
            $table->foreign('rubrik_penilaian_id')->references('id')->on('rubrik_penilaian')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('komponen_rubrik');
    }
};

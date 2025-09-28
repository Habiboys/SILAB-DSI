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
        Schema::create('nominal_kas', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('kepengurusan_lab_id');
            $table->decimal('nominal', 10, 2); // Nominal kas per periode
            $table->enum('periode', ['mingguan', 'bulanan']); // Periode pembayaran
            $table->boolean('is_active')->default(true); // Status aktif
            $table->text('deskripsi')->nullable(); // Deskripsi tambahan
            $table->timestamps();
            
            // Foreign key constraint
            $table->foreign('kepengurusan_lab_id')->references('id')->on('kepengurusan_lab')->onDelete('cascade');
            
            // Index untuk performa
            $table->index(['kepengurusan_lab_id', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('nominal_kas');
    }
};

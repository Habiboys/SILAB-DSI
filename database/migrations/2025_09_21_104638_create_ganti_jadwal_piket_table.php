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
        Schema::create('ganti_jadwal_piket', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('jadwal_piket_id'); // Jadwal asli asisten
            $table->uuid('periode_piket_id'); // Periode aktif (auto-filled)
            $table->uuid('user_id'); // Asisten yang request
            $table->string('hari_lama'); // Hari asli (senin, selasa, dll)
            $table->string('hari_baru'); // Hari pengganti
            $table->text('alasan'); // Alasan wajib diisi
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->uuid('approved_by')->nullable(); // Admin yang approve
            $table->timestamp('approved_at')->nullable();
            $table->text('catatan_admin')->nullable(); // Catatan dari admin
            $table->timestamps();
            
            // Foreign key constraints
            $table->foreign('jadwal_piket_id')->references('id')->on('jadwal_piket')->onDelete('cascade');
            $table->foreign('periode_piket_id')->references('id')->on('periode_piket')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('approved_by')->references('id')->on('users')->onDelete('set null');
            
            // Index untuk performa
            $table->index(['periode_piket_id', 'status']);
            $table->index(['user_id', 'status']);
            $table->index(['status', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ganti_jadwal_piket');
    }
};

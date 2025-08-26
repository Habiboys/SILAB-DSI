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
        Schema::create('nilai_rubrik', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('pengumpulan_tugas_id')->nullable(); // Bisa null untuk nilai tanpa pengumpulan
            $table->string('komponen_rubrik_id');
            $table->string('praktikan_id');
            $table->decimal('nilai', 5, 2); // Nilai yang diberikan untuk komponen ini
            $table->text('catatan')->nullable();
            $table->string('dinilai_oleh'); // User ID yang memberikan nilai
            $table->timestamp('dinilai_at')->useCurrent();
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('pengumpulan_tugas_id')->references('id')->on('pengumpulan_tugas')->onDelete('cascade');
            $table->foreign('komponen_rubrik_id')->references('id')->on('komponen_rubrik')->onDelete('cascade');
            $table->foreign('praktikan_id')->references('id')->on('praktikan')->onDelete('cascade');
            $table->foreign('dinilai_oleh')->references('id')->on('users')->onDelete('cascade');
            
            // Unique constraint untuk mencegah duplikasi penilaian komponen per praktikan
            $table->unique(['komponen_rubrik_id', 'praktikan_id'], 'unique_komponen_praktikan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('nilai_rubrik');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('disposisi_surat', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('surat_masuk_id')
                  ->constrained('surat_masuk')
                  ->cascadeOnDelete();
            $table->foreignUuid('dari_user_id')
                  ->constrained('users')
                  ->restrictOnDelete();
            $table->foreignUuid('kepada_user_id')
                  ->constrained('users')
                  ->restrictOnDelete();
            $table->text('catatan')->nullable();
            $table->enum('status', ['belum_dibaca', 'sudah_dibaca', 'selesai'])
                  ->default('belum_dibaca');
            $table->timestamp('dibaca_at')->nullable();
            $table->timestamp('diselesaikan_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('disposisi_surat');
    }
};

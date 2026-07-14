<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('denda_piket', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('periode_piket_id')->constrained('periode_piket')->cascadeOnDelete();
            $table->foreignUuid('kepengurusan_lab_id')->constrained('kepengurusan_lab')->cascadeOnDelete();
            $table->decimal('total_denda', 12, 2)->default(0);
            $table->decimal('sudah_dibayar', 12, 2)->default(0);
            $table->enum('status', ['belum_lunas', 'lunas'])->default('belum_lunas');
            $table->timestamps();
            $table->unique(['user_id', 'periode_piket_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('denda_piket');
    }
};

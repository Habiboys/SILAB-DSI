<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('aslab_praktikum')) return;
        Schema::create('aslab_praktikum', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('praktikum_id')->constrained('praktikum')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->text('catatan')->nullable();
            $table->timestamps();
            $table->unique(['praktikum_id', 'user_id']);
        });
    }

    public function down(): void
    {
        // Tabel ini juga dapat berasal dari instalasi lama; rollback tidak menghapus penugasan yang sudah ada.
    }
};

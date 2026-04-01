<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pengaturan_piket', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('kepengurusan_lab_id')
                ->unique()
                ->constrained('kepengurusan_lab')
                ->onDelete('cascade');
            $table->boolean('ada_denda')->default(false);
            // nominal_denda dalam rupiah, null jika tidak ada denda
            $table->decimal('nominal_denda', 12, 2)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pengaturan_piket');
    }
};

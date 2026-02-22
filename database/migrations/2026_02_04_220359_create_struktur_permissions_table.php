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
        Schema::create('struktur_permissions', function (Blueprint $table) {
            $table->id();
            $table->string('jabatan'); // e.g., "Kalab", "Bendahara", "Sekretaris"
            $table->string('permission'); // e.g., "keuangan.create"
            $table->text('description')->nullable(); // Optional description
            $table->timestamps();
            
            // Ensure unique jabatan-permission combination
            $table->unique(['jabatan', 'permission']);
            
            // Index for faster lookups
            $table->index('jabatan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('struktur_permissions');
    }
};

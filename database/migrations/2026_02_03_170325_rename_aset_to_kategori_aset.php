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
        Schema::rename('aset', 'kategori_aset');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::rename('kategori_aset', 'aset');
    }
};

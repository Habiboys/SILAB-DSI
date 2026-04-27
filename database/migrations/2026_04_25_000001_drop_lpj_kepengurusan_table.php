<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('lpj_kepengurusan');
    }

    public function down(): void
    {
        // Recreate removed in down() — see original migration if needed
    }
};

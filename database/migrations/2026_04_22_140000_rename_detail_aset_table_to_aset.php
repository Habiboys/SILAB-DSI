<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('detail_aset') && !Schema::hasTable('aset')) {
            Schema::rename('detail_aset', 'aset');
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('aset') && !Schema::hasTable('detail_aset')) {
            Schema::rename('aset', 'detail_aset');
        }
    }
};

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
        Schema::table('detail_aset', function (Blueprint $table) {
            $table->renameColumn('aset_id', 'kategori_aset_id');
            $table->string('qr_code_path')->nullable()->after('foto');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('detail_aset', function (Blueprint $table) {
            $table->dropColumn('qr_code_path');
            $table->renameColumn('kategori_aset_id', 'aset_id');
        });
    }
};

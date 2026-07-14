<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pemasukan_keuangan', function (Blueprint $table) {
            $table->foreignUuid('denda_piket_id')
                ->nullable()
                ->after('nominal_kas_id')
                ->constrained('denda_piket')
                ->nullOnDelete();

            $table->foreignUuid('tagihan_kas_id')
                ->nullable()
                ->after('denda_piket_id')
                ->constrained('tagihan_kas')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('pemasukan_keuangan', function (Blueprint $table) {
            $table->dropForeign(['tagihan_kas_id']);
            $table->dropForeign(['denda_piket_id']);
            $table->dropColumn(['denda_piket_id', 'tagihan_kas_id']);
        });
    }
};

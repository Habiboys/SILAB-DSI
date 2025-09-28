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
        Schema::table('riwayat_keuangan', function (Blueprint $table) {
            $table->enum('jenis_pembayaran_kas', ['normal', 'lebih'])->nullable()->after('is_uang_kas');
            $table->text('catatan_pembayaran')->nullable()->after('jenis_pembayaran_kas');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('riwayat_keuangan', function (Blueprint $table) {
            $table->dropColumn(['jenis_pembayaran_kas', 'catatan_pembayaran']);
        });
    }
};

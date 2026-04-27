<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Normalisasi data lama agar kompatibel dengan enum baru
        DB::table('pemasukan_keuangan')
            ->whereNotNull('jenis_pembayaran_kas')
            ->whereNotIn('jenis_pembayaran_kas', ['normal', 'lebih'])
            ->update(['jenis_pembayaran_kas' => null]);

        DB::statement("\n            ALTER TABLE pemasukan_keuangan\n            MODIFY jenis_pembayaran_kas ENUM('normal','lebih') NULL\n        ");
    }

    public function down(): void
    {
        DB::statement("\n            ALTER TABLE pemasukan_keuangan\n            MODIFY jenis_pembayaran_kas VARCHAR(255) NULL\n        ");
    }
};

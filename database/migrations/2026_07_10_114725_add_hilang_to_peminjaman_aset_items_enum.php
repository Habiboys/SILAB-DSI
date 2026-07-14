<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE peminjaman_aset_items MODIFY COLUMN kondisi_setelah_kembali ENUM('baik', 'rusak', 'hilang') NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE peminjaman_aset_items MODIFY COLUMN kondisi_setelah_kembali ENUM('baik', 'rusak') NULL");
    }
};

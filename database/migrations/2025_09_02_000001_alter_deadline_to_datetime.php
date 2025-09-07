<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Ubah tipe kolom deadline menjadi DATETIME agar jam-menit tersimpan
        DB::statement('ALTER TABLE tugas_praktikum MODIFY deadline DATETIME NOT NULL');
    }

    public function down(): void
    {
        // Kembalikan ke DATE jika dibutuhkan rollback
        DB::statement('ALTER TABLE tugas_praktikum MODIFY deadline DATE NOT NULL');
    }
};



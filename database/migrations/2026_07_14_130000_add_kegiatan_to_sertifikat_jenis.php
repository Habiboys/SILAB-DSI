<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE `sertifikat` MODIFY `jenis_sertifikat` ENUM('asisten','praktikan','kepengurusan','kegiatan') NOT NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE `sertifikat` MODIFY `jenis_sertifikat` ENUM('asisten','praktikan','kepengurusan') NOT NULL");
    }
};

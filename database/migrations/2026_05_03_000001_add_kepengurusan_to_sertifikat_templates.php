<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE `sertifikat_templates` MODIFY `kategori` ENUM('kegiatan','praktikum','aslab','umum','kepengurusan') NOT NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE `sertifikat_templates` MODIFY `kategori` ENUM('kegiatan','praktikum','aslab','umum') NOT NULL");
    }
};

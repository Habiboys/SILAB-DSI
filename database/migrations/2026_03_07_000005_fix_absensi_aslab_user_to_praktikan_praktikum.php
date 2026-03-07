<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $columns = DB::select('SHOW COLUMNS FROM `absensi_aslab`');
        $columnNames = array_column($columns, 'Field');

        // 1. ADD aslab_praktikum_id FIRST (nullable) — BEFORE dropping user_id agar bisa populate
        if (!in_array('aslab_praktikum_id', $columnNames)) {
            DB::statement('ALTER TABLE `absensi_aslab` ADD `aslab_praktikum_id` bigint unsigned NULL AFTER `pertemuan_id`');
        } else {
            // Pastikan type benar (mungkin dari partial run)
            DB::statement('ALTER TABLE `absensi_aslab` MODIFY `aslab_praktikum_id` bigint unsigned NULL');
        }

        // 2. POPULATE aslab_praktikum_id dari user_id (selama user_id masih ada)
        //    absensi_aslab.pertemuan_id → pertemuan_praktikum.kelas_id → kelas.praktikum_id → aslab_praktikum.praktikum_id
        //    dan cocokkan user_id
        if (in_array('user_id', $columnNames)) {
            DB::statement("
                UPDATE `absensi_aslab` aa
                JOIN `pertemuan_praktikum` pp ON pp.id = aa.pertemuan_id
                JOIN `kelas` k ON k.id = pp.kelas_id
                JOIN `aslab_praktikum` ap ON ap.user_id = aa.user_id AND ap.praktikum_id = k.praktikum_id
                SET aa.aslab_praktikum_id = ap.id
                WHERE aa.aslab_praktikum_id IS NULL
            ");
        }

        // 3. Hapus baris yang tidak bisa di-mapping (aslab tidak ditemukan di kelas yang sesuai)
        DB::statement('DELETE FROM `absensi_aslab` WHERE `aslab_praktikum_id` IS NULL OR `aslab_praktikum_id` NOT IN (SELECT `id` FROM `aslab_praktikum`)');

        // 4. Drop user_id (SETELAH populate, aman sekarang)
        $freshCols = array_column(DB::select('SHOW COLUMNS FROM `absensi_aslab`'), 'Field');
        if (in_array('user_id', $freshCols)) {
            $fks = DB::select("SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_NAME='absensi_aslab' AND CONSTRAINT_TYPE='FOREIGN KEY' AND TABLE_SCHEMA=DATABASE()");
            $fkNames = array_column($fks, 'CONSTRAINT_NAME');
            if (in_array('absensi_aslab_user_id_foreign', $fkNames)) {
                DB::statement('ALTER TABLE `absensi_aslab` DROP FOREIGN KEY `absensi_aslab_user_id_foreign`');
            }
            DB::statement('ALTER TABLE `absensi_aslab` DROP COLUMN `user_id`');
        }

        // 5. Make column NOT NULL now that orphans are removed and user_id is dropped
        DB::statement('ALTER TABLE `absensi_aslab` MODIFY `aslab_praktikum_id` bigint unsigned NOT NULL');

        // 6. Add FK to aslab_praktikum
        $fks = DB::select("SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_NAME='absensi_aslab' AND CONSTRAINT_TYPE='FOREIGN KEY' AND TABLE_SCHEMA=DATABASE()");
        $fkNames = array_column($fks, 'CONSTRAINT_NAME');
        if (!in_array('absensi_aslab_aslab_praktikum_id_foreign', $fkNames)) {
            Schema::table('absensi_aslab', function (Blueprint $table) {
                $table->foreign('aslab_praktikum_id')
                      ->references('id')
                      ->on('aslab_praktikum')
                      ->onDelete('cascade');
            });
        }
    }

    public function down(): void
    {
        Schema::table('absensi_aslab', function (Blueprint $table) {
            $table->dropForeign(['aslab_praktikum_id']);
            $table->dropColumn('aslab_praktikum_id');

            $table->uuid('user_id')->after('pertemuan_id');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }
};

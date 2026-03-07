<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $columns = DB::select('SHOW COLUMNS FROM `pengumpulan_tugas`');
        $columnNames = array_column($columns, 'Field');
        $hasPraktikanId = in_array('praktikan_id', $columnNames);
        $hasPraktikanPraktikumId = in_array('praktikan_praktikum_id', $columnNames);

        // 1. ADD praktikan_praktikum_id FIRST (nullable) — BEFORE drop praktikan_id agar bisa populate
        if (!$hasPraktikanPraktikumId) {
            DB::statement('ALTER TABLE `pengumpulan_tugas` ADD `praktikan_praktikum_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL AFTER `tugas_praktikum_id`');
        } else {
            // Pastikan type & charset benar, dan nullable untuk sementara
            DB::statement('ALTER TABLE `pengumpulan_tugas` MODIFY `praktikan_praktikum_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL');
        }

        // 2. POPULATE praktikan_praktikum_id dari praktikan_id (selama praktikan_id masih ada)
        //    Caranya: join tugas_praktikum untuk dapat kelas_id, lalu cari praktikan_praktikum yang sesuai
        if ($hasPraktikanId) {
            DB::statement("
                UPDATE `pengumpulan_tugas` pt
                JOIN `tugas_praktikum` tp ON tp.id = pt.tugas_praktikum_id
                JOIN `praktikan_praktikum` pp ON pp.praktikan_id = pt.praktikan_id AND pp.kelas_id = tp.kelas_id
                SET pt.praktikan_praktikum_id = pp.id
                WHERE pt.praktikan_praktikum_id IS NULL
            ");
        }

        // 3. Hapus baris yang tidak bisa di-mapping (praktikan tidak terdaftar di kelas yang sesuai)
        DB::statement('DELETE FROM `pengumpulan_tugas` WHERE `praktikan_praktikum_id` IS NULL OR `praktikan_praktikum_id` NOT IN (SELECT `id` FROM `praktikan_praktikum`)');

        // 4. Drop praktikan_id beserta FK dan unique index lamanya (SETELAH populate)
        if ($hasPraktikanId) {
            $fks = DB::select("SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_NAME='pengumpulan_tugas' AND CONSTRAINT_TYPE='FOREIGN KEY' AND TABLE_SCHEMA=DATABASE()");
            $fkNames = array_column($fks, 'CONSTRAINT_NAME');

            // Drop tugas_praktikum_id FK dulu (ada di unique index lama)
            if (in_array('pengumpulan_tugas_tugas_praktikum_id_foreign', $fkNames)) {
                DB::statement('ALTER TABLE `pengumpulan_tugas` DROP FOREIGN KEY `pengumpulan_tugas_tugas_praktikum_id_foreign`');
            }

            // Drop unique index lama (tugas_praktikum_id, praktikan_id)
            $idxOld = DB::select("SHOW INDEX FROM `pengumpulan_tugas` WHERE Key_name = 'pengumpulan_tugas_tugas_praktikum_id_praktikan_id_unique'");
            if (!empty($idxOld)) {
                DB::statement('ALTER TABLE `pengumpulan_tugas` DROP INDEX `pengumpulan_tugas_tugas_praktikum_id_praktikan_id_unique`');
            }

            // Drop praktikan_id FK
            if (in_array('pengumpulan_tugas_praktikan_id_foreign', $fkNames)) {
                DB::statement('ALTER TABLE `pengumpulan_tugas` DROP FOREIGN KEY `pengumpulan_tugas_praktikan_id_foreign`');
            }

            // Drop kolom praktikan_id
            DB::statement('ALTER TABLE `pengumpulan_tugas` DROP COLUMN `praktikan_id`');
        }

        // 5. Set NOT NULL sekarang data sudah terisi
        DB::statement('ALTER TABLE `pengumpulan_tugas` MODIFY `praktikan_praktikum_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL');

        // 6. Add FK baru dan unique index
        Schema::table('pengumpulan_tugas', function (Blueprint $table) {
            $constraints = DB::select("SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_NAME = 'pengumpulan_tugas' AND CONSTRAINT_TYPE = 'FOREIGN KEY' AND TABLE_SCHEMA = DATABASE()");
            $constraintNames = array_column($constraints, 'CONSTRAINT_NAME');

            if (!in_array('pengumpulan_tugas_tugas_praktikum_id_foreign', $constraintNames)) {
                $table->foreign('tugas_praktikum_id')
                      ->references('id')
                      ->on('tugas_praktikum')
                      ->onDelete('cascade');
            }

            if (!in_array('pengumpulan_tugas_praktikan_praktikum_id_foreign', $constraintNames)) {
                $table->foreign('praktikan_praktikum_id')
                      ->references('id')
                      ->on('praktikan_praktikum')
                      ->onDelete('cascade');
            }

            // Nama pendek untuk menghindari error identifier too long (batas MySQL 64 char)
            $idxNew = DB::select("SHOW INDEX FROM `pengumpulan_tugas` WHERE Key_name = 'pt_unique_tugas_praktikan'");
            if (empty($idxNew)) {
                DB::statement('ALTER TABLE `pengumpulan_tugas` ADD UNIQUE `pt_unique_tugas_praktikan` (`tugas_praktikum_id`, `praktikan_praktikum_id`)');
            }
        });
    }

    public function down(): void
    {
        Schema::table('pengumpulan_tugas', function (Blueprint $table) {
            $table->dropUnique(['tugas_praktikum_id', 'praktikan_praktikum_id']);
            $table->dropForeign(['praktikan_praktikum_id']);
            $table->dropColumn('praktikan_praktikum_id');

            $table->uuid('praktikan_id')->after('tugas_praktikum_id');
            $table->foreign('praktikan_id')->references('id')->on('praktikan')->onDelete('cascade');
            $table->unique(['tugas_praktikum_id', 'praktikan_id']);
        });
    }
};

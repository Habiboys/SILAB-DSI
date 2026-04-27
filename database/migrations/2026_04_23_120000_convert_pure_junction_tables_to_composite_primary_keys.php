<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->convertProkerPj();
        $this->convertStrukturPermissions();
        $this->convertTargetKuesioner();
        $this->convertPengaturanPiket();
        $this->convertKonfigurasiSurat();
        $this->enforceUserPraktikanOneToOne();
    }

    public function down(): void
    {
        $this->rollbackUserPraktikanOneToOne();
        $this->rollbackKonfigurasiSurat();
        $this->rollbackPengaturanPiket();
        $this->rollbackProkerPj();
        $this->rollbackStrukturPermissions();
        $this->rollbackTargetKuesioner();
    }

    private function convertProkerPj(): void
    {
        if (!Schema::hasTable('proker_pj')) {
            return;
        }

        if (Schema::hasColumn('proker_pj', 'id')) {
            $this->dropPrimaryKeyIfExists('proker_pj');
            DB::statement('ALTER TABLE `proker_pj` DROP COLUMN `id`');
        }

        if (!$this->hasPrimaryKey('proker_pj')) {
            DB::statement('ALTER TABLE `proker_pj` ADD PRIMARY KEY (`proker_id`, `user_id`)');
        }
    }

    private function convertStrukturPermissions(): void
    {
        if (!Schema::hasTable('struktur_permissions')) {
            return;
        }

        if (Schema::hasColumn('struktur_permissions', 'id')) {
            DB::statement('ALTER TABLE `struktur_permissions` DROP COLUMN `id`');
        }

        if (!$this->hasPrimaryKey('struktur_permissions')) {
            DB::statement('ALTER TABLE `struktur_permissions` ADD PRIMARY KEY (`struktur_id`, `permission_id`)');
        }
    }

    private function convertTargetKuesioner(): void
    {
        if (!Schema::hasTable('target_kuesioner')) {
            return;
        }

        // Ensure unique pairs before converting to composite PK.
        if (Schema::hasColumn('target_kuesioner', 'id')) {
            DB::statement('DELETE FROM `target_kuesioner` WHERE `id` NOT IN (SELECT `keep_id` FROM (SELECT MIN(`id`) AS `keep_id` FROM `target_kuesioner` GROUP BY `kuesioner_id`, `role_id`) AS `x`)');

            $this->dropPrimaryKeyIfExists('target_kuesioner');
            DB::statement('ALTER TABLE `target_kuesioner` DROP COLUMN `id`');
        }

        if (!$this->hasPrimaryKey('target_kuesioner')) {
            DB::statement('ALTER TABLE `target_kuesioner` ADD PRIMARY KEY (`kuesioner_id`, `role_id`)');
        }
    }

    private function convertPengaturanPiket(): void
    {
        if (!Schema::hasTable('pengaturan_piket')) {
            return;
        }

        // Ensure 1 row per kepengurusan_lab_id before switching PK.
        if (Schema::hasColumn('pengaturan_piket', 'id')) {
            DB::statement('DELETE FROM `pengaturan_piket` WHERE `id` NOT IN (SELECT `keep_id` FROM (SELECT MIN(`id`) AS `keep_id` FROM `pengaturan_piket` GROUP BY `kepengurusan_lab_id`) AS `x`)');

            $this->dropPrimaryKeyIfExists('pengaturan_piket');
            DB::statement('ALTER TABLE `pengaturan_piket` DROP COLUMN `id`');
        }

        if (!$this->hasPrimaryKey('pengaturan_piket')) {
            DB::statement('ALTER TABLE `pengaturan_piket` ADD PRIMARY KEY (`kepengurusan_lab_id`)');
        }
    }

    private function convertKonfigurasiSurat(): void
    {
        if (!Schema::hasTable('konfigurasi_surat')) {
            return;
        }

        // Ensure 1 row per kepengurusan_lab_id before switching PK.
        if (Schema::hasColumn('konfigurasi_surat', 'id')) {
            DB::statement('DELETE FROM `konfigurasi_surat` WHERE `id` NOT IN (SELECT `keep_id` FROM (SELECT MIN(`id`) AS `keep_id` FROM `konfigurasi_surat` GROUP BY `kepengurusan_lab_id`) AS `x`)');

            $this->dropPrimaryKeyIfExists('konfigurasi_surat');
            DB::statement('ALTER TABLE `konfigurasi_surat` DROP COLUMN `id`');
        }

        if (!$this->hasPrimaryKey('konfigurasi_surat')) {
            DB::statement('ALTER TABLE `konfigurasi_surat` ADD PRIMARY KEY (`kepengurusan_lab_id`)');
        }
    }

    private function enforceUserPraktikanOneToOne(): void
    {
        if (!Schema::hasTable('praktikan') || !Schema::hasColumn('praktikan', 'user_id')) {
            return;
        }

        // Merge duplicate praktikan rows per user_id to preserve relational data.
        $duplicates = DB::table('praktikan')
            ->select('user_id', DB::raw('COUNT(*) as total'))
            ->whereNotNull('user_id')
            ->groupBy('user_id')
            ->having('total', '>', 1)
            ->pluck('user_id');

        foreach ($duplicates as $userId) {
            $ids = DB::table('praktikan')
                ->where('user_id', $userId)
                ->orderBy('updated_at', 'desc')
                ->orderBy('created_at', 'desc')
                ->pluck('id')
                ->values();

            if ($ids->count() <= 1) {
                continue;
            }

            $keepId = $ids->first();
            $loserIds = $ids->slice(1)->all();

            if (Schema::hasTable('praktikan_praktikum')) {
                foreach ($loserIds as $loserId) {
                    DB::statement(
                        'DELETE pp FROM `praktikan_praktikum` pp '
                        . 'INNER JOIN `praktikan_praktikum` keep_pp ON keep_pp.`praktikan_id` = ? AND keep_pp.`praktikum_id` = pp.`praktikum_id` '
                        . 'WHERE pp.`praktikan_id` = ?',
                        [$keepId, $loserId]
                    );

                    DB::table('praktikan_praktikum')
                        ->where('praktikan_id', $loserId)
                        ->update(['praktikan_id' => $keepId]);
                }
            }

            foreach (['pengumpulan_tugas', 'nilai_rubrik', 'nilai_tambahan', 'absensi_praktikan'] as $table) {
                if (Schema::hasTable($table) && Schema::hasColumn($table, 'praktikan_id')) {
                    foreach ($loserIds as $loserId) {
                        DB::table($table)
                            ->where('praktikan_id', $loserId)
                            ->update(['praktikan_id' => $keepId]);
                    }
                }
            }

            DB::table('praktikan')->whereIn('id', $loserIds)->delete();
        }

        if (!$this->hasIndex('praktikan', 'praktikan_user_id_unique')) {
            DB::statement('ALTER TABLE `praktikan` ADD UNIQUE KEY `praktikan_user_id_unique` (`user_id`)');
        }
    }

    private function rollbackProkerPj(): void
    {
        if (!Schema::hasTable('proker_pj')) {
            return;
        }

        if ($this->hasPrimaryKey('proker_pj')) {
            DB::statement('ALTER TABLE `proker_pj` DROP PRIMARY KEY');
        }

        if (!Schema::hasColumn('proker_pj', 'id')) {
            DB::statement('ALTER TABLE `proker_pj` ADD COLUMN `id` CHAR(36) NULL FIRST');
            DB::statement('UPDATE `proker_pj` SET `id` = UUID() WHERE `id` IS NULL');
            DB::statement('ALTER TABLE `proker_pj` MODIFY `id` CHAR(36) NOT NULL');
            DB::statement('ALTER TABLE `proker_pj` ADD PRIMARY KEY (`id`)');
        }

        if (!$this->hasIndex('proker_pj', 'proker_pj_proker_id_user_id_unique')) {
            DB::statement('ALTER TABLE `proker_pj` ADD UNIQUE KEY `proker_pj_proker_id_user_id_unique` (`proker_id`, `user_id`)');
        }
    }

    private function rollbackStrukturPermissions(): void
    {
        if (!Schema::hasTable('struktur_permissions')) {
            return;
        }

        if ($this->hasPrimaryKey('struktur_permissions')) {
            DB::statement('ALTER TABLE `struktur_permissions` DROP PRIMARY KEY');
        }

        if (!Schema::hasColumn('struktur_permissions', 'id')) {
            DB::statement('ALTER TABLE `struktur_permissions` ADD COLUMN `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST');
        }

        if (!$this->hasIndex('struktur_permissions', 'struktur_permissions_struktur_id_permission_id_unique')) {
            DB::statement('ALTER TABLE `struktur_permissions` ADD UNIQUE KEY `struktur_permissions_struktur_id_permission_id_unique` (`struktur_id`, `permission_id`)');
        }
    }

    private function rollbackTargetKuesioner(): void
    {
        if (!Schema::hasTable('target_kuesioner')) {
            return;
        }

        if ($this->hasPrimaryKey('target_kuesioner')) {
            DB::statement('ALTER TABLE `target_kuesioner` DROP PRIMARY KEY');
        }

        if (!Schema::hasColumn('target_kuesioner', 'id')) {
            DB::statement('ALTER TABLE `target_kuesioner` ADD COLUMN `id` CHAR(36) NULL FIRST');
            DB::statement('UPDATE `target_kuesioner` SET `id` = UUID() WHERE `id` IS NULL');
            DB::statement('ALTER TABLE `target_kuesioner` MODIFY `id` CHAR(36) NOT NULL');
            DB::statement('ALTER TABLE `target_kuesioner` ADD PRIMARY KEY (`id`)');
        }
    }

    private function rollbackPengaturanPiket(): void
    {
        if (!Schema::hasTable('pengaturan_piket')) {
            return;
        }

        if ($this->hasPrimaryKey('pengaturan_piket')) {
            DB::statement('ALTER TABLE `pengaturan_piket` DROP PRIMARY KEY');
        }

        if (!Schema::hasColumn('pengaturan_piket', 'id')) {
            DB::statement('ALTER TABLE `pengaturan_piket` ADD COLUMN `id` CHAR(36) NULL FIRST');
            DB::statement('UPDATE `pengaturan_piket` SET `id` = UUID() WHERE `id` IS NULL');
            DB::statement('ALTER TABLE `pengaturan_piket` MODIFY `id` CHAR(36) NOT NULL');
            DB::statement('ALTER TABLE `pengaturan_piket` ADD PRIMARY KEY (`id`)');
        }
    }

    private function rollbackKonfigurasiSurat(): void
    {
        if (!Schema::hasTable('konfigurasi_surat')) {
            return;
        }

        if ($this->hasPrimaryKey('konfigurasi_surat')) {
            DB::statement('ALTER TABLE `konfigurasi_surat` DROP PRIMARY KEY');
        }

        if (!Schema::hasColumn('konfigurasi_surat', 'id')) {
            DB::statement('ALTER TABLE `konfigurasi_surat` ADD COLUMN `id` CHAR(36) NULL FIRST');
            DB::statement('UPDATE `konfigurasi_surat` SET `id` = UUID() WHERE `id` IS NULL');
            DB::statement('ALTER TABLE `konfigurasi_surat` MODIFY `id` CHAR(36) NOT NULL');
            DB::statement('ALTER TABLE `konfigurasi_surat` ADD PRIMARY KEY (`id`)');
        }
    }

    private function rollbackUserPraktikanOneToOne(): void
    {
        if (!Schema::hasTable('praktikan')) {
            return;
        }

        $this->dropIndexIfExists('praktikan', 'praktikan_user_id_unique');
    }

    private function hasPrimaryKey(string $table): bool
    {
        $rows = DB::select("SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_TYPE = 'PRIMARY KEY' LIMIT 1", [$table]);
        return !empty($rows);
    }

    private function dropPrimaryKeyIfExists(string $table): void
    {
        if ($this->hasPrimaryKey($table)) {
            DB::statement("ALTER TABLE `{$table}` DROP PRIMARY KEY");
        }
    }

    private function hasIndex(string $table, string $indexName): bool
    {
        $rows = DB::select("SHOW INDEX FROM `{$table}` WHERE Key_name = ?", [$indexName]);
        return !empty($rows);
    }

    private function dropIndexIfExists(string $table, string $indexName): void
    {
        if ($this->hasIndex($table, $indexName)) {
            DB::statement("ALTER TABLE `{$table}` DROP INDEX `{$indexName}`");
        }
    }
};

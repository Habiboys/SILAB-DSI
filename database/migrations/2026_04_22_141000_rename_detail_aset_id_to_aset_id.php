<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private function dropForeignKeysByColumn(string $table, string $column): void
    {
        $fks = DB::table('information_schema.KEY_COLUMN_USAGE')
            ->select('CONSTRAINT_NAME')
            ->where('TABLE_SCHEMA', DB::raw('DATABASE()'))
            ->where('TABLE_NAME', $table)
            ->where('COLUMN_NAME', $column)
            ->whereNotNull('REFERENCED_TABLE_NAME')
            ->pluck('CONSTRAINT_NAME');

        foreach ($fks as $fk) {
            DB::statement("ALTER TABLE `{$table}` DROP FOREIGN KEY `{$fk}`");
        }
    }

    public function up(): void
    {
        // peminjaman_aset.detail_aset_id -> peminjaman_aset.aset_id
        if (Schema::hasTable('peminjaman_aset')
            && Schema::hasColumn('peminjaman_aset', 'detail_aset_id')
            && !Schema::hasColumn('peminjaman_aset', 'aset_id')) {
            $this->dropForeignKeysByColumn('peminjaman_aset', 'detail_aset_id');
            DB::statement('ALTER TABLE `peminjaman_aset` CHANGE `detail_aset_id` `aset_id` CHAR(36) NOT NULL');
        }

        // riwayat_kondisi_aset.detail_aset_id -> riwayat_kondisi_aset.aset_id
        if (Schema::hasTable('riwayat_kondisi_aset')
            && Schema::hasColumn('riwayat_kondisi_aset', 'detail_aset_id')
            && !Schema::hasColumn('riwayat_kondisi_aset', 'aset_id')) {
            $this->dropForeignKeysByColumn('riwayat_kondisi_aset', 'detail_aset_id');
            DB::statement('ALTER TABLE `riwayat_kondisi_aset` CHANGE `detail_aset_id` `aset_id` CHAR(36) NOT NULL');
        }

        $targetTable = Schema::hasTable('aset') ? 'aset' : 'detail_aset';

        if (Schema::hasColumn('peminjaman_aset', 'aset_id')) {
            DB::statement("ALTER TABLE `peminjaman_aset` ADD CONSTRAINT `peminjaman_aset_aset_id_foreign` FOREIGN KEY (`aset_id`) REFERENCES `{$targetTable}` (`id`) ON DELETE CASCADE");
        }

        if (Schema::hasColumn('riwayat_kondisi_aset', 'aset_id')) {
            DB::statement("ALTER TABLE `riwayat_kondisi_aset` ADD CONSTRAINT `riwayat_kondisi_aset_aset_id_foreign` FOREIGN KEY (`aset_id`) REFERENCES `{$targetTable}` (`id`) ON DELETE CASCADE");
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('peminjaman_aset') && Schema::hasColumn('peminjaman_aset', 'aset_id')) {
            $this->dropForeignKeysByColumn('peminjaman_aset', 'aset_id');
            if (!Schema::hasColumn('peminjaman_aset', 'detail_aset_id')) {
                DB::statement('ALTER TABLE `peminjaman_aset` CHANGE `aset_id` `detail_aset_id` CHAR(36) NOT NULL');
            }
        }

        if (Schema::hasTable('riwayat_kondisi_aset') && Schema::hasColumn('riwayat_kondisi_aset', 'aset_id')) {
            $this->dropForeignKeysByColumn('riwayat_kondisi_aset', 'aset_id');
            if (!Schema::hasColumn('riwayat_kondisi_aset', 'detail_aset_id')) {
                DB::statement('ALTER TABLE `riwayat_kondisi_aset` CHANGE `aset_id` `detail_aset_id` CHAR(36) NOT NULL');
            }
        }

        $targetTable = Schema::hasTable('detail_aset') ? 'detail_aset' : 'aset';

        if (Schema::hasColumn('peminjaman_aset', 'detail_aset_id')) {
            DB::statement("ALTER TABLE `peminjaman_aset` ADD CONSTRAINT `peminjaman_aset_detail_aset_id_foreign` FOREIGN KEY (`detail_aset_id`) REFERENCES `{$targetTable}` (`id`) ON DELETE CASCADE");
        }

        if (Schema::hasColumn('riwayat_kondisi_aset', 'detail_aset_id')) {
            DB::statement("ALTER TABLE `riwayat_kondisi_aset` ADD CONSTRAINT `riwayat_kondisi_aset_detail_aset_id_foreign` FOREIGN KEY (`detail_aset_id`) REFERENCES `{$targetTable}` (`id`) ON DELETE CASCADE");
        }
    }
};

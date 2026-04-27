<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('nominal_kas', function (Blueprint $table) {
            $table->unique(['id', 'kepengurusan_lab_id'], 'uk_nominal_kas_id_kep');
        });

        Schema::table('pemasukan_keuangan', function (Blueprint $table) {
            $table->uuid('nominal_kas_id')->nullable()->after('kepengurusan_lab_id');
            $table->index('nominal_kas_id', 'idx_pemasukan_nominal_kas_id');
            $table->index(['nominal_kas_id', 'kepengurusan_lab_id'], 'idx_pemasukan_nominal_kep');
        });

        // Backfill data lama: relasikan pemasukan uang kas ke nominal kas aktif pada kepengurusan yang sama.
        DB::statement("\n            UPDATE pemasukan_keuangan pk\n            SET pk.nominal_kas_id = (\n                SELECT nk.id\n                FROM nominal_kas nk\n                WHERE nk.kepengurusan_lab_id = pk.kepengurusan_lab_id\n                  AND nk.is_active = 1\n                ORDER BY nk.updated_at DESC, nk.created_at DESC\n                LIMIT 1\n            )\n            WHERE pk.is_uang_kas = 1\n              AND pk.nominal_kas_id IS NULL\n        ");

        Schema::table('pemasukan_keuangan', function (Blueprint $table) {
            $table->foreign('nominal_kas_id', 'fk_pemasukan_nominal_kas_id')
                ->references('id')
                ->on('nominal_kas')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });

        // FK komposit untuk mencegah relasi silang antar kepengurusan lab.
        DB::statement("\n            ALTER TABLE pemasukan_keuangan\n            ADD CONSTRAINT fk_pemasukan_nominal_kep\n            FOREIGN KEY (nominal_kas_id, kepengurusan_lab_id)\n            REFERENCES nominal_kas (id, kepengurusan_lab_id)\n            ON UPDATE CASCADE\n            ON DELETE RESTRICT\n        ");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE pemasukan_keuangan DROP FOREIGN KEY fk_pemasukan_nominal_kep');

        Schema::table('pemasukan_keuangan', function (Blueprint $table) {
            $table->dropForeign('fk_pemasukan_nominal_kas_id');
            $table->dropIndex('idx_pemasukan_nominal_kas_id');
            $table->dropIndex('idx_pemasukan_nominal_kep');
            $table->dropColumn('nominal_kas_id');
        });

        Schema::table('nominal_kas', function (Blueprint $table) {
            $table->dropUnique('uk_nominal_kas_id_kep');
        });
    }
};

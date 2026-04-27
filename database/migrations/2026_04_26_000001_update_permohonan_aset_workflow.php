<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1) Transitional enum: allow old + new values to prevent truncation during data migration.
        DB::statement("
            ALTER TABLE permohonan_aset
            MODIFY COLUMN status_permohonan
                ENUM('draft','diajukan','disetujui','ditolak','disetujui_kalab','ditolak_kalab','disetujui_kadep','ditolak_kadep')
                NOT NULL DEFAULT 'draft'
        ");

        DB::statement("
            ALTER TABLE wishlist_aset
            MODIFY COLUMN status_item
                ENUM('draft','diajukan','disetujui','ditolak','disetujui_kalab','ditolak_kalab','disetujui_kadep','ditolak_kadep','dipesan','diterima')
                NOT NULL DEFAULT 'draft'
        ");

        // 2) Migrate existing data from legacy statuses.
        DB::statement("
            UPDATE permohonan_aset
            SET status_permohonan = CASE
                WHEN status_permohonan = 'disetujui' THEN 'disetujui_kadep'
                WHEN status_permohonan = 'ditolak'   THEN 'ditolak_kalab'
                ELSE status_permohonan
            END
        ");

        DB::statement("
            UPDATE wishlist_aset
            SET status_item = CASE
                WHEN status_item = 'disetujui' THEN 'disetujui_kadep'
                WHEN status_item = 'ditolak'   THEN 'ditolak_kalab'
                ELSE status_item
            END
        ");

        // 3) Final enum: keep only workflow statuses.
        DB::statement("
            ALTER TABLE permohonan_aset
            MODIFY COLUMN status_permohonan
                ENUM('draft','diajukan','disetujui_kalab','ditolak_kalab','disetujui_kadep','ditolak_kadep')
                NOT NULL DEFAULT 'draft'
        ");

        DB::statement("
            ALTER TABLE wishlist_aset
            MODIFY COLUMN status_item
                ENUM('draft','diajukan','disetujui_kalab','ditolak_kalab','disetujui_kadep','ditolak_kadep','dipesan','diterima')
                NOT NULL DEFAULT 'draft'
        ");

        // 4) Add Kalab review columns to permohonan_aset
        Schema::table('permohonan_aset', function (Blueprint $table) {
            $table->uuid('reviewed_by')->nullable()->after('approved_at');
            $table->timestamp('reviewed_at')->nullable()->after('reviewed_by');
            $table->text('catatan_review')->nullable()->after('reviewed_at');

            $table->foreign('reviewed_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('permohonan_aset', function (Blueprint $table) {
            $table->dropForeign(['reviewed_by']);
            $table->dropColumn(['reviewed_by', 'reviewed_at', 'catatan_review']);
        });

        DB::statement("
            ALTER TABLE permohonan_aset
            MODIFY COLUMN status_permohonan
                ENUM('diajukan','disetujui','ditolak')
                NOT NULL DEFAULT 'diajukan'
        ");

        DB::statement("
            ALTER TABLE wishlist_aset
            MODIFY COLUMN status_item
                ENUM('diajukan','disetujui','ditolak','dipesan','diterima')
                NOT NULL DEFAULT 'diajukan'
        ");
    }
};

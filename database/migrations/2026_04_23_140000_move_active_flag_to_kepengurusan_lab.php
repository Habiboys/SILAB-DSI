<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('kepengurusan_lab', 'is_active')) {
            Schema::table('kepengurusan_lab', function (Blueprint $table) {
                $table->boolean('is_active')->default(false)->after('sk');
                $table->index(['laboratorium_id', 'is_active'], 'kepengurusan_lab_lab_active_idx');
            });
        }

        // Backfill from legacy tahun_kepengurusan.isactive
        DB::statement("\n            UPDATE kepengurusan_lab kl\n            JOIN tahun_kepengurusan tk ON tk.id = kl.tahun_kepengurusan_id\n            SET kl.is_active = tk.isactive\n        ");
    }

    public function down(): void
    {
        if (Schema::hasColumn('kepengurusan_lab', 'is_active')) {
            Schema::table('kepengurusan_lab', function (Blueprint $table) {
                $table->dropIndex('kepengurusan_lab_lab_active_idx');
                $table->dropColumn('is_active');
            });
        }
    }
};

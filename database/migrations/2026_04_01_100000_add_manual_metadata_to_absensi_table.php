<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('absensi', function (Blueprint $table) {
            if (!Schema::hasColumn('absensi', 'is_manual')) {
                $table->boolean('is_manual')->default(false)->after('kegiatan');
            }

            if (!Schema::hasColumn('absensi', 'manual_input_by')) {
                $table->uuid('manual_input_by')->nullable()->after('is_manual');
                $table->foreign('manual_input_by')->references('id')->on('users')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('absensi', function (Blueprint $table) {
            if (Schema::hasColumn('absensi', 'manual_input_by')) {
                $table->dropForeign(['manual_input_by']);
                $table->dropColumn('manual_input_by');
            }

            if (Schema::hasColumn('absensi', 'is_manual')) {
                $table->dropColumn('is_manual');
            }
        });
    }
};

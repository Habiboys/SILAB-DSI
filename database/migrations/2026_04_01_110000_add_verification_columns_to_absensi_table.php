<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('absensi', function (Blueprint $table) {
            if (!Schema::hasColumn('absensi', 'verification_status')) {
                $table->string('verification_status', 20)->default('approved')->after('manual_input_by');
            }

            if (!Schema::hasColumn('absensi', 'verified_by')) {
                $table->uuid('verified_by')->nullable()->after('verification_status');
                $table->foreign('verified_by')->references('id')->on('users')->nullOnDelete();
            }

            if (!Schema::hasColumn('absensi', 'verified_at')) {
                $table->timestamp('verified_at')->nullable()->after('verified_by');
            }

            if (!Schema::hasColumn('absensi', 'verification_note')) {
                $table->text('verification_note')->nullable()->after('verified_at');
            }
        });

        DB::table('absensi')
            ->whereNull('verification_status')
            ->update(['verification_status' => 'approved']);
    }

    public function down(): void
    {
        Schema::table('absensi', function (Blueprint $table) {
            if (Schema::hasColumn('absensi', 'verified_by')) {
                $table->dropForeign(['verified_by']);
            }

            $dropColumns = [];
            foreach (['verification_note', 'verified_at', 'verified_by', 'verification_status'] as $column) {
                if (Schema::hasColumn('absensi', $column)) {
                    $dropColumns[] = $column;
                }
            }

            if (!empty($dropColumns)) {
                $table->dropColumn($dropColumns);
            }
        });
    }
};

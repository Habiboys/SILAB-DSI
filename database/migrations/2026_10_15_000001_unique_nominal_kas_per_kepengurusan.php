<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $duplicateIds = DB::table('nominal_kas')
            ->select('kepengurusan_lab_id')
            ->groupBy('kepengurusan_lab_id')
            ->havingRaw('COUNT(*) > 1')
            ->pluck('kepengurusan_lab_id');

        foreach ($duplicateIds as $kepengurusanLabId) {
            app(\App\Services\NominalKasSettings::class)->consolidate($kepengurusanLabId);
        }

        Schema::table('nominal_kas', function (Blueprint $table) {
            $table->unique('kepengurusan_lab_id');
        });
    }

    public function down(): void
    {
        Schema::table('nominal_kas', function (Blueprint $table) {
            $table->dropUnique(['kepengurusan_lab_id']);
        });
    }
};

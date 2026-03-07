<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Step 1: Copy foto → foto_checkin for old records that only had one photo
        // (before foto_checkin column was added — these rows have foto set but foto_checkin NULL)
        DB::statement("
            UPDATE absensi
            SET foto_checkin = foto
            WHERE foto_checkin IS NULL
              AND foto IS NOT NULL
        ");

        // Step 2: Rename foto → foto_checkout
        Schema::table('absensi', function (Blueprint $table) {
            $table->renameColumn('foto', 'foto_checkout');
        });

        // Step 3: Make foto_checkin NOT NULL
        // (safe now — all rows have been populated in step 1 above)
        Schema::table('absensi', function (Blueprint $table) {
            $table->string('foto_checkin')->nullable(false)->change();
        });

        // foto_checkout remains nullable — rows mid-shift (checked-in, not yet checked-out)
        // legitimately have foto_checkout = NULL until checkout is done.
    }

    public function down(): void
    {
        // Step 1: Make foto_checkin nullable again
        Schema::table('absensi', function (Blueprint $table) {
            $table->string('foto_checkin')->nullable()->change();
        });

        // Step 2: Rename foto_checkout → foto
        Schema::table('absensi', function (Blueprint $table) {
            $table->renameColumn('foto_checkout', 'foto');
        });
    }
};

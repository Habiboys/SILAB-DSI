<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('absensi', function (Blueprint $table) {
            // Drop old FK for jadwal_piket (column named without _id)
            $table->dropForeign(['jadwal_piket']);

            // Drop old FK for periode_piket_id
            $table->dropForeign(['periode_piket_id']);

            // Rename jadwal_piket → jadwal_piket_id
            $table->renameColumn('jadwal_piket', 'jadwal_piket_id');

            // Drop the now-redundant periode_piket_id column
            $table->dropColumn('periode_piket_id');
        });

        Schema::table('absensi', function (Blueprint $table) {
            // Re-add proper FK for jadwal_piket_id
            $table->foreign('jadwal_piket_id')
                  ->references('id')
                  ->on('jadwal_piket')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('absensi', function (Blueprint $table) {
            $table->dropForeign(['jadwal_piket_id']);
            $table->renameColumn('jadwal_piket_id', 'jadwal_piket');
            $table->uuid('periode_piket_id')->after('jadwal_piket');
        });

        Schema::table('absensi', function (Blueprint $table) {
            $table->foreign('jadwal_piket')->references('id')->on('jadwal_piket')->onDelete('cascade');
            $table->foreign('periode_piket_id')->references('id')->on('periode_piket')->onDelete('cascade');
        });
    }
};

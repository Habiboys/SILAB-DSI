<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('peminjaman_aset', function (Blueprint $table) {
            if (!Schema::hasColumn('peminjaman_aset', 'jenis_jaminan')) {
                $table->string('jenis_jaminan')->nullable()->after('institusi');
            }
            if (!Schema::hasColumn('peminjaman_aset', 'detail_jaminan')) {
                $table->text('detail_jaminan')->nullable()->after('jenis_jaminan');
            }
        });
    }

    public function down(): void
    {
        Schema::table('peminjaman_aset', function (Blueprint $table) {
            if (Schema::hasColumn('peminjaman_aset', 'jenis_jaminan')) {
                $table->dropColumn('jenis_jaminan');
            }
            if (Schema::hasColumn('peminjaman_aset', 'detail_jaminan')) {
                $table->dropColumn('detail_jaminan');
            }
        });
    }
};

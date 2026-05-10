<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ═══════════════════════════════════════
        // BAGIAN 1: jadwal_piket
        // ═══════════════════════════════════════

        if (Schema::hasColumn('jadwal_piket', 'user_id')) {
            Schema::table('jadwal_piket', function (Blueprint $table) {
                $table->uuid('kepengurusan_user_id')->nullable()->after('user_id');
            });

            // Petakan user_id → kepengurusan_user_id via JOIN
            DB::statement("
                UPDATE jadwal_piket jp
                INNER JOIN kepengurusan_user ku
                    ON  ku.user_id             = jp.user_id
                    AND ku.kepengurusan_lab_id = jp.kepengurusan_lab_id
                SET jp.kepengurusan_user_id = ku.id
            ");

            // Hapus record yang tidak bisa dipetakan (user bukan anggota lab tsb — data corrupted)
            $deleted = DB::delete("DELETE FROM jadwal_piket WHERE kepengurusan_user_id IS NULL");
            if ($deleted > 0) {
                Log::warning("[Migration] Dihapus {$deleted} record jadwal_piket: user bukan anggota kepengurusan lab.");
            }

            Schema::table('jadwal_piket', function (Blueprint $table) {
                $table->uuid('kepengurusan_user_id')->nullable(false)->change();
                $table->foreign('kepengurusan_user_id')
                      ->references('id')->on('kepengurusan_user')
                      ->onDelete('cascade');
                $table->dropForeign(['user_id']);
                $table->dropColumn('user_id');
            });
        }

        // ═══════════════════════════════════════
        // BAGIAN 2: ganti_jadwal_piket
        // ═══════════════════════════════════════

        if (Schema::hasColumn('ganti_jadwal_piket', 'user_id')) {
            if (!Schema::hasColumn('ganti_jadwal_piket', 'kepengurusan_user_id')) {
                Schema::table('ganti_jadwal_piket', function (Blueprint $table) {
                    $table->uuid('kepengurusan_user_id')->nullable()->after('user_id');
                });

                // Ambil kepengurusan_user_id dari jadwal_piket yang sudah dimigrasi
                DB::statement("
                    UPDATE ganti_jadwal_piket gjp
                    INNER JOIN jadwal_piket jp ON jp.id = gjp.jadwal_piket_id
                    SET gjp.kepengurusan_user_id = jp.kepengurusan_user_id
                ");

                DB::delete("DELETE FROM ganti_jadwal_piket WHERE kepengurusan_user_id IS NULL");

                Schema::table('ganti_jadwal_piket', function (Blueprint $table) {
                    $table->uuid('kepengurusan_user_id')->nullable(false)->change();
                    $table->foreign('kepengurusan_user_id')
                          ->references('id')->on('kepengurusan_user')
                          ->onDelete('cascade');
                });
            }

            // Hapus FK dulu, baru index, baru kolom (urutan wajib di MySQL)
            Schema::table('ganti_jadwal_piket', function (Blueprint $table) {
                $table->dropForeign(['user_id']);
            });

            Schema::table('ganti_jadwal_piket', function (Blueprint $table) {
                $table->dropIndex('ganti_jadwal_piket_user_id_status_index');
                $table->index(['kepengurusan_user_id', 'status']);
                $table->dropColumn('user_id');
            });
        }
    }

    public function down(): void
    {
        // ═══════════════════════════════════════
        // Reverse BAGIAN 2: ganti_jadwal_piket
        // ═══════════════════════════════════════

        Schema::table('ganti_jadwal_piket', function (Blueprint $table) {
            $table->uuid('user_id')->nullable()->after('kepengurusan_user_id');
        });

        DB::statement("
            UPDATE ganti_jadwal_piket gjp
            INNER JOIN kepengurusan_user ku ON ku.id = gjp.kepengurusan_user_id
            SET gjp.user_id = ku.user_id
        ");

        Schema::table('ganti_jadwal_piket', function (Blueprint $table) {
            $table->uuid('user_id')->nullable(false)->change();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->dropIndex('ganti_jadwal_piket_kepengurusan_user_id_status_index');
            $table->index(['user_id', 'status']);
            $table->dropForeign(['kepengurusan_user_id']);
            $table->dropColumn('kepengurusan_user_id');
        });

        // ═══════════════════════════════════════
        // Reverse BAGIAN 1: jadwal_piket
        // ═══════════════════════════════════════

        Schema::table('jadwal_piket', function (Blueprint $table) {
            $table->uuid('user_id')->nullable()->after('kepengurusan_user_id');
        });

        DB::statement("
            UPDATE jadwal_piket jp
            INNER JOIN kepengurusan_user ku ON ku.id = jp.kepengurusan_user_id
            SET jp.user_id = ku.user_id
        ");

        Schema::table('jadwal_piket', function (Blueprint $table) {
            $table->uuid('user_id')->nullable(false)->change();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->dropForeign(['kepengurusan_user_id']);
            $table->dropColumn('kepengurusan_user_id');
        });
    }
};

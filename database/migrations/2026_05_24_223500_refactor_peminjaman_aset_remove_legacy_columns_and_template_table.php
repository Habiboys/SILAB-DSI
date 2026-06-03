<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('peminjaman_aset')) {
            Schema::table('peminjaman_aset', function (Blueprint $table) {
                if (Schema::hasColumn('peminjaman_aset', 'peminjam_id')) {
                    try {
                        $table->dropForeign(['peminjam_id']);
                    } catch (\Throwable $e) {
                    }

                    $table->dropColumn('peminjam_id');
                }

                if (Schema::hasColumn('peminjaman_aset', 'aset_id')) {
                    try {
                        $table->dropForeign(['aset_id']);
                    } catch (\Throwable $e) {
                    }

                    $table->dropColumn('aset_id');
                }

                if (Schema::hasColumn('peminjaman_aset', 'detail_aset_id')) {
                    try {
                        $table->dropForeign(['detail_aset_id']);
                    } catch (\Throwable $e) {
                    }

                    $table->dropColumn('detail_aset_id');
                }
            });
        }

        Schema::dropIfExists('template_surat_peminjaman');
    }

    public function down(): void
    {
        if (Schema::hasTable('peminjaman_aset')) {
            Schema::table('peminjaman_aset', function (Blueprint $table) {
                if (!Schema::hasColumn('peminjaman_aset', 'peminjam_id')) {
                    $table->uuid('peminjam_id')->nullable()->after('id');
                    $table->foreign('peminjam_id')->references('id')->on('users')->onDelete('set null');
                }

                if (!Schema::hasColumn('peminjaman_aset', 'aset_id')) {
                    $targetAsetTable = Schema::hasTable('aset') ? 'aset' : 'detail_aset';
                    $table->uuid('aset_id')->nullable()->after('peminjam_id');
                    $table->foreign('aset_id')->references('id')->on($targetAsetTable)->onDelete('cascade');
                }
            });
        }

        if (!Schema::hasTable('template_surat_peminjaman')) {
            Schema::create('template_surat_peminjaman', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('nama_template');
                $table->string('file_path');
                $table->uuid('laboratorium_id')->nullable();
                $table->text('deskripsi')->nullable();
                $table->timestamps();

                $table->foreign('laboratorium_id')->references('id')->on('laboratorium')->onDelete('set null');
            });
        }
    }
};

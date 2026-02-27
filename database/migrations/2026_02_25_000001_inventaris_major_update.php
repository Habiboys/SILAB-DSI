<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add new fields to detail_aset
        Schema::table('detail_aset', function (Blueprint $table) {
            if (!Schema::hasColumn('detail_aset', 'laboratorium_id')) {
                $table->uuid('laboratorium_id')->nullable()->after('kategori_aset_id');
            }
            if (!Schema::hasColumn('detail_aset', 'keterangan')) {
                $table->text('keterangan')->nullable()->after('nama');
            }
            if (!Schema::hasColumn('detail_aset', 'tanggal_perolehan')) {
                $table->date('tanggal_perolehan')->nullable()->after('keterangan');
            }
            if (!Schema::hasColumn('detail_aset', 'harga_perolehan')) {
                $table->decimal('harga_perolehan', 15, 2)->nullable()->after('tanggal_perolehan');
            }
            if (!Schema::hasColumn('detail_aset', 'asal_barang')) {
                $table->enum('asal_barang', ['pengadaan', 'hibah', 'pembelian_mandiri', 'lainnya'])
                    ->nullable()
                    ->after('harga_perolehan');
            }
            if (!Schema::hasColumn('detail_aset', 'wishlist_aset_id')) {
                $table->uuid('wishlist_aset_id')->nullable()->after('asal_barang');
            }
        });

        // 2. Copy laboratorium_id from kategori_aset to detail_aset (data migration)
        if (Schema::hasColumn('kategori_aset', 'laboratorium_id')) {
            DB::statement("
                UPDATE detail_aset da
                INNER JOIN kategori_aset ka ON da.kategori_aset_id = ka.id
                SET da.laboratorium_id = ka.laboratorium_id
                WHERE da.laboratorium_id IS NULL
            ");
        }

        // 3. Add FKs for new detail_aset columns (only if they don't already exist)
        $existingFks = DB::select("
            SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'detail_aset'
              AND CONSTRAINT_TYPE = 'FOREIGN KEY'
        ");
        $existingFkNames = array_column($existingFks, 'CONSTRAINT_NAME');

        Schema::table('detail_aset', function (Blueprint $table) use ($existingFkNames) {
            if (!in_array('detail_aset_laboratorium_id_foreign', $existingFkNames)) {
                $table->foreign('laboratorium_id')->references('id')->on('laboratorium')->onDelete('set null');
            }
            if (!in_array('detail_aset_wishlist_aset_id_foreign', $existingFkNames)) {
                $table->foreign('wishlist_aset_id')->references('id')->on('wishlist_aset')->onDelete('set null');
            }
        });

        // 4. Modify keadaan enum to add 'hilang'
        DB::statement("ALTER TABLE detail_aset MODIFY COLUMN keadaan ENUM('baik', 'rusak', 'hilang') NOT NULL DEFAULT 'baik'");

        // 5. Drop laboratorium_id from kategori_aset
        if (Schema::hasColumn('kategori_aset', 'laboratorium_id')) {
            // Find the actual FK constraint name dynamically
            $kategoriAsetFks = DB::select("
                SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'kategori_aset'
                  AND CONSTRAINT_TYPE = 'FOREIGN KEY'
            ");
            $kategoriAsetFkNames = array_column($kategoriAsetFks, 'CONSTRAINT_NAME');

            // Drop any FK on laboratorium_id column
            $labFkNames = array_filter($kategoriAsetFkNames, fn($name) => str_contains($name, 'laboratorium_id'));
            foreach ($labFkNames as $fkName) {
                DB::statement("ALTER TABLE `kategori_aset` DROP FOREIGN KEY `{$fkName}`");
            }

            Schema::table('kategori_aset', function (Blueprint $table) {
                $table->dropColumn('laboratorium_id');
            });
        }

        // 6. Create riwayat_kondisi_aset table
        if (!Schema::hasTable('riwayat_kondisi_aset')) {
            Schema::create('riwayat_kondisi_aset', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('detail_aset_id');
                $table->enum('kondisi_sebelum', ['baik', 'rusak', 'hilang'])->nullable();
                $table->enum('kondisi_sesudah', ['baik', 'rusak', 'hilang']);
                $table->text('catatan')->nullable();
                $table->uuid('dicatat_oleh');
                $table->timestamps();

                $table->foreign('detail_aset_id')->references('id')->on('detail_aset')->onDelete('cascade');
                $table->foreign('dicatat_oleh')->references('id')->on('users');
            });
        }

        // 7. Create peminjaman_aset table
        if (!Schema::hasTable('peminjaman_aset')) {
            Schema::create('peminjaman_aset', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('detail_aset_id');
                $table->uuid('peminjam_id')->nullable();
                $table->string('nama_peminjam');
                $table->string('institusi')->nullable();
                $table->text('keperluan');
                $table->date('tanggal_pinjam');
                $table->date('tanggal_kembali_rencana');
                $table->date('tanggal_kembali_aktual')->nullable();
                $table->enum('status', ['dipinjam', 'dikembalikan', 'terlambat'])->default('dipinjam');
                $table->string('surat_peminjaman_path')->nullable();
                $table->text('catatan')->nullable();
                $table->uuid('diproses_oleh')->nullable();
                $table->timestamps();

                $table->foreign('detail_aset_id')->references('id')->on('detail_aset')->onDelete('cascade');
                $table->foreign('peminjam_id')->references('id')->on('users')->onDelete('set null');
                $table->foreign('diproses_oleh')->references('id')->on('users')->onDelete('set null');
            });
        }

        // 8. Create template_surat_peminjaman table
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

    public function down(): void
    {
        Schema::dropIfExists('template_surat_peminjaman');
        Schema::dropIfExists('peminjaman_aset');
        Schema::dropIfExists('riwayat_kondisi_aset');

        // Restore laboratorium_id to kategori_aset
        if (!Schema::hasColumn('kategori_aset', 'laboratorium_id')) {
            Schema::table('kategori_aset', function (Blueprint $table) {
                $table->uuid('laboratorium_id')->nullable();
                $table->foreign('laboratorium_id')->references('id')->on('laboratorium')->onDelete('cascade');
            });
        }

        // Revert keadaan enum
        DB::statement("ALTER TABLE detail_aset MODIFY COLUMN keadaan ENUM('baik', 'rusak') NOT NULL DEFAULT 'baik'");

        // Remove added detail_aset columns
        Schema::table('detail_aset', function (Blueprint $table) {
            try { $table->dropForeign(['laboratorium_id']); } catch (\Exception $e) {}
            try { $table->dropForeign(['wishlist_aset_id']); } catch (\Exception $e) {}

            $columns = ['asal_barang', 'wishlist_aset_id', 'harga_perolehan', 'tanggal_perolehan', 'keterangan', 'laboratorium_id'];
            foreach ($columns as $col) {
                if (Schema::hasColumn('detail_aset', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};

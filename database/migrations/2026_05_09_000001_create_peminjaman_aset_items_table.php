<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('peminjaman_aset_items')) {
            Schema::create('peminjaman_aset_items', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('peminjaman_aset_id');
                $table->uuid('aset_id');
                $table->date('tanggal_kembali_aktual')->nullable();
                $table->enum('kondisi_setelah_kembali', ['baik', 'rusak'])->nullable();
                $table->text('catatan_item')->nullable();
                $table->timestamps();

                $table->foreign('peminjaman_aset_id')
                    ->references('id')->on('peminjaman_aset')
                    ->onDelete('cascade');

                $targetAsetTable = Schema::hasTable('aset') ? 'aset' : 'detail_aset';
                $table->foreign('aset_id')
                    ->references('id')->on($targetAsetTable)
                    ->onDelete('cascade');

                $table->unique(['peminjaman_aset_id', 'aset_id']);
                $table->index('aset_id');
            });
        }

        // Backfill: setiap baris peminjaman_aset legacy yang punya aset_id (atau detail_aset_id pada schema lama)
        // dimigrasikan menjadi 1 item.
        if (Schema::hasTable('peminjaman_aset')) {
            $legacyColumn = Schema::hasColumn('peminjaman_aset', 'aset_id')
                ? 'aset_id'
                : (Schema::hasColumn('peminjaman_aset', 'detail_aset_id') ? 'detail_aset_id' : null);

            if ($legacyColumn) {
                $rows = DB::table('peminjaman_aset')
                    ->select('id', $legacyColumn . ' as aset_id', 'tanggal_kembali_aktual', 'created_at', 'updated_at')
                    ->whereNotNull($legacyColumn)
                    ->get();

                foreach ($rows as $row) {
                    $exists = DB::table('peminjaman_aset_items')
                        ->where('peminjaman_aset_id', $row->id)
                        ->where('aset_id', $row->aset_id)
                        ->exists();

                    if (!$exists) {
                        DB::table('peminjaman_aset_items')->insert([
                            'id'                      => (string) Str::uuid(),
                            'peminjaman_aset_id'      => $row->id,
                            'aset_id'                 => $row->aset_id,
                            'tanggal_kembali_aktual'  => $row->tanggal_kembali_aktual,
                            'kondisi_setelah_kembali' => null,
                            'catatan_item'            => null,
                            'created_at'              => $row->created_at ?? now(),
                            'updated_at'              => $row->updated_at ?? now(),
                        ]);
                    }
                }
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('peminjaman_aset_items');
    }
};

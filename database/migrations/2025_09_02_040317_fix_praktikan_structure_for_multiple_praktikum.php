<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Buat tabel praktikan_praktikum untuk relasi many-to-many
        Schema::create('praktikan_praktikum', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('praktikan_id');
            $table->uuid('praktikum_id');
            $table->uuid('kelas_id');
            $table->enum('status', ['aktif', 'nonaktif'])->default('aktif');
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('praktikan_id')->references('id')->on('praktikan')->onDelete('cascade');
            $table->foreign('praktikum_id')->references('id')->on('praktikum')->onDelete('cascade');
            $table->foreign('kelas_id')->references('id')->on('kelas')->onDelete('cascade');
            
            // Unique constraint untuk mencegah duplikasi praktikan di praktikum yang sama
            $table->unique(['praktikan_id', 'praktikum_id']);
        });

        // 2. Migrasi data dari tabel praktikan lama ke struktur baru
        $this->migrateExistingData();

        // 3. Hapus kolom yang tidak diperlukan dari tabel praktikan
        Schema::table('praktikan', function (Blueprint $table) {
            // Hapus foreign key constraint dulu
            $table->dropForeign(['praktikum_id']);
            $table->dropForeign(['kelas_id']);
            
            // Hapus kolom yang dipindah ke tabel praktikan_praktikum
            $table->dropColumn(['praktikum_id', 'kelas_id', 'status']);
            
            // Hapus unique constraint pada NIM
            $table->dropUnique(['nim']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. Restore kolom di tabel praktikan
        Schema::table('praktikan', function (Blueprint $table) {
            $table->uuid('praktikum_id')->after('user_id');
            $table->uuid('kelas_id')->after('praktikum_id');
            $table->enum('status', ['aktif', 'nonaktif'])->default('aktif')->after('kelas_id');
            
            // Restore foreign keys
            $table->foreign('praktikum_id')->references('id')->on('praktikum')->onDelete('cascade');
            $table->foreign('kelas_id')->references('id')->on('kelas')->onDelete('cascade');
            
            // Restore unique constraint pada NIM
            $table->unique('nim');
        });

        // 2. Migrasi data kembali dari praktikan_praktikum ke praktikan
        $this->migrateDataBack();

        // 3. Hapus tabel praktikan_praktikum
        Schema::dropIfExists('praktikan_praktikum');
    }

    /**
     * Migrasi data dari struktur lama ke struktur baru
     */
    private function migrateExistingData(): void
    {
        // Ambil semua data praktikan yang ada
        $praktikans = DB::table('praktikan')->get();
        
        foreach ($praktikans as $praktikan) {
            // Insert ke tabel praktikan_praktikum
            DB::table('praktikan_praktikum')->insert([
                'id' => Str::uuid(),
                'praktikan_id' => $praktikan->id,
                'praktikum_id' => $praktikan->praktikum_id,
                'kelas_id' => $praktikan->kelas_id,
                'status' => $praktikan->status,
                'created_at' => $praktikan->created_at,
                'updated_at' => $praktikan->updated_at,
            ]);
        }
    }

    /**
     * Migrasi data kembali dari struktur baru ke struktur lama
     */
    private function migrateDataBack(): void
    {
        // Ambil semua data dari praktikan_praktikum
        $praktikanPraktikums = DB::table('praktikan_praktikum')->get();
        
        foreach ($praktikanPraktikums as $pp) {
            // Update tabel praktikan dengan data dari praktikan_praktikum
            DB::table('praktikan')
                ->where('id', $pp->praktikan_id)
                ->update([
                    'praktikum_id' => $pp->praktikum_id,
                    'kelas_id' => $pp->kelas_id,
                    'status' => $pp->status,
                ]);
        }
    }
};
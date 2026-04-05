<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1) Tambah kolom jadwal di tabel kelas
        Schema::table('kelas', function (Blueprint $table) {
            if (!Schema::hasColumn('kelas', 'hari')) {
                $table->string('hari')->nullable()->after('status');
            }
            if (!Schema::hasColumn('kelas', 'jam_mulai')) {
                $table->time('jam_mulai')->nullable()->after('hari');
            }
            if (!Schema::hasColumn('kelas', 'jam_selesai')) {
                $table->time('jam_selesai')->nullable()->after('jam_mulai');
            }
            if (!Schema::hasColumn('kelas', 'ruangan')) {
                $table->string('ruangan')->nullable()->after('jam_selesai');
            }
        });

        // 2) Migrasi data jadwal lama ke kelas (berdasarkan kelas_id)
        if (Schema::hasTable('jadwal_praktikum')) {
            $jadwalRows = DB::table('jadwal_praktikum')
                ->whereNotNull('kelas_id')
                ->orderByDesc('updated_at')
                ->orderByDesc('created_at')
                ->get();

            foreach ($jadwalRows as $row) {
                DB::table('kelas')
                    ->where('id', $row->kelas_id)
                    ->update([
                        'hari' => $row->hari,
                        'jam_mulai' => $row->jam_mulai,
                        'jam_selesai' => $row->jam_selesai,
                        'ruangan' => $row->ruangan,
                        'updated_at' => now(),
                    ]);
            }

            // 3) Drop tabel jadwal_praktikum
            Schema::dropIfExists('jadwal_praktikum');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate jadwal_praktikum table (minimal schema yang dibutuhkan aplikasi lama)
        if (!Schema::hasTable('jadwal_praktikum')) {
            Schema::create('jadwal_praktikum', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('kelas')->nullable();
                $table->time('jam_mulai')->nullable();
                $table->time('jam_selesai')->nullable();
                $table->string('ruangan')->nullable();
                $table->string('hari')->nullable();
                $table->uuid('kelas_id')->nullable();
                $table->timestamps();

                $table->foreign('kelas_id')
                    ->references('id')
                    ->on('kelas')
                    ->onDelete('cascade');
            });
        }

        // Restore data from kelas back to jadwal_praktikum
        $kelasRows = DB::table('kelas')
            ->whereNotNull('hari')
            ->orWhereNotNull('jam_mulai')
            ->orWhereNotNull('jam_selesai')
            ->orWhereNotNull('ruangan')
            ->get();

        foreach ($kelasRows as $kelas) {
            DB::table('jadwal_praktikum')->insert([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'kelas' => $kelas->nama_kelas,
                'jam_mulai' => $kelas->jam_mulai,
                'jam_selesai' => $kelas->jam_selesai,
                'ruangan' => $kelas->ruangan,
                'hari' => $kelas->hari,
                'kelas_id' => $kelas->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Drop jadwal columns from kelas
        Schema::table('kelas', function (Blueprint $table) {
            if (Schema::hasColumn('kelas', 'ruangan')) {
                $table->dropColumn('ruangan');
            }
            if (Schema::hasColumn('kelas', 'jam_selesai')) {
                $table->dropColumn('jam_selesai');
            }
            if (Schema::hasColumn('kelas', 'jam_mulai')) {
                $table->dropColumn('jam_mulai');
            }
            if (Schema::hasColumn('kelas', 'hari')) {
                $table->dropColumn('hari');
            }
        });
    }
};

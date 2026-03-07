<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Step 1: Create opsi_pertanyaan table
        Schema::create('opsi_pertanyaan', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('pertanyaan_id');
            $table->string('teks');
            $table->integer('urutan')->nullable();
            $table->timestamps();

            $table->foreign('pertanyaan_id')
                ->references('id')
                ->on('pertanyaan_kuesioner')
                ->onDelete('cascade');
        });

        // Step 2: Migrate existing opsi JSON data into opsi_pertanyaan rows
        $pertanyaanRows = DB::table('pertanyaan_kuesioner')
            ->whereNotNull('opsi')
            ->whereIn('tipe_pertanyaan', ['radio', 'checkbox', 'scale'])
            ->get(['id', 'opsi']);

        foreach ($pertanyaanRows as $row) {
            $opsiArray = json_decode($row->opsi, true);
            if (is_array($opsiArray)) {
                foreach ($opsiArray as $urutan => $teks) {
                    DB::table('opsi_pertanyaan')->insert([
                        'id'              => \Illuminate\Support\Str::uuid(),
                        'pertanyaan_id'   => $row->id,
                        'teks'            => (string) $teks,
                        'urutan'          => $urutan + 1,
                        'created_at'      => now(),
                        'updated_at'      => now(),
                    ]);
                }
            }
        }

        // Step 3: Add opsi_id FK to jawaban_kuesioner (nullable)
        Schema::table('jawaban_kuesioner', function (Blueprint $table) {
            $table->uuid('opsi_id')->nullable()->after('pertanyaan_id');
            $table->foreign('opsi_id')
                ->references('id')
                ->on('opsi_pertanyaan')
                ->onDelete('set null');
        });

        // Step 4: Drop opsi JSON column from pertanyaan_kuesioner
        Schema::table('pertanyaan_kuesioner', function (Blueprint $table) {
            $table->dropColumn('opsi');
        });
    }

    public function down(): void
    {
        // Restore opsi JSON column
        Schema::table('pertanyaan_kuesioner', function (Blueprint $table) {
            $table->json('opsi')->nullable()->after('tipe_pertanyaan');
        });

        // Re-populate opsi JSON from opsi_pertanyaan rows
        $groupedOpsi = DB::table('opsi_pertanyaan')
            ->orderBy('pertanyaan_id')
            ->orderBy('urutan')
            ->get()
            ->groupBy('pertanyaan_id');

        foreach ($groupedOpsi as $pertanyaanId => $opsiRows) {
            $opsiArray = $opsiRows->pluck('teks')->toArray();
            DB::table('pertanyaan_kuesioner')
                ->where('id', $pertanyaanId)
                ->update(['opsi' => json_encode($opsiArray)]);
        }

        // Remove opsi_id FK from jawaban_kuesioner
        Schema::table('jawaban_kuesioner', function (Blueprint $table) {
            $table->dropForeign(['opsi_id']);
            $table->dropColumn('opsi_id');
        });

        // Drop opsi_pertanyaan table
        Schema::dropIfExists('opsi_pertanyaan');
    }
};

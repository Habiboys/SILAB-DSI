<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('nilai_tambahan', 'pengumpulan_tugas_id')) {
            Schema::table('nilai_tambahan', function (Blueprint $table) {
                $table->foreignUuid('pengumpulan_tugas_id')->nullable()->constrained('pengumpulan_tugas')->nullOnDelete();
            });
        }
        foreach (['tugas_praktikum_id', 'praktikan_id'] as $field) {
            if (Schema::hasColumn('nilai_tambahan', $field)) {
                Schema::table('nilai_tambahan', fn (Blueprint $table) => $table->string($field)->nullable()->change());
            } else {
                Schema::table('nilai_tambahan', fn (Blueprint $table) => $table->foreignUuid($field)->nullable()
                    ->constrained($field === 'praktikan_id' ? 'praktikan' : 'tugas_praktikum')->cascadeOnDelete());
            }
        }
        if (Schema::hasColumn('nilai_tambahan', 'tugas_praktikum_id') && Schema::hasColumn('nilai_tambahan', 'praktikan_id')) {
            $matches = DB::table('nilai_tambahan as bonus')
                ->join('pengumpulan_tugas as submission', 'submission.tugas_praktikum_id', '=', 'bonus.tugas_praktikum_id')
                ->join('praktikan_praktikum as enrollment', 'enrollment.id', '=', 'submission.praktikan_praktikum_id')
                ->whereColumn('enrollment.praktikan_id', 'bonus.praktikan_id')
                ->whereNull('bonus.pengumpulan_tugas_id')
                ->groupBy('bonus.id')->havingRaw('COUNT(*) = 1')
                ->selectRaw('bonus.id, MIN(submission.id) as submission_id')->get();
            foreach ($matches as $match) {
                DB::table('nilai_tambahan')->where('id', $match->id)->update(['pengumpulan_tugas_id' => $match->submission_id]);
            }
        }
    }

    public function down(): void
    {
        // Relasi dan nilai historis dipertahankan; rollback tidak menghapus data atau kolom.
    }
};

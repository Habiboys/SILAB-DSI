<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Ubah kolom mulai dan selesai dari string (nama bulan) ke date
     */
    public function up(): void
    {
        // Map nama bulan Indonesia ke angka bulan
        $bulanMap = [
            'Januari' => '01',
            'Februari' => '02',
            'Maret' => '03',
            'April' => '04',
            'Mei' => '05',
            'Juni' => '06',
            'Juli' => '07',
            'Agustus' => '08',
            'September' => '09',
            'Oktober' => '10',
            'November' => '11',
            'Desember' => '12',
        ];

        // Konversi data lama: nama bulan → tanggal (contoh: "Agustus" → "2025-08-01")
        $records = DB::table('tahun_kepengurusan')->get();
        foreach ($records as $record) {
            $tahun = $record->tahun; // Format: "2025/2026"
            $tahunParts = explode('/', $tahun);
            $tahunMulai = $tahunParts[0] ?? date('Y');
            $tahunSelesai = $tahunParts[1] ?? $tahunMulai;

            $mulaiMonth = $bulanMap[$record->mulai] ?? '01';
            $selesaiMonth = $bulanMap[$record->selesai] ?? '12';

            // Bulan mulai: tahun pertama, Bulan selesai: tahun kedua jika lintas tahun
            $mulaiDate = $tahunMulai . '-' . $mulaiMonth . '-01';
            // Jika bulan selesai < bulan mulai, berarti lintas tahun → pakai tahun kedua
            if (intval($selesaiMonth) < intval($mulaiMonth)) {
                $selesaiDate = $tahunSelesai . '-' . $selesaiMonth . '-01';
            } else {
                $selesaiDate = $tahunMulai . '-' . $selesaiMonth . '-01';
            }

            DB::table('tahun_kepengurusan')
                ->where('id', $record->id)
                ->update([
                    'mulai' => $mulaiDate,
                    'selesai' => $selesaiDate,
                ]);
        }

        // Ubah tipe kolom ke date
        Schema::table('tahun_kepengurusan', function (Blueprint $table) {
            $table->date('mulai')->change();
            $table->date('selesai')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Map angka bulan ke nama bulan Indonesia
        $bulanNames = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret',
            4 => 'April', 5 => 'Mei', 6 => 'Juni',
            7 => 'Juli', 8 => 'Agustus', 9 => 'September',
            10 => 'Oktober', 11 => 'November', 12 => 'Desember',
        ];

        // Ubah tipe kolom kembali ke string
        Schema::table('tahun_kepengurusan', function (Blueprint $table) {
            $table->string('mulai')->change();
            $table->string('selesai')->change();
        });

        // Konversi data kembali: date → nama bulan
        $records = DB::table('tahun_kepengurusan')->get();
        foreach ($records as $record) {
            $mulaiMonth = intval(date('m', strtotime($record->mulai)));
            $selesaiMonth = intval(date('m', strtotime($record->selesai)));

            DB::table('tahun_kepengurusan')
                ->where('id', $record->id)
                ->update([
                    'mulai' => $bulanNames[$mulaiMonth] ?? 'Januari',
                    'selesai' => $bulanNames[$selesaiMonth] ?? 'Desember',
                ]);
        }
    }
};

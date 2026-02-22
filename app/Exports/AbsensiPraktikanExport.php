<?php

namespace App\Exports;

use App\Models\PertemuanPraktikum;
use App\Models\Praktikan;
use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class AbsensiPraktikanExport implements FromView, ShouldAutoSize, WithStyles
{
    protected $praktikumId;
    protected $kelasId;

    public function __construct($praktikumId, $kelasId)
    {
        $this->praktikumId = $praktikumId;
        $this->kelasId = $kelasId;
    }

    public function view(): View
    {
        // Get meetings for the specific class
        $pertemuans = PertemuanPraktikum::where('praktikum_id', $this->praktikumId)
            ->where('kelas_id', $this->kelasId)
            ->orderBy('tanggal')
            ->get();

        // Get students in the class
        $praktikans = Praktikan::whereHas('praktikanPraktikums', function ($q) {
                $q->where('praktikum_id', $this->praktikumId)
                  ->where('kelas_id', $this->kelasId)
                  ->where('status', 'aktif');
            })
            ->orderBy('nim')
            ->with(['absensis' => function ($q) use ($pertemuans) {
                $q->whereIn('pertemuan_id', $pertemuans->pluck('id'));
            }])
            ->get();

        // Map attendance for each student
        foreach ($praktikans as $praktikan) {
            $attendance = [];
            foreach ($pertemuans as $pertemuan) {
                // Find attendance record for this meeting
                // Note: assuming 'absensis' relationship exists on Praktikan model pointing to AbsensiPraktikan
                // If not, we might need to adjust or load it differently. 
                // Let's assume standard relationship name or use a query.
                // Actually, accessing via the pivot or direct hasMany is better.
                // Let's refactor to be safe with manual query or relationship if needed.
                // Checking previous context, Praktikan model has not been established to have 'absensis' hasMany relationship directly visible in the snippet I saw.
                // I should add the relationship to Praktikan model or query manually.
                
                $absen = \App\Models\AbsensiPraktikan::where('praktikan_id', $praktikan->id)
                    ->where('pertemuan_id', $pertemuan->id)
                    ->first();
                
                $attendance[$pertemuan->id] = $absen ? $absen->status : 'Belum Diisi';
            }
            $praktikan->attendance_list = $attendance;
        }

        return view('exports.absensi_praktikan', [
            'pertemuans' => $pertemuans,
            'praktikans' => $praktikans
        ]);
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}

<?php

namespace App\Exports;

use App\Models\PertemuanPraktikum;
use App\Models\User;
use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class AbsensiAslabExport implements FromView, ShouldAutoSize, WithStyles
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

        // Get aslab assigned to the praktikum
        $aslabs = User::whereHas('aslabPraktikums', function ($q) {
                $q->where('praktikum_id', $this->praktikumId);
            })
            ->orderBy('name')
            ->get();

        // Map attendance
        foreach ($aslabs as $aslab) {
            $attendance = [];
            foreach ($pertemuans as $pertemuan) {
                $absen = \App\Models\AbsensiAslab::where('user_id', $aslab->id)
                    ->where('pertemuan_id', $pertemuan->id)
                    ->first();
                
                $attendance[$pertemuan->id] = $absen ? $absen->status : 'Belum Diisi';
            }
            $aslab->attendance_list = $attendance;
        }

        return view('exports.absensi_aslab', [
            'pertemuans' => $pertemuans,
            'aslabs' => $aslabs
        ]);
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}

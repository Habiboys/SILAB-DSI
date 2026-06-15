<?php

namespace App\Exports;

use App\Models\TugasPraktikum;
use App\Models\PengumpulanTugas;
use App\Models\NilaiTambahan;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;

class TugasSubmissionExport implements FromCollection, WithHeadings, WithTitle, WithStyles
{
    protected $tugasId;
    protected $tugas;

    public function __construct($tugasId)
    {
        $this->tugasId = $tugasId;
        $this->tugas = TugasPraktikum::with([
            'praktikum.kelas',
            'kelas.subKelas',
            'praktikum.praktikans.praktikanPraktikums',
            'komponenRubriks' => function($query) {
                $query->orderBy('urutan');
            }
        ])->findOrFail($tugasId);
    }

    public function collection()
    {
        $data = collect();

        // Kelas yang tercakup: jika tugas untuk kelas induk, include induk + semua subkelas
        $kelasIds = [];
        if ($this->tugas->kelas_id) {
            $kelasIds = [$this->tugas->kelas_id];
            if ($this->tugas->kelas && $this->tugas->kelas->subKelas->isNotEmpty()) {
                $kelasIds = array_merge($kelasIds, $this->tugas->kelas->subKelas->pluck('id')->toArray());
            }
        }

        if (!empty($kelasIds)) {
            $praktikans = $this->tugas->praktikum->praktikans()
                ->whereIn('praktikan_praktikum.kelas_id', $kelasIds)
                ->with('user')
                ->get();
        } else {
            $praktikans = $this->tugas->praktikum->praktikans()
                ->with('user')
                ->get();
        }

        // Get all submissions for this tugas (pakai praktikan_praktikum_id; match via praktikan)
        $submissions = PengumpulanTugas::with([
            'praktikanPraktikum.praktikan',
            'praktikan.user',
            'nilaiRubriks.komponenRubrik'
        ])->where('tugas_praktikum_id', $this->tugas->id)->get();

        foreach ($praktikans as $index => $praktikan) {
            $submission = $submissions->first(function ($s) use ($praktikan) {
                return $s->praktikanPraktikum && $s->praktikanPraktikum->praktikan_id === $praktikan->id;
            });

            // Get nilai tambahan (via pengumpulan_tugas_id)
            $nilaiTambahans = $submission
                ? NilaiTambahan::where('pengumpulan_tugas_id', $submission->id)->get()
                : collect();

            $nilaiDasar = 0;
            $nilaiRubrikData = [];

            if ($submission) {
                // Calculate nilai dasar
                if ($submission->total_nilai_rubrik) {
                    $nilaiDasar = $submission->total_nilai_rubrik;
                } elseif ($submission->nilai) {
                    $nilaiDasar = $submission->nilai;
                }

                // Build nilai rubrik per komponen
                if ($submission->nilaiRubriks && $submission->nilaiRubriks->count() > 0) {
                    foreach ($submission->nilaiRubriks as $nilaiRubrik) {
                        $nilaiRubrikData[$nilaiRubrik->komponenRubrik->id] = $nilaiRubrik->nilai;
                    }
                }
            }

            $totalNilaiTambahan = $nilaiTambahans->sum('nilai');
            $totalNilai = $nilaiDasar + $totalNilaiTambahan;

            // Status pengumpulan
            $statusPengumpulan = $submission ? $submission->status : 'belum-submit';

            // Build row data
            $rowData = [
                'No' => $index + 1,
                'NIM' => $praktikan->nim,
                'Nama' => $praktikan->nama,
                'Status_Pengumpulan' => $statusPengumpulan,
                'Tanggal_Pengumpulan' => $submission ?
                    $submission->submitted_at->format('d/m/Y H:i') : '-'
            ];

            // Tambahkan nilai untuk setiap komponen rubrik
            foreach ($this->tugas->komponenRubriks as $komponen) {
                $rowData[$komponen->nama_komponen . ' (' . $komponen->bobot . '%) (' . $komponen->nilai_maksimal . ')'] =
                    isset($nilaiRubrikData[$komponen->id]) ? number_format($nilaiRubrikData[$komponen->id], 1) : '-';
            }

            // Tambahkan kolom lainnya
            $rowData = array_merge($rowData, [
                'Nilai_Dasar' => $nilaiDasar > 0 ? number_format($nilaiDasar, 1) : '-',
                'Nilai_Tambahan' => $totalNilaiTambahan > 0 ? '+' . number_format($totalNilaiTambahan, 1) : '-',
                'Total_Nilai' => $totalNilai > 0 ? number_format($totalNilai, 1) : '-',
                'Feedback' => $submission && $submission->feedback ? $submission->feedback : '-'
            ]);

            $data->push($rowData);
        }

        return $data;
    }

    public function headings(): array
    {
        $headings = [
            'No',
            'NIM',
            'Nama',
            'Status Pengumpulan',
            'Tanggal Pengumpulan'
        ];

        // Tambahkan kolom untuk setiap komponen rubrik
        foreach ($this->tugas->komponenRubriks as $komponen) {
            $headings[] = $komponen->nama_komponen . ' (' . $komponen->bobot . '%) (' . $komponen->nilai_maksimal . ')';
        }

        $headings = array_merge($headings, [
            'Nilai Dasar',
            'Nilai Tambahan',
            'Total Nilai',
            'Feedback'
        ]);

        return $headings;
    }

    public function title(): string
    {
        return 'Nilai ' . $this->tugas->judul_tugas;
    }

    public function styles(Worksheet $sheet)
    {
        // Style header row
        $sheet->getStyle('A1:' . $sheet->getHighestColumn() . '1')->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF']
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '4F46E5']
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER
            ]
        ]);

        // Auto-size columns
        foreach (range('A', $sheet->getHighestColumn()) as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        // Add borders to all cells
        $sheet->getStyle('A1:' . $sheet->getHighestColumn() . $sheet->getHighestRow())->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => '000000']
                ]
            ]
        ]);

        return [];
    }
}

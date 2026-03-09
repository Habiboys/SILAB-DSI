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

/**
 * Export nilai satu tugas untuk satu kelas saja (untuk opsi "per subkelas").
 */
class TugasSubmissionExportForKelas implements FromCollection, WithHeadings, WithTitle, WithStyles
{
    protected $tugasId;
    protected $kelasId;
    protected $kelasLabel;
    protected $tugas;

    public function __construct($tugasId, $kelasId, $kelasLabel = '')
    {
        $this->tugasId = $tugasId;
        $this->kelasId = $kelasId;
        $this->kelasLabel = $kelasLabel ?: $kelasId;
        $this->tugas = TugasPraktikum::with([
            'kelas.subKelas',
            'praktikum',
            'komponenRubriks' => function ($q) {
                $q->orderBy('urutan');
            }
        ])->findOrFail($tugasId);
    }

    public function collection()
    {
        $data = collect();

        $praktikans = $this->tugas->praktikum->praktikans()
            ->wherePivot('kelas_id', $this->kelasId)
            ->with('user')
            ->get();

        $submissions = PengumpulanTugas::with([
            'praktikanPraktikum.praktikan',
            'praktikan.user',
            'nilaiRubriks.komponenRubrik'
        ])->where('tugas_praktikum_id', $this->tugas->id)->get();

        foreach ($praktikans as $index => $praktikan) {
            $submission = $submissions->first(function ($s) use ($praktikan) {
                return $s->praktikanPraktikum && $s->praktikanPraktikum->praktikan_id === $praktikan->id;
            });

            $nilaiTambahans = $submission
                ? NilaiTambahan::where('pengumpulan_tugas_id', $submission->id)->get()
                : collect();

            $nilaiDasar = 0;
            $nilaiRubrikData = [];
            if ($submission) {
                if ($submission->total_nilai_rubrik) {
                    $nilaiDasar = $submission->total_nilai_rubrik;
                } elseif ($submission->nilai) {
                    $nilaiDasar = $submission->nilai;
                }
                if ($submission->nilaiRubriks && $submission->nilaiRubriks->count() > 0) {
                    foreach ($submission->nilaiRubriks as $nr) {
                        $nilaiRubrikData[$nr->komponenRubrik->id] = $nr->nilai;
                    }
                }
            }

            $totalNilaiTambahan = $nilaiTambahans->sum('nilai');
            $totalNilai = $nilaiDasar + $totalNilaiTambahan;
            $statusPengumpulan = $submission ? $submission->status : 'belum-submit';

            $rowData = [
                'No' => $index + 1,
                'NIM' => $praktikan->nim,
                'Nama' => $praktikan->nama,
                'Status_Pengumpulan' => $statusPengumpulan,
                'Tanggal_Pengumpulan' => $submission
                    ? $submission->submitted_at->format('d/m/Y H:i')
                    : '-',
            ];

            foreach ($this->tugas->komponenRubriks as $komponen) {
                $rowData[$komponen->nama_komponen . ' (' . $komponen->bobot . '%) (' . $komponen->nilai_maksimal . ')'] =
                    isset($nilaiRubrikData[$komponen->id]) ? number_format($nilaiRubrikData[$komponen->id], 1) : '-';
            }

            $rowData = array_merge($rowData, [
                'Nilai_Dasar' => $nilaiDasar > 0 ? number_format($nilaiDasar, 1) : '-',
                'Nilai_Tambahan' => $totalNilaiTambahan > 0 ? '+' . number_format($totalNilaiTambahan, 1) : '-',
                'Total_Nilai' => $totalNilai > 0 ? number_format($totalNilai, 1) : '-',
                'Feedback' => $submission && $submission->feedback ? $submission->feedback : '-',
            ]);

            $data->push($rowData);
        }

        return $data;
    }

    public function headings(): array
    {
        $headings = ['No', 'NIM', 'Nama', 'Status Pengumpulan', 'Tanggal Pengumpulan'];
        foreach ($this->tugas->komponenRubriks as $komponen) {
            $headings[] = $komponen->nama_komponen . ' (' . $komponen->bobot . '%) (' . $komponen->nilai_maksimal . ')';
        }
        return array_merge($headings, ['Nilai Dasar', 'Nilai Tambahan', 'Total Nilai', 'Feedback']);
    }

    public function title(): string
    {
        $judul = 'Nilai ' . $this->tugas->judul_tugas;
        $suffix = $this->kelasLabel ? ' - ' . $this->kelasLabel : '';
        return \Illuminate\Support\Str::limit($judul . $suffix, 31, '');
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->getStyle('A1:' . $sheet->getHighestColumn() . '1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '4F46E5']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
        ]);
        foreach (range('A', $sheet->getHighestColumn()) as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }
        $sheet->getStyle('A1:' . $sheet->getHighestColumn() . $sheet->getHighestRow())->applyFromArray([
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']]],
        ]);
        return [];
    }
}

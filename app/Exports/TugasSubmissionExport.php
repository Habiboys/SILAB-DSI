<?php

namespace App\Exports;

use App\Models\TugasPraktikum;
use App\Models\PengumpulanTugas;
use App\Models\NilaiTambahan;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;

class TugasSubmissionExport implements WithMultipleSheets
{
    protected $tugasId;
    protected $tugas;

    public function __construct($tugasId)
    {
        $this->tugasId = $tugasId;
        $this->tugas = TugasPraktikum::with([
            'praktikum.kelas',
            'praktikum.praktikans.praktikanPraktikums',
            'komponenRubriks' => function($query) {
                $query->orderBy('urutan');
            }
        ])->findOrFail($tugasId);
    }

    public function sheets(): array
    {
        $sheets = [];
        
        // Get all classes for this praktikum
        $kelas = $this->tugas->praktikum->kelas;
        
        foreach ($kelas as $kelasItem) {
            $sheets[] = new TugasSubmissionSheet($this->tugas, $kelasItem);
        }
        
        // Add summary sheet
        $sheets[] = new TugasSubmissionSummarySheet($this->tugas, $kelas);
        
        return $sheets;
    }
}

class TugasSubmissionSheet implements FromCollection, WithHeadings, WithTitle, WithStyles
{
    protected $tugas;
    protected $kelas;

    public function __construct($tugas, $kelas)
    {
        $this->tugas = $tugas;
        $this->kelas = $kelas;
    }

    public function collection()
    {
        $data = collect();
        
        // Get all praktikans in this class through praktikan_praktikum pivot table
        $praktikans = $this->tugas->praktikum->praktikans->filter(function($praktikan) {
            // Check if this praktikan is in the current class through praktikan_praktikum
            return $praktikan->praktikanPraktikums->where('kelas_id', $this->kelas->id)->isNotEmpty();
        });
        
        foreach ($praktikans as $index => $praktikan) {
            // Get submission for this praktikan
            $submission = PengumpulanTugas::with(['nilaiRubriks.komponenRubrik'])
                ->where('tugas_praktikum_id', $this->tugas->id)
                ->where('praktikan_id', $praktikan->id)
                ->first();
            
            // Get nilai tambahan
            $nilaiTambahans = NilaiTambahan::where('tugas_praktikum_id', $this->tugas->id)
                ->where('praktikan_id', $praktikan->id)
                ->get();
            
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
            $totalNilai = min($nilaiDasar + $totalNilaiTambahan, 100);
            
            $statusPengumpulan = 'Belum Mengumpulkan';
            if ($submission) {
                if ($submission->status === 'dinilai') {
                    $statusPengumpulan = 'Sudah Dinilai';
                } elseif ($submission->status === 'terlambat') {
                    $statusPengumpulan = 'Terlambat';
                } else {
                    $statusPengumpulan = 'Dikumpulkan';
                }
            }

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
        return 'Kelas ' . $this->kelas->nama_kelas;
    }

    public function styles(Worksheet $sheet)
    {
        // Hitung jumlah kolom dinamis
        $totalColumns = 5 + $this->tugas->komponenRubriks->count() + 4; // 5 kolom awal + komponen rubrik + 4 kolom akhir
        $lastColumn = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($totalColumns);
        
        // Style header row
        $sheet->getStyle('A1:' . $lastColumn . '1')->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF']
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '4472C4']
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => '000000']
                ]
            ]
        ]);

        // Auto-size columns
        for ($i = 1; $i <= $totalColumns; $i++) {
            $columnLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($i);
            $sheet->getColumnDimension($columnLetter)->setAutoSize(true);
        }

        // Style data rows
        $lastRow = $sheet->getHighestRow();
        if ($lastRow > 1) {
            $sheet->getStyle('A2:' . $lastColumn . $lastRow)->applyFromArray([
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['rgb' => '000000']
                    ]
                ],
                'alignment' => [
                    'vertical' => Alignment::VERTICAL_CENTER
                ]
            ]);
        }

        return $sheet;
    }
}

class TugasSubmissionSummarySheet implements FromCollection, WithHeadings, WithTitle, WithStyles
{
    protected $tugas;
    protected $kelas;

    public function __construct($tugas, $kelas)
    {
        $this->tugas = $tugas;
        $this->kelas = $kelas;
    }

    public function collection()
    {
        $data = collect();
        
        // Add tugas information
        $data->push([
            'Informasi' => 'Judul Tugas',
            'Detail' => $this->tugas->judul_tugas
        ]);
        
        $data->push([
            'Informasi' => 'Mata Kuliah',
            'Detail' => $this->tugas->praktikum->mata_kuliah
        ]);
        
        $data->push([
            'Informasi' => 'Deadline',
            'Detail' => $this->tugas->deadline->format('d/m/Y H:i')
        ]);
        
        $data->push([
            'Informasi' => 'Tanggal Export',
            'Detail' => now()->format('d/m/Y H:i')
        ]);
        
        $data->push([
            'Informasi' => '',
            'Detail' => ''
        ]);
        
        // Add summary per class
        $data->push([
            'Informasi' => 'RINGKASAN PER KELAS',
            'Detail' => ''
        ]);
        
        foreach ($this->kelas as $kelasItem) {
            // Get praktikans in this class through praktikan_praktikum pivot table
            $praktikans = $this->tugas->praktikum->praktikans->filter(function($praktikan) use ($kelasItem) {
                return $praktikan->praktikanPraktikums->where('kelas_id', $kelasItem->id)->isNotEmpty();
            });
            $totalPraktikans = $praktikans->count();
            
            $submissions = PengumpulanTugas::where('tugas_praktikum_id', $this->tugas->id)
                ->whereIn('praktikan_id', $praktikans->pluck('id'))
                ->get();
            
            $sudahKumpul = $submissions->count();
            $sudahDinilai = $submissions->where('status', 'dinilai')->count();
            $terlambat = $submissions->where('status', 'terlambat')->count();
            $belumKumpul = $totalPraktikans - $sudahKumpul;
            
            $data->push([
                'Informasi' => 'Kelas ' . $kelasItem->nama_kelas,
                'Detail' => "Total: {$totalPraktikans}, Sudah Kumpul: {$sudahKumpul}, Sudah Dinilai: {$sudahDinilai}, Terlambat: {$terlambat}, Belum Kumpul: {$belumKumpul}"
            ]);
        }
        
        return $data;
    }

    public function headings(): array
    {
        return [
            'Informasi',
            'Detail'
        ];
    }

    public function title(): string
    {
        return 'Ringkasan';
    }

    public function styles(Worksheet $sheet)
    {
        // Style header row
        $sheet->getStyle('A1:B1')->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF']
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '4472C4']
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => '000000']
                ]
            ]
        ]);

        // Auto-size columns
        $sheet->getColumnDimension('A')->setWidth(25);
        $sheet->getColumnDimension('B')->setAutoSize(true);

        // Style data rows
        $lastRow = $sheet->getHighestRow();
        if ($lastRow > 1) {
            $sheet->getStyle('A2:B' . $lastRow)->applyFromArray([
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['rgb' => '000000']
                    ]
                ],
                'alignment' => [
                    'vertical' => Alignment::VERTICAL_CENTER
                ]
            ]);
        }

        // Style summary header
        $summaryRow = null;
        for ($i = 1; $i <= $lastRow; $i++) {
            $cellValue = $sheet->getCell('A' . $i)->getValue();
            if ($cellValue === 'RINGKASAN PER KELAS') {
                $summaryRow = $i;
                break;
            }
        }
        
        if ($summaryRow) {
            $sheet->getStyle('A' . $summaryRow . ':B' . $summaryRow)->applyFromArray([
                'font' => [
                    'bold' => true
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'E7E6E6']
                ]
            ]);
        }

        return $sheet;
    }
}

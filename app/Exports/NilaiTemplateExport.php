<?php

namespace App\Exports;

use App\Models\TugasPraktikum;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Color;

class NilaiTemplateExport implements FromCollection, WithHeadings, WithTitle, WithStyles, WithColumnWidths
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

    public function collection()
    {
        $data = collect();
        
        // Get all praktikans for this tugas (filtered by kelas)
        if ($this->tugas->kelas_id) {
            // Tugas untuk kelas tertentu
            $praktikans = $this->tugas->praktikum->praktikans()
                ->wherePivot('kelas_id', $this->tugas->kelas_id)
                ->with('user')
                ->orderBy('nim')
                ->get();
        } else {
            // Tugas untuk semua kelas
            $praktikans = $this->tugas->praktikum->praktikans()
                ->with('user')
                ->orderBy('nim')
                ->get();
        }
        
        foreach ($praktikans as $index => $praktikan) {
            // Build row data with empty values for import
            $rowData = [
                'No' => $index + 1,
                'NIM' => $praktikan->nim,
                'Nama' => $praktikan->nama,
            ];
            
            // Tambahkan kolom kosong untuk setiap komponen rubrik
            foreach ($this->tugas->komponenRubriks as $komponen) {
                $rowData[$komponen->nama_komponen] = ''; // Empty for user to fill
            }
            
            $data->push($rowData);
        }
        
        return $data;
    }

    public function headings(): array
    {
        $headings = [
            'No',
            'NIM',
            'Nama'
        ];
        
        // Tambahkan kolom untuk setiap komponen rubrik
        foreach ($this->tugas->komponenRubriks as $komponen) {
            $headings[] = $komponen->nama_komponen;
        }
        
        return $headings;
    }

    public function title(): string
    {
        return 'Template Import Nilai';
    }

    public function columnWidths(): array
    {
        $widths = [
            'A' => 8,   // No
            'B' => 15,  // NIM
            'C' => 25,  // Nama
        ];
        
        // Set width for komponen columns (dikecilkan ke 12)
        $column = 'D';
        foreach ($this->tugas->komponenRubriks as $komponen) {
            $widths[$column] = 12;
            $column++;
        }
        
        return $widths;
    }

    public function styles(Worksheet $sheet)
    {
        $lastColumn = $sheet->getHighestColumn();
        $lastRow = $sheet->getHighestRow();
        
        // Style header row
        $sheet->getStyle('A1:' . $lastColumn . '1')->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF']
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '059669'] // Green color
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER
            ]
        ]);

        // Style data rows
        $sheet->getStyle('A2:' . $lastColumn . $lastRow)->applyFromArray([
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER
            ]
        ]);

        // Add borders to all cells
        $sheet->getStyle('A1:' . $lastColumn . $lastRow)->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => '000000']
                ]
            ]
        ]);

        // Add instruction row
        $instructionRow = $lastRow + 2;
        $sheet->setCellValue('A' . $instructionRow, 'PANDUAN PENGISIAN:');
        $sheet->getStyle('A' . $instructionRow)->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'DC2626']]
        ]);
        
        $instructionRow++;
        $sheet->setCellValue('A' . $instructionRow, '1. Jangan mengubah kolom No, NIM, dan Nama');
        $sheet->setCellValue('A' . ($instructionRow + 1), '2. Isi nilai pada kolom komponen rubrik (hanya angka, contoh: 85.5)');
        $sheet->setCellValue('A' . ($instructionRow + 2), '3. Kosongkan kolom jika tidak ada nilai');
        $sheet->setCellValue('A' . ($instructionRow + 3), '4. Simpan file sebagai Excel (.xlsx)');
        $sheet->setCellValue('A' . ($instructionRow + 4), '5. Upload file yang sudah diisi untuk import nilai');
        
        // Add komponen information
        $infoRow = $instructionRow + 6;
        $sheet->setCellValue('A' . $infoRow, 'INFORMASI KOMPONEN RUBRIK:');
        $sheet->getStyle('A' . $infoRow)->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => '059669']]
        ]);
        
        $infoRow++;
        foreach ($this->tugas->komponenRubriks as $komponen) {
            $sheet->setCellValue('A' . $infoRow, '• ' . $komponen->nama_komponen . ':');
            $sheet->setCellValue('B' . $infoRow, 'Bobot ' . $komponen->bobot . '% | Nilai Maksimal ' . $komponen->nilai_maksimal);
            $infoRow++;
        }

        return [];
    }
}

<?php

namespace App\Exports;

use App\Models\Kelas;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

class PraktikanTemplateExport implements FromArray, WithHeadings, WithStyles
{
    protected $praktikumId;

    public function __construct($praktikumId = null)
    {
        $this->praktikumId = $praktikumId;
    }

    public function array(): array
    {
        // Sample data untuk template
        $sampleData = [
            [
                'nim' => '1234567890',
                'nama' => 'Nama Lengkap',
                'no_hp' => '081234567890',
                'kelas_id' => 'ID_KELAS_1'
            ],
            [
                'nim' => '0987654321',
                'nama' => 'Nama Lengkap 2',
                'no_hp' => '081234567891',
                'kelas_id' => 'ID_KELAS_2'
            ]
        ];

        // Jika ada praktikumId, tambahkan informasi kelas yang tersedia
        if ($this->praktikumId) {
            $kelas = Kelas::where('praktikum_id', $this->praktikumId)
                ->where('status', 'aktif')
                ->orderBy('nama_kelas')
                ->get();
            
            if ($kelas->count() > 0) {
                $sampleData[] = [
                    'nim' => '',
                    'nama' => '',
                    'no_hp' => '',
                    'kelas_id' => ''
                ];
                
                $sampleData[] = [
                    'nim' => 'INFO KELAS',
                    'nama' => 'Kelas yang tersedia:',
                    'no_hp' => '',
                    'kelas_id' => ''
                ];
                
                foreach ($kelas as $kelasItem) {
                    $sampleData[] = [
                        'nim' => '',
                        'nama' => '',
                        'no_hp' => '',
                        'kelas_id' => $kelasItem->id . ' (' . $kelasItem->nama_kelas . ')'
                    ];
                }
            }
        }

        return $sampleData;
    }

    public function headings(): array
    {
        return [
            'nim',
            'nama', 
            'no_hp',
            'kelas_id'
        ];
    }

    public function styles(Worksheet $sheet)
    {
        // Style untuk header
        $sheet->getStyle('A1:D1')->applyFromArray([
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
        foreach (range('A', 'D') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        // Style untuk sample data
        $sheet->getStyle('A2:D3')->applyFromArray([
            'fill' => [
                'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'F3F4F6']
            ]
        ]);

        // Style untuk info kelas (jika ada)
        if ($this->praktikumId) {
            $kelas = Kelas::where('praktikum_id', $this->praktikumId)
                ->where('status', 'aktif')
                ->count();
            
            if ($kelas > 0) {
                $startRow = 6; // Setelah sample data
                $endRow = $startRow + $kelas + 1; // +1 untuk header info
                
                $sheet->getStyle("A{$startRow}:D{$endRow}")->applyFromArray([
                    'fill' => [
                        'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                        'startColor' => ['rgb' => 'E0F2FE']
                    ],
                    'font' => [
                        'color' => ['rgb' => '0C4A6E']
                    ]
                ]);
            }
        }

        // Add instructions
        $instructionRow = $this->praktikumId ? 8 + $kelas : 5;
        $sheet->insertNewRowBefore($instructionRow);
        $sheet->setCellValue("A{$instructionRow}", 'INSTRUKSI:');
        $sheet->setCellValue("A" . ($instructionRow + 1), '1. NIM wajib diisi dan harus unik');
        $sheet->setCellValue("A" . ($instructionRow + 2), '2. Nama wajib diisi');
        $sheet->setCellValue("A" . ($instructionRow + 3), '3. No HP opsional (bisa dikosongkan)');
        $sheet->setCellValue("A" . ($instructionRow + 4), '4. Kelas ID wajib diisi dengan ID kelas yang valid');
        $sheet->setCellValue("A" . ($instructionRow + 5), '5. Hapus baris sample data dan info kelas sebelum import');
        $sheet->setCellValue("A" . ($instructionRow + 6), '6. Sistem akan otomatis:');
        $sheet->setCellValue("A" . ($instructionRow + 7), '   - Jika NIM sudah ada: gunakan akun existing');
        $sheet->setCellValue("A" . ($instructionRow + 8), '   - Jika NIM baru: buat akun baru');
        $sheet->setCellValue("A" . ($instructionRow + 9), '7. Format email: NIM_awalnama@student.unand.ac.id');
        $sheet->setCellValue("A" . ($instructionRow + 10), '8. Format: .xlsx atau .xls');
        $sheet->setCellValue("A" . ($instructionRow + 11), '9. Pastikan kelas_id sesuai dengan ID kelas yang ada di sistem');

        // Style untuk instruksi
        $endInstructionRow = $instructionRow + 11;
        $sheet->getStyle("A{$instructionRow}:A{$endInstructionRow}")->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'DC2626']
            ]
        ]);

        return $sheet;
    }
}

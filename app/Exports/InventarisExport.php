<?php

namespace App\Exports;

use App\Models\KategoriAset;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use Maatwebsite\Excel\Concerns\WithCustomStartCell;

class InventarisExport implements FromCollection, WithHeadings, WithTitle, WithStyles, WithCustomStartCell
{
    protected $labName;
    protected $kategoriAsets;

    public function __construct(string $labName, $kategoriAsets)
    {
        $this->labName = $labName;
        $this->kategoriAsets = $kategoriAsets;
    }

    public function collection()
    {
        $rows = collect();
        $no = 1;

        foreach ($this->kategoriAsets as $kategori) {
            foreach ($kategori->detailAset as $detail) {
                $rows->push([
                    'No' => $no++,
                    'Kategori' => $kategori->nama,
                    'Nama Barang' => $detail->nama ?? '-', // Added Nama
                    'Kode Barang' => $detail->kode_barang,
                    'Kondisi' => ucfirst($detail->keadaan),
                    'Status' => ucfirst($detail->status),
                    'Tanggal Registrasi' => $detail->created_at ? $detail->created_at->format('d/m/Y') : '-',
                ]);
            }
        }

        return $rows;
    }

    public function headings(): array
    {
        return ['No', 'Kategori', 'Nama Barang', 'Kode Barang', 'Kondisi', 'Status', 'Tanggal Registrasi'];
    }

    public function title(): string
    {
        return 'Data Inventaris';
    }

    public function startCell(): string
    {
        return 'A5';
    }

    public function styles(Worksheet $sheet)
    {
        // Title
        $sheet->setCellValue('A1', 'Data Inventaris');
        $sheet->mergeCells('A1:F1');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Lab info
        $sheet->setCellValue('A2', 'Laboratorium');
        $sheet->setCellValue('B2', ': ' . $this->labName);

        $totalItems = $this->kategoriAsets->sum(fn($k) => $k->detailAset->count());
        $sheet->setCellValue('A3', 'Total Aset');
        $sheet->setCellValue('B3', ': ' . $totalItems . ' unit');

        // Header row styling (row 5 = headings row after 3 info rows + 1 blank)
        $headerRow = 5;
        $sheet->getStyle("A{$headerRow}:F{$headerRow}")->applyFromArray([
            'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['argb' => 'FF4472C4'],
            ],
            'borders' => [
                'allBorders' => ['borderStyle' => Border::BORDER_THIN],
            ],
        ]);

        // Auto-size columns
        foreach (range('A', 'F') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        // Data borders
        $lastRow = $headerRow + $totalItems;
        if ($totalItems > 0) {
            $sheet->getStyle("A" . ($headerRow + 1) . ":F{$lastRow}")->applyFromArray([
                'borders' => [
                    'allBorders' => ['borderStyle' => Border::BORDER_THIN],
                ],
            ]);
        }
    }
}

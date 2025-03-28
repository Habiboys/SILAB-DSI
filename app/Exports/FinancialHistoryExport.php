<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class FinancialHistoryExport implements FromCollection, WithHeadings, WithTitle, WithStyles
{
    protected $kepengurusanLab;
    protected $riwayatKeuangan;
    protected $totalPemasukan;
    protected $totalPengeluaran;
    protected $saldo;

    public function __construct($kepengurusanLab, $riwayatKeuangan, $totalPemasukan, $totalPengeluaran, $saldo)
    {
        $this->kepengurusanLab = $kepengurusanLab;
        $this->riwayatKeuangan = $riwayatKeuangan;
        $this->totalPemasukan = $totalPemasukan;
        $this->totalPengeluaran = $totalPengeluaran;
        $this->saldo = $saldo;
    }

    public function collection()
    {
        $data = $this->riwayatKeuangan->map(function ($item, $index) {
            return [
                'No' => $index + 1,
                'Tanggal' => $item->tanggal,
                'Jenis' => $item->jenis,
                'Nominal' => $item->nominal,
                'Keterangan' => $item->keterangan,
                'Penanggungjawab' => $item->user->name,
            ];
        });

        // Add total rows
        $data->push([
            'No' => '',
            'Tanggal' => 'Total Pemasukan',
            'Jenis' => $this->totalPemasukan,
            'Nominal' => '',
            'Keterangan' => '',
            'Penanggungjawab' => '',
        ]);

        $data->push([
            'No' => '',
            'Tanggal' => 'Total Pengeluaran',
            'Jenis' => $this->totalPengeluaran,
            'Nominal' => '',
            'Keterangan' => '',
            'Penanggungjawab' => '',
        ]);

        $data->push([
            'No' => '',
            'Tanggal' => 'Saldo',
            'Jenis' => $this->saldo,
            'Nominal' => '',
            'Keterangan' => '',
            'Penanggungjawab' => '',
        ]);

        return $data;
    }

    public function headings(): array
    {
        return [
            'No',
            'Tanggal',
            'Jenis',
            'Nominal',
            'Keterangan',
            'Penanggungjawab'
        ];
    }

    public function title(): string
    {
        return 'Riwayat Keuangan';
    }

    public function styles(Worksheet $sheet)
    {
        // Style for the header row
        $sheet->getStyle('A6:F6')->applyFromArray([
            'font' => ['bold' => true],
            'alignment' => ['horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER],
            'fill' => [
                'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                'startColor' => ['argb' => 'FFE0E0E0']
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN
                ]
            ]
        ]);

        // Add header information
        $sheet->setCellValue('A1', 'Laporan Riwayat Keuangan');
        $sheet->mergeCells('A1:F1');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(16);
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);

        $sheet->setCellValue('A3', 'Laboratorium');
        $sheet->setCellValue('B3', ': ' . $this->kepengurusanLab->laboratorium->nama);
        
        $sheet->setCellValue('A4', 'Tahun Kepengurusan');
        $sheet->setCellValue('B4', ': ' . $this->kepengurusanLab->tahunKepengurusan->tahun);

        // Auto size columns
        foreach (range('A', 'F') as $columnID) {
            $sheet->getColumnDimension($columnID)->setAutoSize(true);
        }
    }
}
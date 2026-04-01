<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class SuratKeluarExport implements FromCollection, WithHeadings, WithTitle, WithStyles
{
    protected $suratKeluar;
    protected $labNama;

    public function __construct($suratKeluar, string $labNama = '')
    {
        $this->suratKeluar = $suratKeluar;
        $this->labNama     = $labNama;
    }

    public function collection()
    {
        return $this->suratKeluar->map(function ($item, $index) {
            return [
                'No'               => $index + 1,
                'Nomor Surat'      => $item->nomor_surat,
                'Perihal'          => $item->perihal,
                'Tujuan'           => $item->tujuan,
                'Tanggal Surat'    => $item->tanggal_surat ? $item->tanggal_surat->format('d/m/Y') : '-',
                'Kode Klasifikasi' => $item->kode_klasifikasi ?? '-',
                'Isi Ringkas'      => $item->isi_ringkas ?? '-',
                'Dibuat Oleh'      => $item->dibuatOleh?->name ?? '-',
            ];
        });
    }

    public function headings(): array
    {
        return [
            'No',
            'Nomor Surat',
            'Perihal',
            'Tujuan',
            'Tanggal Surat',
            'Kode Klasifikasi',
            'Isi Ringkas',
            'Dibuat Oleh',
        ];
    }

    public function title(): string
    {
        return 'Surat Keluar ' . $this->labNama;
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}

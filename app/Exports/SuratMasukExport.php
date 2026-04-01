<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class SuratMasukExport implements FromCollection, WithHeadings, WithTitle, WithStyles
{
    protected $suratMasuk;
    protected $labNama;

    public function __construct($suratMasuk, string $labNama = '')
    {
        $this->suratMasuk = $suratMasuk;
        $this->labNama    = $labNama;
    }

    public function collection()
    {
        return $this->suratMasuk->map(function ($item, $index) {
            return [
                'No'              => $index + 1,
                'Nomor Agenda'    => $item->nomor_agenda,
                'Nomor Surat Asal'=> $item->nomor_surat_asal,
                'Asal Surat'      => $item->asal_surat,
                'Perihal'         => $item->perihal,
                'Tanggal Surat'   => $item->tanggal_surat ? $item->tanggal_surat->format('d/m/Y') : '-',
                'Tanggal Terima'  => $item->tanggal_terima ? $item->tanggal_terima->format('d/m/Y') : '-',
                'Isi Ringkas'     => $item->isi_ringkas ?? '-',
                'Diterima Oleh'   => $item->diterimaOleh?->name ?? '-',
            ];
        });
    }

    public function headings(): array
    {
        return [
            'No',
            'Nomor Agenda',
            'Nomor Surat Asal',
            'Asal Surat',
            'Perihal',
            'Tanggal Surat',
            'Tanggal Terima',
            'Isi Ringkas',
            'Diterima Oleh',
        ];
    }

    public function title(): string
    {
        return 'Surat Masuk ' . $this->labNama;
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}

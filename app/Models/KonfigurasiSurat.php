<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KonfigurasiSurat extends Model
{
    protected $table = 'konfigurasi_surat';

    public $incrementing = false;
    protected $keyType = 'string';
    protected $primaryKey = 'kepengurusan_lab_id';

    protected $fillable = [
        'kepengurusan_lab_id',
        'inisial_lab',
        'format_nomor',
        'variabel_aktif',
        'reset_tiap_tahun',
    ];

    protected $casts = [
        'variabel_aktif'  => 'array',
        'reset_tiap_tahun' => 'boolean',
    ];

    public function kepengurusanLab(): BelongsTo
    {
        return $this->belongsTo(KepengurusanLab::class, 'kepengurusan_lab_id');
    }

    /**
     * Generate the formatted nomor surat from the configured format.
     *
     * @param int    $nomor     The sequential number
     * @param string $tanggal   Date string (Y-m-d)
     * @return string
     */
    public function generateNomor(int $nomor, string $tanggal): string
    {
        $date = \Carbon\Carbon::parse($tanggal);

        $bulanRomawi = [
            1  => 'I',   2  => 'II',  3  => 'III', 4  => 'IV',
            5  => 'V',   6  => 'VI',  7  => 'VII', 8  => 'VIII',
            9  => 'IX',  10 => 'X',   11 => 'XI',  12 => 'XII',
        ][$date->month];

        $replacements = [
            '{nomor}'        => $nomor,
            '{inisial_lab}'  => $this->inisial_lab,
            '{bulan_romawi}' => $bulanRomawi,
            '{tahun}'        => $date->year,
            '{bulan}'        => str_pad($date->month, 2, '0', STR_PAD_LEFT),
        ];

        return str_replace(
            array_keys($replacements),
            array_values($replacements),
            $this->format_nomor
        );
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ModulPraktikum extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $table = 'modul_praktikum';

    protected $fillable = [
        'pertemuan_id',
        'nomor_pertemuan',
        'judul',
        'modul',
        'is_public',
        'hash',
    ];

    public function pertemuan()
    {
        return $this->belongsTo(PertemuanPraktikum::class, 'pertemuan_id');
    }

    /**
     * Get praktikum through pertemuan → kelas chain.
     * Access via: $modul->pertemuan->kelas->praktikum
     *
     * For query constraints use: whereHas('pertemuan.kelas.praktikum', ...)
     */
    public function getPraktikumAttribute()
    {
        return $this->pertemuan?->kelas?->praktikum;
    }
}

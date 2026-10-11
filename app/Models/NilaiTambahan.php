<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class NilaiTambahan extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'nilai_tambahan';

    protected $fillable = [
        'pengumpulan_tugas_id',
        'tugas_praktikum_id',
        'praktikan_id',
        'nilai',
        'kategori',
        'keterangan',
        'diberikan_oleh',
        'diberikan_at'
    ];

    protected $casts = [
        'nilai' => 'decimal:2',
        'diberikan_at' => 'datetime'
    ];

    public function pengumpulanTugas()
    {
        return $this->belongsTo(\App\Models\PengumpulanTugas::class, 'pengumpulan_tugas_id');
    }

    public function diberikanOleh()
    {
        return $this->belongsTo(\App\Models\User::class, 'diberikan_oleh');
    }

    public function tugasPraktikum()
    {
        return $this->belongsTo(TugasPraktikum::class);
    }

    public function praktikan()
    {
        return $this->belongsTo(Praktikan::class);
    }

    public function scopeByKategori($query, $kategori)
    {
        return $query->where('kategori', $kategori);
    }

    public function scopeForPraktikanTask($query, string $praktikanId, string $tugasId)
    {
        return $query->where(function ($query) use ($praktikanId, $tugasId) {
            $query->where(fn ($legacy) => $legacy->where('tugas_praktikum_id', $tugasId)->where('praktikan_id', $praktikanId))
                ->orWhereHas('pengumpulanTugas', fn ($submission) => $submission->where('tugas_praktikum_id', $tugasId)
                    ->whereHas('praktikanPraktikum', fn ($enrollment) => $enrollment->where('praktikan_id', $praktikanId)));
        });
    }
}

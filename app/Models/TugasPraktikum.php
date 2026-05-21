<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

class TugasPraktikum extends Model
{
    use HasFactory;
    use HasUuids;
    protected $table = 'tugas_praktikum';

    protected $fillable = [
        'pertemuan_id',
        'kelas_id',
        'judul_tugas',
        'deskripsi',
        'file_tugas',
        'deadline',
        'status'
    ];

    protected $casts = [
        'deadline' => 'datetime',
        'status' => 'string'
    ];

    public function kelas()
    {
        return $this->belongsTo(Kelas::class);
    }


    public function praktikum()
    {
        return $this->hasOneThrough(
            Praktikum::class,
            Kelas::class,
            'id',
            'id',
            'kelas_id',
            'praktikum_id'
        );
    }

    public function pertemuan()
    {
        return $this->belongsTo(PertemuanPraktikum::class, 'pertemuan_id');
    }

    public function pengumpulanTugas()
    {
        return $this->hasMany(PengumpulanTugas::class);
    }

    public function scopeAktif($query)
    {
        return $query->where('status', 'aktif');
    }

    public function scopeBelumDeadline($query)
    {
        return $query->where('deadline', '>=', now());
    }

    public function scopeSudahDeadline($query)
    {
        return $query->where('deadline', '<', now());
    }

    public function komponenRubriks()
    {
        return $this->hasMany(\App\Models\KomponenRubrik::class, 'tugas_praktikum_id')->orderBy('urutan');
    }

    public function nilaiTambahans()
    {
        return $this->hasManyThrough(
            \App\Models\NilaiTambahan::class,
            \App\Models\PengumpulanTugas::class,
            'tugas_praktikum_id',
            'pengumpulan_tugas_id',
            'id',
            'id'
        );
    }
}

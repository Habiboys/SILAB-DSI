<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
//has uuid
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

    // Relasi ke Kelas
    public function kelas()
    {
        return $this->belongsTo(Kelas::class);
    }

    /**
     * Get praktikum through kelas relationship.
     */
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

    // Relasi ke Pengumpulan Tugas
    public function pengumpulanTugas()
    {
        return $this->hasMany(PengumpulanTugas::class);
    }

    // Scope untuk tugas aktif
    public function scopeAktif($query)
    {
        return $query->where('status', 'aktif');
    }

    // Scope untuk tugas yang belum deadline
    public function scopeBelumDeadline($query)
    {
        return $query->where('deadline', '>=', now());
    }

    // Scope untuk tugas yang sudah deadline
    public function scopeSudahDeadline($query)
    {
        return $query->where('deadline', '<', now());
    }

    // Relasi ke KomponenRubrik (langsung tanpa tabel rubrik_penilaian)
    public function komponenRubriks()
    {
        return $this->hasMany(\App\Models\KomponenRubrik::class, 'tugas_praktikum_id')->orderBy('urutan');
    }

    // Relasi ke NilaiTambahan (via PengumpulanTugas)
    public function nilaiTambahans()
    {
        return $this->hasManyThrough(
            \App\Models\NilaiTambahan::class,
            \App\Models\PengumpulanTugas::class,
            'tugas_praktikum_id',   // FK on pengumpulan_tugas -> tugas_praktikum
            'pengumpulan_tugas_id', // FK on nilai_tambahan -> pengumpulan_tugas
            'id',                   // local key on tugas_praktikum
            'id'                    // local key on pengumpulan_tugas
        );
    }
}

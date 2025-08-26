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
        'praktikum_id',
        'kelas_id',
        'judul_tugas',
        'deskripsi',
        'file_tugas',
        'deadline',
        'status'
    ];

    protected $casts = [
        'deadline' => 'date',
        'status' => 'string'
    ];

    // Relasi ke Praktikum
    public function praktikum()
    {
        return $this->belongsTo(Praktikum::class);
    }

    // Relasi ke Kelas
    public function kelas()
    {
        return $this->belongsTo(Kelas::class);
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

    // Scope untuk tugas berdasarkan praktikum
    public function scopeByPraktikum($query, $praktikumId)
    {
        return $query->where('praktikum_id', $praktikumId);
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

    // Relasi ke NilaiTambahan
    public function nilaiTambahans()
    {
        return $this->hasMany(\App\Models\NilaiTambahan::class, 'tugas_praktikum_id');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Praktikan extends Model
{
    use HasFactory, HasUuids;
    
    public $incrementing = false;
    protected $keyType = 'string';

    protected $table = 'praktikan';
    
    protected $fillable = [
        'nim',
        'nama',
        'no_hp',
        'user_id',
        'praktikum_id',
        'kelas_id',
        'status'
    ];

    protected $casts = [
        'status' => 'string'
    ];

    // Relasi ke User (jika sudah ada akun)
    public function user()
    {
        return $this->belongsTo(User::class);
    }

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

    // Relasi ke Laboratorium melalui Praktikum
    public function lab()
    {
        return $this->praktikum->kepengurusanLab->laboratorium ?? null;
    }

    // Relasi ke Pengumpulan Tugas
    public function pengumpulanTugas()
    {
        return $this->hasMany(PengumpulanTugas::class);
    }

    // Scope untuk praktikan aktif
    public function scopeAktif($query)
    {
        return $query->where('status', 'aktif');
    }

    // Scope untuk praktikan berdasarkan praktikum
    public function scopeByPraktikum($query, $praktikumId)
    {
        return $query->where('praktikum_id', $praktikumId);
    }

    // Get lab melalui praktikum
    public function getLab()
    {
        return $this->praktikum->kepengurusanLab->laboratorium ?? null;
    }
}

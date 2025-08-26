<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Kelas extends Model
{
    use HasFactory, HasUuids;
    
    public $incrementing = false;
    protected $keyType = 'string';
    protected $table = 'kelas';

    protected $fillable = [
        'nama_kelas',
        'praktikum_id',
        'status'
    ];

    protected $casts = [
        'status' => 'string'
    ];

    // Relasi ke Praktikum
    public function praktikum()
    {
        return $this->belongsTo(Praktikum::class);
    }

    // Relasi ke Praktikan
    public function praktikans()
    {
        return $this->hasMany(Praktikan::class);
    }

    // Relasi ke Tugas Praktikum
    public function tugasPraktikums()
    {
        return $this->hasMany(TugasPraktikum::class);
    }

    // Relasi ke Jadwal Praktikum
    public function jadwalPraktikums()
    {
        return $this->hasMany(JadwalPraktikum::class);
    }

    // Scope untuk kelas aktif
    public function scopeAktif($query)
    {
        return $query->where('status', 'aktif');
    }

    // Scope berdasarkan praktikum
    public function scopeByPraktikum($query, $praktikumId)
    {
        return $query->where('praktikum_id', $praktikumId);
    }
}

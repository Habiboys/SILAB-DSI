<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Praktikum extends Model
{
    use HasFactory, HasUuids;
    
    public $incrementing = false;
    protected $keyType = 'string';

    protected $table = 'praktikum';

    protected $fillable = [
        'mata_kuliah',
        'kepengurusan_lab_id',
    ];

    public function jadwalPraktikum()
    {
        return $this->hasMany(JadwalPraktikum::class, 'praktikum_id');
    }

    public function kepengurusanLab()
    {
        return $this->belongsTo(KepengurusanLab::class);
    }

    public function modulPraktikum()
    {
        return $this->hasMany(ModulPraktikum::class);
    }

    // Relasi ke Praktikan
    public function praktikan()
    {
        return $this->hasMany(Praktikan::class);
    }

    // Relasi ke Kelas
    public function kelas()
    {
        return $this->hasMany(Kelas::class);
    }

    // Relasi ke Tugas Praktikum
    public function tugasPraktikum()
    {
        return $this->hasMany(TugasPraktikum::class);
    }
}
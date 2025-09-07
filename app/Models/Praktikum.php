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

    // Relasi ke Praktikan (many-to-many melalui PraktikanPraktikum)
    public function praktikans()
    {
        return $this->belongsToMany(Praktikan::class, 'praktikan_praktikum', 'praktikum_id', 'praktikan_id')
                    ->withPivot(['kelas_id', 'status'])
                    ->withTimestamps();
    }

    // Relasi ke PraktikanPraktikum (pivot table)
    public function praktikanPraktikums()
    {
        return $this->hasMany(PraktikanPraktikum::class);
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

    // Relasi ke Aslab yang ditugaskan
    public function aslabPraktikum()
    {
        return $this->hasMany(AslabPraktikum::class);
    }

    // Relasi ke User (Aslab) yang ditugaskan
    public function aslab()
    {
        return $this->belongsToMany(User::class, 'aslab_praktikum', 'praktikum_id', 'user_id')
                    ->withPivot('catatan')
                    ->withTimestamps();
    }
}
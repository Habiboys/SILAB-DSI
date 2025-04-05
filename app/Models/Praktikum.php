<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Praktikum extends Model
{
    use HasFactory;

    protected $table = 'praktikum';

    protected $fillable = [
        'mata_kuliah',
        'jadwal_id',
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
}
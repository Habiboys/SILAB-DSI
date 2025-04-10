<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KepengurusanLab extends Model
{
    use HasFactory;

    protected $table = 'kepengurusan_lab';

    protected $fillable = [
        'tahun_kepengurusan_id',
        'laboratorium_id',
        'sk'
    ];

    public function tahunKepengurusan()
    {
        return $this->belongsTo(TahunKepengurusan::class);
    }

    public function laboratorium()
    {
        return $this->belongsTo(Laboratorium::class);
    }

    public function periodePiket()
    {
        return $this->hasMany(PeriodePiket::class, 'kepengurusan_lab_id');
    }

    public function struktur()
    {
        return $this->hasMany(Struktur::class);
    }

    public function laporanKeuangan()
    {
        return $this->hasMany(LaporanKeuangan::class);
    }

    public function jadwalPiket()
    {
        return $this->hasMany(JadwalPiket::class);
    }

    public function riwayatKeuangan()
    {
        return $this->hasMany(RiwayatKeuangan::class);
    }
    
    public function praktikum()
    {
        return $this->hasMany(Praktikum::class);
    }
}
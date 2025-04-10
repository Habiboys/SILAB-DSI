<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PeriodePiket extends Model
{
    use HasFactory;

    protected $table = "periode_piket";

    protected $fillable = [
        'nama', 
        'tanggal_mulai', 
        'tanggal_selesai', 
        'isactive',
        'kepengurusan_lab_id' // Add this
    ];

    protected $casts = [
        'tanggal_mulai' => 'date',
        'tanggal_selesai' => 'date',
        'isactive' => 'boolean',
    ];

    public function kepengurusanLab()
    {
        return $this->belongsTo(KepengurusanLab::class, 'kepengurusan_lab_id');
    }

    public function jadwalPiket()
    {
        return $this->hasManyThrough(
            JadwalPiket::class,
            Absensi::class,
            'periode_piket_id',
            'id',
            'id',
            'jadwal_piket'
        );
    }

    public function absensi()
    {
        return $this->hasMany(Absensi::class);
    }
}
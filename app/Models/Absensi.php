<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Absensi extends Model
{
    use HasFactory;
    
    protected $table = 'absensi';
    
    protected $fillable = [
        'tanggal', 
        'jam_masuk', 
        'jam_keluar', 
        'foto', 
        'jadwal_piket', 
        'kegiatan', 
        'periode_piket_id'
    ];
    
    protected $casts = [
        'tanggal' => 'date',
    ];

    // Fix for the relationship - this joins to the jadwal_piket field
    public function jadwalPiket()
    {
        return $this->belongsTo(JadwalPiket::class, 'jadwal_piket');
    }

    public function periodePiket()
    {
        return $this->belongsTo(PeriodePiket::class, 'periode_piket_id');
    }
}
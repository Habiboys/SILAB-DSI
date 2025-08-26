<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Absensi extends Model
{
    use HasFactory, HasUuids;
    
    public $incrementing = false;
    protected $keyType = 'string';
    
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
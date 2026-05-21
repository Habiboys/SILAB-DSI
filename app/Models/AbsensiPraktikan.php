<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class AbsensiPraktikan extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'absensi_praktikan';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'pertemuan_id',
        'praktikan_praktikum_id',
        'status',
        'waktu_absen',
        'keterangan',
    ];

    protected $casts = [
        'waktu_absen' => 'datetime',
    ];

    public function pertemuan()
    {
        return $this->belongsTo(PertemuanPraktikum::class, 'pertemuan_id');
    }

    
    public function praktikanPraktikum()
    {
        return $this->belongsTo(PraktikanPraktikum::class, 'praktikan_praktikum_id');
    }

    
    public function praktikan()
    {
        return $this->hasOneThrough(
            Praktikan::class,
            PraktikanPraktikum::class,
            'id',
            'id',
            'praktikan_praktikum_id',
            'praktikan_id'
        );
    }
}

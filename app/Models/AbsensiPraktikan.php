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

    /**
     * Relation to PraktikanPraktikum (enrollment record).
     */
    public function praktikanPraktikum()
    {
        return $this->belongsTo(PraktikanPraktikum::class, 'praktikan_praktikum_id');
    }

    /**
     * Convenience accessor: get the Praktikan through PraktikanPraktikum.
     */
    public function praktikan()
    {
        return $this->hasOneThrough(
            Praktikan::class,
            PraktikanPraktikum::class,
            'id',                    // PK on praktikan_praktikum
            'id',                    // PK on praktikan
            'praktikan_praktikum_id',// local key on absensi_praktikan
            'praktikan_id'           // FK on praktikan_praktikum pointing to praktikan
        );
    }
}

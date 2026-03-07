<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class AbsensiAslab extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'absensi_aslab';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'pertemuan_id',
        'aslab_praktikum_id',
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
     * Relation to PraktikanPraktikum (the aslab's enrollment record).
     */
    public function aslabPraktikum()
    {
        return $this->belongsTo(PraktikanPraktikum::class, 'aslab_praktikum_id');
    }

    /**
     * Get the user (aslab) through PraktikanPraktikum → Praktikan → User.
     */
    public function user()
    {
        return $this->hasOneThrough(
            User::class,
            PraktikanPraktikum::class,
            'id',           // FK on praktikan_praktikum (PK)
            'id',           // FK on users (PK)
            'aslab_praktikum_id', // local key on absensi_aslab
            'praktikan_id'  // local key on praktikan_praktikum → use Praktikan's user_id
        );
    }
}

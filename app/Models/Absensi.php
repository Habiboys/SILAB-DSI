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
        'foto_checkin',
        'foto_checkout',
        'jadwal_piket_id',
        'kegiatan',
        'is_manual',
        'manual_input_by',
        'verification_status',
        'verified_by',
        'verified_at',
        'verification_note',
        'checkin_latitude', 'checkin_longitude', 'checkin_distance_meters',
        'checkout_latitude', 'checkout_longitude', 'checkout_distance_meters',
        'location_samples_inside', 'location_samples_outside', 'location_percent', 'location_status',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'is_manual' => 'boolean',
        'geolocation_enabled' => 'boolean',
        'location_percent' => 'integer',
        'location_samples_inside' => 'integer',
        'location_samples_outside' => 'integer',
        'verified_at' => 'datetime',
    ];

    public function jadwalPiket()
    {
        return $this->belongsTo(JadwalPiket::class, 'jadwal_piket_id')->withTrashed();
    }


    public function getPeriodePiketAttribute()
    {
        if (!$this->jadwalPiket) {
            return null;
        }

        return PeriodePiket::where('kepengurusan_lab_id', $this->jadwalPiket->kepengurusan_lab_id)
            ->where('tanggal_mulai', '<=', $this->tanggal)
            ->where('tanggal_selesai', '>=', $this->tanggal)
            ->first();
    }
}

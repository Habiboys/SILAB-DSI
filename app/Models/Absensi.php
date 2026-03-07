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
    ];

    protected $casts = [
        'tanggal' => 'date',
    ];

    public function jadwalPiket()
    {
        return $this->belongsTo(JadwalPiket::class, 'jadwal_piket_id');
    }

    /**
     * Get the periode piket that this absensi belongs to, derived via jadwal_piket date range.
     * Since periode_piket_id was removed, we look it up through the jadwal's kepengurusan_lab
     * and the absensi tanggal.
     */
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

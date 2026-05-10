<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class GantiJadwalPiket extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $table = 'ganti_jadwal_piket';

    protected $fillable = [
        'jadwal_piket_id',
        'periode_piket_id',
        'kepengurusan_user_id',
        'hari_lama',
        'hari_baru',
        'alasan',
        'status',
        'approved_by',
        'approved_at',
        'catatan_admin'
    ];

    protected $casts = [
        'approved_at' => 'datetime',
    ];

    // Expose user via accessor so frontend JSON contract stays the same
    protected $appends = ['user'];

    public function kepengurusanUser()
    {
        return $this->belongsTo(KepengurusanUser::class, 'kepengurusan_user_id');
    }

    public function jadwalPiket()
    {
        return $this->belongsTo(JadwalPiket::class);
    }

    public function periodePiket()
    {
        return $this->belongsTo(PeriodePiket::class);
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    // Accessor: returns the User model through kepengurusanUser
    public function getUserAttribute()
    {
        return $this->kepengurusanUser?->user;
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    public function getStatusTextAttribute()
    {
        return match($this->status) {
            'pending' => 'Menunggu Persetujuan',
            'approved' => 'Disetujui',
            'rejected' => 'Ditolak',
            default => 'Tidak Diketahui'
        };
    }

    public function getHariLamaTextAttribute()
    {
        return match($this->hari_lama) {
            'senin' => 'Senin',
            'selasa' => 'Selasa',
            'rabu' => 'Rabu',
            'kamis' => 'Kamis',
            'jumat' => 'Jumat',
            default => ucfirst($this->hari_lama)
        };
    }

    public function getHariBaruTextAttribute()
    {
        return match($this->hari_baru) {
            'senin' => 'Senin',
            'selasa' => 'Selasa',
            'rabu' => 'Rabu',
            'kamis' => 'Kamis',
            'jumat' => 'Jumat',
            default => ucfirst($this->hari_baru)
        };
    }
}

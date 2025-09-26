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
        'user_id',
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
    
    // Relationships
    public function jadwalPiket()
    {
        return $this->belongsTo(JadwalPiket::class);
    }
    
    public function periodePiket()
    {
        return $this->belongsTo(PeriodePiket::class);
    }
    
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    
    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
    
    // Scopes
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
    
    // Accessor untuk status dalam bahasa Indonesia
    public function getStatusTextAttribute()
    {
        return match($this->status) {
            'pending' => 'Menunggu Persetujuan',
            'approved' => 'Disetujui',
            'rejected' => 'Ditolak',
            default => 'Tidak Diketahui'
        };
    }
    
    // Accessor untuk hari dalam bahasa Indonesia
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

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class PeriodePiket extends Model
{
    use HasFactory, HasUuids;
    
    public $incrementing = false;
    protected $keyType = 'string';

    protected $table = 'periode_piket';

    protected $fillable = [
        'nama',
        'tanggal_mulai',
        'tanggal_selesai',
        'isactive',
        'kepengurusan_lab_id',
    ];

    protected $casts = [
        'tanggal_mulai' => 'date',
        'tanggal_selesai' => 'date',
        'isactive' => 'boolean',
    ];

    /**
     * Get the kepengurusan lab that this period belongs to
     */
    public function kepengurusanLab(): BelongsTo
    {
        return $this->belongsTo(KepengurusanLab::class, 'kepengurusan_lab_id');
    }

    /**
     * Check if any absensi exist for this period.
     * Absensi no longer has periode_piket_id; we match via jadwal_piket.kepengurusan_lab_id and tanggal within period range.
     */
    public function hasAbsensi(): bool
    {
        return Absensi::whereHas('jadwalPiket', function ($q) {
            $q->where('kepengurusan_lab_id', $this->kepengurusan_lab_id);
        })
            ->whereBetween('tanggal', [$this->tanggal_mulai, $this->tanggal_selesai])
            ->exists();
    }
    
    /**
     * Scope to filter by kepengurusan lab
     */
    public function scopeForKepengurusanLab($query, $kepengurusanLabId)
    {
        return $query->where('kepengurusan_lab_id', $kepengurusanLabId);
    }
    
    /**
     * Convenience method to get the lab ID through the kepengurusan relationship
     */
    public function getLabIdAttribute()
    {
        return $this->kepengurusanLab ? $this->kepengurusanLab->laboratorium_id : null;
    }
    
    /**
     * Convenience method to get the tahun ID through the kepengurusan relationship
     */
    public function getTahunIdAttribute()
    {
        return $this->kepengurusanLab ? $this->kepengurusanLab->tahun_kepengurusan_id : null;
    }
}
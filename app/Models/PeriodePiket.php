<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PeriodePiket extends Model
{
    use HasFactory;

    protected $table = 'periode_piket';

    protected $fillable = [
        'nama',
        'tanggal_mulai',
        'tanggal_selesai',
        'isactive',
        'kepengurusan_lab_id',
    ];

    protected $casts = [
        'tanggal_mulai' => 'datetime',
        'tanggal_selesai' => 'datetime',
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
     * Get the absensi records for this period
     */
    public function absensi(): HasMany
    {
        return $this->hasMany(Absensi::class, 'periode_piket_id');
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
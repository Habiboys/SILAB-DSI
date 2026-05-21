<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class NominalKas extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'kepengurusan_lab_id',
        'nominal',
        'periode',
        'periode_mulai',
        'periode_berakhir',
        'is_active',
        'deskripsi'
    ];

    protected $casts = [
        'nominal' => 'decimal:2',
        'is_active' => 'boolean',
        'periode' => 'string',
        'periode_mulai' => 'date',
        'periode_berakhir' => 'date'
    ];

    public function kepengurusanLab()
    {
        return $this->belongsTo(KepengurusanLab::class);
    }

    public function pemasukanKeuangan()
    {
        return $this->hasMany(PemasukanKeuangan::class, 'nominal_kas_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByPeriode($query, $periode)
    {
        return $query->where('periode', $periode);
    }

    public static function getActiveNominalKas($kepengurusanLabId, $periode = null)
    {
        $query = self::where('kepengurusan_lab_id', $kepengurusanLabId)
            ->where('is_active', true);

        if ($periode) {
            $query->where('periode', $periode);
        }

        return $query->first();
    }

    public function calculatePeriodsPaid($amount)
    {
        if ($this->nominal <= 0) {
            return 0;
        }

        return floor($amount / $this->nominal);
    }

    public function calculateRemainingAmount($amount)
    {
        $periodsPaid = $this->calculatePeriodsPaid($amount);
        $totalPaid = $periodsPaid * $this->nominal;

        return $amount - $totalPaid;
    }
}

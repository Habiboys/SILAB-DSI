<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PengaturanPiket extends Model
{
    use HasUuids;

    protected $table = 'pengaturan_piket';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'kepengurusan_lab_id',
        'ada_denda',
        'nominal_denda',
    ];

    protected $casts = [
        'ada_denda'      => 'boolean',
        'nominal_denda'  => 'decimal:2',
    ];

    public function kepengurusanLab(): BelongsTo
    {
        return $this->belongsTo(KepengurusanLab::class, 'kepengurusan_lab_id');
    }
}

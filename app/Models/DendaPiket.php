<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class DendaPiket extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';
    protected $table = 'denda_piket';

    protected $fillable = [
        'user_id',
        'periode_piket_id',
        'kepengurusan_lab_id',
        'total_denda',
        'sudah_dibayar',
        'status',
    ];

    protected $casts = [
        'total_denda' => 'decimal:2',
        'sudah_dibayar' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function periodePiket()
    {
        return $this->belongsTo(PeriodePiket::class);
    }

    public function kepengurusanLab()
    {
        return $this->belongsTo(KepengurusanLab::class);
    }

    public function pemasukanKeuangan()
    {
        return $this->hasMany(PemasukanKeuangan::class, 'denda_piket_id');
    }
}

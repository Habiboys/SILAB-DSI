<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class TagihanKas extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';
    protected $table = 'tagihan_kas';

    protected $fillable = [
        'user_id',
        'nominal_kas_id',
        'kepengurusan_lab_id',
        'total_tagihan',
        'sudah_dibayar',
        'status',
    ];

    protected $casts = [
        'total_tagihan' => 'decimal:2',
        'sudah_dibayar' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function nominalKas()
    {
        return $this->belongsTo(NominalKas::class);
    }

    public function kepengurusanLab()
    {
        return $this->belongsTo(KepengurusanLab::class);
    }

    public function pemasukanKeuangan()
    {
        return $this->hasMany(PemasukanKeuangan::class, 'tagihan_kas_id');
    }
}

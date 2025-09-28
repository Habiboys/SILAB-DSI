<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class RiwayatKeuangan extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';
    protected $table = 'riwayat_keuangan';
    protected $fillable = [
        'tanggal',
        'nominal',
        'jenis',
        'deskripsi',
        'bukti',
        'user_id',
        'kepengurusan_lab_id',
        'is_uang_kas',
        'jenis_pembayaran_kas',
        'catatan_pembayaran'
    ];

    protected $casts = [
        'tanggal' => 'date',
        'is_uang_kas' => 'boolean',
        'jenis_pembayaran_kas' => 'string'
    ];
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function kepengurusanLab()
    {
        return $this->belongsTo(KepengurusanLab::class);
    }
}

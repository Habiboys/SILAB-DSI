<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class RiwayatKeuangan extends Model
{
    use HasFactory;

    protected $table = 'riwayat_keuangan';

    protected $fillable = [
        'tanggal',
        'nominal',
        'jenis',
        'deskripsi',
        'bukti',
        'user_id',
        'kepengurusan_lab_id',
    ];

    protected $casts = [
        'tanggal' => 'date',
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
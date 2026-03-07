<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class PengeluaranKeuangan extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';
    protected $table = 'pengeluaran_keuangan';

    protected $fillable = [
        'tanggal',
        'nominal',
        'deskripsi',
        'bukti',
        'user_id',
        'kepengurusan_lab_id',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'nominal' => 'integer',
    ];

    // Virtual field to unify with old RiwayatKeuangan usage
    protected $appends = ['jenis'];

    public function getJenisAttribute(): string
    {
        return 'keluar';
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function kepengurusanLab()
    {
        return $this->belongsTo(KepengurusanLab::class, 'kepengurusan_lab_id');
    }
}

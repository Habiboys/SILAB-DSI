<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class LaporanKeuangan extends Model
{
    use HasFactory, HasUuids;
    
    public $incrementing = false;
    protected $keyType = 'string';

    protected $table = 'laporan_keuangan';

    protected $fillable = [
        'bulan',
        'kepengurusan_lab_id',
        'pemasukan',
        'pengeluaran',
        'saldo_akhir',
    ];

    public function kepengurusanLab()
    {
        return $this->belongsTo(KepengurusanLab::class);
    }
}
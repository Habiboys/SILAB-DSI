<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LaporanKeuangan extends Model
{
    use HasFactory;

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
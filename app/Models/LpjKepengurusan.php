<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LpjKepengurusan extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'lpj_kepengurusan';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'kepengurusan_lab_id',
        'judul',
        'nomor_dokumen',
        'status',
        'ringkasan',
        'total_proker',
        'proker_disetujui',
        'proker_selesai',
        'total_kegiatan',
        'kegiatan_disetujui',
        'total_laporan_kegiatan',
        'total_dokumentasi_kegiatan',
        'persentase_capaian_rata2',
        'generated_at',
        'generated_by',
        'approved_at',
        'approved_by',
        'locked_at',
    ];

    protected $casts = [
        'generated_at' => 'datetime',
        'approved_at' => 'datetime',
        'locked_at' => 'datetime',
        'persentase_capaian_rata2' => 'decimal:2',
    ];

    public function kepengurusanLab()
    {
        return $this->belongsTo(KepengurusanLab::class, 'kepengurusan_lab_id');
    }

    public function generator()
    {
        return $this->belongsTo(User::class, 'generated_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}

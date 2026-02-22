<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Kegiatan extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'kegiatan';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'proker_id',
        'nama_kegiatan',
        'deskripsi_kegiatan',
        'tanggal_mulai',
        'tanggal_selesai',
        'status_approval',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'tanggal_mulai' => 'date',
        'tanggal_selesai' => 'date',
        'approved_at' => 'datetime',
    ];

    public function proker()
    {
        return $this->belongsTo(Proker::class, 'proker_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function laporanKegiatan()
    {
        return $this->hasMany(LaporanKegiatan::class, 'kegiatan_id');
    }

    public function peserta()
    {
        return $this->hasMany(KegiatanPeserta::class, 'kegiatan_id');
    }
}

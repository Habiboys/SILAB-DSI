<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class PeminjamanAset extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'peminjaman_aset';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'nama_peminjam',
        'institusi',
        'keperluan',
        'tanggal_pinjam',
        'tanggal_kembali_rencana',
        'tanggal_kembali_aktual',
        'status',
        'surat_peminjaman_path',
        'catatan',
        'diproses_oleh',
    ];

    protected $casts = [
        'tanggal_pinjam'           => 'date',
        'tanggal_kembali_rencana'  => 'date',
        'tanggal_kembali_aktual'   => 'date',
    ];

    public function items()
    {
        return $this->hasMany(PeminjamanAsetItem::class, 'peminjaman_aset_id');
    }

    public function itemsBelumKembali()
    {
        return $this->hasMany(PeminjamanAsetItem::class, 'peminjaman_aset_id')
                    ->whereNull('tanggal_kembali_aktual');
    }

    public function diprosesoleh()
    {
        return $this->belongsTo(User::class, 'diproses_oleh');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class PeminjamanAsetItem extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'peminjaman_aset_items';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'peminjaman_aset_id',
        'aset_id',
        'tanggal_kembali_aktual',
        'kondisi_setelah_kembali',
        'catatan_item',
    ];

    protected $casts = [
        'tanggal_kembali_aktual' => 'date',
    ];

    public function peminjaman()
    {
        return $this->belongsTo(PeminjamanAset::class, 'peminjaman_aset_id');
    }

    public function detailAset()
    {
        return $this->belongsTo(DetailAset::class, 'aset_id');
    }
}

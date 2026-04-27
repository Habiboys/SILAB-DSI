<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class WishlistAset extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'wishlist_aset';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'permohonan_aset_id',
        'nama_barang',
        'jenis_barang',
        'spesifikasi_teknis',
        'perkiraan_harga',
        'jumlah_diminta',
        'satuan',
        'urgensi',
        'referensi_url',
        'status_item',
        'jumlah_disetujui',
        'catatan_item',
    ];

    protected $casts = [
        'perkiraan_harga' => 'decimal:2',
        'jumlah_diminta' => 'integer',
        'jumlah_disetujui' => 'integer',
    ];

    public function permohonanAset()
    {
        return $this->belongsTo(PermohonanAset::class, 'permohonan_aset_id');
    }

    public function laboratorium()
    {
        return $this->belongsTo(Laboratorium::class, 'laboratorium_id');
    }

    public function detailAsets()
    {
        return $this->hasMany(DetailAset::class, 'wishlist_aset_id');
    }

    /** Scope: item yang belum masuk permohonan (standalone draft) */
    public function scopeStandalone($query)
    {
        return $query->whereNull('permohonan_aset_id');
    }
}

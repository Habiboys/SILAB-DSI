<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class DetailAset extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'detail_aset';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = [
        'kategori_aset_id',
        'laboratorium_id',
        'nama',
        'kode_barang',
        'keadaan',
        'status',
        'keterangan',
        'foto',
        'qr_code_path',
        'tanggal_perolehan',
        'harga_perolehan',
        'asal_barang',
        'wishlist_aset_id',
    ];

    protected $casts = [
        'tanggal_perolehan' => 'date',
        'harga_perolehan'   => 'decimal:2',
    ];

    public function kategoriAset()
    {
        return $this->belongsTo(KategoriAset::class, 'kategori_aset_id');
    }

    public function laboratorium()
    {
        return $this->belongsTo(Laboratorium::class, 'laboratorium_id');
    }

    public function riwayatKondisi()
    {
        return $this->hasMany(RiwayatKondisiAset::class, 'detail_aset_id')
                    ->orderBy('created_at', 'desc');
    }

    public function peminjaman()
    {
        return $this->hasMany(PeminjamanAset::class, 'detail_aset_id');
    }

    public function peminjamanAktif()
    {
        return $this->hasOne(PeminjamanAset::class, 'detail_aset_id')
                    ->where('status', 'dipinjam');
    }

    public function wishlistAset()
    {
        return $this->belongsTo(WishlistAset::class, 'wishlist_aset_id');
    }
}

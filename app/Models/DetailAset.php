<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class DetailAset extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'aset';
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
        return $this->hasMany(RiwayatKondisiAset::class, 'aset_id')
                    ->orderBy('created_at', 'desc');
    }

    public function peminjaman()
    {
        return $this->hasMany(PeminjamanAset::class, 'aset_id');
    }

    public function peminjamanItems()
    {
        return $this->hasMany(PeminjamanAsetItem::class, 'aset_id');
    }

    public function peminjamanAktifItem()
    {
        return $this->hasOne(PeminjamanAsetItem::class, 'aset_id')
                    ->whereNull('tanggal_kembali_aktual')
                    ->whereHas('peminjaman', fn($q) => $q->where('status', 'dipinjam'));
    }

    public function peminjamanAktif()
    {
        return $this->hasOneThrough(
            PeminjamanAset::class,
            PeminjamanAsetItem::class,
            'aset_id',
            'id',
            'id',
            'peminjaman_aset_id'
        )->where('peminjaman_aset.status', 'dipinjam')
         ->whereNull('peminjaman_aset_items.tanggal_kembali_aktual');
    }

    public function wishlistAset()
    {
        return $this->belongsTo(WishlistAset::class, 'wishlist_aset_id');
    }
}

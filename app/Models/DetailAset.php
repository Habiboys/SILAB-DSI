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
        'nama',
        'kode_barang',
        'kondisi',
        'status',
        'keterangan',
        'foto_path',
        'qr_code_path',
        'laboratorium_id', // Jika ada relasi langsung, opsional
        'tanggal_perolehan',
        'harga_perolehan',
    ];

    public function kategoriAset()
    {
        return $this->belongsTo(KategoriAset::class, 'kategori_aset_id');
    }
}
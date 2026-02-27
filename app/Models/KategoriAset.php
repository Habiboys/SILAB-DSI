<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class KategoriAset extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $table = 'kategori_aset';
    // Kategori aset dikelola secara global, tidak per-lab
    protected $fillable = ['nama', 'deskripsi'];

    public function detailAset()
    {
        return $this->hasMany(DetailAset::class, 'kategori_aset_id');
    }

    public function getJumlahAttribute()
    {
        return $this->detailAset()->count();
    }
}

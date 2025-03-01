<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DetailAset extends Model
{
    protected $fillable = ['aset_id', 'kode_barang', 'status', 'keadaan'];

    public function aset()
    {
        return $this->belongsTo(Aset::class);
    }
}
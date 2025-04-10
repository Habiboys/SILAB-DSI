<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DetailAset extends Model
{
    protected $table = 'detail_aset';
    protected $fillable = ['aset_id', 'kode_barang', 'status', 'keadaan', 'foto'];

    public function aset()
    {
        return $this->belongsTo(Aset::class);
    }
}
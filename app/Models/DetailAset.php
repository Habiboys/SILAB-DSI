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
    protected $fillable = ['aset_id', 'kode_barang', 
    'status', 'keadaan', 'foto'];

    public function aset()
    {
        return $this->belongsTo(Aset::class);
    }
}
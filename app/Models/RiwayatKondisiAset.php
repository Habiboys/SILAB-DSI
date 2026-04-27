<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class RiwayatKondisiAset extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'riwayat_kondisi_aset';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'aset_id',
        'kondisi_sebelum',
        'kondisi_sesudah',
        'catatan',
        'dicatat_oleh',
    ];

    public function detailAset()
    {
        return $this->belongsTo(DetailAset::class, 'aset_id');
    }

    public function pencatat()
    {
        return $this->belongsTo(User::class, 'dicatat_oleh');
    }
}

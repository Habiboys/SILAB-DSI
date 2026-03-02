<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class NilaiRubrik extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'nilai_rubrik';

    protected $fillable = [
        'pengumpulan_tugas_id',
        'komponen_rubrik_id',
        'nilai',
        'catatan',
        'dinilai_oleh',
        'dinilai_at'
    ];

    protected $casts = [
        'nilai' => 'decimal:2',
        'dinilai_at' => 'datetime'
    ];

    public function pengumpulanTugas()
    {
        return $this->belongsTo(\App\Models\PengumpulanTugas::class, 'pengumpulan_tugas_id');
    }

    public function komponenRubrik()
    {
        return $this->belongsTo(\App\Models\KomponenRubrik::class, 'komponen_rubrik_id');
    }

    public function penilai()
    {
        return $this->belongsTo(User::class, 'dinilai_oleh');
    }
}

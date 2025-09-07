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
        'praktikan_id',
        'nilai',
        'catatan',
        'dinilai_oleh',
        'dinilai_at'
    ];

    protected $attributes = [
        'pengumpulan_tugas_id' => null
    ];

    protected $casts = [
        'nilai' => 'decimal:2',
        'dinilai_at' => 'datetime'
    ];

    // Relasi ke PengumpulanTugas
    public function pengumpulanTugas()
    {
        return $this->belongsTo(PengumpulanTugas::class);
    }

    // Relasi ke KomponenRubrik
    public function komponenRubrik()
    {
        return $this->belongsTo(KomponenRubrik::class);
    }

    // Relasi ke Praktikan
    public function praktikan()
    {
        return $this->belongsTo(Praktikan::class);
    }

    // Relasi ke User (dinilai oleh)
    public function penilai()
    {
        return $this->belongsTo(User::class, 'dinilai_oleh');
    }
}

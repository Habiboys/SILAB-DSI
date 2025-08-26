<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class KomponenRubrik extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'komponen_rubrik';
    
    protected $fillable = [
        'tugas_praktikum_id',
        'nama_komponen',
        'deskripsi',
        'bobot',
        'nilai_maksimal',
        'urutan'
    ];

    protected $casts = [
        'bobot' => 'decimal:2',
        'nilai_maksimal' => 'decimal:2',
        'urutan' => 'integer'
    ];

    // Relasi ke TugasPraktikum
    public function tugasPraktikum()
    {
        return $this->belongsTo(\App\Models\TugasPraktikum::class, 'tugas_praktikum_id');
    }

    // Relasi ke NilaiRubrik
    public function nilaiRubriks()
    {
        return $this->hasMany(\App\Models\NilaiRubrik::class, 'komponen_rubrik_id');
    }
}

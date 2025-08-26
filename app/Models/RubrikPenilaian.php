<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class RubrikPenilaian extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'rubrik_penilaian';
    
    protected $fillable = [
        'tugas_praktikum_id',
        'nama_rubrik',
        'deskripsi',
        'bobot_total',
        'is_active'
    ];

    protected $casts = [
        'bobot_total' => 'decimal:2',
        'is_active' => 'boolean'
    ];

    // Relasi ke TugasPraktikum
    public function tugasPraktikum()
    {
        return $this->belongsTo(\App\Models\TugasPraktikum::class, 'tugas_praktikum_id');
    }

    // Relasi ke KomponenRubrik
    public function komponenRubriks()
    {
        return $this->hasMany(\App\Models\KomponenRubrik::class, 'rubrik_penilaian_id')->orderBy('urutan');
    }

    // Scope untuk rubrik aktif
    public function scopeAktif($query)
    {
        return $query->where('is_active', true);
    }
}


<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class PertemuanPraktikum extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'pertemuan_praktikum';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'kelas_id',
        'judul',
        'deskripsi',
        'tanggal',
    ];

    protected $casts = [
        'tanggal' => 'datetime',
    ];

    public function kelas()
    {
        return $this->belongsTo(Kelas::class, 'kelas_id');
    }


    public function praktikum()
    {
        return $this->hasOneThrough(
            Praktikum::class,
            Kelas::class,
            'id',
            'id',
            'kelas_id',
            'praktikum_id'
        );
    }

    public function modul()
    {
        return $this->hasMany(ModulPraktikum::class, 'pertemuan_id');
    }

    public function absensiPraktikan()
    {
        return $this->hasMany(AbsensiPraktikan::class, 'pertemuan_id');
    }

    public function absensiAslab()
    {
        return $this->hasMany(AbsensiAslab::class, 'pertemuan_id');
    }
}

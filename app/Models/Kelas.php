<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Kelas extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';
    protected $table = 'kelas';

    protected $fillable = [
        'nama_kelas',
        'praktikum_id',
        'parent_kelas_id',
        'status',
        'hari',
        'jam_mulai',
        'jam_selesai',
        'ruangan',
    ];

    protected $casts = [
        'status' => 'string'
    ];

    public function praktikum()
    {
        return $this->belongsTo(Praktikum::class);
    }


    public function parent()
    {
        return $this->belongsTo(Kelas::class, 'parent_kelas_id');
    }


    public function subKelas()
    {
        return $this->hasMany(Kelas::class, 'parent_kelas_id');
    }


    public function isSubKelas(): bool
    {
        return !is_null($this->parent_kelas_id);
    }


    public function hasSubKelas(): bool
    {
        return $this->subKelas()->exists();
    }

    public function praktikans()
    {
        return $this->hasMany(Praktikan::class);
    }

    public function tugasPraktikums()
    {
        return $this->hasMany(TugasPraktikum::class);
    }

    public function getKelasAttribute()
    {
        return $this->nama_kelas;
    }

    public function getKelasIdAttribute()
    {
        return $this->id;
    }


    public function scopeParentOnly($query)
    {
        return $query->whereNull('parent_kelas_id');
    }


    public function scopeSubKelasOf($query, string $parentKelasId)
    {
        return $query->where('parent_kelas_id', $parentKelasId);
    }


    public function scopeAktif($query)
    {
        return $query->where('status', 'aktif');
    }


    public function scopeByPraktikum($query, $praktikumId)
    {
        return $query->where('praktikum_id', $praktikumId);
    }
}

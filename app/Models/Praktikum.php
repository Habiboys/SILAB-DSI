<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Praktikum extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $table = 'praktikum';

    protected $fillable = [
        'mata_kuliah',
        'mata_kuliah_id',
        'kepengurusan_lab_id',
    ];

    public function mataKuliah()
    {
        return $this->belongsTo(MataKuliah::class, 'mata_kuliah_id');
    }

    public function jadwalPraktikum()
    {
        return $this->hasMany(Kelas::class, 'praktikum_id')
            ->whereNotNull('hari');
    }

    public function kepengurusanLab()
    {
        return $this->belongsTo(KepengurusanLab::class);
    }


    public function modulPraktikum()
    {
        return \App\Models\ModulPraktikum::whereHas('pertemuan.kelas', function ($q) {
            $q->where('praktikum_id', $this->id);
        });
    }

    public function praktikans()
    {
        return $this->belongsToMany(Praktikan::class, 'praktikan_praktikum', 'praktikum_id', 'praktikan_id')
                    ->withPivot(['kelas_id', 'status'])
                    ->withTimestamps();
    }

    public function praktikanPraktikums()
    {
        return $this->hasMany(PraktikanPraktikum::class);
    }

    public function kelas()
    {
        return $this->hasMany(Kelas::class);
    }


    public function parentKelas()
    {
        return $this->hasMany(Kelas::class)->whereNull('parent_kelas_id');
    }

    public function tugasPraktikum()
    {
        return $this->hasManyThrough(
            TugasPraktikum::class,
            Kelas::class,
            'praktikum_id',
            'kelas_id',
            'id',
            'id'
        );
    }

    public function aslabPraktikum()
    {
        return $this->hasMany(AslabPraktikum::class);
    }

    public function aslab()
    {
        return $this->belongsToMany(User::class, 'aslab_praktikum', 'praktikum_id', 'user_id')
                    ->withPivot('catatan')
                    ->withTimestamps();
    }

    public function pertemuan()
    {
        return $this->hasManyThrough(
            PertemuanPraktikum::class,
            Kelas::class,
            'praktikum_id',
            'kelas_id',
            'id',
            'id'
        );
    }
}

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
        'kepengurusan_lab_id',
    ];

    public function jadwalPraktikum()
    {
        return $this->hasManyThrough(
            JadwalPraktikum::class,
            Kelas::class,
            'praktikum_id',
            'kelas_id',
            'id',
            'id'
        );
    }

    public function kepengurusanLab()
    {
        return $this->belongsTo(KepengurusanLab::class);
    }

    /**
     * ModulPraktikum tidak punya FK langsung ke Praktikum.
     * Chain: praktikum → kelas → pertemuan → modul.
     * CATATAN: Ini bukan Eloquent Relation standar (tidak bisa di-load via load()).
     * Gunakan setRelation() di controller untuk eager loading.
     */
    public function modulPraktikum()
    {
        return \App\Models\ModulPraktikum::whereHas('pertemuan.kelas', function ($q) {
            $q->where('praktikum_id', $this->id);
        });
    }

    // Relasi ke Praktikan (many-to-many melalui PraktikanPraktikum)
    public function praktikans()
    {
        return $this->belongsToMany(Praktikan::class, 'praktikan_praktikum', 'praktikum_id', 'praktikan_id')
                    ->withPivot(['kelas_id', 'status'])
                    ->withTimestamps();
    }

    // Relasi ke PraktikanPraktikum (pivot table)
    public function praktikanPraktikums()
    {
        return $this->hasMany(PraktikanPraktikum::class);
    }

    // Relasi ke Kelas (semua, termasuk sub-kelas)
    public function kelas()
    {
        return $this->hasMany(Kelas::class);
    }

    /**
     * Hanya kelas "asli" (parent_kelas_id IS NULL) beserta sub-kelasnya.
     * Gunakan ini untuk tampilan daftar kelas dan penilaian akhir.
     *
     * Contoh: $praktikum->parentKelas()->with('subKelas')->get()
     */
    public function parentKelas()
    {
        return $this->hasMany(Kelas::class)->whereNull('parent_kelas_id');
    }

    // Relasi ke Tugas Praktikum (via Kelas, karena praktikum_id sudah dihapus dari tugas_praktikum)
    public function tugasPraktikum()
    {
        return $this->hasManyThrough(
            TugasPraktikum::class,
            Kelas::class,
            'praktikum_id', // FK pada kelas → praktikum.id
            'kelas_id',     // FK pada tugas_praktikum → kelas.id
            'id',
            'id'
        );
    }

    // Relasi ke Aslab yang ditugaskan
    public function aslabPraktikum()
    {
        return $this->hasMany(AslabPraktikum::class);
    }

    // Relasi ke User (Aslab) yang ditugaskan
    public function aslab()
    {
        return $this->belongsToMany(User::class, 'aslab_praktikum', 'praktikum_id', 'user_id')
                    ->withPivot('catatan')
                    ->withTimestamps();
    }

    // Relasi ke PertemuanPraktikum (via Kelas, karena praktikum_id sudah dihapus dari pertemuan_praktikum)
    public function pertemuan()
    {
        return $this->hasManyThrough(
            PertemuanPraktikum::class,
            Kelas::class,
            'praktikum_id', // FK pada kelas → praktikum.id
            'kelas_id',     // FK pada pertemuan_praktikum → kelas.id
            'id',
            'id'
        );
    }
}

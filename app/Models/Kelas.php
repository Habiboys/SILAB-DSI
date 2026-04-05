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

    // ─────────────────────────────────────────────────
    // Relasi ke Praktikum
    // ─────────────────────────────────────────────────
    public function praktikum()
    {
        return $this->belongsTo(Praktikum::class);
    }

    // ─────────────────────────────────────────────────
    // Self-referencing: Hierarki Parent – Sub-Kelas
    //
    //   Kelas A  (parent_kelas_id = null)  ← kelas asli
    //     ├── Kelas A1 (parent_kelas_id = A.id)
    //     └── Kelas A2 (parent_kelas_id = A.id)
    // ─────────────────────────────────────────────────

    /**
     * Kelas induk dari sub-kelas ini.
     * Null jika ini sudah kelas asli (parent-level).
     */
    public function parent()
    {
        return $this->belongsTo(Kelas::class, 'parent_kelas_id');
    }

    /**
     * Daftar sub-kelas yang dimiliki kelas ini.
     */
    public function subKelas()
    {
        return $this->hasMany(Kelas::class, 'parent_kelas_id');
    }

    // ─────────────────────────────────────────────────
    // Helper methods
    // ─────────────────────────────────────────────────

    /**
     * Apakah ini sub-kelas (punya parent)?
     */
    public function isSubKelas(): bool
    {
        return !is_null($this->parent_kelas_id);
    }

    /**
     * Apakah kelas ini punya sub-kelas?
     */
    public function hasSubKelas(): bool
    {
        return $this->subKelas()->exists();
    }

    // ─────────────────────────────────────────────────
    // Relasi ke Praktikan
    // ─────────────────────────────────────────────────
    public function praktikans()
    {
        return $this->hasMany(Praktikan::class);
    }

    // Relasi ke Tugas Praktikum
    public function tugasPraktikums()
    {
        return $this->hasMany(TugasPraktikum::class);
    }

    // Kompatibilitas struktur data lama (jadwal_praktikum)
    public function getKelasAttribute()
    {
        return $this->nama_kelas;
    }

    public function getKelasIdAttribute()
    {
        return $this->id;
    }

    // ─────────────────────────────────────────────────
    // Scopes
    // ─────────────────────────────────────────────────

    /** Hanya kelas-kelas "asli" (tidak punya parent), untuk penilaian akhir. */
    public function scopeParentOnly($query)
    {
        return $query->whereNull('parent_kelas_id');
    }

    /** Hanya sub-kelas dari kelas tertentu. */
    public function scopeSubKelasOf($query, string $parentKelasId)
    {
        return $query->where('parent_kelas_id', $parentKelasId);
    }

    /** Scope untuk kelas aktif */
    public function scopeAktif($query)
    {
        return $query->where('status', 'aktif');
    }

    /** Scope berdasarkan praktikum */
    public function scopeByPraktikum($query, $praktikumId)
    {
        return $query->where('praktikum_id', $praktikumId);
    }
}

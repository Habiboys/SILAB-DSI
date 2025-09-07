<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Praktikan extends Model
{
    use HasFactory, HasUuids;
    
    public $incrementing = false;
    protected $keyType = 'string';

    protected $table = 'praktikan';
    
    protected $fillable = [
        'nim',
        'nama',
        'no_hp',
        'user_id'
    ];

    protected $casts = [
        'status' => 'string'
    ];

    // Relasi ke User (jika sudah ada akun)
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Relasi ke Praktikum (many-to-many melalui PraktikanPraktikum)
    public function praktikums()
    {
        return $this->belongsToMany(Praktikum::class, 'praktikan_praktikum', 'praktikan_id', 'praktikum_id')
                    ->withPivot(['kelas_id', 'status'])
                    ->withTimestamps();
    }

    // Relasi ke PraktikanPraktikum (pivot table)
    public function praktikanPraktikums()
    {
        return $this->hasMany(PraktikanPraktikum::class);
    }

    // Accessor untuk kompatibilitas frontend - ambil praktikum pertama
    public function getPraktikumAttribute()
    {
        return $this->praktikums->first();
    }

    // Relasi ke Laboratorium melalui PraktikanPraktikum
    public function labs()
    {
        return $this->hasManyThrough(
            Laboratorium::class,
            PraktikanPraktikum::class,
            'praktikan_id', // Foreign key on praktikan_praktikum table
            'id', // Foreign key on laboratorium table
            'id', // Local key on praktikan table
            'praktikum_id' // Local key on praktikan_praktikum table
        )->join('praktikum', 'praktikan_praktikum.praktikum_id', '=', 'praktikum.id')
         ->join('kepengurusan_lab', 'praktikum.kepengurusan_lab_id', '=', 'kepengurusan_lab.id')
         ->select('laboratorium.*');
    }

    // Relasi ke Pengumpulan Tugas
    public function pengumpulanTugas()
    {
        return $this->hasMany(PengumpulanTugas::class);
    }

    // Scope untuk praktikan yang aktif di praktikum tertentu
    public function scopeAktifDiPraktikum($query, $praktikumId)
    {
        return $query->whereHas('praktikanPraktikums', function($q) use ($praktikumId) {
            $q->where('praktikum_id', $praktikumId)->where('status', 'aktif');
        });
    }

    // Scope untuk praktikan berdasarkan praktikum
    public function scopeByPraktikum($query, $praktikumId)
    {
        return $query->whereHas('praktikanPraktikums', function($q) use ($praktikumId) {
            $q->where('praktikum_id', $praktikumId);
        });
    }

    // Get lab melalui praktikum tertentu
    public function getLabByPraktikum($praktikumId)
    {
        $praktikanPraktikum = $this->praktikanPraktikums()
            ->where('praktikum_id', $praktikumId)
            ->with('praktikum.kepengurusanLab.laboratorium')
            ->first();
            
        return $praktikanPraktikum?->praktikum?->kepengurusanLab?->laboratorium;
    }
}

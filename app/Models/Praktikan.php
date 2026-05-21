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

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function praktikums()
    {
        return $this->belongsToMany(Praktikum::class, 'praktikan_praktikum', 'praktikan_id', 'praktikum_id')
                    ->withPivot(['kelas_id', 'status'])
                    ->withTimestamps();
    }

    public function praktikanPraktikums()
    {
        return $this->hasMany(PraktikanPraktikum::class);
    }

    public function getPraktikumAttribute()
    {
        return $this->praktikums->first();
    }

    public function labs()
    {
        return $this->hasManyThrough(
            Laboratorium::class,
            PraktikanPraktikum::class,
            'praktikan_id',
            'id',
            'id',
            'praktikum_id'
        )->join('praktikum', 'praktikan_praktikum.praktikum_id', '=', 'praktikum.id')
         ->join('kepengurusan_lab', 'praktikum.kepengurusan_lab_id', '=', 'kepengurusan_lab.id')
         ->select('laboratorium.*');
    }

    public function pengumpulanTugas()
    {
        return $this->hasMany(PengumpulanTugas::class);
    }

    public function scopeAktifDiPraktikum($query, $praktikumId)
    {
        return $query->whereHas('praktikanPraktikums', function($q) use ($praktikumId) {
            $q->where('praktikum_id', $praktikumId)->where('status', 'aktif');
        });
    }

    public function scopeByPraktikum($query, $praktikumId)
    {
        return $query->whereHas('praktikanPraktikums', function($q) use ($praktikumId) {
            $q->where('praktikum_id', $praktikumId);
        });
    }

    public function getLabByPraktikum($praktikumId)
    {
        $praktikanPraktikum = $this->praktikanPraktikums()
            ->where('praktikum_id', $praktikumId)
            ->with('praktikum.kepengurusanLab.laboratorium')
            ->first();

        return $praktikanPraktikum?->praktikum?->kepengurusanLab?->laboratorium;
    }

    public function absensis()
    {
        return $this->hasMany(AbsensiPraktikan::class);
    }
}

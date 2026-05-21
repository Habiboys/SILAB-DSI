<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class PraktikanPraktikum extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $table = 'praktikan_praktikum';

    protected $fillable = [
        'praktikan_id',
        'praktikum_id',
        'kelas_id',
        'status'
    ];

    protected $casts = [
        'status' => 'string'
    ];

    public function praktikan()
    {
        return $this->belongsTo(Praktikan::class);
    }

    public function praktikum()
    {
        return $this->belongsTo(Praktikum::class);
    }

    public function kelas()
    {
        return $this->belongsTo(Kelas::class);
    }

    public function laboratorium()
    {
        return $this->hasOneThrough(
            Laboratorium::class,
            Praktikum::class,
            'id',
            'id',
            'praktikum_id',
            'kepengurusan_lab_id'
        )->join('kepengurusan_lab', 'praktikum.kepengurusan_lab_id', '=', 'kepengurusan_lab.id');
    }

    public function scopeAktif($query)
    {
        return $query->where('status', 'aktif');
    }

    public function scopeByPraktikum($query, $praktikumId)
    {
        return $query->where('praktikum_id', $praktikumId);
    }

    public function scopeByPraktikan($query, $praktikanId)
    {
        return $query->where('praktikan_id', $praktikanId);
    }
}

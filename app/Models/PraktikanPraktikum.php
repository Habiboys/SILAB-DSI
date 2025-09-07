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

    // Relasi ke Praktikan
    public function praktikan()
    {
        return $this->belongsTo(Praktikan::class);
    }

    // Relasi ke Praktikum
    public function praktikum()
    {
        return $this->belongsTo(Praktikum::class);
    }

    // Relasi ke Kelas
    public function kelas()
    {
        return $this->belongsTo(Kelas::class);
    }

    // Relasi ke Laboratorium melalui Praktikum
    public function laboratorium()
    {
        return $this->hasOneThrough(
            Laboratorium::class,
            Praktikum::class,
            'id', // Foreign key on praktikum table
            'id', // Foreign key on laboratorium table
            'praktikum_id', // Local key on praktikan_praktikum table
            'kepengurusan_lab_id' // Local key on praktikum table
        )->join('kepengurusan_lab', 'praktikum.kepengurusan_lab_id', '=', 'kepengurusan_lab.id');
    }

    // Scope untuk status aktif
    public function scopeAktif($query)
    {
        return $query->where('status', 'aktif');
    }

    // Scope untuk praktikan berdasarkan praktikum
    public function scopeByPraktikum($query, $praktikumId)
    {
        return $query->where('praktikum_id', $praktikumId);
    }

    // Scope untuk praktikan berdasarkan praktikan
    public function scopeByPraktikan($query, $praktikanId)
    {
        return $query->where('praktikan_id', $praktikanId);
    }
}
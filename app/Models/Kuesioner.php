<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Kuesioner extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'kuesioner';
    
    protected $fillable = [
        'judul',
        'deskripsi',
        'tipe', // internal, eksternal
        'link_eksternal',
        'tanggal_mulai',
        'tanggal_selesai',
        'is_active',
        'is_mandatory',
        'dibuat_oleh',
    ];

    protected $casts = [
        'tanggal_mulai' => 'datetime',
        'tanggal_selesai' => 'datetime',
        'is_active' => 'boolean',
        'is_mandatory' => 'boolean',
    ];

    public function pembuat()
    {
        return $this->belongsTo(User::class, 'dibuat_oleh');
    }

    public function pertanyaan()
    {
        return $this->hasMany(PertanyaanKuesioner::class, 'kuesioner_id')->orderBy('urutan');
    }

    public function target()
    {
        return $this->hasMany(TargetKuesioner::class, 'kuesioner_id');
    }

    public function respon()
    {
        return $this->hasMany(ResponKuesioner::class, 'kuesioner_id');
    }
}

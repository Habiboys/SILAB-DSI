<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class KepengurusanUser extends Model
{
    use HasFactory, HasUuids;
    
    public $incrementing = false;
    protected $keyType = 'string';

    protected $table = 'kepengurusan_user';

    protected $fillable = [
        'kepengurusan_lab_id',
        'user_id',
        'struktur_id',
        'is_active',
        'tanggal_bergabung',
        'tanggal_keluar',
        'catatan'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'tanggal_bergabung' => 'date',
        'tanggal_keluar' => 'date',
    ];

    public function kepengurusanLab()
    {
        return $this->belongsTo(KepengurusanLab::class, 'kepengurusan_lab_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function struktur()
    {
        return $this->belongsTo(Struktur::class, 'struktur_id');
    }

    // Scope untuk anggota aktif
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // Scope untuk anggota yang sudah keluar
    public function scopeInactive($query)
    {
        return $query->where('is_active', false);
    }
}

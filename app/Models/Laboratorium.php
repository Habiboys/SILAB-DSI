<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\DetailAset;

class Laboratorium extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'laboratorium';
    protected $fillable = ['nama', 'logo', 'is_active'];

    public $incrementing = false;
    protected $keyType = 'string';

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function aset()
    {
        return $this->hasMany(DetailAset::class);
    }

    public function kepengurusanLab()
    {
        return $this->hasMany(KepengurusanLab::class);
    }

    // Relasi ke Praktikan
    public function praktikan()
    {
        return $this->hasMany(Praktikan::class, 'lab_id');
    }
}

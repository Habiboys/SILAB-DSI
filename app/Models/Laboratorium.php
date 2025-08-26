<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Laboratorium extends Model
{
    use HasFactory, HasUuids;
    
    protected $table = 'laboratorium';
    protected $fillable = ['nama', 'logo'];
    
    public $incrementing = false;
    protected $keyType = 'string';

    public function aset()
    {
        return $this->hasMany(Aset::class);
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
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Laboratorium extends Model
{
    use HasFactory;
    
    protected $table = 'laboratorium';
    protected $fillable = ['nama', 'logo'];

    public function aset()
    {
        return $this->hasMany(Aset::class);
    }

    public function kepengurusanLab()
    {
        return $this->hasMany(KepengurusanLab::class);
    }
}
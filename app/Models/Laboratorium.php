<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Laboratorium extends Model
{
    protected $table = 'laboratorium';
    protected $fillable = ['nama', 'logo'];

    public function aset()
    {
        return $this->hasMany(Aset::class);
    }

    public function struktur()
    {
        return $this->hasMany(Struktur::class, 'struktur_id');
    }
}
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Struktur extends Model
{
    use HasFactory;

    protected $table = 'struktur';

    protected $fillable = [
        'struktur',
        'kepengurusan_lab_id',
        'proker',
    ];

    public function kepengurusanLab()
    {
        return $this->belongsTo(KepengurusanLab::class);
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }
}
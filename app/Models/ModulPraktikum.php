<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ModulPraktikum extends Model
{
    use HasFactory;

    protected $table = 'modul_praktikum';

    protected $fillable = [
        'praktikum_id',
        'pertemuan', 
        'judul',
        'modul',
    ];

    public function praktikum()
    {
        return $this->belongsTo(Praktikum::class);
    }
}
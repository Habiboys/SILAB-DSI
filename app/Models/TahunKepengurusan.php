<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class TahunKepengurusan extends Model
{
    use HasFactory;

    protected $table = 'tahun_kepengurusan';

    protected $fillable = [
        'tahun',
        'isactive',
        'mulai',
        'selesai',
    ];

    protected $casts = [
        'isactive' => 'boolean',
    ];

    public function kepengurusanLab()
    {
        return $this->hasOne(KepengurusanLab::class);
    }
}
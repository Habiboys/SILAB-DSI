<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class TahunKepengurusan extends Model
{
    use HasFactory, HasUuids;

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
    
    public $incrementing = false;
    protected $keyType = 'string';

    public function kepengurusanLab()
    {
        return $this->hasOne(KepengurusanLab::class, 'tahun_kepengurusan_id');
    }
}
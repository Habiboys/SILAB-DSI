<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ModulPraktikum extends Model
{
    use HasFactory, HasUuids;
    
    public $incrementing = false;
    protected $keyType = 'string';

    protected $table = 'modul_praktikum';

    protected $fillable = [
        'praktikum_id',
        'pertemuan', 
        'judul',
        'modul',
        'is_public',
        'hash',
    ];

    public function praktikum()
    {
        return $this->belongsTo(Praktikum::class);
    }
}
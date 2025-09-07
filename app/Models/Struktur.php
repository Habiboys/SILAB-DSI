<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Struktur extends Model
{
    use HasFactory, HasUuids;
    
    public $incrementing = false;
    protected $keyType = 'string';

    protected $table = 'struktur';

    protected $fillable = [
        'struktur',
        'tipe_jabatan',
        'jabatan_tunggal',
        'jabatan_terkait'
    ];



    public function proker()
    {
        return $this->hasMany(Proker::class);
    }
}
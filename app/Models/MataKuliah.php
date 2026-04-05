<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MataKuliah extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $table = 'mata_kuliah';

    protected $fillable = [
        'kode_mata_kuliah',
        'nama',
        'sks',
        'semester',
        'status',
    ];

    protected $casts = [
        'sks' => 'integer',
        'semester' => 'integer',
    ];

    public function praktikums()
    {
        return $this->hasMany(Praktikum::class, 'mata_kuliah_id');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class SertifikatTemplate extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'sertifikat_templates';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'nama',
        'file_path',
        'kategori',
        'ref_id',
    ];

    public function getFileUrlAttribute()
    {
        return asset('storage/' . $this->file_path);
    }
}

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
        'pertemuan_id', // Changed/Added
        'judul',
        'file_path', // Standardized to file_path
        'is_published',
        // Legacy fields support if needed, but per plan we use:
        // 'praktikum_id', 'pertemuan', 'modul', 'hash' might be deprecated or unused in new flow
    ];

    public function pertemuan()
    {
        return $this->belongsTo(PertemuanPraktikum::class, 'pertemuan_id');
    }

    // Legacy relation (optional, depending on DB state)
    public function praktikum()
    {
        return $this->belongsTo(Praktikum::class);
    }
}